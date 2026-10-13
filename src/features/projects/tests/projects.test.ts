import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '@/app';
import { PrismaService } from '@/shared/database/prisma.service';

function createTestPrisma() {
  const prisma = new PrismaService('postgresql://postgres:test@localhost:5432/test');
  vi.spyOn(prisma, '$connect').mockResolvedValue();
  vi.spyOn(prisma, '$disconnect').mockResolvedValue();
  return prisma;
}

describe('Projects dependency injection', () => {
  const apps: FastifyInstance[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    vi.restoreAllMocks();
  });

  it('injects the shared Prisma client through the repository into the service', async () => {
    const prisma = createTestPrisma();
    const project = { id: 'project-id', userId: 'user-id', name: 'Test event' };
    const create = vi.spyOn(prisma.project, 'create').mockResolvedValue(project);
    const app = await buildApp({ logger: false, prisma });
    apps.push(app);

    expect(await app.projectsService.create({ name: project.name }, project.userId)).toEqual(
      project,
    );
    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: { name: project.name, user: { connect: { id: project.userId } } },
    });

    await app.register(async (feature) => {
      feature.get('/test-projects-di', async () => ({
        shared: feature.projectsService === app.projectsService,
      }));
    });
    expect((await app.inject('/test-projects-di')).json()).toEqual({ shared: true });
    expect(prisma.$connect).toHaveBeenCalledOnce();
  });

  it('propagates repository failures to the caller', async () => {
    const prisma = createTestPrisma();
    const error = new Error('Database operation failed');
    vi.spyOn(prisma.project, 'create').mockRejectedValue(error);
    const app = await buildApp({ logger: false, prisma });
    apps.push(app);

    await expect(app.projectsService.create({ name: 'Test event' }, 'user-id')).rejects.toBe(error);
  });

  it('creates separate services and repositories for separate app instances', async () => {
    const firstPrisma = createTestPrisma();
    const secondPrisma = createTestPrisma();
    const project = { id: 'project-id', userId: 'user-id', name: 'Test event' };
    const firstCreate = vi.spyOn(firstPrisma.project, 'create').mockResolvedValue(project);
    const secondCreate = vi.spyOn(secondPrisma.project, 'create').mockResolvedValue(project);
    const first = await buildApp({ logger: false, prisma: firstPrisma });
    apps.push(first);
    const second = await buildApp({ logger: false, prisma: secondPrisma });
    apps.push(second);

    expect(first.projectsService).not.toBe(second.projectsService);
    await first.projectsService.create({ name: project.name }, project.userId);
    expect(firstCreate).toHaveBeenCalledOnce();
    expect(secondCreate).not.toHaveBeenCalled();
  });
});
