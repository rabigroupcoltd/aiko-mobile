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

/**
 * Firebase Auth, purely as a token mint.
 *
 * The backend's only entry point verifies a **Firebase** ID token, and the
 * token Google Sign-In hands back is not one — it is issued by
 * `accounts.google.com`, whereas Firebase Admin only trusts
 * `securetoken.google.com/<project>`. So the Google credential is exchanged for
 * a Firebase session here, and its ID token is what goes to the API.
 *
 * The JS SDK is used rather than @react-native-firebase because this needs no
 * native module — which keeps it out of the prebuild and off the critical path
 * for a rebuild.
 */

let auth: Auth | null = null;

function getAuthInstance(): Auth {
  if (auth) return auth;

  const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);

  /**
   * In-memory on purpose.
   *
   * The Firebase session is only ever used to mint one ID token, which is
   * immediately traded for our own — and that one IS persisted, in the auth
   * store. Nothing after sign-in reads the Firebase user, so persisting it too
   * would add a second source of truth for "are we signed in" without buying
   * anything.
   *
   * Stated explicitly rather than left to the default, which logs a warning on
   * React Native and would look like a misconfiguration.
   */
  auth = initializeAuth(app, { persistence: inMemoryPersistence });

  return auth;
}

export type FirebaseTokenResult =
  | { ok: true; idToken: string }
  | { ok: false; message: string };

/**
 * Exchanges a Google ID token for a Firebase one.
 *
 * Creates the Firebase user on first sign-in, which is what gives the backend a
 * stable `uid` to key the account on across sessions and devices.
 */
export async function exchangeGoogleToken(googleIdToken: string): Promise<FirebaseTokenResult> {
  try {
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const result = await signInWithCredential(getAuthInstance(), credential);

    // Not forced: a token minted seconds ago is still valid for an hour, and a
    // forced refresh costs a round trip on the slowest screen in the app.
    const idToken = await result.user.getIdToken();

    return { ok: true, idToken };
  } catch (error: any) {
    log.error('Google credential exchange failed', error);
    return { ok: false, message: describeFirebaseError(error) };
  }
}

/**
 * A fresh ID token for the current Firebase user, or null if there is none.
 *
 * Only valid within the session that signed in — persistence is in-memory, so
 * this returns null after a reload. That is fine: the app authenticates with
 * its own seven-day token, and a user whose token has expired signs in through
 * Google again rather than refreshing here.
 */
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

/** Ends the Firebase session. The app's own session is cleared separately. */
export async function signOutOfFirebase(): Promise<void> {
  try {
    await signOut(getAuthInstance());
  } catch (error) {
    // Signing out of a session that is not there is not worth surfacing.
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
      // A project-configuration fault, not a runtime one — retrying cannot help.
      return 'Google sign-in is not enabled for this project.';
    default:
      return 'Could not complete sign-in. Please try again.';
  }
}
