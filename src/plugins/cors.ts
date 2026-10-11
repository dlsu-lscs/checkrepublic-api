import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '@/config/env';

export const corsPlugin = fp(async (fastify: FastifyInstance) => {
  const origin = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim());

  await fastify.register(cors, {
    origin,
    credentials: true,
  });
});
