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
        case 'off-centre':
          return { id: 'offCentre', ...p.offCentre };
        case 'not-frontal':
          return { id: 'notFrontal', ...p.notFrontal };
        case 'multiple-faces':
          return { id: 'multipleFaces', ...p.multipleFaces };
        case 'none':
          return { id: 'holdStill', ...p.holdStill };
        default:
          return { id: 'searching', ...p.searching };
      }

    case 'BLINK':
      return state.blinkRetried
        ? { id: 'blinkAgain', ...p.blinkAgain }
        : { id: 'blink', ...p.blink };

    case 'HEAD_TURN':
      return state.turnStage === 'AWAIT_RECENTER'
        ? { id: 'headTurnBack', ...p.headTurnBack }
        : { id: 'headTurn', ...p.headTurn };

    case 'PASSED':
      return { id: 'passed', ...p.passed };

    case 'FAILED': {
      const reason = state.failReason ?? 'TIMEOUT_FACE';
      const copy = LIVENESS_COPY.failures[reason];
      return { id: `fail-${reason}`, ...copy };
    }
  }
}

export function stepIndexFor(state: LivenessState): number {
  switch (state.phase) {
    case 'FACE_SEARCH':
      return 0;
    case 'BLINK':
      return 1;
    case 'HEAD_TURN':
      return 2;
    case 'PASSED':
      return 3;
    default:
      return 0;
  }
}
