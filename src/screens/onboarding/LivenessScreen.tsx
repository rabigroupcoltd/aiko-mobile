import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { Camera as FaceCamera } from 'react-native-vision-camera-face-detector';

import { FaceOvalGuide } from '@/components/liveness/FaceOvalGuide';
import { LivenessProgress } from '@/components/liveness/LivenessProgress';
import { Button, Icon } from '@/components/ui';
import { LIVENESS_COPY } from '@/data/copy';
import { useCameraActive } from '@/hooks/useCameraActive';
import { useLivenessCheck } from '@/hooks/useLivenessCheck';
import { LIVENESS } from '@/liveness/constants';
import {
  UpdateOnboardingManager,
  UploadOnboardingPhotoManager,
} from '@/modules/onboarding/onboardingController';
import type { OnboardingState } from '@/modules/onboarding/onboardingTypes';
import { onboardingStepRoute, ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { colors, radius, screenGutter, spacing, typography } from '@/theme';
import { createLogger } from '@/utils/logger';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.LIVENESS>;

const log = createLogger('liveness');
const DetectorCamera = memo(FaceCamera);

const toFileUri = (path: string) => (path.startsWith('file://') ? path : `file://${path}`);

/**
 * The selfie step: look at the camera, nod once. The frame captured while the
 * face is centred and still becomes the profile photo, and the nod proves a
 * real person is in front of the camera — one screen instead of two.
 */
export function LivenessScreen({ navigation }: Props) {
  const { updateOnboarding } = UpdateOnboardingManager();
  const { uploadPhoto } = UploadOnboardingPhotoManager();
  const setAsset = useAppStore((s) => s.setAsset);
  const isActive = useCameraActive();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({ quality: 0.85 });

  const [started, setStarted] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const captureRef = useRef<Promise<string | null> | null>(null);
  const saveRef = useRef<Promise<OnboardingState> | null>(null);

  const capture = useCallback(async (): Promise<string | null> => {
    try {
      const file = await photoOutput.capturePhotoToFile({ enableShutterSound: false }, {});
      const uri = toFileUri(file.filePath);
      setSelfie(uri);
      return uri;
    } catch (error) {
      log.warn('selfie capture failed', error);
      return null;
    }
  }, [photoOutput]);

  const save = useCallback(async (): Promise<OnboardingState> => {
    const uri = (await captureRef.current) ?? (await capture());
    if (!uri) throw new Error('We could not take your photo. Please try again.');

    await setAsset('profile', { uri, width: 0, height: 0 }).catch(() => undefined);
    await uploadPhoto({ uri, name: `selfie-${Date.now()}.jpg`, type: 'image/jpeg' });
    return updateOnboarding({ livenessPassed: true });
  }, [capture, setAsset, uploadPhoto, updateOnboarding]);

  const handleFramed = useCallback(() => {
    captureRef.current = capture();
  }, [capture]);

  const handlePassed = useCallback(() => {
    setSaveError(null);
    saveRef.current = save();
    saveRef.current.catch((error: Error) => setSaveError(error.message));
  }, [save]);

  const { phase, prompt, progress, attempt, stepIndex, canRetry, detectorOptions, begin } =
    useLivenessCheck(handlePassed, handleFramed);

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  const aligned = phase === 'FACE_SEARCH' && progress > 0;
  const failed = phase === 'FAILED';
  const passed = phase === 'PASSED';

  const restart = () => {
    captureRef.current = null;
    saveRef.current = null;
    setSelfie(null);
    setSaveError(null);
    begin();
  };

  const handleStart = () => {
    setStarted(true);
    restart();
  };

  const handleContinue = async () => {
    setContinuing(true);
    setSaveError(null);
    try {
      const state = await (saveRef.current ?? save());
      const next = onboardingStepRoute(state.resumeStep);
      if (next && next !== ROUTES.LIVENESS) navigation.navigate(next);
    } catch (error) {
      saveRef.current = null;
      setSaveError((error as Error).message);
    } finally {
      setContinuing(false);
    }
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permission}>
        <View style={styles.permissionIcon}>
          <Icon name="shield-check" size={34} color={colors.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          We use your front camera to take your profile photo and check it&apos;s really you.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
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
        <Button label="Go back" variant="secondary" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <DetectorCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && started && !passed}
        outputs={[photoOutput]}
        {...detectorOptions}
      />

      {passed && selfie ? (
        <View style={styles.doneBackdrop}>
          <Image source={{ uri: selfie }} style={styles.selfie} />
          <View style={styles.tick}>
            <Icon name="shield-check" size={22} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        </View>
      ) : (
        <FaceOvalGuide phase={phase} aligned={aligned} />
      )}

      <SafeAreaView style={styles.chrome} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.top}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate(ROUTES.PROFILE_FORM))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}>
              <Icon name="chevron-left" size={24} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.screenTitle}>{LIVENESS_COPY.screenTitle}</Text>
            <View style={styles.backButton} />
          </View>

          {started && !passed ? (
            <LivenessProgress stepIndex={stepIndex} progress={progress} failed={failed} />
          ) : null}
        </View>

        <View style={styles.bottom}>
          <View style={[styles.promptCard, failed && styles.promptCardError, passed && styles.promptCardSuccess]}>
            <Text style={styles.promptTitle}>{started ? prompt.title : 'Take a quick selfie'}</Text>
            <Text style={styles.promptSubtitle}>
              {started ? prompt.subtitle : LIVENESS_COPY.screenSubtitle}
            </Text>
            {failed && attempt > 1 ? (
              <Text style={styles.attempts}>
                Attempt {attempt} of {LIVENESS.MAX_ATTEMPTS}
              </Text>
            ) : null}
            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          </View>

          {!started ? (
            <View style={styles.actions}>
              <View style={styles.tips}>
                <Text style={styles.tip}>• Good light on your face</Text>
                <Text style={styles.tip}>• No sunglasses, hat or face covering</Text>
                <Text style={styles.tip}>• Only you in the frame</Text>
              </View>
              <Button label="Start" onPress={handleStart} />
            </View>
          ) : null}

          {failed ? (
            <View style={styles.actions}>
              {canRetry ? (
                <Button label="Try again" onPress={restart} />
              ) : (
                <>
                  <Text style={styles.exhausted}>
                    You&apos;ve used all {LIVENESS.MAX_ATTEMPTS} attempts. Take a moment, then start over.
                  </Text>
                  <Button label="Start over" onPress={restart} />
                </>
              )}
            </View>
          ) : null}

          {passed ? (
            <View style={styles.actions}>
              <Button label="Continue" onPress={handleContinue} loading={continuing} />
              {saveError ? (
                <Button label="Retake selfie" variant="ghost" onPress={restart} />
              ) : null}
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  screenTitle: { ...typography.subheading, color: colors.onPrimary },

  doneBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 160,
  },
  selfie: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 5,
    borderColor: colors.green[400],
  },
  tick: {
    marginTop: -26,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green[500],
    borderWidth: 4,
    borderColor: colors.neutral[900],
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottom: { paddingHorizontal: screenGutter, paddingBottom: spacing.base, gap: spacing.md },

  promptCard: {
    backgroundColor: 'rgba(17,25,23,0.86)',
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
