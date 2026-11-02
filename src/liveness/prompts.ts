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

    case 'NOD':
      return state.nodStage === 'AWAIT_RETURN'
        ? { id: 'nodBack', ...p.nodBack }
        : { id: 'nod', ...p.nod };

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
    case 'NOD':
      return 1;
    case 'PASSED':
      return 2;
    default:
      return 0;
  }
}
