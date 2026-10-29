import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { DocumentsController } from './documents.controller';
import { uploadDocumentRequestSchema } from './documents.schema';

export async function documentsRoutes(app: FastifyInstance): Promise<void> {
  const controller = new DocumentsController(app.documentsService);

  app.post(
    '/documents/upload',
    {
      config: {
        swaggerTransform: (options) =>
          jsonSchemaTransform({
            ...options,
            schema: { ...options.schema, body: uploadDocumentRequestSchema },
          }),
      },
      schema: {
        tags: ['Documents'],
        summary: 'Upload a document',
        description:
          'Upload one PDF, DOCX, or XLSX file (25 MB maximum) with projectId and documentType fields',
        consumes: ['multipart/form-data'],
      },
    },
    controller.upload,
  );

  app.get<{ Params: { documentId: string } }>(
    '/documents/:documentId',
    {
      schema: {
        tags: ['Documents'],
        summary: 'Retrieve document metadata and a signed download URL',
        description: 'Returns a fresh document URL valid for 15 minutes',
      },
    },
    controller.findOne,
  );
}
