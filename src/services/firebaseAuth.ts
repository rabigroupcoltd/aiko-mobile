import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  inMemoryPersistence,
  initializeAuth,
  signInWithCredential,
  signOut,
  type Auth,
} from 'firebase/auth';

import { FIREBASE_CONFIG } from '@/config/firebase';
import { createLogger } from '@/utils/logger';

const log = createLogger('firebaseAuth');

let auth: Auth | null = null;

function getAuthInstance(): Auth {
  if (auth) return auth;

  const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);

  auth = initializeAuth(app, { persistence: inMemoryPersistence });

  return auth;
}

export type FirebaseTokenResult =
  | { ok: true; idToken: string }
  | { ok: false; message: string };

export async function exchangeGoogleToken(googleIdToken: string): Promise<FirebaseTokenResult> {
  try {
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const result = await signInWithCredential(getAuthInstance(), credential);

    const idToken = await result.user.getIdToken();

    return { ok: true, idToken };
  } catch (error: any) {
    log.error('Google credential exchange failed', error);
    return { ok: false, message: describeFirebaseError(error) };
  }
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  const user = getAuthInstance().currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    log.warn('Could not refresh the Firebase token', error);
    return null;
  }
}

export async function signOutOfFirebase(): Promise<void> {
  try {
    await signOut(getAuthInstance());
  } catch (error) {
    log.warn('Firebase sign-out failed', error);
  }
}

function describeFirebaseError(error: { code?: string; message?: string }): string {
  switch (error?.code) {
    case 'auth/invalid-credential':
      return 'That sign-in could not be verified. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already registered with a different sign-in method.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/network-request-failed':
      return 'Connection error, please try again';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this project.';
    default:
      return 'Could not complete sign-in. Please try again.';
  }
}
