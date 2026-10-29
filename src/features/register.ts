import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { healthRoutes } from './health/health.routes';
import { projectsPlugin } from './projects/projects.plugin';
import { projectsRoutes } from './projects/projects.routes';
import { documentsPlugin } from './documents/documents.plugin';
import { documentsRoutes } from './documents/documents.routes';

export const registerFeatures = fp(async (fastify: FastifyInstance): Promise<void> => {
  await fastify.register(projectsPlugin);
  await fastify.register(documentsPlugin);
  await fastify.register(
    async (api) => {
      await api.register(projectsRoutes);
      await api.register(documentsRoutes);
      await api.register(healthRoutes);
    },
    { prefix: '/api' },
  );
});
