import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { corsPlugin } from './cors';
import { helmetPlugin } from './helmet';
import { sensiblePlugin } from './sensible';
import { swaggerPlugin } from './swagger';

export const registerPlugins = fp(async (fastify: FastifyInstance) => {
  await fastify.register(sensiblePlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(swaggerPlugin);
});

export * from './cors';
export * from './helmet';
export * from './sensible';
export * from './swagger';
