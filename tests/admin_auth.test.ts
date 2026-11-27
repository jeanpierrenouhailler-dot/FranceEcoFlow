import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminBearerToken } from '../server/api/adminAuth.ts';

describe('Ingestion administrator bearer token', () => {
  test('accepts a configured matching bearer token', () => {
    assert.equal(validateAdminBearerToken('Bearer test-secret', 'test-secret'), 'VALID');
  });

  test('rejects missing and incorrect authorization headers', () => {
    assert.equal(validateAdminBearerToken(undefined, 'test-secret'), 'INVALID');
    assert.equal(validateAdminBearerToken('Bearer wrong', 'test-secret'), 'INVALID');
    assert.equal(validateAdminBearerToken('Basic test-secret', 'test-secret'), 'INVALID');
  });

  test('reports an unconfigured token without opening the operation', () => {
    assert.equal(validateAdminBearerToken('Bearer test-secret', undefined), 'NOT_CONFIGURED');
  });
});
