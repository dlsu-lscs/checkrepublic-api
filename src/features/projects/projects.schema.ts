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
