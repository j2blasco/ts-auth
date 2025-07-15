import { Result } from '@j2blasco/ts-result';
import { IAuthFrontend } from './auth-frontend.interface';

/**
 * Helper functions for testing Result types
 */
function isResultSuccess<T, E>(result: Result<T, E>): boolean {
  try {
    result.unwrapOrThrow();
    return true;
  } catch {
    return false;
  }
}

function getResultError<T, E>(result: Result<T, E>): E {
  try {
    result.unwrapOrThrow();
    throw new Error('Result is not an error');
  } catch (error) {
    return error as E;
  }
}

/**
 * Comprehensive test suite for IAuth implementations.
 * Run this against any implementation to verify it satisfies the interface contract.
 */
export function testAuth(authFactory: () => IAuthFrontend): void {
  describe('IAuth implementation tests', () => {
    let auth: IAuthFrontend;

    beforeEach(async () => {
      auth = authFactory();
      // Ensure clean state before each test
      try {
        await auth.signOut();
      } catch {
        // Ignore if already signed out
      }
    });

    describe('authState$', () => {
      it('should be an Observable', () => {
        expect(auth.authState$).toBeDefined();
        expect(typeof auth.authState$.subscribe).toBe('function');
      });

      it('should emit initial state', (done) => {
        auth.authState$
          .subscribe({
            next: (state) => {
              expect(
                state === null ||
                  state === undefined ||
                  (typeof state === 'object' && 'uid' in state),
              ).toBe(true);
              done();
            },
          })
          .unsubscribe();
      });
    });

    describe('signUp', () => {
      it('should create a new user and return a UserId', async () => {
        const email = `test-${Date.now()}@example.com`;
        const password = 'testPassword123';

        const userId = await auth.signUp(email, password);

        expect(typeof userId).toBe('string');
        expect(userId.length).toBeGreaterThan(0);
      });

      it('should reject duplicate email addresses', async () => {
        const email = `duplicate-${Date.now()}@example.com`;
        const password = 'testPassword123';

        await auth.signUp(email, password);

        await expect(auth.signUp(email, password)).rejects.toThrow();
      });
    });

    describe('signInWithEmailAndPassword', () => {
      const testEmail = `signin-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      let testUserId: string;

      beforeEach(async () => {
        testUserId = await auth.signUp(testEmail, testPassword);
      });

      it('should sign in with valid credentials', async () => {
        const result = await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
          persistent: true,
        });

        expect(isResultSuccess(result)).toBe(true);
      });

      it('should update authState$ when signing in', async () => {
        let authStateUpdated = false;
        const subscription = auth.authState$.subscribe((state) => {
          if (state && state.uid === testUserId) {
            authStateUpdated = true;
          }
        });

        await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
          persistent: true,
        });

        // Give some time for the observable to emit
        await new Promise((resolve) => setTimeout(resolve, 10));

        subscription.unsubscribe();
        expect(authStateUpdated).toBe(true);
      });

      it('should return error for invalid email format', async () => {
        const result = await auth.signInWithEmailAndPassword({
          email: 'invalid-email',
          password: testPassword,
          persistent: true,
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('invalid-email');
      });

      it('should return error for non-existent user', async () => {
        const result = await auth.signInWithEmailAndPassword({
          email: `nonexistent-${Date.now()}@example.com`,
          password: testPassword,
          persistent: true,
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('user-not-found');
      });

      it('should return error for wrong password', async () => {
        const result = await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: 'wrongPassword',
          persistent: true,
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('wrong-password');
      });
    });

    describe('getIdToken', () => {
      const testEmail = `token-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';

      beforeEach(async () => {
        await auth.signUp(testEmail, testPassword);
        await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
          persistent: true,
        });
      });

      it('should return a valid token when signed in', async () => {
        const token = await auth.getIdToken();

        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('should throw error when not signed in', async () => {
        await auth.signOut();

        await expect(auth.getIdToken()).rejects.toThrow();
      });
    });

    describe('signOut', () => {
      const testEmail = `signout-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';

      beforeEach(async () => {
        await auth.signUp(testEmail, testPassword);
        await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
          persistent: true,
        });
      });

      it('should sign out successfully', async () => {
        await expect(auth.signOut()).resolves.not.toThrow();
      });

      it('should update authState$ to null when signing out', async () => {
        let authStateUpdated = false;
        const subscription = auth.authState$.subscribe((state) => {
          if (state === null) {
            authStateUpdated = true;
          }
        });

        await auth.signOut();

        // Give some time for the observable to emit
        await new Promise((resolve) => setTimeout(resolve, 10));

        subscription.unsubscribe();
        expect(authStateUpdated).toBe(true);
      });
    });

    describe('isEmailAvailable', () => {
      const testEmail = `availability-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';

      it('should return true for available email', async () => {
        const available = await auth.isEmailAvailable(
          `new-${Date.now()}@example.com`,
        );
        expect(available).toBe(true);
      });

      it('should return false for taken email', async () => {
        await auth.signUp(testEmail, testPassword);

        const available = await auth.isEmailAvailable(testEmail);
        expect(available).toBe(false);
      });
    });

    describe('changeEmail', () => {
      const testEmail = `changeemail-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      const newEmail = `new-${Date.now()}@example.com`;

      beforeEach(async () => {
        await auth.signUp(testEmail, testPassword);
        await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
          persistent: true,
        });
      });

      it('should change email to available address', async () => {
        const result = await auth.changeEmail(newEmail);

        expect(isResultSuccess(result)).toBe(true);
      });

      it('should return error for unavailable email', async () => {
        const takenEmail = `taken-${Date.now()}@example.com`;
        await auth.signUp(takenEmail, 'anotherPassword');

        const result = await auth.changeEmail(takenEmail);

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('email-not-available');
      });
    });

    describe('triggerResetPasswordFlow', () => {
      const testEmail = `reset-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';

      beforeEach(async () => {
        await auth.signUp(testEmail, testPassword);
      });

      it('should trigger reset flow for existing email', async () => {
        const result = await auth.triggerResetPasswordFlow(testEmail);

        expect(isResultSuccess(result)).toBe(true);
      });

      it('should return error for non-existent email', async () => {
        const result = await auth.triggerResetPasswordFlow(
          `nonexistent-${Date.now()}@example.com`,
        );

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('email-not-in-database');
      });

      it('should rate limit repeated requests', async () => {
        await auth.triggerResetPasswordFlow(testEmail);

        const result = await auth.triggerResetPasswordFlow(testEmail);

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('rate-limit-exceeded');
      });
    });

    describe('requestChangePassword', () => {
      const testEmail = `passwordchange-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      const newPassword = 'newPassword456';

      beforeEach(async () => {
        await auth.signUp(testEmail, testPassword);
      });

      it('should return error for invalid token', async () => {
        const result = await auth.requestChangePassword({
          passwordToken: 'invalid-token',
          newPassword,
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('token-not-found');
      });

      // Note: Testing valid token scenarios requires the specific implementation
      // to expose token generation methods, which may not be available in all implementations
    });

    describe('deleteAccount', () => {
      const testEmail = `delete-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';

      beforeEach(async () => {
        await auth.signUp(testEmail, testPassword);
        await auth.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
          persistent: true,
        });
      });

      it('should delete account when signed in', async () => {
        await expect(auth.deleteAccount()).resolves.not.toThrow();
      });

      it('should update authState$ to null after deletion', async () => {
        let authStateUpdated = false;
        const subscription = auth.authState$.subscribe((state) => {
          if (state === null) {
            authStateUpdated = true;
          }
        });

        await auth.deleteAccount();

        // Give some time for the observable to emit
        await new Promise((resolve) => setTimeout(resolve, 10));

        subscription.unsubscribe();
        expect(authStateUpdated).toBe(true);
      });

      it('should throw error when not signed in', async () => {
        await auth.signOut();

        await expect(auth.deleteAccount()).rejects.toThrow();
      });
    });
  });
}
