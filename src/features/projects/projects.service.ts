import type { FastifyBaseLogger } from 'fastify';
import type { ProjectsRepository } from './projects.repository';
import type { CreateProjectInput } from './projects.schema';

export class ProjectsService {
  constructor(
    private readonly repository: ProjectsRepository,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async create(data: CreateProjectInput, userId: string) {
    this.logger.debug({ userId }, `Creating project ${data.name}`);

    /**
     * TODO:
     * Call findOne user repo to check if it is an existing user based on userId
     * Kung hindi sya existing (null) then throw NotFoundError, make sure na may logger 
     *  */ 
    const project = await this.repository.create(data, userId);
    this.logger.info({ projectId: project.id, userId }, `Project ${data.name} created`);

    return project;
  }
}
