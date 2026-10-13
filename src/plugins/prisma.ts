import fp from 'fastify-plugin';
import { env } from '@/config/env';
import { PrismaService } from '@/shared/database/prisma.service';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaService;
  }
}

export interface PrismaPluginOptions {
  prisma?: PrismaService;
}

export const prismaPlugin = fp<PrismaPluginOptions>(
  async (app, options) => {
    const prisma = options.prisma ?? new PrismaService(env.DATABASE_URL);

    // Register cleanup before connecting so failed startup can also release resources.
    app.addHook('onClose', async () => {
      await prisma.$disconnect();
    });

    try {
      await prisma.$connect();
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }

    app.decorate('prisma', prisma);
  },
  { name: 'prisma', fastify: '5.x' },
);
