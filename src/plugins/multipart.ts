import multipart from '@fastify/multipart';
import fp from 'fastify-plugin';

export const multipartPlugin = fp(
  async (app) => {
    await app.register(multipart, {
      throwFileSizeLimit: true,
      limits: {
        fileSize: 26_214_400,
        files: 1,
        fields: 2,
        parts: 3,
        fieldSize: 256,
      },
    });
  },
  { name: 'multipart', fastify: '5.x' },
);
