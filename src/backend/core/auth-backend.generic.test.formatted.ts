import { Result } from '@j2blasco/ts-result';
import { IAuthBackend } from './auth-backend.interface';

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
 * Comprehensive test suite for IAuthBackend implementations.
 * Run this against any implementation to verify it satisfies the interface contract.
 */
export function testAuthBackend(authBackend: IAuthBackend): void {
  describe('IAuthBackend implementation tests', () => {
    describe('Observable events', () => {
      it('should have onUserCreated$ Observable', () => {
        expect(authBackend.onUserCreated$).toBeDefined();
        expect(typeof authBackend.onUserCreated$.subscribe).toBe('function');
      });

      it('should have onUserDeleted$ Observable', () => {
        expect(authBackend.onUserDeleted$).toBeDefined();
        expect(typeof authBackend.onUserDeleted$.subscribe).toBe('function');
      });
    });

    describe('signUpWithEmailPassword', () => {
      it('should create a new user and return a uid', async () => {
        const email = `test-${Date.now()}@example.com`;
        const password = 'testPassword123';

        const result = await authBackend.signUpWithEmailPassword({
          email,
          password,
        });

        expect(isResultSuccess(result)).toBe(true);
        const success = result.unwrapOrThrow();
        expect(typeof success.uid).toBe('string');
        expect(success.uid.length).toBeGreaterThan(0);
      });

      it('should emit onUserCreated$ event when user is created', async () => {
        const email = `event-test-${Date.now()}@example.com`;
        const password = 'testPassword123';

        let emittedUid: string | undefined;
        const subscription = authBackend.onUserCreated$.subscribe((event) => {
          emittedUid = event.uid;
        });

        const result = await authBackend.signUpWithEmailPassword({
          email,
          password,
        });

        // Give some time for the observable to emit
        await new Promise((resolve) => setTimeout(resolve, 10));

        subscription.unsubscribe();

        const success = result.unwrapOrThrow();
        expect(emittedUid).toBe(success.uid);
      });
    });

    describe('signInWithEmailAndPassword', () => {
      const testEmail = `signin-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      let testUid: string;

      beforeEach(async () => {
        const result = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = result.unwrapOrThrow().uid;
      });

      it('should sign in with valid credentials', async () => {
        const result = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
        });

        expect(isResultSuccess(result)).toBe(true);
        const success = result.unwrapOrThrow();
        expect(success.uid).toBe(testUid);
        expect(typeof success.refreshToken).toBe('string');
        expect(typeof success.idToken).toBe('string');
        expect(success.refreshToken.length).toBeGreaterThan(0);
        expect(success.idToken.length).toBeGreaterThan(0);
      });

      it('should return error for invalid email format', async () => {
        const result = await authBackend.signInWithEmailAndPassword({
          email: 'invalid-email',
          password: testPassword,
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('invalid-email');
      });

      it('should return error for non-existent user', async () => {
        const result = await authBackend.signInWithEmailAndPassword({
          email: `nonexistent-${Date.now()}@example.com`,
          password: testPassword,
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('user-not-found');
      });

      it('should return error for wrong password', async () => {
        const result = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: 'wrongPassword',
        });

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('wrong-password');
      });
    });

    describe('getUidFromIdToken', () => {
      const testEmail = `token-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      let testUid: string;
      let testIdToken: string;

      beforeEach(async () => {
        const signUpResult = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = signUpResult.unwrapOrThrow().uid;

        const signInResult = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
        });
        testIdToken = signInResult.unwrapOrThrow().idToken;
      });

      it('should return uid for valid idToken', async () => {
        const result = await authBackend.getUidFromIdToken(testIdToken);

        expect(isResultSuccess(result)).toBe(true);
        const uid = result.unwrapOrThrow();
        expect(uid).toBe(testUid);
      });

      it('should return error for invalid idToken', async () => {
        const result = await authBackend.getUidFromIdToken('invalid-token');

        expect(isResultSuccess(result)).toBe(false);
      });
    });

    describe('signInWithRefreshToken', () => {
      const testEmail = `refresh-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      let testUid: string;
      let testRefreshToken: string;

      beforeEach(async () => {
        const signUpResult = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = signUpResult.unwrapOrThrow().uid;

        const signInResult = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
        });
        testRefreshToken = signInResult.unwrapOrThrow().refreshToken;
      });

      it('should sign in with valid refresh token', async () => {
        const result =
          await authBackend.signInWithRefreshToken(testRefreshToken);

        expect(isResultSuccess(result)).toBe(true);
        const success = result.unwrapOrThrow();
        expect(success.uid).toBe(testUid);
        expect(typeof success.idToken).toBe('string');
        expect(success.idToken.length).toBeGreaterThan(0);
      });

      it('should return error for invalid refresh token', async () => {
        const result = await authBackend.signInWithRefreshToken(
          'invalid-refresh-token',
        );

        expect(isResultSuccess(result)).toBe(false);
      });
    });

    describe('getUidByEmail', () => {
      const testEmail = `uidbyemail-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      let testUid: string;

      beforeEach(async () => {
        const result = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = result.unwrapOrThrow().uid;
      });

      it('should return uid for existing email', async () => {
        const result = await authBackend.getUidByEmail(testEmail);

        expect(isResultSuccess(result)).toBe(true);
        const success = result.unwrapOrThrow();
        expect(success.uid).toBe(testUid);
      });

      it('should return error for non-existent email', async () => {
        const result = await authBackend.getUidByEmail(
          `nonexistent-${Date.now()}@example.com`,
        );

        expect(isResultSuccess(result)).toBe(false);
        const error = getResultError(result);
        expect(error.code).toBe('email-not-found');
      });
    });

    describe('changeEmail', () => {
      const testEmail = `changeemail-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      const newEmail = `new-${Date.now()}@example.com`;
      let testUid: string;

      beforeEach(async () => {
        const result = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = result.unwrapOrThrow().uid;
      });

      it('should change email for existing user', async () => {
        const result = await authBackend.changeEmail({
          uid: testUid,
          newEmail,
        });

        expect(isResultSuccess(result)).toBe(true);

        // Verify the email was actually changed
        const uidResult = await authBackend.getUidByEmail(newEmail);
        expect(isResultSuccess(uidResult)).toBe(true);
        expect(uidResult.unwrapOrThrow().uid).toBe(testUid);
      });

      it('should return error for non-existent user', async () => {
        const result = await authBackend.changeEmail({
          uid: 'non-existent-uid',
          newEmail,
        });

        expect(isResultSuccess(result)).toBe(false);
      });
    });

    describe('changePassword', () => {
      const testEmail = `changepassword-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      const newPassword = 'newPassword456';
      let testUid: string;

      beforeEach(async () => {
        const result = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = result.unwrapOrThrow().uid;
      });

      it('should change password for existing user', async () => {
        const result = await authBackend.changePassword({
          uid: testUid,
          newPassword,
        });

        expect(isResultSuccess(result)).toBe(true);

        // Verify the password was actually changed by trying to sign in
        const signInResult = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: newPassword,
        });
        expect(isResultSuccess(signInResult)).toBe(true);

        // Verify old password no longer works
        const oldPasswordResult = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
        });
        expect(isResultSuccess(oldPasswordResult)).toBe(false);
      });

      it('should return error for non-existent user', async () => {
        const result = await authBackend.changePassword({
          uid: 'non-existent-uid',
          newPassword,
        });

        expect(isResultSuccess(result)).toBe(false);
      });
    });

    describe('deleteUser', () => {
      const testEmail = `delete-backend-test-${Date.now()}@example.com`;
      const testPassword = 'testPassword123';
      let testUid: string;

      beforeEach(async () => {
        const result = await authBackend.signUpWithEmailPassword({
          email: testEmail,
          password: testPassword,
        });
        testUid = result.unwrapOrThrow().uid;
      });

      it('should delete existing user', async () => {
        const result = await authBackend.deleteUser({ uid: testUid });

        expect(isResultSuccess(result)).toBe(true);

        // Verify user was actually deleted
        const signInResult = await authBackend.signInWithEmailAndPassword({
          email: testEmail,
          password: testPassword,
        });
        expect(isResultSuccess(signInResult)).toBe(false);
        const error = getResultError(signInResult);
        expect(error.code).toBe('user-not-found');
      });

      it('should emit onUserDeleted$ event when user is deleted', async () => {
        let emittedUid: string | undefined;
        const subscription = authBackend.onUserDeleted$.subscribe((event) => {
          emittedUid = event.uid;
        });

        await authBackend.deleteUser({ uid: testUid });

        // Give some time for the observable to emit
        await new Promise((resolve) => setTimeout(resolve, 10));

        subscription.unsubscribe();
        expect(emittedUid).toBe(testUid);
      });

      it('should return error for non-existent user', async () => {
        const result = await authBackend.deleteUser({
          uid: 'non-existent-uid',
        });

        expect(isResultSuccess(result)).toBe(false);
      });
    });
  });
}
