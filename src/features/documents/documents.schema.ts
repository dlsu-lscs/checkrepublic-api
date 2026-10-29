import { z } from 'zod';
import { DocumentType, type Document } from '@/shared/database/generated/client';

export const uploadDocumentSchema = z.strictObject({
  projectId: z.uuid(),
  documentType: z.enum(DocumentType),
});

export const uploadDocumentRequestSchema = uploadDocumentSchema.extend({
  file: z.string().meta({
    format: 'binary',
    description: 'A PDF, DOCX, or XLSX file, up to 25 MB (26214400 bytes)',
  }),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export type CreateDocumentInput = UploadDocumentInput &
  Pick<Document, 'filename' | 'mimeType' | 'sizeBytes' | 'storageKey'>;
