const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../../env/main.env'), quiet: true });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-with-at-least-32-chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-with-at-least-32-chars';
process.env.DB_HOST = process.env.TEST_DB_HOST || '127.0.0.1';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'npj_test';
process.env.DB_USER = process.env.TEST_DB_USER || process.env.DB_USER || 'appuser';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_HOST_PORT || '3306';
process.env.SMTP_HOST = process.env.TEST_SMTP_HOST || '127.0.0.1';
process.env.SMTP_PORT = process.env.TEST_SMTP_PORT || '1025';
process.env.SMTP_SECURE = 'false';
process.env.ENABLE_EMAILS = 'true';

if (!process.env.DB_NAME.endsWith('_test')) {
  throw new Error(`Testes recusaram banco inseguro: ${process.env.DB_NAME}`);
}

jest.setTimeout(30000);
