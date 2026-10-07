import { describe, it, expect } from 'vitest';
import { validateEnv } from './env';

describe('Config / Environment Validation', () => {
  it('should validate and parse valid environment variables', () => {
    const validConfig = validateEnv({
      NODE_ENV: 'test',
      PORT: '4000',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'warn',
      CORS_ORIGIN: 'http://localhost:3000',
    });

    expect(validConfig.NODE_ENV).toBe('test');
    expect(validConfig.PORT).toBe(4000);
    expect(validConfig.HOST).toBe('127.0.0.1');
    expect(validConfig.LOG_LEVEL).toBe('warn');
    expect(validConfig.CORS_ORIGIN).toBe('http://localhost:3000');
  });

  it('should use default values when optional environment variables are missing', () => {
    const config = validateEnv({});

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe('0.0.0.0');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.CORS_ORIGIN).toBe('*');
  });

  it('should throw an explicit error on invalid NODE_ENV', () => {
    expect(() => {
      validateEnv({ NODE_ENV: 'invalid-env' });
    }).toThrow('[Config Error] Invalid or missing environment configuration');
  });

  it('should throw an explicit error on invalid PORT value', () => {
    expect(() => {
      validateEnv({ PORT: '999999' });
    }).toThrow('[Config Error] Invalid or missing environment configuration');
  });
});
