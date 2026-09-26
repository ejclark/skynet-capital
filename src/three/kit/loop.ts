/**
 * THE LOOP — when the tower draws, and what each draw costs (plan #3807 slice 3a). Pure policy, no
 * three.js: the scene hands it a `draw` and the renderer's `setAnimationLoop`, so the rules below
 * are unit-testable without a GPU.
 *
 *   · reduced motion → ONE frame, then the loop is off; a resize or a mood change draws one more
 *     still (the page asked for a picture, not an animation — it used to redraw every frame);
 *   · `run(false)` (the page says the frame is hidden or off-screen) → the loop is off until
 *     `run(true)`; the caller re-anchors its clock on resume so the sweep never jumps;
 *   · every draw is timed (`FrameStats`) — the first frame-time budget this repo has;
 *   · `fpsCap` (the crest's `quality=presence`, slice 3a-2) skips display frames by timestamp, so a
 *     60 Hz display draws ~30 a second and a 120 Hz one the same — the scene's own clock is real
 *     time, so the motion is no slower, only sampled less often.
 */

/** The fire's clock wraps here, on the CPU (docs/art/EYE.md, the real-device addendum): an
 *  unbounded time uniform multiplied into noise goes chaotic on `mediump` mobile GPUs. */
export const FIRE_PERIOD = 300;

/** The time the fire shaders see: `t` folded into [0, FIRE_PERIOD). The sweep and the flicker keep
 *  the unwrapped `t`, so only the fire's noise phase restarts at the wrap. */
export function fireTime(t: number): number {
  const w = t % FIRE_PERIOD;
  return w < 0 ? w + FIRE_PERIOD : w;
}

/** Nearest-rank percentile of `xs` (0..100); 0 for an empty sample. */
export function percentile(xs: readonly number[], p: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));
  return sorted[rank - 1] ?? 0;
}

/** What the harness reads (`window.__towerStats()`): draws so far, CPU submit time, time to ready. */
export interface TowerStats {
  readonly frames: number;
  readonly submitMs: { readonly p50: number; readonly p95: number };
  readonly mountToReadyMs: number | null;
}

/** A rolling record of draw costs — the last `cap` submits, and the count of every draw. */
export class FrameStats {
  frames = 0;
  mountToReadyMs: number | null = null;
  private readonly samples: number[] = [];
  constructor(private readonly cap = 600) {}

  record(ms: number): void {
    this.frames += 1;
    this.samples.push(ms);
    if (this.samples.length > this.cap) this.samples.shift();
  }

  snapshot(): TowerStats {
    const round = (x: number): number => Math.round(x * 1000) / 1000;
    return {
      frames: this.frames,
      submitMs: {
        p50: round(percentile(this.samples, 50)),
        p95: round(percentile(this.samples, 95)),
      },
      mountToReadyMs: this.mountToReadyMs,
    };
  }
}

/** A display frame this close to the cap's interval still counts as due — refresh jitter on a
 *  60 Hz display lands every second frame at 33.3 ± ~1 ms, which must not read as "too soon". */
const CAP_SLACK_MS = 2;

/**
 * The frame gate: `due(now)` says whether the display frame at `now` (ms) should draw under a cap
 * of `fps` draws a second. The first frame is always due; `reset()` makes the next one due too (a
 * resume must not wait out a stale interval).
 */
export function frameGate(fps: number): { due(now: number): boolean; reset(): void } {
  const interval = 1000 / fps;
  let last = Number.NEGATIVE_INFINITY;
  return {
    due(now) {
      if (now - last < interval - CAP_SLACK_MS) return false;
      last = now;
      return true;
    },
    reset() {
      last = Number.NEGATIVE_INFINITY;
    },
  };
}

export interface LoopDeps {
  /** Prefers reduced motion: one still, no loop. */
  readonly reduce: boolean;
  /** One animated tick (advance time, then draw). */
  readonly tick: () => void;
  /** Draw the current state once, without advancing time. */
  readonly still: () => void;
  /** The renderer's `setAnimationLoop` (it hands the callback the frame's timestamp in ms). */
  readonly setAnimationLoop: (cb: ((now: number) => void) | null) => void;
  /** Most draws per second (`quality=presence` → 30); omitted or `null` draws every frame. */
  readonly fpsCap?: number | null;
  /** The frame's timestamp when the animation loop does not pass one (tests pass their own). */
  readonly now?: () => number;
  /** Called when a paused loop resumes, before its first tick — re-anchor the clock here. */
  readonly onResume?: () => void;
}

export interface Loop {
  /** Begin: the animation loop, or under reduced motion the one still. */
  start(): void;
  /** The page's visibility: `false` stops the loop, `true` resumes it (never under reduced motion). */
  run(on: boolean): void;
  /** Something visible changed (a resize, a mood): redraw once if nothing else will. */
  invalidate(): void;
  /** Stop for good (a seek takes over the frame). */
  halt(): void;
  readonly running: boolean;
}

export function createLoop(deps: LoopDeps): Loop {
  let running = false;
  let wanted = true;
  let halted = false;
  const gate = deps.fpsCap ? frameGate(deps.fpsCap) : null;
  const clock = deps.now ?? (() => performance.now());
  const frame = gate
    ? (now?: number): void => {
        if (gate.due(typeof now === "number" ? now : clock())) deps.tick();
      }
    : (): void => deps.tick();
  const stop = (): void => {
    running = false;
    deps.setAnimationLoop(null);
  };
  const go = (): void => {
    running = true;
    gate?.reset();
    deps.setAnimationLoop(frame);
  };
  return {
    start() {
      if (deps.reduce) {
        deps.still();
        stop();
      } else go();
    },
    run(on) {
      wanted = on;
      if (halted || deps.reduce || on === running) return;
      if (on) {
        deps.onResume?.();
        go();
      } else stop();
    },
    invalidate() {
      if (!(running || halted) && (deps.reduce || !wanted)) deps.still();
    },
    halt() {
      halted = true;
      stop();
    },
    get running() {
      return running;
    },
  };
}
