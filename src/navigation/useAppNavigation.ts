import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ROUTES } from './routes';
import type { RootStackParamList } from './types';
import { scanDocument } from '@/services/documentScanner';
import { useAppStore } from '@/store/appStore';
import type { CaptureTarget } from '@/types/models';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function useRootNavigation(): RootNav {
  return useNavigation<RootNav>();
}

const SCANNED_TARGETS: CaptureTarget[] = ['license', 'nationalId'];

export function useOpenCamera() {
  const navigation = useRootNavigation();
  const setAsset = useAppStore((s) => s.setAsset);

  return async (target: CaptureTarget) => {
    if (SCANNED_TARGETS.includes(target)) {
      const result = await scanDocument();
      if (result.status === 'scanned') {
        await setAsset(target, result);
        return;
      }
      if (result.status === 'cancelled') return;
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
