import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { corsPlugin } from './cors';
import { helmetPlugin } from './helmet';
import { sensiblePlugin } from './sensible';
import { swaggerPlugin } from './swagger';
import { prismaPlugin, type PrismaPluginOptions } from './prisma';
import { multipartPlugin } from './multipart';
import { s3Plugin, type S3PluginOptions } from './s3';

export const registerPlugins = fp<PrismaPluginOptions & S3PluginOptions>(
  async (fastify: FastifyInstance, options) => {
    await fastify.register(prismaPlugin, { prisma: options.prisma });
    await fastify.register(s3Plugin, { s3: options.s3 });
    await fastify.register(multipartPlugin);
    await fastify.register(sensiblePlugin);
    await fastify.register(helmetPlugin);
    await fastify.register(corsPlugin);
    await fastify.register(swaggerPlugin);
  },
);
