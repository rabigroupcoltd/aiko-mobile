import { LIVENESS } from '../constants';
import { faceSize, initialState, pickChallenge, start, step, type TickSignals } from '../machine';
import { fuseEyes, median } from '../signals';
import type { ChallengeKind, EyeWindow, FaceSnapshot, LivenessState } from '../types';

const T0 = 1_000_000;
const TICK = LIVENESS.TICK_MS;
const OPEN: EyeWindow = { min: 0.95, max: 0.95 };
const SHUT: EyeWindow = { min: 0.05, max: 0.05 };

function makeFace(overrides: Partial<FaceSnapshot> = {}): FaceSnapshot {
  return {
    x: 300,
    y: 300,
    w: 300,
    h: 380,
    frameW: 720,
    frameH: 1280,
    yaw: 0,
    roll: 0,
    pitch: 0,
    leftEye: 0.95,
    rightEye: 0.95,
    t: T0,
    ...overrides,
  };
}

interface Frame {
  snapshot?: FaceSnapshot | null;
  faceCount?: number;
  yaw?: number;
  roll?: number;
  pitch?: number;
  eyes?: EyeWindow;
}

class Driver {
  state: LivenessState;
  now = T0;
  private lastFaceAt = T0;

  constructor(challenge: ChallengeKind) {
    this.state = start(initialState(T0), T0, challenge);
  }

  tick(n: number, frame: Frame = {}): LivenessState {
    for (let i = 0; i < n; i += 1) {
      this.now += TICK;
      const snapshot = frame.snapshot === undefined ? makeFace({ t: this.now }) : frame.snapshot;
      if (snapshot) this.lastFaceAt = this.now;

      const signals: TickSignals = {
        yaw: frame.yaw ?? snapshot?.yaw ?? 0,
        roll: frame.roll ?? snapshot?.roll ?? 0,
        pitch: frame.pitch ?? snapshot?.pitch ?? 0,
      };

      this.state = step(
        this.state,
        {
          now: this.now,
          snapshot,
          faceCount: frame.faceCount ?? (snapshot ? 1 : 0),
          sinceLastFace: this.now - this.lastFaceAt,
          eyes: frame.eyes ?? (snapshot ? OPEN : { min: null, max: null }),
        },
        signals,
      );
    }
    return this.state;
  }

  restart(challenge: ChallengeKind): LivenessState {
    this.state = start(this.state, this.now, challenge);
    this.lastFaceAt = this.now;
    return this.state;
  }
}

const FRAMING_TICKS = Math.ceil(LIVENESS.FRAMING_HOLD_MS / TICK) + 1;
const SETTLE_TICKS = Math.ceil(LIVENESS.SETTLE_HOLD_MS / TICK) + 2;

function toChallenge(d: Driver) {
  d.tick(FRAMING_TICKS);
  expect(d.state.phase).toBe('CHALLENGE');
}

function blink(d: Driver) {
  d.tick(2, { eyes: OPEN });
  d.tick(2, { eyes: SHUT });
  d.tick(1, { eyes: OPEN });
}

function nod(d: Driver, depth = LIVENESS.NOD_DELTA_DEG + 5) {
  d.tick(3, { pitch: depth });
  d.tick(2, { pitch: 0 });
}

describe('pickChallenge', () => {
  it('picks blink or nod from the random source', () => {
    expect(pickChallenge(() => 0.1)).toBe('BLINK');
    expect(pickChallenge(() => 0.9)).toBe('NOD');
  });
});

describe('finding a face — forgiving, full screen', () => {
  it('starts the challenge once any usable face stays in view briefly', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
  });

  it('does not care where in the picture the face is', () => {
    const d = new Driver('BLINK');
    d.tick(FRAMING_TICKS, { snapshot: makeFace({ x: 0, y: 900 }) });
    expect(d.state.phase).toBe('CHALLENGE');
  });

  it('tolerates the face moving around while it is found', () => {
    const d = new Driver('NOD');
    for (let i = 0; i < FRAMING_TICKS; i += 1) d.tick(1, { snapshot: makeFace({ x: 100 + (i % 2) * 200 }) });
    expect(d.state.phase).toBe('CHALLENGE');
  });

  it('measures face size against the shorter frame side, whatever the rotation', () => {
    expect(faceSize(makeFace({ w: 360, frameW: 720, frameH: 1280 }))).toBeCloseTo(0.5);
    expect(faceSize(makeFace({ w: 360, frameW: 1280, frameH: 720 }))).toBeCloseTo(0.5);
  });

  it('asks a tiny face to come closer', () => {
    const d = new Driver('BLINK');
    d.tick(FRAMING_TICKS, { snapshot: makeFace({ w: 60 }) });
    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.framingIssue).toBe('too-far');
  });

  it('asks a turned-away face to look at the camera', () => {
    const d = new Driver('BLINK');
    d.tick(FRAMING_TICKS, { yaw: LIVENESS.MAX_FRAMING_YAW_DEG + 10 });
    expect(d.state.framingIssue).toBe('not-frontal');
  });

  it('accepts a slightly turned head', () => {
    const d = new Driver('BLINK');
    d.tick(FRAMING_TICKS, { yaw: 15, pitch: 12, roll: 10 });
    expect(d.state.phase).toBe('CHALLENGE');
  });

  it('coaches about a second face', () => {
    const d = new Driver('BLINK');
    d.tick(FRAMING_TICKS + 8, { faceCount: 2 });
    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.framingIssue).toBe('multiple-faces');
  });

  it('fails with TIMEOUT_FACE when no face ever appears', () => {
    const d = new Driver('BLINK');
    d.tick(Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 2, { snapshot: null });
    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_FACE');
  });
});

describe('blink challenge', () => {
  it('passes on open → closed → open, then settles and passes', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
    blink(d);
    expect(d.state.phase).toBe('SETTLE');
    d.tick(SETTLE_TICKS);
    expect(d.state.phase).toBe('PASSED');
  });

  it('catches a blink shorter than one tick', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
    d.tick(2, { eyes: OPEN });
    d.tick(1, { eyes: { min: 0.05, max: 0.95 } });
    expect(d.state.phase).toBe('SETTLE');
  });

  it('does not pass on eyes that were never seen open (a closed-eye photo)', () => {
    const d = new Driver('BLINK');
    d.tick(FRAMING_TICKS, { eyes: SHUT });
    d.tick(10, { eyes: SHUT });
    expect(d.state.phase).toBe('CHALLENGE');
  });

  it('does not pass while the eyes stay open (a printed photo)', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
    d.tick(50, { eyes: OPEN });
    expect(d.state.phase).toBe('CHALLENGE');
  });

  it('switches to a nod when the device reports no eye data', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
    d.tick(Math.ceil(LIVENESS.NO_EYE_DATA_FALLBACK_MS / TICK) + 1, { eyes: { min: null, max: null } });
    expect(d.state.phase).toBe('CHALLENGE');
    expect(d.state.challenge).toBe('NOD');
    nod(d);
    expect(d.state.phase).toBe('SETTLE');
  });

  it('fails with TIMEOUT_CHALLENGE if there is never a blink', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
    d.tick(Math.ceil(LIVENESS.TIMEOUT_CHALLENGE_MS / TICK) + 2, { eyes: OPEN });
    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_CHALLENGE');
  });
});

describe('nod challenge', () => {
  it('passes on a nod and return', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    nod(d);
    expect(d.state.phase).toBe('SETTLE');
  });

  it('accepts a nod in either direction', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    nod(d, -(LIVENESS.NOD_DELTA_DEG + 5));
    expect(d.state.phase).toBe('SETTLE');
  });

  it('counts a partial return from a deep nod', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    d.tick(3, { pitch: 30 });
    d.tick(1, { pitch: 14 });
    expect(d.state.phase).toBe('SETTLE');
  });

  it('ignores a nod that is too small', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    nod(d, LIVENESS.NOD_DELTA_DEG / 2);
    expect(d.state.phase).toBe('CHALLENGE');
    expect(d.state.stage).toBe('READY');
  });

  it('does not count a head turn as a nod', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    d.tick(3, { pitch: LIVENESS.NOD_DELTA_DEG + 5, yaw: LIVENESS.NOD_MAX_YAW_DEG + 10 });
    expect(d.state.stage).toBe('READY');
  });
});

describe('settle — taking a good photo', () => {
  it('waits for eyes open and a front-on face', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    nod(d);
    d.tick(SETTLE_TICKS, { yaw: 30 });
    expect(d.state.phase).toBe('SETTLE');
    d.tick(SETTLE_TICKS);
    expect(d.state.phase).toBe('PASSED');
  });

  it('never blocks: passes after the settle limit regardless', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    nod(d);
    d.tick(Math.ceil(LIVENESS.SETTLE_MAX_MS / TICK) + 1, { yaw: 30, eyes: SHUT });
    expect(d.state.phase).toBe('PASSED');
  });
});

describe('face loss and retries', () => {
  it('rides out a brief face loss mid-challenge', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    d.tick(Math.floor(LIVENESS.FACE_LOST_MS / TICK) - 2, { snapshot: null });
    expect(d.state.phase).toBe('CHALLENGE');
  });

  it('goes back to finding the face after a long loss, without failing', () => {
    const d = new Driver('NOD');
    toChallenge(d);
    d.tick(Math.ceil(LIVENESS.FACE_LOST_MS / TICK) + 2, { snapshot: null });
    expect(d.state.phase).toBe('FACE_SEARCH');
    toChallenge(d);
    nod(d);
    d.tick(SETTLE_TICKS);
    expect(d.state.phase).toBe('PASSED');
  });

  it('restarts with a new challenge and counts the attempt after a failure', () => {
    const d = new Driver('BLINK');
    d.tick(Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 2, { snapshot: null });
    const next = d.restart('NOD');
    expect(next.attempt).toBe(2);
    expect(next.challenge).toBe('NOD');
    expect(next.phase).toBe('FACE_SEARCH');
  });

  it('treats PASSED as terminal', () => {
    const d = new Driver('BLINK');
    toChallenge(d);
    blink(d);
    d.tick(SETTLE_TICKS);
    d.tick(30, { snapshot: null });
    expect(d.state.phase).toBe('PASSED');
  });
});

describe('signal conditioning', () => {
  it('fuses eyes with min, not average', () => {
    expect(fuseEyes(makeFace({ leftEye: 0.9, rightEye: 0.1 }))).toBeCloseTo(0.1);
  });

  it('returns null when neither eye reports', () => {
    expect(fuseEyes(makeFace({ leftEye: null, rightEye: null }))).toBeNull();
  });

  it('median rejects a single-frame outlier', () => {
    expect(median([1, 1, 50])).toBe(1);
  });
});
