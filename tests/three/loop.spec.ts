import {
  createLoop,
  FIRE_PERIOD,
  FrameStats,
  fireTime,
  percentile,
} from "../../src/three/kit/loop.js";
import { flicker, gazeAt } from "../../src/three/pieces/eye.js";

/**
 * When the tower draws (plan #3807 slice 3a). A fake `setAnimationLoop` stands in for the renderer:
 * it holds the callback and a simulated 60 Hz clock calls it, so "three seconds" is 180 chances to
 * draw — and reduced motion must take exactly one of them.
 */
function harness(reduce: boolean) {
  let cb: (() => void) | null = null;
  const counts = { ticks: 0, stills: 0, resumes: 0 };
  const loop = createLoop({
    reduce,
    tick: () => void counts.ticks++,
    still: () => void counts.stills++,
    setAnimationLoop: (next) => {
      cb = next;
    },
    onResume: () => void counts.resumes++,
  });
  const seconds = (s: number): void => {
    for (let i = 0; i < Math.round(s * 60); i++) cb?.();
  };
  return { loop, counts, seconds, draws: () => counts.ticks + counts.stills };
}

describe("the loop under reduced motion", () => {
  it("draws exactly one frame in the first three seconds, then the loop is off", () => {
    const h = harness(true);
    h.loop.start();
    h.seconds(3);
    expect(h.draws()).toBe(1);
    expect(h.loop.running).toBe(false);
  });

  it("draws one more still on a resize or a mood change, and nothing else", () => {
    const h = harness(true);
    h.loop.start();
    h.loop.invalidate();
    h.seconds(3);
    expect(h.draws()).toBe(2);
  });

  it("never resumes the animation, even when the page says the frame is seen", () => {
    const h = harness(true);
    h.loop.start();
    h.loop.run(true);
    h.seconds(1);
    expect(h.counts.ticks).toBe(0);
  });
});

describe("the loop in motion", () => {
  it("ticks every frame while running", () => {
    const h = harness(false);
    h.loop.start();
    h.seconds(1);
    expect(h.counts.ticks).toBe(60);
  });

  it("stops on run(false) and resumes on run(true), re-anchoring the clock once", () => {
    const h = harness(false);
    h.loop.start();
    h.loop.run(false);
    h.seconds(2);
    expect(h.counts.ticks).toBe(0);
    h.loop.run(true);
    h.loop.run(true);
    h.seconds(1);
    expect(h.counts.resumes).toBe(1);
    expect(h.counts.ticks).toBe(60);
  });

  it("while paused, a mood change draws one still so the new light shows", () => {
    const h = harness(false);
    h.loop.start();
    h.loop.run(false);
    h.loop.invalidate();
    expect(h.counts.stills).toBe(1);
  });

  it("a running loop ignores invalidate — the next tick draws it anyway", () => {
    const h = harness(false);
    h.loop.start();
    h.loop.invalidate();
    expect(h.counts.stills).toBe(0);
  });

  it("halt (a seek) wins over any later run(true)", () => {
    const h = harness(false);
    h.loop.start();
    h.loop.halt();
    h.loop.run(true);
    h.seconds(1);
    expect(h.counts.ticks).toBe(0);
  });
});

describe("the fire clock's wrap", () => {
  it("folds time into [0, 300) for the shaders", () => {
    expect(FIRE_PERIOD).toBe(300);
    expect(fireTime(299.9)).toBeCloseTo(299.9);
    expect(fireTime(300.1)).toBeCloseTo(0.1);
    expect(fireTime(50_000)).toBeCloseTo(50_000 % 300);
    expect(fireTime(-1)).toBeCloseTo(299);
  });

  it("keeps the sweep and the flicker continuous across the wrap (they read the unwrapped time)", () => {
    const a = gazeAt(299.9);
    const b = gazeAt(300.1);
    expect(Math.abs(a.yaw - b.yaw)).toBeLessThan(0.05);
    expect(Math.abs(a.pitch - b.pitch)).toBeLessThan(0.01);
    // The flicker's fastest term is 23.1 rad/s: 0.2 s is a bounded step, never a restart.
    expect(Math.abs(flicker(299.9) - flicker(300.1))).toBeLessThan(2 * 0.2 * 23.1);
    expect(gazeAt(300.1)).not.toEqual(gazeAt(0.1));
  });
});

describe("the frame-time record", () => {
  it("counts every draw and reports nearest-rank percentiles", () => {
    const s = new FrameStats();
    for (const ms of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) s.record(ms);
    expect(s.snapshot()).toEqual({
      frames: 10,
      submitMs: { p50: 5, p95: 10 },
      mountToReadyMs: null,
    });
  });

  it("keeps a rolling window but never forgets the count", () => {
    const s = new FrameStats(3);
    for (const ms of [100, 1, 1, 1]) s.record(ms);
    expect(s.snapshot().frames).toBe(4);
    expect(s.snapshot().submitMs.p95).toBe(1);
  });

  it("reads an empty sample as zero", () => {
    expect(percentile([], 95)).toBe(0);
  });
});
