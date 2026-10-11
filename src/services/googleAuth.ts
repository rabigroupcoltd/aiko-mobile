import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import type { GoogleAccount } from '@/types/models';
import { createLogger } from '@/utils/logger';

const log = createLogger('googleAuth');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const isGoogleSignInConfigured = WEB_CLIENT_ID.length > 0;

let configured = false;

function ensureConfigured() {
  if (configured || !isGoogleSignInConfigured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  configured = true;
}

export type GoogleSignInResult =
  | {
      ok: true;
      account: GoogleAccount;
      idToken: string | null;
    }
  | {
      ok: false;
      reason:
        | 'cancelled'
        | 'in-progress'
        | 'no-play-services'
        | 'not-configured'
        | 'developer-error'
        | 'error';
      message?: string;
    };

const DEVELOPER_ERROR_CODE = '10';

function isDeveloperError(error: unknown): boolean {
  if (isErrorWithCode(error) && String(error.code) === DEVELOPER_ERROR_CODE) return true;
  return error instanceof Error && error.message.includes('DEVELOPER_ERROR');
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isGoogleSignInConfigured) {
    return { ok: false, reason: 'not-configured' };
  }

  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { ok: false, reason: 'cancelled' };
    }

    const { user, idToken } = response.data;
    return {
      ok: true,
      idToken: idToken ?? null,
      account: {
        id: user.id,
        email: user.email,
        givenName: user.givenName ?? null,
        familyName: user.familyName ?? null,
        photoUrl: user.photo ?? null,
      },
    };
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { ok: false, reason: 'cancelled' };
        case statusCodes.IN_PROGRESS:
          return { ok: false, reason: 'in-progress' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { ok: false, reason: 'no-play-services' };
      }
    }

    if (isDeveloperError(error)) {
      log.error(
        'DEVELOPER_ERROR — the SHA-1 of this build is not registered as an ' +
          'Android OAuth client for this package. Add the signing certificate ' +
          "fingerprint to the Firebase project's Android app, download the new " +
          'google-services.json, and rebuild. Retrying will not help.',
        error
      );
      return { ok: false, reason: 'developer-error' };
    }

    log.error('sign-in failed', error);
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

export async function signOutOfGoogle(): Promise<void> {
  if (!isGoogleSignInConfigured) return;
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch (error) {
    log.warn('sign-out failed', error);
  }
}

export function describeFailure(reason: Exclude<GoogleSignInResult, { ok: true }>['reason']): string {
  switch (reason) {
    case 'cancelled':
      return 'Sign-in was cancelled.';
    case 'in-progress':
      return 'A sign-in is already in progress.';
    case 'no-play-services':
      return 'Google Play Services is not available on this device.';
    case 'not-configured':
      return 'Google sign-in is not configured for this build.';
    case 'developer-error':
      return 'Google sign-in is not set up for this build of the app.';
    default:
      return "Couldn't sign in with Google. Please try again.";
  }
}
