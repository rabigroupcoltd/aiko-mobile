import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Face } from 'react-native-vision-camera-face-detector';

import { LIVENESS } from '@/liveness/constants';
import { toFaceSnapshot } from '@/liveness/faceSnapshot';
import { canRetry, initialState, start, step, type TickSignals } from '@/liveness/machine';
import { promptFor, stepIndexFor, type Prompt } from '@/liveness/prompts';
import { AngleSmoother, Smoother, fuseEyes } from '@/liveness/signals';
import type { FaceSnapshot, FailReason, LivenessPhase, LivenessState } from '@/liveness/types';

/** What the screen renders from. Deliberately small and change-diffed. */
interface LivenessUiState {
  phase: LivenessPhase;
  prompt: Prompt;
  progress: number;
  attempt: number;
  stepIndex: number;
  failReason: FailReason | null;
  canRetry: boolean;
}

export interface LivenessDebugInfo {
  yaw: number;
  roll: number;
  pitch: number;
  eye: number | null;
  leftEye: number | null;
  rightEye: number | null;
  widthRatio: number;
  centerX: number;
  centerY: number;
  faceCount: number;
  fps: number;
}

function uiFrom(state: LivenessState): LivenessUiState {
  return {
    phase: state.phase,
    prompt: promptFor(state),
    progress: state.progress,
    attempt: state.attempt,
    stepIndex: stepIndexFor(state),
    failReason: state.failReason,
    canRetry: canRetry(state),
  };
}

/**
 * Binds the pure liveness machine to the camera.
 *
 * Performance strategy, in three layers — the detector callback fires at camera
 * framerate (30-60Hz), so naive setState here would destroy the frame rate:
 *
 *  1. `onFacesDetected` does almost nothing: copies scalars out of the native
 *     HybridObject into a ref, stamps a timestamp, counts a frame. No React
 *     state, no allocation beyond one small object, never touches the FSM.
 *  2. A fixed 10Hz interval drives the pure reducer. Decoupling from camera fps
 *     is what makes millisecond thresholds portable across devices, makes
 *     timeouts trivial, and makes the machine testable without a camera.
 *  3. React state is committed only when a compact UI key actually changes —
 *     roughly 6-12 renders for a whole session instead of ~900.
 */
export function useLivenessCheck(onPassed?: () => void) {
  const stateRef = useRef<LivenessState>(initialState(Date.now()));
  const latestRef = useRef<FaceSnapshot | null>(null);
  const faceCountRef = useRef(0);
  const lastFaceAtRef = useRef(0);

  const eyeSmoother = useRef(new Smoother());
  const yawSmoother = useRef(new AngleSmoother());
  const rollSmoother = useRef(new AngleSmoother());

  // fps accounting for the debug overlay
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const fpsWindowStart = useRef(Date.now());

  const uiKeyRef = useRef('');
  const [ui, setUi] = useState<LivenessUiState>(() => uiFrom(stateRef.current));
  const [debug, setDebug] = useState<LivenessDebugInfo | null>(null);
  const debugTickRef = useRef(0);

  const onPassedRef = useRef(onPassed);
  onPassedRef.current = onPassed;

  /**
   * MUST have empty deps. If this callback is recreated on every render the
   * detector re-registers each time and the frame rate collapses.
   */
  const onFacesDetected = useCallback((faces: Face[]) => {
    const now = Date.now();
    frameCountRef.current += 1;
    faceCountRef.current = faces.length;

    if (faces.length > 0) {
      // Copy scalars out immediately — see faceSnapshot.ts for why this cannot
      // be deferred, spread, or stored.
      latestRef.current = toFaceSnapshot(faces[0], now);
      lastFaceAtRef.current = now;
    }
  }, []);

  const onError = useCallback((error: Error) => {
    // Detector errors are transient (buffer hiccups); the face-lost timeout
    // already covers a genuinely dead detector.
    if (__DEV__) console.warn('[liveness] detector error', error);
  }, []);

  // ── the 10Hz engine ───────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const snapshot = latestRef.current;

      // fps, recomputed once per second
      if (now - fpsWindowStart.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        fpsWindowStart.current = now;
      }

      let signals: TickSignals = { eye: eyeSmoother.current.value, yaw: 0, roll: 0 };

      if (snapshot) {
        const eye = eyeSmoother.current.push(fuseEyes(snapshot));
        const yaw = yawSmoother.current.push(snapshot.yaw);
        const roll = rollSmoother.current.push(snapshot.roll);
        signals = { eye, yaw, roll };
      }

      const next = step(
        stateRef.current,
        {
          now,
          snapshot,
          faceCount: faceCountRef.current,
          sinceLastFace: lastFaceAtRef.current ? now - lastFaceAtRef.current : Infinity,
        },
        signals
      );

      const wasPassed = stateRef.current.phase === 'PASSED';
      stateRef.current = next;

      // Layer 3: commit only when something the UI shows actually changed.
      const key = `${next.phase}|${promptFor(next).id}|${Math.round(next.progress * 10)}|${next.attempt}|${next.failReason ?? ''}`;
      if (key !== uiKeyRef.current) {
        uiKeyRef.current = key;
        setUi(uiFrom(next));
      }

      if (!wasPassed && next.phase === 'PASSED') onPassedRef.current?.();

      // Debug overlay throttles itself to ~5Hz.
      debugTickRef.current += 1;
      if (debugTickRef.current % 2 === 0 && snapshot) {
        const frameW = snapshot.frameW || 1;
        const frameH = snapshot.frameH || 1;
        setDebug({
          yaw: signals.yaw,
          roll: signals.roll,
          pitch: snapshot.pitch,
          eye: signals.eye,
          leftEye: snapshot.leftEye,
          rightEye: snapshot.rightEye,
          widthRatio: snapshot.w / frameW,
          centerX: (snapshot.x + snapshot.w / 2) / frameW,
          centerY: (snapshot.y + snapshot.h / 2) / frameH,
          faceCount: faceCountRef.current,
          fps: fpsRef.current,
        });
      }
    }, LIVENESS.TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const reset = useCallback(() => {
    eyeSmoother.current.reset();
    yawSmoother.current.reset();
    rollSmoother.current.reset();
    latestRef.current = null;
    lastFaceAtRef.current = 0;
    faceCountRef.current = 0;
  }, []);

  const begin = useCallback(() => {
    reset();
    const now = Date.now();
    stateRef.current = start(stateRef.current, now);
    uiKeyRef.current = '';
    setUi(uiFrom(stateRef.current));
  }, [reset]);

  /** Force a pass — demo escape hatch only, gated by the caller. */
  const forcePass = useCallback(() => {
    stateRef.current = { ...stateRef.current, phase: 'PASSED', progress: 1 };
    setUi(uiFrom(stateRef.current));
    onPassedRef.current?.();
  }, []);

  const detectorOptions = useMemo(
    () => ({
      performanceMode: 'fast' as const,
      // Required for leftEyeOpenProbability / rightEyeOpenProbability.
      runClassifications: true,
      cameraFacing: 'front' as const,
      minFaceSize: 0.15,
      outputResolution: 'preview' as const,
      onFacesDetected,
      onError,
    }),
    [onFacesDetected, onError]
  );

  return { ...ui, debug, detectorOptions, begin, forcePass, reset };
}
