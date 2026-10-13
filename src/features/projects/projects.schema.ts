import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Temporary owner field for local testing until authentication supplies the user.
export const createProjectRequestSchema = createProjectSchema.extend({
  userId: z.uuid(),
});

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

export const projectResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  name: z.string().min(1).max(255),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type ProjectResponse = z.infer<typeof projectResponseSchema>;

export const projectErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    statusCode: z.number().int().min(400).max(599),
    details: z.unknown().optional(),
  }),
  timestamp: z.iso.datetime(),
  requestId: z.string().optional(),
});

export type ProjectErrorResponse = z.infer<typeof projectErrorResponseSchema>;
