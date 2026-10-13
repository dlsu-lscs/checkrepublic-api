import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

/** One service (and connection pool) per app; inject it into feature services. */
export class PrismaService extends PrismaClient {
  constructor(databaseUrl: string) {
    super({
      adapter: new PrismaPg({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5_000,
      }),
    });
  }
}
