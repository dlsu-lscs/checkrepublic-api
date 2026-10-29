import type { PrismaService } from '@/shared/database/prisma.service';
import type { CreateProjectInput } from './projects.schema';

export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProjectInput, userId: string) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        userId: userId,
      },
    });
  }
}
