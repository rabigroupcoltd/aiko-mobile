import { LIVENESS } from '../constants';
import { initialState, start, step, type TickSignals } from '../machine';
import { fuseEyes, median, Smoother } from '../signals';
import type { FaceSnapshot, LivenessState } from '../types';

/**
 * Replays synthetic snapshot sequences through the pure reducer.
 *
 * Building the machine against these tests before touching a camera means the
 * on-device session is spent tuning thresholds, not chasing logic bugs.
 */

const T0 = 1_000_000;

/** A well-framed, frontal face. */
function makeFace(overrides: Partial<FaceSnapshot> = {}): FaceSnapshot {
  const frameW = 1000;
  const frameH = 1000;
  const w = 400; // widthRatio 0.4 — inside [MIN_FACE_RATIO, MAX_FACE_RATIO]
  const h = 500;
  return {
    // centre at (0.5, 0.45), matching the framing targets
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
  eye?: number | null;
  yaw?: number;
  roll?: number;
}

/** Repeat a frame n times. */
const repeat = (n: number, frame: Frame): Frame[] =>
  Array.from({ length: n }, () => frame);

/**
 * Drives the machine while carrying the clock forward across calls.
 *
 * The clock has to be threaded through rather than restarted per call — the FSM
 * compares absolute timestamps, so a driver that reset `now` between phases
 * would push time backwards and stall every duration check.
 */
class Driver {
  state: LivenessState;
  private now = T0;

  constructor(state: LivenessState = initialState(T0)) {
    this.state = state;
  }

  static started(): Driver {
    return new Driver(start(initialState(T0), T0));
  }

  /** Advance through one or more frames. */
  run(frames: Frame[]): LivenessState {
    for (const frame of frames) {
      this.now += frame.dt;
      const snapshot =
        frame.snapshot === undefined ? makeFace({ t: this.now }) : frame.snapshot;

      const signals: TickSignals = {
        eye: frame.eye !== undefined ? frame.eye : snapshot ? 0.9 : null,
        yaw: frame.yaw ?? snapshot?.yaw ?? 0,
        roll: frame.roll ?? snapshot?.roll ?? 0,
      };

      this.state = step(
        this.state,
        {
          now: this.now,
          snapshot,
          faceCount: frame.faceCount ?? (snapshot ? 1 : 0),
          sinceLastFace: snapshot ? 0 : 10_000,
        },
        signals
      );
    }
    return this.state;
  }

  /** Repeat a single frame n times. */
  tick(n: number, frame: Frame): LivenessState {
    return this.run(repeat(n, frame));
  }

  /** Restart after a failure, keeping the clock monotonic. */
  restart(): LivenessState {
    this.now += 1000;
    this.state = start(this.state, this.now);
    return this.state;
  }
}

const TICK = LIVENESS.TICK_MS;

// Enough ticks to satisfy FRAMING_HOLD_MS with margin.
const FRAMING_TICKS = Math.ceil(LIVENESS.FRAMING_HOLD_MS / TICK) + 2;
// Enough ticks to satisfy EYE_OPEN_BASELINE_MS.
const OPEN_TICKS = Math.ceil(LIVENESS.EYE_OPEN_BASELINE_MS / TICK) + 2;
const HOLD_TICKS = Math.ceil(LIVENESS.YAW_HOLD_MS / TICK) + 2;

/** Drive a full successful run: framing -> blink -> turn -> recentre. */
function completeRun(d: Driver): LivenessState {
  d.tick(FRAMING_TICKS, { dt: TICK });
  d.tick(OPEN_TICKS, { dt: TICK, eye: 0.9 });
  d.tick(2, { dt: TICK, eye: 0.05 });
  d.tick(LIVENESS.BLINK_REOPEN_SAMPLES + 1, { dt: TICK, eye: 0.9 });
  d.tick(HOLD_TICKS, { dt: TICK, yaw: LIVENESS.YAW_DELTA_DEG + 10 });
  d.tick(2, { dt: TICK, yaw: 0 });
  return d.state;
}

describe('liveness machine — framing', () => {
  it('advances to BLINK once a well-framed face is held', () => {
    const s = Driver.started().tick(FRAMING_TICKS, { dt: TICK });
    expect(s.phase).toBe('BLINK');
  });

  it('does not advance while the face is too small', () => {
    const small = makeFace({ w: 100 }); // widthRatio 0.1 < MIN_FACE_RATIO
    const s = Driver.started().tick(FRAMING_TICKS, { dt: TICK, snapshot: small });
    expect(s.phase).toBe('FACE_SEARCH');
    expect(s.framingIssue).toBe('too-far');
  });

  it('does not advance while the face is too large', () => {
    const huge = makeFace({ w: 900 }); // widthRatio 0.9 > MAX_FACE_RATIO
    const s = Driver.started().tick(FRAMING_TICKS, { dt: TICK, snapshot: huge });
    expect(s.framingIssue).toBe('too-close');
  });

  it('does not advance while the face is off-centre', () => {
    const offset = makeFace({ x: 0 });
    const s = Driver.started().tick(FRAMING_TICKS, { dt: TICK, snapshot: offset });
    expect(s.phase).toBe('FACE_SEARCH');
    expect(s.framingIssue).toBe('off-centre');
  });

  it('does not accept a baseline from a turned head', () => {
    const turned = makeFace({ yaw: 40 });
    const s = Driver.started().tick(FRAMING_TICKS, {
      dt: TICK,
      snapshot: turned,
      yaw: 40,
    });
    expect(s.phase).toBe('FACE_SEARCH');
    expect(s.framingIssue).toBe('not-frontal');
  });

  it('captures a pose baseline when it advances', () => {
    const s = Driver.started().tick(FRAMING_TICKS, { dt: TICK, yaw: 5, roll: 3 });
    expect(s.phase).toBe('BLINK');
    expect(s.yawBaseline).toBe(5);
    expect(s.rollBaseline).toBe(3);
  });

  it('fails with TIMEOUT_FACE when no face ever appears', () => {
    const ticks = Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 5;
    const s = Driver.started().tick(ticks, { dt: TICK, snapshot: null, faceCount: 0 });
    expect(s.phase).toBe('FAILED');
    expect(s.failReason).toBe('TIMEOUT_FACE');
  });

  it('coaches about a second face instead of failing the attempt', () => {
    const ticks = Math.ceil(LIVENESS.MULTI_FACE_GRACE_MS / TICK) + 3;
    const s = Driver.started().tick(ticks, { dt: TICK, faceCount: 2 });

    // Used to fail with MULTIPLE_FACES. Nothing about the face ends an attempt
    // any more — the user can step out of shot and carry on.
    expect(s.phase).toBe('FACE_SEARCH');
    expect(s.framingIssue).toBe('multiple-faces');
  });

  it('ignores a momentary phantom second face', () => {
    // ML Kit reports a spurious extra face for a frame or two; reacting inside
    // MULTI_FACE_GRACE_MS would keep resetting the framing hold.
    const d = Driver.started();
    d.tick(1, { dt: TICK, faceCount: 2 });
    expect(d.state.framingIssue).not.toBe('multiple-faces');
  });

  it('does not advance while the head is tilted', () => {
    const tilted = makeFace({ roll: LIVENESS.MAX_FRAMING_ROLL_DEG + 10 });
    const s = Driver.started().tick(FRAMING_TICKS, {
      dt: TICK,
      snapshot: tilted,
      roll: LIVENESS.MAX_FRAMING_ROLL_DEG + 10,
    });
    expect(s.phase).toBe('FACE_SEARCH');
    expect(s.framingIssue).toBe('not-frontal');
  });

  it('does not advance while the head is tipped up or down', () => {
    const tipped = makeFace({ pitch: LIVENESS.MAX_FRAMING_PITCH_DEG + 10 });
    const s = Driver.started().tick(FRAMING_TICKS, { dt: TICK, snapshot: tipped });
    expect(s.phase).toBe('FACE_SEARCH');
    expect(s.framingIssue).toBe('not-frontal');
  });

  it('does not advance while a correctly-framed face is still moving', () => {
    // The "truly centred and settled" gate: every frame here is inside the
    // framing tolerances, but the face is travelling faster than
    // CENTER_DRIFT_TOL per tick, so the hold must never accumulate.
    const d = Driver.started();
    const frameW = 1000;
    const w = 400;
    const step = LIVENESS.CENTER_DRIFT_TOL * 2 * frameW;

    for (let i = 0; i < FRAMING_TICKS + 4; i++) {
      // Oscillate either side of dead centre, staying within CENTER_TOL_X.
      const offset = i % 2 === 0 ? step / 2 : -step / 2;
      d.run([
        {
          dt: TICK,
          snapshot: makeFace({ x: frameW * LIVENESS.TARGET_CENTER_X - w / 2 + offset }),
        },
      ]);
    }

    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.progress).toBe(0);
  });

  it('advances once a moving face settles', () => {
    const d = Driver.started();
    const frameW = 1000;
    const w = 400;

    // Moving: no progress.
    d.run([
      { dt: TICK, snapshot: makeFace({ x: 0 }) },
      { dt: TICK, snapshot: makeFace({ x: frameW * 0.3 }) },
    ]);
    expect(d.state.phase).toBe('FACE_SEARCH');

    // Now parked dead centre and steady.
    d.tick(FRAMING_TICKS + 1, {
      dt: TICK,
      snapshot: makeFace({ x: frameW * LIVENESS.TARGET_CENTER_X - w / 2 }),
    });
    expect(d.state.phase).toBe('BLINK');
  });
});

describe('liveness machine — blink', () => {
  /** Drive to BLINK with the eyes-open baseline already established. */
  function atBlinkReady(): Driver {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK });
    expect(d.state.phase).toBe('BLINK');
    d.tick(OPEN_TICKS, { dt: TICK, eye: 0.9 });
    expect(d.state.blinkStage).toBe('AWAIT_CLOSE');
    return d;
  }

  it('accepts a normal blink and advances to HEAD_TURN', () => {
    const d = atBlinkReady();
    // Closed ~200ms — comfortably inside [BLINK_MIN_MS, BLINK_MAX_MS].
    d.tick(2, { dt: TICK, eye: 0.05 });
    d.tick(LIVENESS.BLINK_REOPEN_SAMPLES + 1, { dt: TICK, eye: 0.9 });
    expect(d.state.phase).toBe('HEAD_TURN');
  });

  it('rejects eyes held shut and restarts the sub-machine', () => {
    const d = atBlinkReady();
    const tooLong = Math.ceil(LIVENESS.BLINK_MAX_MS / TICK) + 3;
    d.tick(tooLong, { dt: TICK, eye: 0.05 });

    expect(d.state.phase).toBe('BLINK');
    expect(d.state.blinkStage).toBe('AWAIT_OPEN_BASELINE');
    expect(d.state.blinkRetried).toBe(true);
  });

  it('rejects a closure shorter than BLINK_MIN_MS as sensor noise', () => {
    const d = atBlinkReady();
    // 10ms closed — far below BLINK_MIN_MS, so this is detector noise.
    d.run([{ dt: 10, eye: 0.05 }]);
    d.tick(LIVENESS.BLINK_REOPEN_SAMPLES + 1, { dt: 10, eye: 0.9 });

    expect(d.state.phase).toBe('BLINK');
    expect(d.state.blinkRetried).toBe(true);
  });

  it('treats a dropout (null eye) as no information, not a closure', () => {
    const d = atBlinkReady();
    const before = d.state.blinkStage;
    d.tick(5, { dt: TICK, eye: null });

    expect(d.state.phase).toBe('BLINK');
    expect(d.state.blinkStage).toBe(before);
  });

  it('fails with TIMEOUT_BLINK if the user never blinks', () => {
    const d = atBlinkReady();
    const ticks = Math.ceil(LIVENESS.TIMEOUT_BLINK_MS / TICK) + 5;
    d.tick(ticks, { dt: TICK, eye: 0.9 });

    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_BLINK');
  });
});

describe('liveness machine — head turn', () => {
  function atHeadTurn(): Driver {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK });
    d.tick(OPEN_TICKS, { dt: TICK, eye: 0.9 });
    d.tick(2, { dt: TICK, eye: 0.05 });
    d.tick(LIVENESS.BLINK_REOPEN_SAMPLES + 1, { dt: TICK, eye: 0.9 });
    expect(d.state.phase).toBe('HEAD_TURN');
    return d;
  }

  it('passes on a sustained turn followed by a re-centre', () => {
    const d = atHeadTurn();
    d.tick(HOLD_TICKS, { dt: TICK, yaw: LIVENESS.YAW_DELTA_DEG + 10 });
    expect(d.state.turnStage).toBe('AWAIT_RECENTER');

    d.tick(2, { dt: TICK, yaw: 0 });
    expect(d.state.phase).toBe('PASSED');
  });

  it('accepts a turn in the opposite direction (direction-agnostic default)', () => {
    // Guards the ENFORCE_TURN_DIRECTION=false contract: ML Kit yaw handedness
    // varies by device, so both signs must pass by default.
    expect(LIVENESS.ENFORCE_TURN_DIRECTION).toBe(false);

    const d = atHeadTurn();
    d.tick(HOLD_TICKS, { dt: TICK, yaw: -(LIVENESS.YAW_DELTA_DEG + 10) });
    d.tick(2, { dt: TICK, yaw: 0 });
    expect(d.state.phase).toBe('PASSED');
  });

  it('rejects a head tilt (roll) masquerading as a turn', () => {
    const d = atHeadTurn();
    d.tick(HOLD_TICKS, {
      dt: TICK,
      yaw: LIVENESS.YAW_DELTA_DEG + 10,
      roll: LIVENESS.MAX_ROLL_DELTA_DEG + 15,
    });

    expect(d.state.phase).toBe('HEAD_TURN');
    expect(d.state.turnStage).toBe('AWAIT_TURN');
  });

  it('does not pass on an insufficient turn', () => {
    const d = atHeadTurn();
    d.tick(HOLD_TICKS, { dt: TICK, yaw: LIVENESS.YAW_DELTA_DEG - 5 });
    expect(d.state.phase).toBe('HEAD_TURN');
    expect(d.state.turnStage).toBe('AWAIT_TURN');
  });

  it('does not pass until the head returns to centre', () => {
    const d = atHeadTurn();
    d.tick(HOLD_TICKS, { dt: TICK, yaw: LIVENESS.YAW_DELTA_DEG + 10 });
    expect(d.state.turnStage).toBe('AWAIT_RECENTER');

    // Still turned away — must not pass yet.
    d.tick(3, { dt: TICK, yaw: LIVENESS.YAW_DELTA_DEG + 10 });
    expect(d.state.phase).toBe('HEAD_TURN');
  });

  it('fails with TIMEOUT_TURN if the head never turns', () => {
    const d = atHeadTurn();
    const ticks = Math.ceil(LIVENESS.TIMEOUT_HEAD_TURN_MS / TICK) + 5;
    d.tick(ticks, { dt: TICK, yaw: 0 });

    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_TURN');
  });
});

describe('liveness machine — a static photo cannot pass', () => {
  it('never advances past the blink check when the eyes never close', () => {
    // The core anti-spoof guarantee: a printed photo held up to the camera
    // frames correctly but produces a constant eye probability and no yaw
    // excursion, so it must time out rather than pass.
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK });
    expect(d.state.phase).toBe('BLINK');

    const ticks = Math.ceil(LIVENESS.TIMEOUT_BLINK_MS / TICK) + 5;
    d.tick(ticks, { dt: TICK, eye: 0.92, yaw: 0, roll: 0 });

    expect(d.state.phase).toBe('FAILED');
    expect(d.state.failReason).toBe('TIMEOUT_BLINK');
  });
});

describe('liveness machine — face loss and retries', () => {
  it('regresses to FACE_SEARCH and clears baselines when the face is lost', () => {
    const d = Driver.started();
    d.tick(FRAMING_TICKS, { dt: TICK });
    expect(d.state.phase).toBe('BLINK');

    d.tick(3, { dt: TICK, snapshot: null, faceCount: 0 });

    expect(d.state.phase).toBe('FACE_SEARCH');
    expect(d.state.yawBaseline).toBeNull();
  });

  it('increments the attempt counter on retry after a failure', () => {
    const ticks = Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 5;
    const d = Driver.started();
    d.tick(ticks, { dt: TICK, snapshot: null, faceCount: 0 });

    expect(d.state.phase).toBe('FAILED');
    expect(d.state.attempt).toBe(1);

    const retried = d.restart();
    expect(retried.attempt).toBe(2);
    expect(retried.phase).toBe('FACE_SEARCH');
  });

  it('can still pass on a retry after an earlier failure', () => {
    const ticks = Math.ceil(LIVENESS.TIMEOUT_FACE_SEARCH_MS / TICK) + 5;
    const d = Driver.started();
    d.tick(ticks, { dt: TICK, snapshot: null, faceCount: 0 });
    d.restart();

    completeRun(d);

    expect(d.state.phase).toBe('PASSED');
    expect(d.state.attempt).toBe(2);
  });

  it('treats PASSED and FAILED as terminal', () => {
    const d = new Driver({ ...initialState(T0), phase: 'PASSED' });
    d.tick(10, { dt: TICK });
    expect(d.state.phase).toBe('PASSED');
  });
});

describe('signal conditioning', () => {
  it('fuses eyes with min, not average', () => {
    // A wink must not read as "half open" — min keeps closure crisp.
    const face = makeFace({ leftEye: 0.9, rightEye: 0.1 });
    expect(fuseEyes(face)).toBeCloseTo(0.1);
  });

  it('returns null when neither eye reports', () => {
    expect(fuseEyes(makeFace({ leftEye: null, rightEye: null }))).toBeNull();
  });

  it('falls back to whichever eye is available', () => {
    expect(fuseEyes(makeFace({ leftEye: null, rightEye: 0.4 }))).toBeCloseTo(0.4);
  });

  it('median rejects a single-frame outlier', () => {
    expect(median([0.9, 0.02, 0.9])).toBeCloseTo(0.9);
  });

  it('smoother preserves a real blink dip below EYE_LOW', () => {
    // The key tuning guarantee: over-smoothing would flatten this dip above
    // EYE_LOW and make the blink check impossible to pass.
    const smoother = new Smoother();
    [0.9, 0.9, 0.9, 0.9].forEach((v) => smoother.push(v));

    let lowest = 1;
    [0.05, 0.02, 0.02, 0.05].forEach((v) => {
      const out = smoother.push(v);
      if (out != null) lowest = Math.min(lowest, out);
    });

    expect(lowest).toBeLessThanOrEqual(LIVENESS.EYE_LOW);
  });

  it('smoother ignores nulls rather than treating them as zero', () => {
    const smoother = new Smoother();
    smoother.push(0.9);
    smoother.push(0.9);
    const before = smoother.value;
    smoother.push(null);
    expect(smoother.value).toBe(before);
  });
});
