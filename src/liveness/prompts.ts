import { LIVENESS_COPY } from '@/data/copy';
import type { LivenessState } from './types';

export interface Prompt {
  id: string;
  title: string;
  subtitle: string;
}

export function promptFor(state: LivenessState): Prompt {
  const p = LIVENESS_COPY.prompts;

  switch (state.phase) {
    case 'IDLE':
      return { id: 'idle', ...p.idle };

    case 'FACE_SEARCH':
      switch (state.framingIssue) {
        case 'too-far':
          return { id: 'tooFar', ...p.tooFar };
        case 'too-close':
          return { id: 'tooClose', ...p.tooClose };
        case 'not-frontal':
          return { id: 'notFrontal', ...p.notFrontal };
        case 'multiple-faces':
          return { id: 'multipleFaces', ...p.multipleFaces };
        case 'none':
          return { id: 'faceFound', ...p.faceFound };
        default:
          return { id: 'searching', ...p.searching };
      }

    case 'CHALLENGE':
      if (state.challenge === 'BLINK') {
        return state.stage === 'ACTING'
          ? { id: 'blinkOpen', ...p.blinkOpen }
          : { id: 'blink', ...p.blink };
      }
      return state.stage === 'ACTING'
        ? { id: 'nodBack', ...p.nodBack }
        : { id: 'nod', ...p.nod };

    case 'SETTLE':
      return { id: 'settle', ...p.settle };

    case 'PASSED':
      return { id: 'passed', ...p.passed };

    case 'FAILED': {
      const reason = state.failReason ?? 'TIMEOUT_FACE';
      return { id: `fail-${reason}`, ...LIVENESS_COPY.failures[reason] };
    }
  }
}

/** 0: find your face, 1: the challenge, 2: the photo. */
export function stepIndexFor(state: LivenessState): number {
  switch (state.phase) {
    case 'CHALLENGE':
      return 1;
    case 'SETTLE':
    case 'PASSED':
      return 2;
    default:
      return 0;
  }
}
