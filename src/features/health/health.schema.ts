import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.string().describe('Service health status'),
  timestamp: z.string().describe('Current ISO timestamp'),
  uptime: z.number().describe('Service uptime in seconds'),
  version: z.string().describe('Application version'),
  environment: z.string().describe('Active runtime environment'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
