import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '@/app';
import { PrismaService } from '@/shared/database/prisma.service';
import { Prisma } from '@/shared/database/generated/client';
import {
  projectErrorResponseSchema,
  projectResponseSchema,
} from '@/features/projects/projects.schema';

describe('POST /api/projects', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.restoreAllMocks();
  });

  async function setup() {
    const prisma = new PrismaService('postgresql://postgres:test@localhost:5432/test');
    vi.spyOn(prisma, '$connect').mockResolvedValue();
    vi.spyOn(prisma, '$disconnect').mockResolvedValue();
    app = await buildApp({ logger: false, prisma });
    return prisma;
  }

  it('creates a project with the supplied owner and a trimmed name', async () => {
    const userId = randomUUID();
    const prisma = await setup();
    const project = { id: randomUUID(), userId, name: 'Test event' };
    const create = vi.spyOn(prisma.project, 'create').mockResolvedValue(project);

    const response = await app!.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { name: '  Test event  ', userId },
    });
    expect(response.statusCode).toBe(201);
    expect(projectResponseSchema.parse(response.json())).toEqual(project);
    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: { name: 'Test event', user: { connect: { id: userId } } },
    });
  });

  it.each([{}, { name: '' }, { name: '   ' }, { name: 'x'.repeat(256) }, { name: 123 }])(
    'rejects invalid project input: %j',
    async (payload) => {
      const prisma = await setup();
      const create = vi.spyOn(prisma.project, 'create');
      const response = await app!.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { ...payload, userId: randomUUID() },
      });

      expect(response.statusCode).toBe(400);
      expect(projectErrorResponseSchema.parse(response.json())).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR', statusCode: 400 },
      });
      expect(create).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, '', 'not-a-uuid'])(
    'rejects a missing or invalid userId: %s',
    async (userId) => {
      const prisma = await setup();
      const create = vi.spyOn(prisma.project, 'create');
      const response = await app!.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Test event', userId },
      });

      expect(response.statusCode).toBe(400);
      expect(projectErrorResponseSchema.parse(response.json())).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR', statusCode: 400 },
      });
      expect(create).not.toHaveBeenCalled();
    },
  );

  it('returns the existing error response format for repository failures', async () => {
    const prisma = await setup();
    vi.spyOn(prisma.project, 'create').mockRejectedValue(new Error('Database failed'));
    const response = await app!.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { name: 'Test event', userId: randomUUID() },
    });

    expect(response.statusCode).toBe(500);
    expect(projectErrorResponseSchema.parse(response.json())).toMatchObject({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', statusCode: 500 },
    });
  });

  it('returns 404 when the owner does not exist', async () => {
    const prisma = await setup();
    vi.spyOn(prisma.project, 'create').mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Required user not found', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    );
    const response = await app!.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { name: 'Test event', userId: randomUUID() },
    });
    expect(response.statusCode).toBe(404);
    expect(projectErrorResponseSchema.parse(response.json())).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found', statusCode: 404 },
    });
  });

  it('documents the request and response schemas in OpenAPI', async () => {
    await setup();
    await app!.ready();
    const operation = app!.swagger().paths?.['/api/projects']?.post;
    expect(operation?.tags).toEqual(['Projects']);
    expect(operation).toHaveProperty('requestBody');
    expect(Object.keys(operation?.responses ?? {})).toEqual(['201', '400', '404', '500']);
  });

  it('requires the API prefix for feature routes', async () => {
    const prisma = await setup();
    const create = vi.spyOn(prisma.project, 'create');
    const response = await app!.inject({
      method: 'POST',
      url: '/projects',
      payload: { name: 'Test event', userId: randomUUID() },
    });
    expect(response.statusCode).toBe(404);
    expect((await app!.inject('/health')).statusCode).toBe(404);
    expect((await app!.inject('/api/health')).statusCode).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });
});
