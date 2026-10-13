import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '@/app';
import { AuditStatus, DocumentType, EvaluationOutcome, Prisma } from './generated/client';

async function createFixture(tx: Prisma.TransactionClient) {
  const token = randomUUID();
  const user = await tx.user.create({
    data: { googleSubject: token, email: `${token}@dlsu.edu.ph`, fullName: 'Schema test' },
  });
  const project = await tx.project.create({ data: { userId: user.id, name: 'Schema test' } });
  const document = await tx.document.create({
    data: {
      projectId: project.id,
      documentType: DocumentType.PRE_ACTS,
      filename: 'test.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024n,
      storageKey: `test/${token}`,
    },
  });
  const audit = await tx.auditRun.create({
    data: {
      projectId: project.id,
      inputSnapshot: { projectName: project.name, documentIds: [document.id] },
      auditDocuments: { create: { documentId: document.id } },
    },
  });
  return { user, project, document, audit };
}

describe('DBML schema with PostgreSQL', () => {
  let app: FastifyInstance | undefined;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  async function rollbackFixture(callback: (tx: Prisma.TransactionClient) => Promise<void>) {
    const rollback = new Error('Rollback schema fixture');
    try {
      await app!.prisma.$transaction(async (tx) => {
        await callback(tx);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }

  it('round-trips all seven models, relationships, native types, and defaults', async () => {
    await rollbackFixture(async (tx) => {
      const { user, project, document, audit } = await createFixture(tx);
      const expiresAt = new Date('2030-01-01T12:00:00+08:00');
      await tx.session.create({
        data: { userId: user.id, refreshTokenHash: 'test-hash', expiresAt },
      });
      await tx.auditFinding.create({
        data: {
          auditId: audit.id,
          outcome: EvaluationOutcome.NEEDS_MANUAL_REVIEW,
          reason: 'Review needed',
          recommendation: 'Confirm the form',
        },
      });

      const loaded = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          sessions: true,
          projects: {
            include: {
              documents: true,
              auditRuns: {
                include: { findings: true, auditDocuments: { include: { document: true } } },
              },
            },
          },
        },
      });
      expect(loaded.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(loaded.sessions[0].expiresAt).toEqual(expiresAt);
      const loadedProject = loaded.projects[0];
      expect(loadedProject.id).toBe(project.id);
      expect(loadedProject.documents[0]).toMatchObject({
        id: document.id,
        sizeBytes: 1024n,
        formType: 'UNKNOWN',
        isDeleted: false,
      });
      const loadedAudit = loadedProject.auditRuns[0];
      expect(loadedAudit).toMatchObject({
        status: 'QUEUED',
        evaluationResults: [],
        overallResult: null,
        errorMessage: null,
        completedAt: null,
        inputSnapshot: { projectName: project.name, documentIds: [document.id] },
      });
      expect(loadedAudit.createdAt).toBeInstanceOf(Date);
      expect(loadedAudit.auditDocuments[0].document.id).toBe(document.id);
      expect(loadedAudit.findings[0]).toMatchObject({
        severity: null,
        reference: null,
        locations: [],
      });
    });
  });

  it.each([AuditStatus.QUEUED, AuditStatus.PROCESSING])(
    'rejects a second active run while the first is %s',
    async (status) => {
      await expect(
        app!.prisma.$transaction(async (tx) => {
          const { project, audit } = await createFixture(tx);
          await tx.auditRun.update({ where: { id: audit.id }, data: { status } });
          await tx.auditRun.create({ data: { projectId: project.id, inputSnapshot: {} } });
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    },
  );

  it('allows terminal history and reuse of a file in another run', async () => {
    await rollbackFixture(async (tx) => {
      const { project, document, audit } = await createFixture(tx);
      await tx.auditRun.update({
        where: { id: audit.id },
        data: { status: AuditStatus.COMPLETED },
      });
      await tx.auditRun.create({
        data: { projectId: project.id, status: AuditStatus.FAILED, inputSnapshot: {} },
      });
      const retry = await tx.auditRun.create({
        data: {
          projectId: project.id,
          inputSnapshot: { documentIds: [document.id] },
          auditDocuments: { create: { documentId: document.id } },
        },
      });
      expect(retry.status).toBe(AuditStatus.QUEUED);
      expect(await tx.auditDocument.count({ where: { documentId: document.id } })).toBe(2);
    });
  });

  it('rejects duplicate run/document pairs', async () => {
    await expect(
      app!.prisma.$transaction(async (tx) => {
        const { audit, document } = await createFixture(tx);
        await tx.auditDocument.create({ data: { auditId: audit.id, documentId: document.id } });
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it.each(['user', 'project', 'document', 'audit'] as const)(
    'restricts deletion of a referenced %s',
    async (parent) => {
      await expect(
        app!.prisma.$transaction(async (tx) => {
          const fixture = await createFixture(tx);
          switch (parent) {
            case 'user':
              await tx.user.delete({ where: { id: fixture.user.id } });
              break;
            case 'project':
              await tx.project.delete({ where: { id: fixture.project.id } });
              break;
            case 'document':
              await tx.document.delete({ where: { id: fixture.document.id } });
              break;
            case 'audit':
              await tx.auditRun.delete({ where: { id: fixture.audit.id } });
              break;
          }
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    },
  );

  it('requires document_type without an implicit default', async () => {
    await expect(
      app!.prisma.$transaction(async (tx) => {
        const { project } = await createFixture(tx);
        await tx.$executeRaw`
        INSERT INTO documents (project_id, filename, mime_type, size_bytes, storage_key)
        VALUES (${project.id}::uuid, 'missing-type.pdf', 'application/pdf', 1024, ${randomUUID()})
      `;
      }),
    ).rejects.toMatchObject({
      code: 'P2010',
      meta: { driverAdapterError: { cause: { originalCode: '23502' } } },
    });
  });
});
