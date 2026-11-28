import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ROUTES } from './routes';
import type { RootStackParamList } from './types';
import { scanDocument } from '@/services/documentScanner';
import { useAppStore } from '@/store/appStore';
import type { CaptureTarget } from '@/types/models';
import showToast from '@/utils/toast';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function useRootNavigation(): RootNav {
  return useNavigation<RootNav>();
}

/**
 * Captures that go through the smart scanner (edge detection, crop,
 * perspective correction, enhancement). The profile photo and the whole-vehicle
 * photo stay ordinary camera shots.
 */
export const SCANNED_TARGETS: readonly CaptureTarget[] = ['license', 'nationalId', 'plate'];

export const isScannedTarget = (target: CaptureTarget) => SCANNED_TARGETS.includes(target);

/**
 * Opens the right capture experience for a target. Camera only throughout —
 * there is deliberately no gallery picker anywhere in the app.
 *
 * A scanned target falls back to the guided camera (cropped to the on-screen
 * frame) only when the scanner cannot run on this device. A denied permission
 * also lands on the guided camera, whose permission gate explains how to
 * allow the camera from Settings.
 */
export function useOpenCamera() {
  const navigation = useRootNavigation();
  const setAsset = useAppStore((s) => s.setAsset);

  return async (target: CaptureTarget) => {
    // The profile photo is a live selfie: full-screen front camera plus a
    // random blink-or-nod check, the same as at sign-up.
    if (target === 'profile') {
      navigation.navigate(ROUTES.PROFILE_PHOTO);
      return;
    }
    if (isScannedTarget(target)) {
      const result = await scanDocument();
      if (result.status === 'cancelled') return;
      if (result.status === 'scanned') {
        try {
          await setAsset(target, result);
        } catch {
          showToast.error('We could not save that scan. Please try again.');
        }
        return;
      }
      if (result.status === 'unavailable') {
        showToast.info('Scanner unavailable — line it up inside the frame instead.');
      }
    }
    navigation.navigate(ROUTES.CAMERA_CAPTURE, { target });
  };
}

export function useOpenDrawer(): () => void {
  const navigation = useNavigation();
  return () => {
    const nav = navigation as unknown as { openDrawer?: () => void };
    nav.openDrawer?.();
  };
}
