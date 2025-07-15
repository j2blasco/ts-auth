import { AuthFrontendTesting } from './auth-frontend.testing';
import { testAuthFrontend } from '../../core/auth-frontend.generic.test';

describe('AuthTesting Core', () => {
  const authFactory = () => new AuthFrontendTesting();
  testAuthFrontend(authFactory);
});

describe('AuthTesting Implementation', () => {
  testAuthFrontend(() => new AuthFrontendTesting());

  describe('AuthTesting specific features', () => {
    let auth: AuthFrontendTesting;

    beforeEach(() => {
      auth = new AuthFrontendTesting();
    });

    it('should allow adding test users', () => {
      const userId = auth.addTestUser('test@example.com', 'password123');

      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
    });

    it('should track password reset tokens', async () => {
      await auth.addTestUser('test@example.com', 'password123');

      await auth.triggerResetPasswordFlow('test@example.com');
      const tokens = auth.getPasswordResetTokens();

      expect(tokens.length).toBe(1);
      expect(typeof tokens[0]).toBe('string');
    });

    it('should handle multiple users', async () => {
      const user1Id = await auth.signUp('user1@example.com', 'pass1');
      const user2Id = await auth.signUp('user2@example.com', 'pass2');

      expect(user1Id).not.toBe(user2Id);

      // Both emails should be unavailable now
      expect(await auth.isEmailAvailable('user1@example.com')).toBe(false);
      expect(await auth.isEmailAvailable('user2@example.com')).toBe(false);
    });
  });
});
