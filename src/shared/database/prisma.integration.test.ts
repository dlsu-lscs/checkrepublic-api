import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '@/app';

describe('Prisma with PostgreSQL', () => {
  let app: FastifyInstance | undefined;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('queries PostgreSQL through the app service', async () => {
    const rows = await app!.prisma.$queryRaw<{ value: number }[]>`SELECT 1::int AS value`;
    expect(rows).toEqual([{ value: 1 }]);
  });

  it('writes and reads parameterized values in a transaction', async () => {
    const value = "Prisma's shared PostgreSQL service";
    const rows = await app!.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`CREATE TEMP TABLE prisma_service_test (value TEXT NOT NULL) ON COMMIT DROP`;
      await tx.$executeRaw`INSERT INTO prisma_service_test (value) VALUES (${value})`;
      return tx.$queryRaw<{ value: string }[]>`SELECT value FROM prisma_service_test`;
    });
    expect(rows).toEqual([{ value }]);
  });

  it('rolls back failed transactions and keeps the pool usable', async () => {
    await expect(
      app!.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`CREATE TEMP TABLE prisma_rollback_test (id INTEGER) ON COMMIT DROP`;
        await tx.$executeRaw`INSERT INTO prisma_rollback_test (id) VALUES (1)`;
        throw new Error('Rollback requested');
      }),
    ).rejects.toThrow('Rollback requested');

    const rows = await app!.prisma.$queryRaw<{ table: string | null }[]>`
      SELECT to_regclass('pg_temp.prisma_rollback_test')::text AS "table"
    `;
    expect(rows).toEqual([{ table: null }]);
  });
});
