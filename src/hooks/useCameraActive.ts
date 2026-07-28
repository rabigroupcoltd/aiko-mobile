import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Whether a camera preview on this screen should be live.
 *
 * Android permits only one camera client at a time. Navigating away from a
 * screen without releasing its camera produces an intermittent black preview —
 * or an outright failure — on the next screen that opens one. Gating `isActive`
 * on focus AND foreground state is what keeps VisionCamera (liveness) and
 * expo-camera (capture) from ever fighting over the device.
 */
export function useCameraActive(): boolean {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) =>
      setAppActive(next === 'active')
    );
    return () => sub.remove();
  }, []);

  return isFocused && appActive;
}
