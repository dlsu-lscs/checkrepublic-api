import { env } from '@/config/env';
import type { HealthResponse } from './health.schema';

export class HealthService {
  public getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime() * 100) / 100,
      version: '1.0.0',
      environment: env.NODE_ENV,
    };
  }
}
