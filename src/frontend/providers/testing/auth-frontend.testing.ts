import { BehaviorSubject, Observable } from 'rxjs';
import {
  ErrorWithCode,
  ErrorUnknown,
  Result,
  SuccessVoid,
  resultSuccess,
  resultSuccessVoid,
  resultError,
} from '@j2blasco/ts-result';
import { IAuthFrontend, BackendAuthUser, UserId } from '../../core/auth-frontend.interface';

interface FakeUser {
  uid: UserId;
  email: string;
  password: string;
}

interface FakePasswordResetToken {
  token: string;
  email: string;
  expiresAt: number;
}

export class AuthTesting implements IAuthFrontend {
  private users: Map<string, FakeUser> = new Map();
  private currentUser: BackendAuthUser | null = null;
  private authState = new BehaviorSubject<BackendAuthUser | null | undefined>(
    undefined,
  );
  private passwordResetTokens: Map<string, FakePasswordResetToken> = new Map();
  private rateLimitTracker: Map<string, number> = new Map();
  private idTokens: Map<string, string> = new Map();

  constructor() {
    this.authState.next(undefined);
  }

  public addTestUser(email: string, password: string, uid?: string): UserId {
    const userId =
      uid || `fake-user-${Math.random().toString(36).substring(2)}`;
    this.users.set(email, { uid: userId, email, password });
    return userId;
  }

  public getPasswordResetTokens(): string[] {
    return Array.from(this.passwordResetTokens.keys());
  }

  public get authState$(): Observable<BackendAuthUser | null | undefined> {
    return this.authState.asObservable();
  }

  public async signInWithEmailAndPassword(args: {
    email: string;
    password: string;
    persistent: boolean;
  }): Promise<
    Result<
      SuccessVoid,
      | ErrorWithCode<'invalid-email'>
      | ErrorWithCode<'user-not-found'>
      | ErrorWithCode<'wrong-password'>
      | ErrorUnknown
    >
  > {
    if (!this.isValidEmail(args.email)) {
      return resultError.withCode('invalid-email');
    }

    const user = this.users.get(args.email);
    if (!user) {
      return resultError.withCode('user-not-found');
    }

    if (user.password !== args.password) {
      return resultError.withCode('wrong-password');
    }

    this.currentUser = { uid: user.uid };
    this.authState.next(this.currentUser);
    this.idTokens.set(user.uid, `fake-id-token-${user.uid}-${Date.now()}`);

    return resultSuccessVoid();
  }

  public async getIdToken(): Promise<string> {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }

    const token = this.idTokens.get(this.currentUser.uid);
    if (!token) {
      throw new Error('No token available');
    }

    return token;
  }

  public async signOut(): Promise<void> {
    if (this.currentUser) {
      this.idTokens.delete(this.currentUser.uid);
    }
    this.currentUser = null;
    this.authState.next(null);
  }

  public async isEmailAvailable(email: string): Promise<boolean> {
    return !this.users.has(email);
  }

  public async changeEmail(
    email: string,
  ): Promise<
    Result<void, ErrorWithCode<'email-not-available'> | ErrorUnknown>
  > {
    if (!this.currentUser) {
      return resultError.unknown('No user signed in');
    }

    if (!(await this.isEmailAvailable(email))) {
      return resultError.withCode('email-not-available');
    }

    for (const [oldEmail, user] of this.users.entries()) {
      if (user.uid === this.currentUser.uid) {
        this.users.delete(oldEmail);
        this.users.set(email, { ...user, email });
        break;
      }
    }

    return resultSuccess(undefined);
  }

  public async triggerResetPasswordFlow(
    email: string,
  ): Promise<
    Result<
      SuccessVoid,
      | ErrorWithCode<'rate-limit-exceeded'>
      | ErrorWithCode<'email-not-in-database'>
      | ErrorUnknown
    >
  > {
    const lastRequest = this.rateLimitTracker.get(email) || 0;
    const now = Date.now();
    if (now - lastRequest < 60000) {
      return resultError.withCode('rate-limit-exceeded');
    }

    if (!this.users.has(email)) {
      return resultError.withCode('email-not-in-database');
    }

    const token = `fake-reset-token-${Math.random().toString(36).substring(2)}`;
    this.passwordResetTokens.set(token, {
      token,
      email,
      expiresAt: now + 3600000,
    });

    this.rateLimitTracker.set(email, now);

    return resultSuccessVoid();
  }

  public async requestChangePassword(args: {
    passwordToken: string;
    newPassword: string;
  }): Promise<
    Result<
      SuccessVoid,
      | ErrorWithCode<'token-expired'>
      | ErrorWithCode<'token-not-found'>
      | ErrorUnknown
    >
  > {
    const resetToken = this.passwordResetTokens.get(args.passwordToken);
    if (!resetToken) {
      return resultError.withCode('token-not-found');
    }

    if (Date.now() > resetToken.expiresAt) {
      this.passwordResetTokens.delete(args.passwordToken);
      return resultError.withCode('token-expired');
    }

    const user = this.users.get(resetToken.email);
    if (user) {
      this.users.set(resetToken.email, { ...user, password: args.newPassword });
    }

    this.passwordResetTokens.delete(args.passwordToken);

    return resultSuccessVoid();
  }

  public async deleteAccount(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }

    for (const [email, user] of this.users.entries()) {
      if (user.uid === this.currentUser.uid) {
        this.users.delete(email);
        break;
      }
    }

    this.idTokens.delete(this.currentUser.uid);

    this.currentUser = null;
    this.authState.next(null);
  }

  public async signUp(email: string, password: string): Promise<UserId> {
    if (this.users.has(email)) {
      throw new Error('Email already in use');
    }

    const uid = `fake-user-${Math.random().toString(36).substring(2)}`;
    this.users.set(email, { uid, email, password });

    return uid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
