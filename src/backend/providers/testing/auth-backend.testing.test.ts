import { testAuthBackend } from '../../core/auth-backend.generic.test';
import { AuthBackendTesting } from './auth-backend.testing';

describe('Backend Auth Testing', () => {
  testAuthBackend(new AuthBackendTesting());
});
