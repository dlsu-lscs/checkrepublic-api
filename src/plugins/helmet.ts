import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

export const helmetPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });
});
