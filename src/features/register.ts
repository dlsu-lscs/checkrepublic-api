import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health/health.routes';

export async function registerFeatures(fastify: FastifyInstance): Promise<void> {
  await fastify.register(healthRoutes);
}
