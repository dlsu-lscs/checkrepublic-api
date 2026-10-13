import { describe, it, expect } from 'vitest';
import { validateEnv } from '@/config/env';

const DATABASE_URL = 'postgresql://postgres:test@localhost:5432/checkrepublic_test';

describe('Config / Environment Validation', () => {
  it('should validate and parse valid environment variables', () => {
    const validConfig = validateEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'warn',
      CORS_ORIGIN: 'http://localhost:3000',
      DATABASE_URL,
    });

    expect(validConfig.NODE_ENV).toBe('test');
    expect(validConfig.PORT).toBe(4000);
    expect(validConfig.HOST).toBe('127.0.0.1');
    expect(validConfig.LOG_LEVEL).toBe('warn');
    expect(validConfig.CORS_ORIGIN).toBe('http://localhost:3000');
    expect(validConfig.DATABASE_URL).toBe(DATABASE_URL);
  });

  it('should use default values when optional environment variables are missing', () => {
    const config = validateEnv({ DATABASE_URL });

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe('0.0.0.0');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.CORS_ORIGIN).toBe('*');
  });

  it('should throw an explicit error on invalid NODE_ENV', () => {
    expect(() => {
      validateEnv({ NODE_ENV: 'invalid-env', DATABASE_URL });
    }).toThrow('[Config Error] Invalid or missing environment configuration');
  });

  it('should throw an explicit error on invalid PORT value', () => {
    expect(() => {
      validateEnv({ PORT: '999999', DATABASE_URL });
    }).toThrow('[Config Error] Invalid or missing environment configuration');
  });

  it.each([undefined, '', 'invalid-url', 'https://localhost/database', 'mysql://localhost/db'])(
    'rejects a missing or invalid database URL: %s',
    (databaseUrl) => {
      expect(() => validateEnv({ DATABASE_URL: databaseUrl })).toThrow('DATABASE_URL');
    },
  );

  it('accepts the postgres URL scheme', () => {
    const url = 'postgres://postgres:test@localhost:5432/checkrepublic_test';
    expect(validateEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });
});
