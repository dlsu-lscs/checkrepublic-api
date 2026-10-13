import { validateEnv } from '@/config/env';
import { buildApp } from './app';

async function bootstrap(): Promise<void> {
  // Validate configuration before boot - halts on invalid/missing vars
  let env;
  try {
    env = validateEnv();
  } catch (error) {
    console.error('Fatal configuration error during startup:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const app = await buildApp();

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}. Initiating graceful shutdown...`);
      try {
        await app.close();
        app.log.info('Server successfully closed');
        process.exit(0);
      } catch (err) {
        app.log.error(err, 'Error occurred while closing server');
        process.exit(1);
      }
    });
  }

  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ reason }, 'Unhandled Promise rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    app.log.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    const displayHost = env.HOST === '0.0.0.0' ? 'localhost' : env.HOST;
    const baseUrl = `http://${displayHost}:${env.PORT}`;
    app.log.info(`Server running at ${baseUrl}`);
    app.log.info(`Swagger documentation available at ${baseUrl}/documentation`);
  } catch (err) {
    app.log.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

void bootstrap();
