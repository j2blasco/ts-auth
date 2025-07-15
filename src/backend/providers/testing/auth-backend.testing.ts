import {
  Result,
  ErrorUnknown,
  resultError,
  resultSuccessVoid,
  resultSuccess,
  ErrorWithCode,
} from '@j2blasco/ts-result';
import { IAuthBackend } from 'backend/core/auth-backend.interface';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export class AuthBackendTesting implements IAuthBackend {
  constructor() {}

  public changePassword(args: {
    uid: string;
    newPassword: string;
  }): Promise<Result<void, ErrorUnknown>> {
    const { uid, newPassword } = args;

    const user = this.registeredUsers.find((u) => u.uid === uid);

    if (!user) {
      return Promise.resolve(resultError.unknown('User not found'));
    }

    user.password = newPassword;

    return Promise.resolve(resultSuccessVoid());
  }

  public sendResetPasswordEmail(_args: {
    email: string;
  }): Promise<Result<{ success: boolean }, ErrorUnknown>> {
    throw new Error('Method not implemented.');
  }

  private registeredUsers = new Array<{
    idToken: string;
    uid: string;
    email: string;
    password: string;
    refreshToken: string;
  }>();

  public getUidFromIdToken(
    idToken: string,
  ): Promise<Result<string, ErrorUnknown>> {
    const user = this.registeredUsers.find((u) => u.idToken === idToken);
    if (!user) {
      return Promise.resolve(resultError.unknown('User not found'));
    }
    return Promise.resolve(resultSuccess(user.uid));
  }

  public onUserCreated$ = new Subject<{ uid: string }>();
  public onUserDeleted$ = new Subject<{ uid: string }>();

  public async signInWithEmailAndPassword(args: {
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
  > {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(args.email)) {
      return Promise.resolve(resultError.withCode('invalid-email'));
    }
    const user = this.registeredUsers.find((u) => u.email === args.email);

    if (!user) {
      return Promise.resolve(resultError.withCode('user-not-found'));
    }

    if (user.password !== args.password) {
      return Promise.resolve(resultError.withCode('wrong-password'));
    }
    return Promise.resolve(
      resultSuccess({
        uid: user.uid,
        refreshToken: user.refreshToken,
        idToken: user.idToken,
      }),
    );
  }

  public async signInWithRefreshToken(
    refreshToken: string,
  ): Promise<Result<{ idToken: string; uid: string }, ErrorUnknown>> {
    // Find the user with the matching refresh token
    const user = this.registeredUsers.find(
      (u) => u.refreshToken === refreshToken,
    );
    if (!user) {
      return Promise.resolve(resultError.unknown('Invalid refresh token'));
    }

    // Generate a new idToken for this session
    const newIdToken = uuidv4();
    user.idToken = newIdToken;

    return Promise.resolve(
      resultSuccess({
        idToken: newIdToken,
        uid: user.uid,
      }),
    );
  }

  public async signUpWithEmailPassword(_args: {
    email: string;
    password: string;
  }): Promise<Result<{ uid: string }, ErrorUnknown>> {
    const uid = uuidv4();
    const idToken = uuidv4();
    const refreshToken = uuidv4();
    this.registeredUsers.push({
      idToken,
      uid,
      email: _args.email,
      password: _args.password,
      refreshToken,
    });
    this.onUserCreated$.next({ uid });
    return Promise.resolve(resultSuccess({ uid }));
  }

  public async changeEmail(_args: {
    uid: string;
    newEmail: string;
  }): Promise<Result<void, ErrorUnknown>> {
    const user = this.registeredUsers.find((u) => u.uid === _args.uid);
    if (!user) {
      return Promise.resolve(resultError.unknown('User not found'));
    }
    user.email = _args.newEmail;
    return Promise.resolve(resultSuccess(undefined));
  }

  public async deleteUser(_args: {
    uid: string;
  }): Promise<Result<void, ErrorUnknown>> {
    const index = this.registeredUsers.findIndex((u) => u.uid === _args.uid);
    if (index === -1) {
      return Promise.resolve(resultError.unknown('User not found'));
    }
    this.registeredUsers.splice(index, 1);
    this.onUserDeleted$.next({ uid: _args.uid });
    return Promise.resolve(resultSuccess(undefined));
  }

  public getUidByEmail(
    email: string,
  ): Promise<
    Result<{ uid: string }, ErrorWithCode<'email-not-found'> | ErrorUnknown>
  > {
    const user = this.registeredUsers.find((u) => u.email === email);
    if (!user) {
      return Promise.resolve(resultError.withCode('email-not-found' as const));
    }
    return Promise.resolve(resultSuccess({ uid: user.uid }));
  }
}
