import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera as FaceCamera } from 'react-native-vision-camera-face-detector';

import { DebugOverlay } from '@/components/liveness/DebugOverlay';
import { FaceOvalGuide } from '@/components/liveness/FaceOvalGuide';
import { LivenessProgress } from '@/components/liveness/LivenessProgress';
import { Button } from '@/components/ui';
import { featureFlags } from '@/config/featureFlags';
import { LIVENESS_COPY } from '@/data/copy';
import { useCameraActive } from '@/hooks/useCameraActive';
import { useLivenessCheck } from '@/hooks/useLivenessCheck';
import { LIVENESS } from '@/liveness/constants';
import { ROUTES } from '@/navigation/routes';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { colors, radius, screenGutter, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, typeof ROUTES.LIVENESS>;

/**
 * Memoised, and that memo is load-bearing — it is what keeps the detector alive.
 *
 * `useFaceDetectorOutput` builds its native detector inside
 * `useMemo(..., [options])`, where `options` is an object-rest binding — a fresh
 * identity on every render. So the memo never hits and the detector output is
 * rebuilt on EVERY render of this camera.
 *
 * This screen re-renders roughly ten times a second while the framing ring
 * fills, so the detector was being torn down and rebuilt at that rate. It
 * stopped delivering frames within a second or two — the debug overlay read
 * `0 fps` with a stale snapshot still on screen, which looked exactly like the
 * check "freezing" as the face approached the centre. FACE_SEARCH then sat there
 * until it timed out.
 *
 * Every prop below is referentially stable (`detectorOptions` is a `useMemo`
 * with stable deps, `device` comes from `useCameraDevice`), so this shallow
 * compare blocks those renders outright and the detector is built once.
 */
const DetectorCamera = memo(FaceCamera);

export function LivenessScreen({ navigation }: Props) {
  const setLivenessPassed = useAppStore((s) => s.setLivenessPassed);
  const isActive = useCameraActive();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const [started, setStarted] = useState(false);
  const tapCount = useRef(0);

  const handlePassed = useCallback(() => {
    setLivenessPassed(true);
  }, [setLivenessPassed]);

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
    forcePass,
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

  /**
   * Five taps on the title force a pass.
   *
   * Harsh backlight or a projector-lit room can defeat ML Kit's eye classifier,
   * and a demo that dead-ends at identity verification is a bad demo. Demo-only
   * and gated behind the feature flag.
   */
  const handleTitleTap = () => {
    if (!featureFlags.DEMO_BYPASS_LIVENESS) return;
    tapCount.current += 1;
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      forcePass();
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
        {/* ── top ── */}
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
            <Pressable onPress={handleTitleTap}>
              <Text style={styles.screenTitle}>{LIVENESS_COPY.screenTitle}</Text>
            </Pressable>
            <View style={styles.backButton} />
          </View>

          {started && !passed ? (
            <LivenessProgress stepIndex={stepIndex} progress={progress} failed={failed} />
          ) : null}
        </View>

        {/* ── bottom ── */}
        <View style={styles.bottom}>
          {featureFlags.SHOW_LIVENESS_DEBUG && started ? (
            <DebugOverlay info={debug} phase={phase} />
          ) : null}

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
              <Button
                label="Continue"
                onPress={() => navigation.navigate(ROUTES.USER_TYPE)}
              />
            </View>
          ) : null}

          {featureFlags.DEMO_BYPASS_LIVENESS && started && !passed ? (
            <Pressable onPress={forcePass} hitSlop={8} style={styles.skip}>
              <Text style={styles.skipText}>DEV: skip liveness</Text>
            </Pressable>
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

  skip: { alignSelf: 'center', paddingVertical: spacing.sm },
  skipText: { ...typography.caption, color: colors.warning, textDecorationLine: 'underline' },

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
