import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '@/app';
import type { Prisma } from '@/shared/database/generated/client';

describe('Project timestamps with PostgreSQL', () => {
  let app: FastifyInstance | undefined;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
  });

  afterAll(async () => {
    await app?.close();
  });

  async function withFixture(
    callback: (tx: Prisma.TransactionClient, userId: string) => Promise<void>,
  ) {
    const rollback = new Error('Rollback timestamp fixture');
    try {
      await app!.prisma.$transaction(async (tx) => {
        const token = randomUUID();
        const user = await tx.user.create({
          data: { googleSubject: token, email: `${token}@dlsu.edu.ph`, fullName: 'Timestamp test' },
        });
        await callback(tx, user.id);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }

  it('sets both timestamps when a project is created', async () => {
    await withFixture(async (tx, userId) => {
      const before = Date.now();
      const project = await tx.project.create({ data: { userId, name: 'Timestamp test' } });
      for (const timestamp of [project.createdAt, project.modifiedAt]) {
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(before - 1000);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  it('advances modifiedAt on an update while preserving createdAt', async () => {
    await withFixture(async (tx, userId) => {
      const originalTime = new Date('2020-01-01T00:00:00Z');
      const project = await tx.project.create({
        data: { userId, name: 'Original name', createdAt: originalTime, modifiedAt: originalTime },
      });
      const updated = await tx.project.update({
        where: { id: project.id },
        data: { name: 'Updated name' },
      });
      expect(updated.createdAt).toEqual(originalTime);
      expect(updated.modifiedAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });
});
