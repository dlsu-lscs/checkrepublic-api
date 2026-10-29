import fp from 'fastify-plugin';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';

declare module 'fastify' {
  interface FastifyInstance {
    documentsService: DocumentsService;
  }
}

export const documentsPlugin = fp(
  async (app) => {
    const repository = new DocumentsRepository(app.prisma);
    const service = new DocumentsService(
      repository,
      app.s3,
      app.log.child({ service: 'DocumentsService' }),
    );
    app.decorate('documentsService', service);
  },
  { name: 'documents', fastify: '5.x', dependencies: ['prisma', 's3', 'multipart'] },
);
