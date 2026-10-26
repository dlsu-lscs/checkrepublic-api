import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { corsPlugin } from './cors';
import { helmetPlugin } from './helmet';
import { sensiblePlugin } from './sensible';
import { swaggerPlugin } from './swagger';
import { prismaPlugin, type PrismaPluginOptions } from './prisma';

export const registerPlugins = fp<PrismaPluginOptions>(
  async (fastify: FastifyInstance, options) => {
    await fastify.register(prismaPlugin, { prisma: options.prisma });
    await fastify.register(sensiblePlugin);
    await fastify.register(helmetPlugin);
    await fastify.register(corsPlugin);
    await fastify.register(swaggerPlugin);
  },
);
