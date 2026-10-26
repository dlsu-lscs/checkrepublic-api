import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ProjectsController } from './projects.controller';
import {
  createProjectRequestSchema,
  projectErrorResponseSchema,
  projectResponseSchema,
} from './projects.schema';

export async function projectsRoutes(app: FastifyInstance): Promise<void> {
  const controller = new ProjectsController(app.projectsService);

  app.withTypeProvider<ZodTypeProvider>().post(
    '/projects',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Create a project',
        description: 'Creates a project; userId is accepted temporarily for local testing',
        body: createProjectRequestSchema,
        response: {
          201: projectResponseSchema,
          400: projectErrorResponseSchema,
          404: projectErrorResponseSchema,
          500: projectErrorResponseSchema,
        },
      },
    },
    controller.create,
  );
}
