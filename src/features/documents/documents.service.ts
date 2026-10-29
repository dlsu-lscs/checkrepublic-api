import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { MultipartFile, MultipartValue } from '@fastify/multipart';
import type { FastifyBaseLogger, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { env } from '@/config/env';
import { Prisma, type Document } from '@/shared/database/generated/client';
import {
  AppError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from '@/shared/errors/app-error';
import type { DocumentsRepository } from './documents.repository';
import { uploadDocumentSchema, type UploadDocumentInput } from './documents.schema';

const supportedFileTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

type UploadedFile = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export class DocumentsService {
  constructor(
    private readonly repository: DocumentsRepository,
    private readonly s3: S3Client,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async upload(request: FastifyRequest) {
    this.assertMultipartRequest(request);
    const { data, file } = await this.readUpload(request);
    await this.assertProjectExists(data.projectId);

    const storageKey = `documents/${data.projectId}/${randomUUID()}${extname(file.filename).toLowerCase()}`;
    const fileUrl = await this.createFileUrl(storageKey);
    this.logger.debug({ projectId: data.projectId, filename: file.filename }, 'Uploading document');
    await this.uploadFile(file, storageKey);
    const document = await this.saveDocument(data, file, storageKey);
    this.logger.info({ documentId: document.id, projectId: data.projectId }, 'Document uploaded');
    return this.toMetadata(document, fileUrl);
  }

  async findOne(documentId: string) {
    this.assertDocumentId(documentId);
    this.logger.debug({ documentId }, 'Retrieving document');
    const document = await this.repository.findOne(documentId);
    if (!document) {
      this.logger.warn({ documentId }, 'Document not found');
      throw new NotFoundError('Document not found');
    }

    // TODO: Authorize the project owner once session authentication is available.
    const fileUrl = await this.createFileUrl(document.storageKey);
    this.logger.info({ documentId }, 'Document download URL generated');
    return this.toMetadata(document, fileUrl);
  }

  private assertMultipartRequest(request: FastifyRequest) {
    if (!request.isMultipart()) {
      this.logger.warn('Rejected a non-multipart upload');
      throw new AppError(
        'Use multipart/form-data to upload a document',
        415,
        'UNSUPPORTED_MEDIA_TYPE',
      );
    }
  }

  private async readUpload(request: FastifyRequest) {
    const fields = new Map<string, unknown>();
    let file: UploadedFile | undefined;

    try {
      for await (const part of request.parts()) {
        if (part.type === 'field') {
          this.addUploadField(fields, part);
        } else {
          file = await this.readFile(part);
        }
      }
    } catch (error) {
      this.throwMultipartError(error, request);
    }

    this.assertFilePresent(file);
    const data = this.validateUploadFields(Object.fromEntries(fields));
    return { data, file };
  }

  private addUploadField(fields: Map<string, unknown>, part: MultipartValue) {
    if (fields.has(part.fieldname) || part.valueTruncated || part.fieldnameTruncated) {
      this.logger.warn({ field: part.fieldname }, 'Rejected an invalid upload field');
      throw new BadRequestError('Upload fields must be unique and within the allowed length');
    }
    fields.set(part.fieldname, part.value);
  }

  private async readFile(part: MultipartFile): Promise<UploadedFile> {
    const buffer = await part.toBuffer();
    if (part.fieldname !== 'file') {
      throw new BadRequestError('The file must use the form field "file"');
    }
    this.assertSupportedFile(part);
    if (buffer.length === 0) {
      this.logger.warn({ filename: part.filename }, 'Rejected an empty document');
      throw new AppError('The uploaded file is empty', 400, 'EMPTY_FILE');
    }
    return { filename: part.filename, mimeType: part.mimetype, buffer };
  }

  private assertSupportedFile(file: MultipartFile) {
    const extension = extname(file.filename).toLowerCase();
    if (supportedFileTypes[extension] !== file.mimetype) {
      this.logger.warn(
        { filename: file.filename, mimeType: file.mimetype },
        'Rejected an unsupported document',
      );
      throw new AppError(
        'Upload a PDF, DOCX, or XLSX file with its matching MIME type',
        415,
        'UNSUPPORTED_FILE_TYPE',
      );
    }
  }

  private assertFilePresent(file: UploadedFile | undefined): asserts file is UploadedFile {
    if (!file) {
      this.logger.warn('Rejected an upload without a file');
      throw new AppError('A file is required', 400, 'FILE_REQUIRED');
    }
  }

  private validateUploadFields(fields: Record<string, unknown>) {
    const result = uploadDocumentSchema.safeParse(fields);
    if (!result.success) {
      this.logger.warn({ issues: result.error.issues }, 'Rejected invalid document metadata');
      throw new AppError('Invalid upload metadata', 400, 'VALIDATION_ERROR', result.error.issues);
    }
    return result.data;
  }

  private throwMultipartError(error: unknown, request: FastifyRequest): never {
    if (error instanceof AppError) throw error;
    this.logger.warn({ err: error }, 'Rejected an invalid multipart upload');
    if (error instanceof request.server.multipartErrors.RequestFileTooLargeError) {
      throw new AppError('The file exceeds the 25 MB limit', 413, 'FILE_TOO_LARGE');
    }
    throw new BadRequestError('Upload one file with projectId and documentType fields');
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.repository.findProject(projectId);
    if (!project) {
      this.logger.warn({ projectId }, 'Upload project not found');
      throw new NotFoundError('Project not found');
    }
    // TODO: Authorize the project owner once session authentication is available.
  }

  private assertDocumentId(documentId: string) {
    if (!z.uuid().safeParse(documentId).success) {
      this.logger.warn({ documentId }, 'Rejected an invalid document ID');
      throw new BadRequestError('Document ID must be a valid UUID');
    }
  }

  private async uploadFile(file: UploadedFile, storageKey: string) {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimeType,
          ContentLength: file.buffer.length,
        }),
      );
    } catch (error) {
      this.logger.error({ err: error, storageKey }, 'Could not upload document');
      throw new AppError('Document storage is unavailable', 502, 'STORAGE_ERROR');
    }
  }

  private async saveDocument(data: UploadDocumentInput, file: UploadedFile, storageKey: string) {
    try {
      return await this.repository.create({
        ...data,
        filename: file.filename,
        mimeType: file.mimeType,
        sizeBytes: BigInt(file.buffer.length),
        storageKey,
      });
    } catch (error) {
      this.logger.error(
        { err: error, projectId: data.projectId, storageKey },
        'Could not save document',
      );
      await this.removeUploadedFile(storageKey);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundError('Project not found');
      }
      throw new InternalServerError('Could not save document');
    }
  }

  private async removeUploadedFile(storageKey: string) {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
      this.logger.info({ storageKey }, 'Removed an upload after the database write failed');
    } catch (error) {
      this.logger.error({ err: error, storageKey }, 'Could not remove an orphaned upload');
    }
  }

  private async createFileUrl(storageKey: string) {
    try {
      return await getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }),
        { expiresIn: 900 },
      );
    } catch (error) {
      this.logger.error({ err: error, storageKey }, 'Could not generate a document URL');
      throw new AppError('Could not generate document URL', 502, 'STORAGE_ERROR');
    }
  }

  private toMetadata(document: Document, fileUrl: string) {
    return {
      documentId: document.id,
      filename: document.filename,
      fileUrl,
      mimeType: document.mimeType,
      sizeBytes: Number(document.sizeBytes),
      uploadedAt: document.uploadedAt.toISOString(),
    };
  }
}
