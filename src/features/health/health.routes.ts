import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { HealthController } from './health.controller';
import { healthResponseSchema } from './health.schema';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new HealthController();

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Service health status',
        description: 'Returns health status, uptime, and runtime environment',
        response: {
          200: healthResponseSchema,
        },
      },
    },
    controller.getHealth,
  );
}
