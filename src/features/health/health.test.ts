import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app';
import { HealthService } from './health.service';

describe('Health Feature Slice', () => {
  describe('HealthService', () => {
    it('should return valid health data', () => {
      const service = new HealthService();
      const health = service.getHealth();

      expect(health.status).toBe('ok');
      expect(health.version).toBe('1.0.0');
      expect(typeof health.uptime).toBe('number');
      expect(typeof health.environment).toBe('string');
      expect(typeof health.timestamp).toBe('string');
    });
  });

  describe('GET /health (Integration)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildApp();
      await app.ready();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should return 200 with service health payload', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        status: 'ok',
        version: '1.0.0',
      });
      expect(typeof body.uptime).toBe('number');
      expect(typeof body.environment).toBe('string');
      expect(typeof body.timestamp).toBe('string');
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });
  });
});
