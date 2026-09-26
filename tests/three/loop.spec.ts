import { GLANCE_SECONDS, glanceOver } from "../../src/three/kit/glance.js";
import {
  createLoop,
  FIRE_PERIOD,
  FrameStats,
  fireTime,
  frameGate,
  percentile,
} from "../../src/three/kit/loop.js";
import { flicker, gazeAt } from "../../src/three/pieces/eye.js";

/**
 * When the tower draws (plan #3807 slice 3a). A fake `setAnimationLoop` stands in for the renderer:
 * it holds the callback and a simulated 60 Hz clock calls it, so "three seconds" is 180 chances to
 * draw — and reduced motion must take exactly one of them.
 */
function harness(reduce: boolean, fpsCap: number | null = null, hz = 60) {
  let cb: ((now: number) => void) | null = null;
  let now = 1000;
  const counts = { ticks: 0, stills: 0, resumes: 0 };
  const loop = createLoop({
    reduce,
    fpsCap,
    tick: () => void counts.ticks++,
    still: () => void counts.stills++,
    setAnimationLoop: (next) => {
      cb = next;
    },
    onResume: () => void counts.resumes++,
  });
  // The display's refresh: each frame's timestamp, with a little jitter the way a real vsync has.
  const seconds = (s: number): void => {
    for (let i = 0; i < Math.round(s * hz); i++) {
      now += 1000 / hz + (i % 2 === 0 ? 0.4 : -0.4);
      cb?.(now);
    }
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

describe("the loop under a 30 fps cap (quality=presence, slice 3a-2)", () => {
  it("draws about 30 times over one second of 60 Hz frames", () => {
    const h = harness(false, 30, 60);
    h.loop.start();
    h.seconds(1);
    expect(h.counts.ticks).toBeGreaterThanOrEqual(29);
    expect(h.counts.ticks).toBeLessThanOrEqual(31);
  });

  it("draws about 30 a second on a 120 Hz display too — the cap is time, not every other frame", () => {
    const h = harness(false, 30, 120);
    h.loop.start();
    h.seconds(2);
    expect(h.counts.ticks).toBeGreaterThanOrEqual(58);
    expect(h.counts.ticks).toBeLessThanOrEqual(62);
  });

  it("draws the first frame after a resume at once, never waiting out the old interval", () => {
    const h = harness(false, 30, 60);
    h.loop.start();
    h.seconds(1);
    h.loop.run(false);
    const before = h.counts.ticks;
    h.loop.run(true);
    h.seconds(1 / 60);
    expect(h.counts.ticks).toBe(before + 1);
  });

  it("leaves reduced motion alone: still one frame", () => {
    const h = harness(true, 30, 60);
    h.loop.start();
    h.seconds(3);
    expect(h.draws()).toBe(1);
  });
});

/**
 * `rest=still` (slice 3a-3): the scene's own rule, in miniature — each tick advances scene time and,
 * once the glance has let go (`glanceOver`), settles the loop on the frame it just drew.
 */
function restHarness(fpsCap: number | null = null, hz = 60) {
  let cb: ((now: number) => void) | null = null;
  let now = 1000;
  let t = 0;
  let glance: { at: number; releasedAt?: number } | undefined;
  const counts = { ticks: 0, stills: 0 };
  const loop = createLoop({
    reduce: false,
    restStill: true,
    fpsCap,
    tick: () => {
      counts.ticks++;
      t += 1 / hz;
      if (glance) {
        const r = glance.releasedAt === undefined ? undefined : t - glance.releasedAt;
        if (glanceOver(t - glance.at, r)) glance = undefined;
      }
      if (!glance) loop.settle();
    },
    still: () => void counts.stills++,
    setAnimationLoop: (next) => {
      cb = next;
    },
  });
  const seconds = (s: number): number => {
    const before = counts.ticks;
    for (let i = 0; i < Math.round(s * hz); i++) {
      now += 1000 / hz;
      cb?.(now);
    }
    return counts.ticks - before;
  };
  const look = (): void => {
    glance = { at: t };
    loop.wake();
  };
  const release = (): void => {
    if (glance) glance.releasedAt = t;
  };
  return { loop, counts, seconds, look, release, draws: () => counts.ticks + counts.stills };
}

describe("the loop at rest=still (slice 3a-3)", () => {
  it("draws exactly one frame over three seconds at rest, then the loop is off", () => {
    const h = restHarness();
    h.loop.start();
    h.seconds(3);
    expect(h.draws()).toBe(1);
    expect(h.loop.running).toBe(false);
  });

  it("a glance draws for about the glance's length, then stops on the settled frame", () => {
    const h = restHarness();
    h.loop.start();
    h.look();
    const drawn = h.seconds(5);
    // ~2.55 s of 60 Hz: the attack, the hold, the release, and the one settled frame.
    expect(drawn).toBeGreaterThanOrEqual(Math.floor(GLANCE_SECONDS * 60));
    expect(drawn).toBeLessThanOrEqual(Math.ceil(GLANCE_SECONDS * 60) + 2);
    expect(h.loop.running).toBe(false);
    expect(h.seconds(3)).toBe(0);
  });

  it("a hover let go early stops sooner — the release's own second", () => {
    const h = restHarness();
    h.loop.start();
    h.look();
    h.seconds(0.5);
    h.release();
    const after = h.seconds(3);
    expect(after).toBeGreaterThanOrEqual(55);
    expect(after).toBeLessThanOrEqual(62);
    expect(h.loop.running).toBe(false);
  });

  it("run(false) still pauses a glance mid-flight, and run(true) finishes it", () => {
    const h = restHarness();
    h.loop.start();
    h.look();
    h.seconds(0.5);
    h.loop.run(false);
    expect(h.seconds(2)).toBe(0);
    h.loop.run(true);
    expect(h.seconds(5)).toBeGreaterThan(60);
    expect(h.loop.running).toBe(false);
  });

  it("a glance while hidden waits for the page to show the frame", () => {
    const h = restHarness();
    h.loop.start();
    h.loop.run(false);
    h.look();
    expect(h.seconds(1)).toBe(0);
    h.loop.run(true);
    expect(h.loop.running).toBe(true);
  });

  it("at rest, a resize or a mood draws one more still", () => {
    const h = restHarness();
    h.loop.start();
    h.loop.invalidate();
    expect(h.counts.stills).toBe(2);
  });

  it("reduced motion ignores a wake: still one frame", () => {
    const r = harness(true);
    r.loop.start();
    r.loop.wake();
    r.seconds(1);
    expect(r.draws()).toBe(1);
  });

  it("rest=live ignores wake and settle — today's constant sweep", () => {
    const h = harness(false);
    h.loop.start();
    h.loop.settle();
    h.loop.wake();
    h.seconds(1);
    expect(h.counts.ticks).toBe(60);
  });
});

describe("frameGate", () => {
  it("is due on the first frame and then once per interval, absorbing a little refresh jitter", () => {
    const g = frameGate(30);
    expect(g.due(0)).toBe(true);
    expect(g.due(16.7)).toBe(false);
    expect(g.due(32.6)).toBe(true); // 33.3 − 0.7 ms of jitter still counts
    expect(g.due(49)).toBe(false);
    g.reset();
    expect(g.due(50)).toBe(true);
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
