import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ROUTES } from './routes';
import type { RootStackParamList } from './types';
import type { CaptureTarget } from '@/types/models';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Typed access to the root stack from anywhere in the tree.
 *
 * Screens nested in the drawer or an inner stack can't reach the root modal
 * through their own typed navigator, and the usual workaround is a pile of
 * `as never` casts that silently defeat type checking. This narrows the escape
 * hatch to one place.
 */
export function useRootNavigation(): RootNav {
  return useNavigation<RootNav>();
}

/** Open the shared camera capture modal for a given target. */
export function useOpenCamera() {
  const navigation = useRootNavigation();
  return (target: CaptureTarget) =>
    navigation.navigate(ROUTES.CAMERA_CAPTURE, { target });
}

/** Drawer screens receive `openDrawer` but aren't statically typed for it. */
export function useOpenDrawer(): () => void {
  const navigation = useNavigation();
  return () => {
    const nav = navigation as unknown as { openDrawer?: () => void };
    nav.openDrawer?.();
  };
}
