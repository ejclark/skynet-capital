import {
  createFlare,
  FLARE,
  FLARE_PEAK,
  FLARE_SECONDS,
  flareGain,
  flareWeight,
} from "../../src/three/kit/flare.js";
import { createLoop } from "../../src/three/kit/loop.js";

/**
 * The flare (plan #3807 slice 3b-3): on a new high the Eye's light rises ONCE and settles back.
 * One pulse, bounded, over in about two seconds; a second flare mid-flare restarts nothing; under
 * reduced motion the one still frame stays.
 */
describe("flareWeight — one rise, one fall", () => {
  const samples = Array.from({ length: 3001 }, (_, i) => flareWeight(i / 1000 - 0.5));

  it("starts at 0 and is 0 again once it is over", () => {
    expect(flareWeight(-0.1)).toBe(0);
    expect(flareWeight(0)).toBe(0);
    expect(flareWeight(FLARE_SECONDS)).toBe(0);
    expect(flareWeight(FLARE_SECONDS + 1)).toBe(0);
  });

  it("stays within 0..1 and reaches 1 through the hold", () => {
    expect(Math.min(...samples)).toBe(0);
    expect(Math.max(...samples)).toBe(1);
    expect(flareWeight(FLARE.attack + FLARE.hold / 2)).toBe(1);
  });

  it("peaks once — never falls and rises again (WCAG 2.3.1: one pulse, not a flash)", () => {
    const turns = samples.slice(1).filter((w, i) => {
      const prev = samples[i] ?? 0;
      const next = samples[i + 2];
      return next !== undefined && w < prev && next > w;
    });
    expect(turns).toEqual([]);
    const firstFall = samples.findIndex((w, i) => i > 0 && w < (samples[i - 1] ?? 0));
    expect(samples.slice(firstFall).every((w, i, a) => i === 0 || w <= (a[i - 1] ?? 0))).toBe(true);
  });

  it("is over in under two and a half seconds — shorter than a glance", () => {
    expect(FLARE_SECONDS).toBeLessThan(2.5);
  });
});

describe("flareGain — a bounded multiple of the resting light", () => {
  it("is 1 at rest and 1 + the peak at full, never past it", () => {
    expect(flareGain(0, "glow")).toBe(1);
    expect(flareGain(1, "glow")).toBeCloseTo(1 + FLARE_PEAK.glow);
    expect(flareGain(7, "embers")).toBeCloseTo(1 + FLARE_PEAK.embers);
    expect(flareGain(-1, "reach")).toBe(1);
  });

  it("never more than doubles any light", () => {
    for (const peak of Object.values(FLARE_PEAK)) expect(peak).toBeLessThan(1);
  });
});

describe("createFlare — one slot", () => {
  it("plays from the moment it starts, then stops", () => {
    const f = createFlare(false);
    expect(f.playing(10)).toBe(false);
    expect(f.start(10)).toBe(true);
    expect(f.playing(10)).toBe(true);
    expect(f.weight(10 + FLARE.attack + 0.1)).toBe(1);
    expect(f.playing(10 + FLARE_SECONDS)).toBe(false);
    expect(f.weight(10 + FLARE_SECONDS)).toBe(0);
  });

  it("a flare arriving mid-flare restarts nothing", () => {
    const f = createFlare(false);
    f.start(10);
    expect(f.start(11)).toBe(false);
    expect(f.playing(10 + FLARE_SECONDS)).toBe(false);
    expect(f.start(10 + FLARE_SECONDS)).toBe(true);
  });

  it("under reduced motion never starts", () => {
    const f = createFlare(true);
    expect(f.start(10)).toBe(false);
    expect(f.weight(10.5)).toBe(0);
  });
});

/**
 * The scene's own wiring in miniature: `if (flare.start(t)) loop.wake()`, and at `rest=still` the
 * tick settles once no glance and no flare is left (`scene-main.ts`).
 */
function sceneHarness(reduce: boolean, restStill: boolean) {
  let cb: ((now: number) => void) | null = null;
  let t = 4;
  const flare = createFlare(reduce);
  const counts = { ticks: 0, stills: 0 };
  const loop = createLoop({
    reduce,
    restStill,
    tick: () => {
      counts.ticks++;
      t += 1 / 60;
      if (restStill && !flare.playing(t)) loop.settle();
    },
    still: () => void counts.stills++,
    setAnimationLoop: (next) => {
      cb = next;
    },
  });
  const seconds = (s: number): number => {
    const before = counts.ticks;
    for (let i = 0; i < Math.round(s * 60); i++) cb?.(i);
    return counts.ticks - before;
  };
  const post = (): void => {
    if (flare.start(t)) loop.wake();
  };
  return { loop, counts, seconds, post, draws: () => counts.ticks + counts.stills };
}

describe("the flare and the loop", () => {
  it("reduced motion: a flare draws nothing — still exactly one frame", () => {
    const h = sceneHarness(true, false);
    h.loop.start();
    h.post();
    h.seconds(3);
    expect(h.draws()).toBe(1);
    expect(h.loop.running).toBe(false);
  });

  it("rest=still: the loop runs for the flare's length, then stops on the settled frame", () => {
    const h = sceneHarness(false, true);
    h.loop.start();
    expect(h.draws()).toBe(1);
    h.post();
    const drawn = h.seconds(5);
    expect(drawn).toBeGreaterThanOrEqual(Math.floor(FLARE_SECONDS * 60));
    expect(drawn).toBeLessThanOrEqual(Math.ceil(FLARE_SECONDS * 60) + 2);
    expect(h.loop.running).toBe(false);
    expect(h.seconds(3)).toBe(0);
  });

  it("rest=still: a second flare mid-flare does not stretch the run", () => {
    const h = sceneHarness(false, true);
    h.loop.start();
    h.post();
    h.seconds(1);
    h.post();
    expect(h.seconds(5)).toBeLessThanOrEqual(Math.ceil((FLARE_SECONDS - 1) * 60) + 2);
  });
});
