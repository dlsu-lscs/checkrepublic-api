import fp from 'fastify-plugin';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

declare module 'fastify' {
  interface FastifyInstance {
    projectsService: ProjectsService;
  }
}

export const projectsPlugin = fp(
  async (app) => {
    const repository = new ProjectsRepository(app.prisma);
    const service = new ProjectsService(repository);

    app.decorate('projectsService', service);
  },
  { name: 'projects', fastify: '5.x', dependencies: ['prisma'] },
);
