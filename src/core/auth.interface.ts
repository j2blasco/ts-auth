import { Observable } from 'rxjs';
import {
  ErrorWithCode,
  ErrorUnknown,
  Result,
  SuccessVoid,
} from '@j2blasco/ts-result';

export const e2eAuthService = 'e2eAuthService';

export type UserId = string;

export type BackendAuthUser = { uid: UserId };

// Authentication service like Firebase Auth or AWS Cognito
export interface IAuth {
  authState$: Observable<BackendAuthUser | null | undefined>;
  signInWithEmailAndPassword(args: {
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
  >;
  // IdToken is a short-lived token that is used to authenticate a user after they have signed in.
  // RefreshToken are used to obtain new IdTokens after the current IdToken has expired.
  getIdToken(): Promise<string>;
  signOut(): Promise<void>;
  isEmailAvailable(email: string): Promise<boolean>;
  changeEmail(
    email: string,
  ): Promise<Result<void, ErrorWithCode<'email-not-available'> | ErrorUnknown>>;

  triggerResetPasswordFlow(
    email: string,
  ): Promise<
    Result<
      SuccessVoid,
      | ErrorWithCode<'rate-limit-exceeded'>
      | ErrorWithCode<'email-not-in-database'>
      | ErrorUnknown
    >
  >;

  requestChangePassword(args: {
    passwordToken: string;
    newPassword: string;
  }): Promise<
    Result<
      SuccessVoid,
      | ErrorWithCode<'token-expired'>
      | ErrorWithCode<'token-not-found'>
      | ErrorUnknown
    >
  >;

  deleteAccount(): Promise<void>;
  signUp(email: string, password: string): Promise<UserId>;
}
