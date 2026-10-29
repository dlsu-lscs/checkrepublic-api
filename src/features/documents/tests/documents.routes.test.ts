import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '@/app';
import { PrismaService } from '@/shared/database/prisma.service';
import { Prisma } from '@/shared/database/generated/client';

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));

const projectId = randomUUID();
const documentId = randomUUID();
const fileUrl = 'https://storage.test/documents/proposal.pdf?signature=test';
const maxFileSize = 26_214_400;
const pdf = {
  name: 'file',
  filename: 'proposal.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.7\nTest document'),
};
const fields = [
  { name: 'projectId', value: projectId },
  { name: 'documentType', value: 'PRE_ACTS' },
];
const document = {
  id: documentId,
  projectId,
  documentType: 'PRE_ACTS' as const,
  formType: 'UNKNOWN' as const,
  filename: pdf.filename,
  mimeType: pdf.mimeType,
  sizeBytes: BigInt(pdf.buffer.length),
  storageKey: `documents/${projectId}/stored.pdf`,
  uploadedAt: new Date('2026-10-29T00:00:00Z'),
  isDeleted: false,
};

type MultipartPart = { name: string; value: string } | typeof pdf;

function multipart(parts: MultipartPart[]) {
  const boundary = `upload-${randomUUID()}`;
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    if ('filename' in part) {
      chunks.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\n` +
            `Content-Type: ${part.mimeType}\r\n\r\n`,
        ),
        part.buffer,
      );
    } else {
      chunks.push(
        Buffer.from(`Content-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value}`),
      );
    }
    chunks.push(Buffer.from('\r\n'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: Buffer.concat(chunks),
  };
}

describe('Documents HTTP endpoints', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.restoreAllMocks();
    vi.mocked(getSignedUrl).mockReset();
  });

  async function setup() {
    const prisma = new PrismaService('postgresql://postgres:test@localhost:5432/test');
    vi.spyOn(prisma, '$connect').mockResolvedValue();
    vi.spyOn(prisma, '$disconnect').mockResolvedValue();
    const findProject = vi.spyOn(prisma.project, 'findUnique').mockResolvedValue({
      id: projectId,
      userId: randomUUID(),
      name: 'Test project',
      createdAt: new Date(),
      modifiedAt: new Date(),
    });
    const create = vi.spyOn(prisma.document, 'create').mockResolvedValue(document);
    const findOne = vi.spyOn(prisma.document, 'findFirst').mockResolvedValue(document);
    const s3 = new S3Client({
      region: 'garage',
      endpoint: 'http://storage.test',
      forcePathStyle: true,
      credentials: { accessKeyId: 'test-access-key', secretAccessKey: 'test-secret-key' },
    });
    const send = vi.spyOn(s3, 'send').mockResolvedValue();
    vi.mocked(getSignedUrl).mockResolvedValue(fileUrl);
    app = await buildApp({ logger: false, prisma, s3 });
    return { prisma, s3, send, create, findProject, findOne };
  }

  it('uploads a PDF and returns stored metadata with an accessible URL', async () => {
    const { s3, send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      documentId,
      filename: pdf.filename,
      fileUrl,
      mimeType: pdf.mimeType,
      sizeBytes: pdf.buffer.length,
      uploadedAt: document.uploadedAt.toISOString(),
    });
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as PutObjectCommand).input).toMatchObject({
      Bucket: 'test-documents',
      Body: pdf.buffer,
      ContentType: pdf.mimeType,
      ContentLength: pdf.buffer.length,
    });
    const storageKey = (command as PutObjectCommand).input.Key;
    expect(storageKey).toMatch(new RegExp(`^documents/${projectId}/[0-9a-f-]+\\.pdf$`));
    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: {
        projectId,
        documentType: 'PRE_ACTS',
        filename: pdf.filename,
        mimeType: pdf.mimeType,
        sizeBytes: BigInt(pdf.buffer.length),
        storageKey,
      },
    });
    expect(getSignedUrl).toHaveBeenCalledExactlyOnceWith(s3, expect.any(GetObjectCommand), {
      expiresIn: 900,
    });
    expect(vi.mocked(getSignedUrl).mock.calls[0][1].input).toMatchObject({
      Bucket: 'test-documents',
      Key: storageKey,
    });
  });

  it('documents the multipart body with required metadata and a file picker', async () => {
    await setup();
    const response = await app!.inject('/documentation/json');
    expect(response.statusCode).toBe(200);
    const operation = response.json().paths['/api/documents/upload'].post;
    expect(operation).toMatchObject({
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: expect.arrayContaining(['projectId', 'documentType', 'file']),
              properties: {
                projectId: { type: 'string', format: 'uuid' },
                documentType: { type: 'string', enum: ['PRE_ACTS', 'POST_ACTS'] },
                file: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
    });
  });

  it.each([
    ['report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['budget.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['PROPOSAL.PDF', 'application/pdf'],
  ])('accepts the approved format %s', async (filename, mimeType) => {
    const { create } = await setup();
    create.mockResolvedValue({ ...document, filename, mimeType });
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, { ...pdf, filename, mimeType }]),
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ filename, mimeType, fileUrl });
  });

  it('accepts metadata fields after the file', async () => {
    const { create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([pdf, ...fields]),
    });
    expect(response.statusCode).toBe(201);
    expect(create).toHaveBeenCalledOnce();
  });

  it('accepts a post-acts document classification', async () => {
    const { create } = await setup();
    create.mockResolvedValue({ ...document, documentType: 'POST_ACTS' });
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([
        { name: 'projectId', value: projectId },
        { name: 'documentType', value: 'POST_ACTS' },
        pdf,
      ]),
    });
    expect(response.statusCode).toBe(201);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ documentType: 'POST_ACTS' }),
    });
  });

  it('accepts a file exactly 25 MB in size', async () => {
    const { create } = await setup();
    create.mockResolvedValue({ ...document, sizeBytes: BigInt(maxFileSize) });
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, { ...pdf, buffer: Buffer.alloc(maxFileSize) }]),
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().sizeBytes).toBe(maxFileSize);
  });

  it('rejects a file larger than 25 MB before uploading or saving', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, { ...pdf, buffer: Buffer.alloc(maxFileSize + 1) }]),
    });
    expect(response.statusCode).toBe(413);
    expect(response.json()).toMatchObject({
      success: false,
      error: { code: 'FILE_TOO_LARGE', statusCode: 413 },
      timestamp: expect.any(String),
      requestId: expect.any(String),
    });
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a missing file', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart(fields),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('FILE_REQUIRED');
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an empty file', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, { ...pdf, buffer: Buffer.alloc(0) }]),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('EMPTY_FILE');
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ['program.exe', 'application/pdf'],
    ['proposal.pdf', 'application/octet-stream'],
    ['report.docx', 'application/pdf'],
    ['proposal.pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ])('rejects an unsupported extension/MIME pair: %s, %s', async (filename, mimeType) => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, { ...pdf, filename, mimeType }]),
    });
    expect(response.statusCode).toBe(415);
    expect(response.json().error.code).toBe('UNSUPPORTED_FILE_TYPE');
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    { projectId: 'invalid', documentType: 'PRE_ACTS' },
    { projectId, documentType: 'OTHER' },
    { projectId },
    { documentType: 'PRE_ACTS' },
  ])('rejects invalid upload metadata: %j', async (values) => {
    const { send, create } = await setup();
    const metadata = Object.entries(values).map(([name, value]) => ({ name, value }));
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...metadata, pdf]),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects multiple files', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf, { ...pdf, filename: 'second.pdf' }]),
    });
    expect(response.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a file under an unexpected form field', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, { ...pdf, name: 'attachment' }]),
    });
    expect(response.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a non-multipart request', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      payload: { projectId, documentType: 'PRE_ACTS' },
    });
    expect(response.statusCode).toBe(415);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects duplicate metadata fields', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([fields[0], fields[0], pdf]),
    });
    expect(response.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects truncated metadata fields', async () => {
    const { send, create } = await setup();
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([fields[0], { name: 'documentType', value: 'x'.repeat(257) }, pdf]),
    });
    expect(response.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an incomplete multipart body without saving a document', async () => {
    const { send, create } = await setup();
    const form = multipart([...fields, pdf]);
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      headers: form.headers,
      payload: form.payload.subarray(0, -30),
    });
    expect(response.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown project before uploading', async () => {
    const { findProject, send, create } = await setup();
    findProject.mockResolvedValue(null);
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.message).toBe('Project not found');
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a storage error without saving when S3 rejects the upload', async () => {
    const { send, create } = await setup();
    send.mockRejectedValue(new Error('Storage unavailable'));
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });
    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe('STORAGE_ERROR');
    expect(create).not.toHaveBeenCalled();
  });

  it('deletes the uploaded object when saving the document fails', async () => {
    const { create, send } = await setup();
    create.mockRejectedValue(new Error('Database unavailable'));
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });
    expect(response.statusCode).toBe(500);
    expect(response.json().error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(send).toHaveBeenCalledTimes(2);
    const uploadCommand = send.mock.calls[0][0] as PutObjectCommand;
    const cleanupCommand = send.mock.calls[1][0] as DeleteObjectCommand;
    expect(cleanupCommand).toBeInstanceOf(DeleteObjectCommand);
    expect(cleanupCommand.input).toEqual({
      Bucket: 'test-documents',
      Key: uploadCommand.input.Key,
    });
  });

  it('preserves the database failure if object cleanup also fails', async () => {
    const { create, send } = await setup();
    create.mockRejectedValue(new Error('Database unavailable'));
    send.mockResolvedValueOnce().mockRejectedValueOnce(new Error('Cleanup unavailable'));
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });
    expect(response.statusCode).toBe(500);
    expect(response.json().error.message).toBe('Could not save document');
  });

  it('returns 404 and cleans up if the project is removed before saving', async () => {
    const { create, send } = await setup();
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Project was removed', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    );
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.message).toBe('Project not found');
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
  });

  it('does not upload or save when URL signing fails', async () => {
    const { send, create } = await setup();
    vi.mocked(getSignedUrl).mockRejectedValue(new Error('Signing unavailable'));
    const response = await app!.inject({
      method: 'POST',
      url: '/api/documents/upload',
      ...multipart([...fields, pdf]),
    });
    expect(response.statusCode).toBe(502);
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('retrieves metadata with a freshly signed URL on each request', async () => {
    const { findOne, send } = await setup();
    const refreshedUrl = 'https://storage.test/documents/proposal.pdf?signature=refreshed';
    vi.mocked(getSignedUrl).mockResolvedValueOnce(fileUrl).mockResolvedValueOnce(refreshedUrl);
    const first = await app!.inject(`/api/documents/${documentId}`);
    const second = await app!.inject(`/api/documents/${documentId}`);

    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({
      documentId,
      filename: document.filename,
      fileUrl,
      mimeType: document.mimeType,
      sizeBytes: Number(document.sizeBytes),
      uploadedAt: document.uploadedAt.toISOString(),
    });
    expect(second.json().fileUrl).toBe(refreshedUrl);
    expect(first.headers['cache-control']).toBe('no-store');
    expect(findOne).toHaveBeenCalledWith({ where: { id: documentId, isDeleted: false } });
    expect(getSignedUrl).toHaveBeenCalledTimes(2);
    expect(vi.mocked(getSignedUrl).mock.calls[0][1].input).toMatchObject({
      Key: document.storageKey,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing or removed document without signing a URL', async () => {
    const { findOne } = await setup();
    findOne.mockResolvedValue(null);
    const response = await app!.inject(`/api/documents/${documentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.json().error.message).toBe('Document not found');
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('returns an S3-compatible signed URL using the configured bucket and object key', async () => {
    await setup();
    const signer = await vi.importActual<typeof import('@aws-sdk/s3-request-presigner')>(
      '@aws-sdk/s3-request-presigner',
    );
    vi.mocked(getSignedUrl).mockImplementation(signer.getSignedUrl);
    const response = await app!.inject(`/api/documents/${documentId}`);
    expect(response.statusCode).toBe(200);
    const signedUrl = new URL(response.json().fileUrl);
    expect(signedUrl.origin).toBe('http://storage.test');
    expect(signedUrl.pathname).toBe(`/test-documents/${document.storageKey}`);
    expect(signedUrl.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(signedUrl.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256');
    expect(signedUrl.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects an invalid document ID before querying the database', async () => {
    const { findOne } = await setup();
    const response = await app!.inject('/api/documents/invalid');
    expect(response.statusCode).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });
});
