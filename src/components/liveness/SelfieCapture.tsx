import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { Camera as FaceCamera } from 'react-native-vision-camera-face-detector';

import { Button, Icon } from '@/components/ui';
import { LIVENESS_COPY } from '@/data/copy';
import { useCameraActive } from '@/hooks/useCameraActive';
import { useLivenessCheck } from '@/hooks/useLivenessCheck';
import { LIVENESS } from '@/liveness/constants';
import { shrinkImage, UPLOAD_SIZES } from '@/services/imageCompression';
import { colors, radius, screenGutter, spacing, typography } from '@/theme';
import { createLogger } from '@/utils/logger';
import { LivenessProgress } from './LivenessProgress';
import { SelfieFrame } from './SelfieFrame';

const log = createLogger('selfie');
const DetectorCamera = memo(FaceCamera);

const toFileUri = (path: string) => (path.startsWith('file://') ? path : `file://${path}`);

export interface SelfieCaptureProps {
  title?: string;
  /** Saves the confirmed photo. Throw with a user-facing message to keep the review up. */
  onConfirm: (uri: string) => Promise<void>;
  onBack: () => void;
  confirmLabel?: string;
}

/**
 * Full-screen front-camera selfie with a liveness check: find the face, do one
 * randomly chosen action (blink or nod), then the photo is taken and shown
 * for review. Camera only — there is no way to pick an existing picture.
 */
export function SelfieCapture({
  title = LIVENESS_COPY.screenTitle,
  onConfirm,
  onBack,
  confirmLabel = 'Use this photo',
}: SelfieCaptureProps) {
  const cameraActive = useCameraActive();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({ quality: 0.85 });
  // A new array every render would make the camera reconfigure on every
  // liveness tick (~10×/s) — the cause of the preview freezing.
  const outputs = useMemo(() => [photoOutput], [photoOutput]);

  const [started, setStarted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const capturingRef = useRef(false);

  const capture = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    setCapturing(true);
    try {
      const file = await photoOutput.capturePhotoToFile({ enableShutterSound: false }, {});
      // A full-resolution selfie is several MB — shrink it before review so
      // what the user approves is exactly what goes over their mobile data.
      const small = await shrinkImage(toFileUri(file.filePath), UPLOAD_SIZES.selfie);
      setPhoto(small.uri);
    } catch (err) {
      log.warn('selfie capture failed', err);
      setError("We couldn't take the photo. Please try again.");
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  }, [photoOutput]);

  const { phase, challenge, prompt, progress, attempt, stepIndex, canRetry, detectorOptions, begin } =
    useLivenessCheck(() => void capture());

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  const restart = useCallback(() => {
    setPhoto(null);
    setError(null);
    setStarted(true);
    begin();
  }, [begin]);

  const confirm = useCallback(async () => {
    if (!photo) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(photo);
    } catch (err) {
      setError((err as Error)?.message || "We couldn't save your photo. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [onConfirm, photo]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permission}>
        <View style={styles.permissionIcon}>
          <Icon name="shield-check" size={34} color={colors.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          We use your front camera to take your profile photo and check it&apos;s really you.
          Photos can only be taken with the camera.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
        <Button label="Open Settings" variant="ghost" onPress={() => void Linking.openSettings()} />
        <Button label="Go back" variant="ghost" onPress={onBack} />
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permissionTitle}>No front camera found</Text>
        <Text style={styles.permissionBody}>
          The selfie check needs a front-facing camera. Try running Aiko on a phone.
        </Text>
        <Button label="Go back" variant="secondary" onPress={onBack} />
      </SafeAreaView>
    );
  }

  // Review: the photo, full screen, before anything is saved.
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <SafeAreaView style={styles.chrome} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <View style={styles.roundButton} />
            <Text style={styles.screenTitle}>Your photo</Text>
            <View style={styles.roundButton} />
          </View>
          <View style={styles.bottom}>
            <View style={[styles.promptCard, styles.promptCardSuccess]}>
              <Text style={styles.promptTitle}>Looking good?</Text>
              <Text style={styles.promptSubtitle}>
                This is the photo riders and customers will see.
              </Text>
              {error ? (
                <Text style={styles.error}>
                  {error} Your photo is still here — you don&apos;t need to retake it.
                </Text>
              ) : null}
            </View>
            <Button
              label={saving ? 'Uploading…' : error ? 'Try uploading again' : confirmLabel}
              onPress={() => void confirm()}
              loading={saving}
            />
            <Button label="Retake" variant="secondary" onPress={restart} disabled={saving} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const failed = phase === 'FAILED';
  const passed = phase === 'PASSED';

  return (
    <View style={styles.container}>
      <DetectorCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive && started}
        outputs={outputs}
        {...detectorOptions}
      />

      {started ? (
        <SelfieFrame
          phase={phase}
          challenge={challenge}
          faceFound={prompt.id === 'faceFound'}
        />
      ) : null}

      <SafeAreaView style={styles.chrome} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.top}>
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.roundButton}>
              <Icon name="chevron-left" size={24} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.screenTitle}>{title}</Text>
            <View style={styles.roundButton} />
          </View>

          {started && !failed ? (
            <LivenessProgress
              stepIndex={stepIndex}
              progress={passed ? 1 : progress}
              challenge={challenge}
            />
          ) : null}
        </View>

        <View style={styles.bottom}>
          <View style={[styles.promptCard, failed && styles.promptCardError]}>
            <Text style={styles.promptTitle}>
              {!started ? 'Take a quick selfie' : capturing || passed ? 'Taking your photo…' : prompt.title}
            </Text>
            <Text style={styles.promptSubtitle}>
              {!started ? LIVENESS_COPY.screenSubtitle : passed ? 'Hold still.' : prompt.subtitle}
            </Text>
            {failed && attempt > 1 ? (
              <Text style={styles.attempts}>
                Attempt {attempt} of {LIVENESS.MAX_ATTEMPTS}
              </Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {!started ? (
            <View style={styles.actions}>
              <View style={styles.tips}>
                {LIVENESS_COPY.tips.map((tip) => (
                  <Text key={tip} style={styles.tip}>
                    • {tip}
                  </Text>
                ))}
              </View>
              <Button label="Start" onPress={restart} />
            </View>
          ) : null}

          {failed || (error && !capturing) ? (
            <View style={styles.actions}>
              {!failed || canRetry ? (
                <Button label="Try again" onPress={restart} />
              ) : (
                <>
                  <Text style={styles.exhausted}>
                    {LIVENESS_COPY.exhausted}
                  </Text>
                  <Button label="Start over" onPress={restart} />
                </>
              )}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[900] },
  chrome: { flex: 1, justifyContent: 'space-between' },

  top: { paddingHorizontal: screenGutter, gap: spacing.base },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  screenTitle: { ...typography.subheading, color: colors.onPrimary },

  bottom: { paddingHorizontal: screenGutter, paddingBottom: spacing.base, gap: spacing.md },
  promptCard: {
    backgroundColor: 'rgba(17,25,23,0.82)',
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xxs,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  promptCardError: { borderColor: colors.danger },
  promptCardSuccess: { borderColor: colors.livenessSuccess },
  promptTitle: { ...typography.heading, color: colors.onPrimary },
  promptSubtitle: { ...typography.bodySmall, color: colors.neutral[300] },
  attempts: { ...typography.caption, color: colors.neutral[400], marginTop: spacing.xs },
  error: { ...typography.bodySmall, color: '#FF8A80', marginTop: spacing.xs },

  actions: { gap: spacing.sm },
  tips: { gap: 2, paddingHorizontal: spacing.xs },
  tip: { ...typography.bodySmall, color: colors.neutral[300] },
  exhausted: { ...typography.caption, color: colors.neutral[400], textAlign: 'center' },

  permission: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { ...typography.title, textAlign: 'center' },
  permissionBody: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.base },
});
