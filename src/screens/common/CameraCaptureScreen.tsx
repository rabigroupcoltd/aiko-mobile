import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CameraCapture } from '@/components/camera/CameraCapture';
import { CAPTURE_CONFIG } from '@/data/copy';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.CAMERA_CAPTURE>;

/**
 * Root-level modal host for {@link CameraCapture}.
 *
 * Takes serializable params only — `{ target }`. Passing an `onCaptured`
 * callback through route params would trip React Navigation's serialization
 * warning and break state persistence, so the result is written to the store
 * instead and callers read it back reactively.
 *
 * This is why every call site is a one-liner, and why the drawer's "Edit photo"
 * is literally this same modal rather than a separate edit flow.
 */
export function CameraCaptureScreen({ route, navigation }: Props) {
  const { target } = route.params;
  const setAsset = useAppStore((s) => s.setAsset);

  const config = CAPTURE_CONFIG[target];

  return (
    <CameraCapture
      title={config.title}
      instruction={config.instruction}
      facing={config.facing}
      overlay={config.overlay}
      confirmLabel={config.confirmLabel}
      onCaptured={async (result) => {
        await setAsset(target, result);
        navigation.goBack();
      }}
      onCancel={() => navigation.goBack()}
    />
  );
}
