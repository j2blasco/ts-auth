import { createBackendAuthTesting } from './auth-backend.testing';
import { testAuthBackend } from '../../core/auth-backend.generic.test';

describe('Backend Auth Testing', () => {
  testAuthBackend(createBackendAuthTesting());
});
