import type { PrismaService } from '@/shared/database/prisma.service';
import type { CreateDocumentInput } from './documents.schema';

export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProject(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
  }

  async create(data: CreateDocumentInput) {
    return this.prisma.document.create({ data });
  }

  async findOne(documentId: string) {
    return this.prisma.document.findFirst({
      where: { id: documentId, isDeleted: false },
    });
  }
}
