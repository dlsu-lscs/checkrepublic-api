import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { env } from '@/config/env';
import { AppError } from './app-error';
import { errorResponse } from '../utils/response';

export function globalErrorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  const requestId = typeof request.id === 'string' ? request.id : undefined;

  // 1. Handled AppError instances
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      request.log.error({ err: error, requestId }, error.message);
    } else {
      request.log.warn({ err: error, requestId }, error.message);
    }

    return reply
      .status(error.statusCode)
      .send(errorResponse(error.code, error.message, error.statusCode, error.details, requestId));
  }

  // 2. Schema validation errors (Zod / Fastify)
  if (hasZodFastifySchemaValidationErrors(error)) {
    request.log.warn({ err: error, validation: error.validation, requestId }, 'Validation failed');
    return reply
      .status(400)
      .send(
        errorResponse(
          'VALIDATION_ERROR',
          'Request validation failed',
          400,
          error.validation,
          requestId,
        ),
      );
  }

  // 3. Fastify built-in errors (e.g. FST_ERR_*, 404, 400 from body parsing)
  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode && fastifyError.statusCode < 500) {
    request.log.warn({ err: error, requestId }, fastifyError.message);
    return reply
      .status(fastifyError.statusCode)
      .send(
        errorResponse(
          fastifyError.code || 'BAD_REQUEST',
          fastifyError.message,
          fastifyError.statusCode,
          fastifyError.validation,
          requestId,
        ),
      );
  }

  // 4. Unexpected server errors
  request.log.error({ err: error, requestId }, 'Unhandled exception occurred');

  const isProduction = env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal Server Error' : error.message || 'Internal Server Error';
  const details = isProduction ? undefined : { stack: error.stack };

  return reply
    .status(500)
    .send(errorResponse('INTERNAL_SERVER_ERROR', message, 500, details, requestId));
}
