import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera as FaceCamera } from 'react-native-vision-camera-face-detector';

import { FaceOvalGuide } from '@/components/liveness/FaceOvalGuide';
import { LivenessProgress } from '@/components/liveness/LivenessProgress';
import { Button } from '@/components/ui';
import { LIVENESS_COPY } from '@/data/copy';
import { useCameraActive } from '@/hooks/useCameraActive';
import { useLivenessCheck } from '@/hooks/useLivenessCheck';
import { LIVENESS } from '@/liveness/constants';
import { UpdateOnboardingManager } from '@/modules/onboarding/onboardingController';
import { onboardingStepRoute, ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { colors, radius, screenGutter, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.LIVENESS>;

const DetectorCamera = memo(FaceCamera);

export function LivenessScreen({ navigation }: Props) {
  const { updateOnboarding } = UpdateOnboardingManager();
  const isActive = useCameraActive();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const [started, setStarted] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const saveResult = useRef<ReturnType<typeof updateOnboarding> | null>(null);

  const handlePassed = useCallback(() => {
    saveResult.current = updateOnboarding({ livenessPassed: true });
  }, [updateOnboarding]);

  const {
    phase,
    prompt,
    progress,
    attempt,
    stepIndex,
    canRetry,
    debug,
    detectorOptions,
    begin,
  } = useLivenessCheck(handlePassed);

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  const aligned = phase === 'FACE_SEARCH' && progress > 0;
  const failed = phase === 'FAILED';
  const passed = phase === 'PASSED';

  const handleStart = () => {
    setStarted(true);
    begin();
  };

  const handleContinue = async () => {
    setContinuing(true);
    try {
      const state = await (saveResult.current ?? updateOnboarding({ livenessPassed: true }));
      const next = onboardingStepRoute(state.resumeStep);
      if (next) navigation.navigate(next);
    } catch {
    } finally {
      setContinuing(false);
    }
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          The liveness check runs entirely on your device. Nothing is recorded or uploaded.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permissionIcon}>📵</Text>
        <Text style={styles.permissionTitle}>No front camera found</Text>
        <Text style={styles.permissionBody}>
          The liveness check needs a front-facing camera. Try running Aiko on a physical
          device.
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
        {...detectorOptions}
      />

      <FaceOvalGuide phase={phase} aligned={aligned} />

      <SafeAreaView style={styles.chrome} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.top}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
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
            <Text style={styles.promptTitle}>{prompt.title}</Text>
            <Text style={styles.promptSubtitle}>{prompt.subtitle}</Text>
            {failed && attempt > 1 ? (
              <Text style={styles.attempts}>
                Attempt {attempt} of {LIVENESS.MAX_ATTEMPTS}
              </Text>
            ) : null}
          </View>

          {!started ? (
            <View style={styles.actions}>
              <Text style={styles.intro}>{LIVENESS_COPY.screenSubtitle}</Text>
              <Button label="Start check" onPress={handleStart} />
            </View>
          ) : null}

          {failed ? (
            <View style={styles.actions}>
              {canRetry ? (
                <Button label="Try again" onPress={begin} />
              ) : (
                <>
                  <Text style={styles.exhausted}>
                    You&apos;ve used all {LIVENESS.MAX_ATTEMPTS} attempts. You can start over
                    or contact support.
                  </Text>
                  <Button label="Start over" onPress={begin} />
                </>
              )}
            </View>
          ) : null}

          {passed ? (
            <View style={styles.actions}>
              <Button label="Continue" onPress={handleContinue} loading={continuing} />
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
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, lineHeight: 34, color: colors.onPrimary },
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

  actions: { gap: spacing.sm },
  intro: { ...typography.bodySmall, color: colors.neutral[300], textAlign: 'center' },
  exhausted: { ...typography.caption, color: colors.neutral[400], textAlign: 'center' },

  permission: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionIcon: { fontSize: 40 },
  permissionTitle: { ...typography.title, textAlign: 'center' },
  permissionBody: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.base },
});
