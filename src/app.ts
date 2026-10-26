import fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '@/config/env';
import { registerPlugins } from '@/plugins/register';
import type { PrismaPluginOptions } from '@/plugins/prisma';
import { registerFeatures } from '@/features/register';
import { globalErrorHandler } from '@/shared/errors/error-handler';
import { errorResponse } from '@/shared/utils/response';

export type BuildAppOptions = FastifyServerOptions & PrismaPluginOptions;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const { prisma, ...serverOptions } = options;
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
    await app.register(registerPlugins, { prisma });
    await app.register(registerFeatures);
  } catch (error) {
    await app.close();
    throw error;
  }

  return app;
}
