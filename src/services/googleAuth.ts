import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import type { GoogleAccount } from '@/types/models';
import { createLogger } from '@/utils/logger';

const log = createLogger('googleAuth');

/**
 * Google Sign-In.
 *
 * The web client ID comes from `google-services.json` — specifically the
 * `oauth_client` entry with `client_type: 3`. Google's Android sign-in flow
 * needs the *web* client ID, not the Android one, which is the single most
 * common misconfiguration here.
 *
 * If Google sign-in has never been enabled in the Firebase console, that array
 * is empty and there is nothing to configure. `isGoogleSignInConfigured`
 * reports that so the UI can hide the button rather than showing one that
 * always fails.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const isGoogleSignInConfigured = WEB_CLIENT_ID.length > 0;

let configured = false;

function ensureConfigured() {
  if (configured || !isGoogleSignInConfigured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    // We only need identity here. There's no backend to exchange a server auth
    // code with, so we don't request offline access.
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  configured = true;
}

export type GoogleSignInResult =
  | { ok: true; account: GoogleAccount }
  | { ok: false; reason: 'cancelled' | 'in-progress' | 'no-play-services' | 'not-configured' | 'error'; message?: string };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isGoogleSignInConfigured) {
    return { ok: false, reason: 'not-configured' };
  }

  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      // The modern API returns a cancellation as a normal response rather than
      // throwing, so this is the expected "user backed out" path.
      return { ok: false, reason: 'cancelled' };
    }

    const { user } = response.data;
    return {
      ok: true,
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
    log.error('sign-in failed', error);
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : undefined,
    };
  }
}

/** Sign out of Google without touching app state. */
export async function signOutOfGoogle(): Promise<void> {
  if (!isGoogleSignInConfigured) return;
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch (error) {
    // Signing out of a session that isn't there is not worth surfacing.
    log.warn('sign-out failed', error);
  }
}

/** Human-readable message for a failed attempt. */
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
    default:
      return "Couldn't sign in with Google. Please try again.";
  }
}
