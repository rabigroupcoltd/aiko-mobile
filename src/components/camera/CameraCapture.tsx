import { CameraView, type CameraCapturedPicture } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCameraActive } from '@/hooks/useCameraActive';
import { colors, hitSize, screenGutter, spacing, typography } from '@/theme';
import { createLogger } from '@/utils/logger';
import { CaptureOverlay, type OverlayShape } from './CaptureOverlay';
import { PermissionGate } from './PermissionGate';
import { ReviewPhoto } from './ReviewPhoto';
import { ShutterButton } from './ShutterButton';

const log = createLogger('camera');

export interface CaptureResult {
  uri: string;
  width: number;
  height: number;
}

export interface CameraCaptureProps {
  title: string;
  instruction: string;
  facing: 'front' | 'back';
  overlay: OverlayShape;
  confirmLabel: string;
  onCaptured: (result: CaptureResult) => void | Promise<void>;
  onCancel: () => void;
  quality?: number;
}

export function CameraCapture({
  title,
  instruction,
  facing,
  overlay,
  confirmLabel,
  onCaptured,
  onCancel,
  quality = 0.7,
}: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const isActive = useCameraActive();

  const [shot, setShot] = useState<CameraCapturedPicture | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    setError(null);
    try {
      const picture = await cameraRef.current?.takePictureAsync({
        quality,
        skipProcessing: true,
      });
      if (picture) setShot(picture);
      else setError('Could not take the photo. Try again.');
    } catch (err) {
      log.error('capture failed', err);
      setError('Could not take the photo. Try again.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, quality]);

  const confirm = useCallback(async () => {
    if (!shot) return;
    setSaving(true);
    try {
      await onCaptured({ uri: shot.uri, width: shot.width, height: shot.height });
    } catch (err) {
      log.error('save failed', err);
      setError('Could not save the photo. Try again.');
      setSaving(false);
    }
  }, [shot, onCaptured]);

  if (shot) {
    return (
      <ReviewPhoto
        uri={shot.uri}
        title={title}
        confirmLabel={confirmLabel}
        busy={saving}
        onRetake={() => {
          setShot(null);
          setError(null);
        }}
        onConfirm={confirm}
      />
    );
  }

  return (
    <PermissionGate onCancel={onCancel}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="picture"
          active={isActive}
        />

        <CaptureOverlay shape={overlay} instruction={instruction} />

        <SafeAreaView style={styles.chrome} edges={['top', 'bottom']} pointerEvents="box-none">
          <View style={styles.topBar}>
            <Pressable
              onPress={onCancel}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.closeButton} />
          </View>

          <View style={styles.bottomBar}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ShutterButton onPress={takePhoto} busy={capturing} disabled={!isActive} />
          </View>
        </SafeAreaView>
      </View>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[900] },
  chrome: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenGutter,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: hitSize,
    height: hitSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 22, color: colors.onPrimary },
  title: { ...typography.subheading, color: colors.onPrimary },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  error: {
    ...typography.bodySmall,
    color: colors.onPrimary,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
