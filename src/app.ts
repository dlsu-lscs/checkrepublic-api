import fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '@/config/env';
import { registerPlugins } from '@/plugins/register';
import type { PrismaPluginOptions } from '@/plugins/prisma';
import type { S3PluginOptions } from '@/plugins/s3';
import { registerFeatures } from '@/features/register';
import { globalErrorHandler } from '@/shared/errors/error-handler';
import { errorResponse } from '@/shared/utils/response';

export type BuildAppOptions = FastifyServerOptions & PrismaPluginOptions & S3PluginOptions;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const { prisma, s3, ...serverOptions } = options;
  const isDev = env.NODE_ENV === 'development';
  const isTest = env.NODE_ENV === 'test';

  const defaultLogger: FastifyServerOptions['logger'] = isTest
    ? false
    : isDev
      ? {
          level: env.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : {
          level: env.LOG_LEVEL,
        };

  const app = fastify({
    logger: options.logger ?? defaultLogger,
    ...serverOptions,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(globalErrorHandler);

  app.setNotFoundHandler((request, reply) => {
    return reply
      .status(404)
      .send(
        errorResponse(
          'NOT_FOUND',
          `Route ${request.method} ${request.url} not found`,
          404,
          undefined,
          typeof request.id === 'string' ? request.id : undefined,
        ),
      );
  });

  try {
    await app.register(registerPlugins, { prisma, s3 });
    await app.register(registerFeatures);
  } catch (error) {
    await app.close();
    throw error;
  }

  return app;
}
