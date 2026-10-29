import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  S3_ENDPOINT: z
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'S3_ENDPOINT must use HTTP or HTTPS'),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  DATABASE_URL: z
    .url()
    .refine(
      (value) => /^postgres(?:ql)?:\/\//i.test(value),
      'DATABASE_URL must be a PostgreSQL connection URL',
    ),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(input: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    const message = `[Config Error] Invalid or missing environment configuration:\n${errorDetails}`;
    throw new Error(message);
  }

  return result.data;
}

export const env: Env = validateEnv();
