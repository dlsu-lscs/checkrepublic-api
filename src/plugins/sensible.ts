import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

export const sensiblePlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(sensible);
});
