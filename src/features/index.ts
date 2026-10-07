import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';

export async function registerFeatures(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);
}

export * from './health';
