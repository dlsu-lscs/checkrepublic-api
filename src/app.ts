import fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from '@/config/env';
import { registerPlugins } from '@/plugins';
import { registerFeatures } from '@/features';
import { globalErrorHandler } from '@/shared/errors';
import { errorResponse } from '@/shared/utils';

export type BuildAppOptions = FastifyServerOptions;

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
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
    ...options,
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

  await app.register(registerPlugins);
  await app.register(registerFeatures);

  return app;
}
