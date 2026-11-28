import AsyncStorage from '@react-native-async-storage/async-storage';
import * as InAppUpdates from 'expo-in-app-updates';
import { Linking, Platform } from 'react-native';

import { createLogger } from '@/utils/logger';

const log = createLogger('appUpdate');

/** Android application id, as in app.config.ts. */
const PACKAGE_ID = 'com.nuriq.aiko';

/** What Google Play says about this install. */
export interface PlayUpdateInfo {
  updateAvailable: boolean;
  /** An immediate update was started earlier and interrupted. */
  updateInProgress: boolean;
  immediateAllowed: boolean;
  /** versionCode of the release on Play. */
  storeVersion: string | null;
  /** Update priority (0-5) the release was published with. */
  priority: number;
}

/**
 * Releases published to Play with this priority or higher must be installed.
 * Priority is set per release when publishing (Play Developer API), not in
 * the Play Console website. It is 0 by default, i.e. optional.
 */
export const REQUIRED_PRIORITY = 4;

export type UpdateAction =
  /** Nothing to do. */
  | { kind: 'none' }
  /** Play has a newer release: offer Play's update screen (dismissible). */
  | { kind: 'offer'; storeVersion: string }
  /** Finish an update that was interrupted. */
  | { kind: 'resume' }
  /** A high-priority release: block the app until it updates. */
  | { kind: 'require' };

/** How long a dismissed offer stays quiet for the same release. */
export const OFFER_AGAIN_AFTER_MS = 24 * 60 * 60 * 1000;
const OFFERED_KEY = 'aiko.appUpdate.offered';

/** Picks what to do from Google Play's answer. A failed check never blocks anyone. */
export function decideUpdate(play: PlayUpdateInfo | null): UpdateAction {
  if (!play) return { kind: 'none' };
  if (play.updateInProgress) return { kind: 'resume' };
  if (!play.updateAvailable || !play.immediateAllowed) return { kind: 'none' };
  if (play.priority >= REQUIRED_PRIORITY) return { kind: 'require' };
  return { kind: 'offer', storeVersion: play.storeVersion ?? 'unknown' };
}

/** Asks Google Play. Fails quietly — e.g. when the app wasn't installed from Play. */
export async function checkPlay(): Promise<PlayUpdateInfo | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const info = await InAppUpdates.checkForUpdate();
    return {
      updateAvailable: info.updateAvailable,
      updateInProgress: Boolean(info.updateInProgress),
      immediateAllowed: Boolean(info.immediateAllowed),
      storeVersion: info.storeVersion ?? null,
      priority: info.serverPriority ?? 0,
    };
  } catch (error) {
    log.info('Play update check unavailable', error);
    return null;
  }
}

/**
 * Opens Google Play's full-screen update flow. It only downloads and restarts
 * when the person taps Update, so nobody is restarted mid-trip.
 */
export async function startPlayUpdate(): Promise<boolean> {
  try {
    return await InAppUpdates.startUpdate(true);
  } catch (error) {
    log.warn('could not start the Play update flow', error);
    return false;
  }
}

/** Opens the Play Store app on the Aiko page, or the website if it isn't installed. */
export async function openStore(): Promise<void> {
  try {
    await Linking.openURL(`market://details?id=${PACKAGE_ID}`);
  } catch {
    // No Play Store app — use the browser.
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${PACKAGE_ID}`).catch(
      () => undefined,
    );
  }
}

export async function offeredRecently(storeVersion: string, now = Date.now()): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(OFFERED_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { storeVersion: string; at: number };
    return saved.storeVersion === storeVersion && now - saved.at < OFFER_AGAIN_AFTER_MS;
  } catch {
    return false;
  }
}

export async function rememberOffer(storeVersion: string): Promise<void> {
  await AsyncStorage.setItem(OFFERED_KEY, JSON.stringify({ storeVersion, at: Date.now() })).catch(
    () => undefined,
  );
}
