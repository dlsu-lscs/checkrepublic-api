import fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '@/app';
import { PrismaService } from '@/shared/database/prisma.service';
import { prismaPlugin } from '@/plugins/prisma';

function createTestService() {
  const prisma = new PrismaService('postgresql://postgres:test@localhost:5432/test');
  vi.spyOn(prisma, '$connect').mockResolvedValue();
  vi.spyOn(prisma, '$disconnect').mockResolvedValue();
  return prisma;
}

describe('Shared Prisma plugin', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.restoreAllMocks();
  });

  it('connects once and exposes the same service to separate feature scopes', async () => {
    const prisma = createTestService();
    app = fastify();
    await app.register(prismaPlugin, { prisma });

    for (const route of ['/first', '/second']) {
      await app.register(async (feature) => {
        feature.get(route, async () => ({ shared: feature.prisma === prisma }));
      });
    }

    for (const url of ['/first', '/second']) {
      const response = await app.inject({ url });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ shared: true });
    }
    expect(app.prisma).toBe(prisma);
    expect(prisma.$connect).toHaveBeenCalledExactlyOnceWith();
    expect(prisma.$disconnect).not.toHaveBeenCalled();

    await app.close();
    expect(prisma.$disconnect).toHaveBeenCalledExactlyOnceWith();
  });

  it('rejects startup and releases the client when connection fails', async () => {
    const prisma = createTestService();
    const error = new Error('Database unavailable');
    vi.mocked(prisma.$connect).mockRejectedValue(error);
    app = fastify();
    app.register(prismaPlugin, { prisma });

    await expect(app.ready()).rejects.toThrow(error);
    expect(prisma.$disconnect).toHaveBeenCalled();
    expect(app.hasDecorator('prisma')).toBe(false);
  });

  it('registers Prisma through buildApp and releases it on application shutdown', async () => {
    const prisma = createTestService();
    app = await buildApp({ logger: false, prisma });
    expect(app.prisma).toBe(prisma);
    expect(prisma.$connect).toHaveBeenCalledOnce();
    expect((await app.inject('/api/health')).statusCode).toBe(200);

    await app.close();
    expect(prisma.$disconnect).toHaveBeenCalledOnce();
  });

  it('propagates database failures from buildApp', async () => {
    const prisma = createTestService();
    vi.mocked(prisma.$connect).mockRejectedValue(new Error('Database unavailable'));
    await expect(buildApp({ logger: false, prisma })).rejects.toThrow('Database unavailable');
    expect(prisma.$disconnect).toHaveBeenCalled();
  });
});
