import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Face } from 'react-native-vision-camera-face-detector';

import { LIVENESS } from '@/liveness/constants';
import { toFaceSnapshot } from '@/liveness/faceSnapshot';
import { canRetry, initialState, start, step, type TickSignals } from '@/liveness/machine';
import { promptFor, stepIndexFor, type Prompt } from '@/liveness/prompts';
import { AngleSmoother, fuseEyes } from '@/liveness/signals';
import type {
  ChallengeKind,
  EyeWindow,
  FaceSnapshot,
  FailReason,
  LivenessPhase,
  LivenessState,
} from '@/liveness/types';
import { haptics } from '@/utils/haptics';

interface LivenessUiState {
  phase: LivenessPhase;
  challenge: ChallengeKind;
  prompt: Prompt;
  progress: number;
  attempt: number;
  stepIndex: number;
  failReason: FailReason | null;
  canRetry: boolean;
}

function uiFrom(state: LivenessState): LivenessUiState {
  return {
    phase: state.phase,
    challenge: state.challenge,
    prompt: promptFor(state),
    progress: state.progress,
    attempt: state.attempt,
    stepIndex: stepIndexFor(state),
    failReason: state.failReason,
    canRetry: canRetry(state),
  };
}

/**
 * Drives the selfie check from face-detector output. Detection runs per camera
 * frame; the state machine runs on a fixed 100 ms tick. `onPassed` fires once,
 * when it is time to take the photo.
 */
export function useLivenessCheck(onPassed?: () => void) {
  const stateRef = useRef<LivenessState>(initialState(Date.now()));
  const latestRef = useRef<FaceSnapshot | null>(null);
  const faceCountRef = useRef(0);
  const lastFaceAtRef = useRef(0);
  const eyesRef = useRef<EyeWindow>({ min: null, max: null });
  const shownRef = useRef<LivenessUiState | null>(null);
  const pendingPromptRef = useRef<{ id: string; since: number } | null>(null);

  const pitchSmoother = useRef(new AngleSmoother());
  const yawSmoother = useRef(new AngleSmoother());
  const rollSmoother = useRef(new AngleSmoother());

  const uiKeyRef = useRef('');
  const [ui, setUi] = useState<LivenessUiState>(() => uiFrom(stateRef.current));

  const onPassedRef = useRef(onPassed);
  onPassedRef.current = onPassed;

  const onFacesDetected = useCallback((faces: Face[]) => {
    const now = Date.now();
    faceCountRef.current = faces.length;
    if (faces.length === 0) return;

    const snapshot = toFaceSnapshot(faces[0], now);
    latestRef.current = snapshot;
    lastFaceAtRef.current = now;

    // Keep the extremes between ticks: a blink can be over within one tick.
    const eye = fuseEyes(snapshot);
    if (eye != null) {
      const window = eyesRef.current;
      eyesRef.current = {
        min: window.min == null ? eye : Math.min(window.min, eye),
        max: window.max == null ? eye : Math.max(window.max, eye),
      };
    }
  }, []);

  const onError = useCallback((error: Error) => {
    if (__DEV__) console.warn('[liveness] detector error', error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const snapshot = latestRef.current;
      const eyes = eyesRef.current;
      eyesRef.current = { min: null, max: null };

      const signals: TickSignals = snapshot
        ? {
            yaw: yawSmoother.current.push(snapshot.yaw),
            roll: rollSmoother.current.push(snapshot.roll),
            pitch: pitchSmoother.current.push(snapshot.pitch),
          }
        : { yaw: 0, roll: 0, pitch: 0 };

      const prev = stateRef.current;
      const next = step(
        prev,
        {
          now,
          snapshot,
          faceCount: faceCountRef.current,
          sinceLastFace: lastFaceAtRef.current ? now - lastFaceAtRef.current : Infinity,
          eyes,
        },
        signals,
      );
      stateRef.current = next;

      // Coaching text waits a beat before changing while searching, so it
      // doesn't flicker as the user adjusts. Phase changes show at once.
      let shownUi = uiFrom(next);
      const shown = shownRef.current;
      if (
        shown &&
        shown.phase === 'FACE_SEARCH' &&
        shownUi.phase === 'FACE_SEARCH' &&
        shownUi.prompt.id !== shown.prompt.id &&
        shownUi.prompt.id !== 'faceFound'
      ) {
        const pending = pendingPromptRef.current;
        if (!pending || pending.id !== shownUi.prompt.id) {
          pendingPromptRef.current = { id: shownUi.prompt.id, since: now };
        }
        if (now - (pendingPromptRef.current?.since ?? now) < LIVENESS.PROMPT_SETTLE_MS) {
          shownUi = { ...shownUi, prompt: shown.prompt };
        }
      } else {
        pendingPromptRef.current = null;
      }

      const key = [
        shownUi.phase,
        shownUi.challenge,
        shownUi.prompt.id,
        Math.round(shownUi.progress * 20),
        shownUi.attempt,
        shownUi.failReason ?? '',
      ].join('|');
      if (key !== uiKeyRef.current) {
        uiKeyRef.current = key;
        shownRef.current = shownUi;
        setUi(shownUi);
      }

      // Haptics mark the moments the user can't see while looking at the lens.
      if (prev.phase !== 'CHALLENGE' && next.phase === 'CHALLENGE') haptics.commit();
      if (prev.phase === 'CHALLENGE' && next.phase === 'SETTLE') haptics.select();
      if (prev.phase !== 'PASSED' && next.phase === 'PASSED') {
        haptics.success();
        onPassedRef.current?.();
      }
      if (prev.phase !== 'FAILED' && next.phase === 'FAILED') haptics.error();
    }, LIVENESS.TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const reset = useCallback(() => {
    pitchSmoother.current.reset();
    yawSmoother.current.reset();
    rollSmoother.current.reset();
    latestRef.current = null;
    lastFaceAtRef.current = 0;
    faceCountRef.current = 0;
    eyesRef.current = { min: null, max: null };
  }, []);

  /** Starts a fresh attempt with a newly picked challenge. */
  const begin = useCallback(() => {
    reset();
    stateRef.current = start(stateRef.current, Date.now());
    uiKeyRef.current = '';
    pendingPromptRef.current = null;
    const next = uiFrom(stateRef.current);
    shownRef.current = next;
    setUi(next);
  }, [reset]);

  const detectorOptions = useMemo(
    () => ({
      performanceMode: 'fast' as const,
      // Eye-open probabilities, needed for the blink challenge.
      runClassifications: true,
      cameraFacing: 'front' as const,
      minFaceSize: 0.15,
      outputResolution: 'preview' as const,
      onFacesDetected,
      onError,
    }),
    [onFacesDetected, onError],
  );

  return { ...ui, detectorOptions, begin, reset };
}
