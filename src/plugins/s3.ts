import { S3Client } from '@aws-sdk/client-s3';
import fp from 'fastify-plugin';
import { env } from '@/config/env';

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
  }
}

export interface S3PluginOptions {
  s3?: S3Client;
}

export const s3Plugin = fp<S3PluginOptions>(
  async (app, options) => {
    const s3 =
      options.s3 ??
      new S3Client({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });

    app.addHook('onClose', async () => {
      s3.destroy();
    });
    app.decorate('s3', s3);
  },
  { name: 's3', fastify: '5.x' },
);
