import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DocumentsService } from './documents.service';

export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  public upload = async (request: FastifyRequest, reply: FastifyReply) => {
    const document = await this.documentsService.upload(request);
    return reply.header('Cache-Control', 'no-store').status(201).send(document);
  };

  public findOne = async (
    request: FastifyRequest<{ Params: { documentId: string } }>,
    reply: FastifyReply,
  ) => {
    const document = await this.documentsService.findOne(request.params.documentId);
    return reply.header('Cache-Control', 'no-store').status(200).send(document);
  };
}
