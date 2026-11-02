import { LIVENESS } from '../constants';
import { initialState, start, step, type TickSignals } from '../machine';
import { fuseEyes, median } from '../signals';
import type { FaceSnapshot, LivenessState } from '../types';

const T0 = 1_000_000;

function makeFace(overrides: Partial<FaceSnapshot> = {}): FaceSnapshot {
  const frameW = 1000;
  const frameH = 1000;
  const w = 400;
  const h = 500;
  return {
    x: frameW * LIVENESS.TARGET_CENTER_X - w / 2,
    y: frameH * LIVENESS.TARGET_CENTER_Y - h / 2,
    w,
    h,
    frameW,
    frameH,
    yaw: 0,
    roll: 0,
    pitch: 0,
    leftEye: 0.9,
    rightEye: 0.9,
    t: T0,
    ...overrides,
  };
}

interface Frame {
  dt: number;
  snapshot?: FaceSnapshot | null;
  faceCount?: number;
  yaw?: number;
  roll?: number;
  pitch?: number;
}

const repeat = (n: number, frame: Frame): Frame[] => Array.from({ length: n }, () => frame);

class Driver {
  state: LivenessState;
  private now = T0;

  constructor(state: LivenessState = initialState(T0)) {
    this.state = state;
  }

  static started(): Driver {
    return new Driver(start(initialState(T0), T0));
  }

  run(frames: Frame[]): LivenessState {
    for (const frame of frames) {
      this.now += frame.dt;
      const snapshot = frame.snapshot === undefined ? makeFace({ t: this.now }) : frame.snapshot;

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
          sinceLastFace: snapshot ? 0 : 10_000,
        },
        signals,
      );
    }
    return this.state;
  }

  tick(n: number, frame: Frame): LivenessState {
    return this.run(repeat(n, frame));
  }

  restart(): LivenessState {
    this.now += 1000;
    this.state = start(this.state, this.now);
    return this.state;
  }
}

const TICK = LIVENESS.TICK_MS;
const FRAMING_TICKS = Math.ceil(LIVENESS.FRAMING_HOLD_MS / TICK) + 2;
const NOD_TICKS = Math.ceil(LIVENESS.NOD_HOLD_MS / TICK) + 2;

function frame(d: Driver): LivenessState {
  return d.tick(FRAMING_TICKS, { dt: TICK });
}

function nod(d: Driver, pitch = LIVENESS.NOD_DELTA_DEG + 6): LivenessState {
  d.tick(NOD_TICKS, { dt: TICK, pitch });
  return d.tick(2, { dt: TICK, pitch: 0 });
}

describe('liveness machine — framing', () => {
  it('advances to NOD once a well-framed face is held', () => {
    expect(frame(Driver.started()).phase).toBe('NOD');
  });

  it('does not advance while the face is too small', () => {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK, snapshot: makeFace({ w: 150 }) });
    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.framingIssue).toBe('too-far');
  });

  it('does not advance while the face is too large', () => {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK, snapshot: makeFace({ w: 800, x: 100 }) });
    expect(d.state.framingIssue).toBe('too-close');
  });

  it('does not advance while the face is off-centre', () => {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK, snapshot: makeFace({ x: 0 }) });
    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.framingIssue).toBe('off-centre');
  });

  it('does not accept a baseline from a turned, tilted or tipped head', () => {
    for (const pose of [{ yaw: 30 }, { roll: 25 }, { pitch: 25 }]) {
      const d = Driver.started();
      d.tick(FRAMING_TICKS, { dt: TICK, ...pose });
      expect(d.state.phase).toBe('FACE_SEARCH');
      expect(d.state.framingIssue).toBe('not-frontal');
    }
  });

  it('captures a pitch baseline when it advances', () => {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK, pitch: 4 });
    expect(d.state.phase).toBe('NOD');
    expect(d.state.pitchBaseline).toBe(4);
  });

  it('fails with TIMEOUT_FACE when no face ever appears', () => {
    const d = Driver.started();
    d.tick(Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 2, { dt: TICK, snapshot: null });
    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_FACE');
  });

  it('coaches about a second face instead of failing the attempt', () => {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK, faceCount: 2 });
    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.framingIssue).toBe('multiple-faces');
  });

  it('does not advance while a correctly-framed face is still moving', () => {
    const d = Driver.started();
    const frames: Frame[] = Array.from({ length: FRAMING_TICKS }, (_, i) => ({
      dt: TICK,
      snapshot: makeFace({ x: 300 + (i % 2) * 60 }),
    }));
    d.run(frames);
    expect(d.state.phase).toBe('FACE_SEARCH');
  });
});

describe('liveness machine — nod', () => {
  it('passes on a nod followed by a return to centre', () => {
    const d = Driver.started();
    frame(d);
    expect(nod(d).phase).toBe('PASSED');
  });

  it('accepts a nod in either direction', () => {
    const d = Driver.started();
    frame(d);
    expect(nod(d, -(LIVENESS.NOD_DELTA_DEG + 6)).phase).toBe('PASSED');
  });

  it('does not pass on a nod that is too small', () => {
    const d = Driver.started();
    frame(d);
    d.tick(NOD_TICKS, { dt: TICK, pitch: LIVENESS.NOD_DELTA_DEG / 2 });
    d.tick(2, { dt: TICK, pitch: 0 });
    expect(d.state.phase).toBe('NOD');
    expect(d.state.nodStage).toBe('AWAIT_NOD');
  });

  it('does not count a head turn as a nod', () => {
    const d = Driver.started();
    frame(d);
    d.tick(NOD_TICKS, { dt: TICK, pitch: LIVENESS.NOD_DELTA_DEG + 6, yaw: LIVENESS.NOD_MAX_YAW_DEG + 10 });
    expect(d.state.nodStage).toBe('AWAIT_NOD');
  });

  it('does not pass until the head comes back up', () => {
    const d = Driver.started();
    frame(d);
    d.tick(NOD_TICKS + 5, { dt: TICK, pitch: LIVENESS.NOD_DELTA_DEG + 6 });
    expect(d.state.phase).toBe('NOD');
    expect(d.state.nodStage).toBe('AWAIT_RETURN');
  });

  it('fails with TIMEOUT_NOD if the head never nods', () => {
    const d = Driver.started();
    frame(d);
    d.tick(Math.ceil(LIVENESS.TIMEOUT_NOD_MS / TICK) + 2, { dt: TICK });
    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_NOD');
  });
});

describe('liveness machine — a static photo cannot pass', () => {
  it('stays in NOD forever when the head never moves', () => {
    const d = Driver.started();
    frame(d);
    d.tick(Math.ceil(LIVENESS.TIMEOUT_NOD_MS / TICK) - 5, { dt: TICK });
    expect(d.state.phase).toBe('NOD');
  });
});

describe('liveness machine — face loss and retries', () => {
  it('regresses to FACE_SEARCH and clears the baseline when the face is lost', () => {
    const d = Driver.started();
    frame(d);
    d.tick(1, { dt: TICK, snapshot: null });
    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.pitchBaseline).toBeNull();
  });

  it('increments the attempt counter on retry after a failure', () => {
    const d = Driver.started();
    d.tick(Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 2, { dt: TICK, snapshot: null });
    expect(d.restart().attempt).toBe(2);
  });

  it('can still pass on a retry after an earlier failure', () => {
    const d = Driver.started();
    d.tick(Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 2, { dt: TICK, snapshot: null });
    d.restart();
    frame(d);
    expect(nod(d).phase).toBe('PASSED');
  });

  it('treats PASSED and FAILED as terminal', () => {
    const d = Driver.started();
    frame(d);
    nod(d);
    d.tick(5, { dt: TICK, snapshot: null });
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
