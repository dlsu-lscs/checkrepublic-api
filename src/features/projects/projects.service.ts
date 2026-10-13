import type { ProjectsRepository } from './projects.repository';
import type { CreateProjectInput, ProjectResponse } from './projects.schema';
import { Prisma } from '@/shared/database/generated/client';
import { NotFoundError } from '@/shared/errors/app-error';

export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  async create(data: CreateProjectInput, userId: string): Promise<ProjectResponse> {
    try {
      const project = await this.repository.create(data, userId);
      return {
        ...project,
        createdAt: project.createdAt.toISOString(),
        modifiedAt: project.modifiedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      throw error;
    }
  }
}
