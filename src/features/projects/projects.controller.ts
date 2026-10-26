import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateProjectRequest } from './projects.schema';
import type { ProjectsService } from './projects.service';

export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  public create = async (
    request: FastifyRequest<{ Body: CreateProjectRequest }>,
    reply: FastifyReply,
  ) => {
    // TODO: Get userId from the authenticated session instead of the request body,
    // then remove userId from createProjectRequestSchema in projects.schema.ts.
    const { userId, ...data } = request.body;
    const project = await this.projectsService.create(data, userId);
    return reply.status(201).send(project);
  };
}
