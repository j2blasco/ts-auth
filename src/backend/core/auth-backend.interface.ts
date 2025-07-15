import { Result, ErrorUnknown, ErrorWithCode } from '@j2blasco/ts-result';
import { Observable } from 'rxjs';

// The RefreshToken is a long lived token that can be used to get a new IdToken. This is stored in the browser's local storage.
// The IdToken is a short lived token that is used to authenticate the user in api calls and is sent in the Authorization header.
export interface IAuthBackend {
  onUserCreated$: Observable<{ uid: string }>;
  onUserDeleted$: Observable<{ uid: string }>;

  getUidFromIdToken: (idToken: string) => Promise<Result<string, ErrorUnknown>>;
  signInWithEmailAndPassword(args: {
    email: string;
    password: string;
  }): Promise<
    Result<
      {
        uid: string;
        refreshToken: string;
        idToken: string;
      },
      | ErrorWithCode<'invalid-email'>
      | ErrorWithCode<'user-not-found'>
      | ErrorWithCode<'wrong-password'>
      | ErrorUnknown
    >
  >;
  signInWithRefreshToken(refreshToken: string): Promise<
    Result<
      {
        uid: string;
        idToken: string;
      },
      ErrorUnknown
    >
  >;
  signUpWithEmailPassword(args: {
    email: string;
    password: string;
  }): Promise<Result<{ uid: string }, ErrorUnknown>>;
  changeEmail(args: {
    uid: string;
    newEmail: string;
  }): Promise<Result<void, ErrorUnknown>>;
  deleteUser(args: { uid: string }): Promise<Result<void, ErrorUnknown>>;
  changePassword(args: {
    uid: string;
    newPassword: string;
  }): Promise<Result<void, ErrorUnknown>>;
  getUidByEmail(
    email: string,
  ): Promise<
    Result<{ uid: string }, ErrorWithCode<'email-not-found'> | ErrorUnknown>
  >;
}
