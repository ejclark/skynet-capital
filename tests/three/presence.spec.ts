import { armContextLoss } from "../../src/three/kit/fallback.js";
import { fpsMeter, probeLines, wantsProbe } from "../../src/three/kit/probe.js";
import {
  FULL,
  PRESENCE,
  pixelRatioFor,
  qualityFromSearch,
  restStillFromSearch,
} from "../../src/three/kit/quality.js";

/**
 * The crest's budget (plan #3807 slice 3a-2): the `quality=presence` dial, the `?probe=1` readout,
 * and the context-loss fallback. The frame-rate cap itself is in loop.spec.ts.
 */

describe("the rest dial (slice 3a-3)", () => {
  it("is still only when the page asks for it; live or absent is today's sweep", () => {
    expect(restStillFromSearch("?frame=crown&quality=presence&rest=still")).toBe(true);
    expect(restStillFromSearch("?frame=crown&rest=live")).toBe(false);
    expect(restStillFromSearch("?frame=crown")).toBe(false);
    expect(restStillFromSearch("?rest=STILL")).toBe(false);
  });
});

describe("the quality dial", () => {
  it("is presence only when the page asks for it", () => {
    expect(qualityFromSearch("?frame=crown&quality=presence")).toBe(PRESENCE);
    expect(qualityFromSearch("?frame=crown")).toBe(FULL);
    expect(qualityFromSearch("?quality=ultra")).toBe(FULL);
  });

  it("presence caps the rate at 30, the pixel ratio at 1, drops the shadow map and halves the embers", () => {
    expect(PRESENCE).toMatchObject({
      fpsCap: 30,
      pixelRatioCap: 1,
      shadowMapSize: 0,
      emberScale: 0.5,
    });
  });

  it("full leaves the scene as designed", () => {
    expect(FULL).toMatchObject({
      fpsCap: null,
      pixelRatioCap: 2,
      shadowMapSize: 2048,
      emberScale: 1,
    });
  });

  it("never raises a low pixel ratio, and treats a nonsense one as 1", () => {
    expect(pixelRatioFor(PRESENCE, 3)).toBe(1);
    expect(pixelRatioFor(FULL, 3)).toBe(2);
    expect(pixelRatioFor(FULL, 1.5)).toBe(1.5);
    expect(pixelRatioFor(FULL, Number.NaN)).toBe(1);
  });
});

describe("the ?probe=1 readout", () => {
  it("shows only when the query asks for it", () => {
    expect(wantsProbe("?frame=crown&probe=1")).toBe(true);
    expect(wantsProbe("?frame=crown")).toBe(false);
    expect(wantsProbe("?probe=0")).toBe(false);
  });

  it("reads draws per second between samples", () => {
    const m = fpsMeter();
    expect(m.sample(0, 1000)).toBe(0);
    expect(m.sample(15, 1500)).toBe(30);
    expect(m.sample(15, 1500)).toBe(0);
  });

  it("says fps · frames, then the submit p50 / p95 in ms", () => {
    const lines = probeLines(29.6, {
      frames: 612,
      submitMs: { p50: 1.26, p95: 3.04 },
      mountToReadyMs: 800,
    });
    expect(lines).toEqual(["30 fps · 612 frames", "submit 1.3 / 3.0 ms (p50 / p95)"]);
  });
});

describe("the context-loss fallback", () => {
  const harness = (still: string | null) => {
    const canvas = new EventTarget();
    const seen = { halts: 0, shown: [] as string[] };
    const disarm = armContextLoss({
      canvas,
      still: () => still,
      halt: () => void seen.halts++,
      show: (url) => void seen.shown.push(url),
    });
    const lose = (): void => void canvas.dispatchEvent(new Event("webglcontextlost"));
    return { seen, lose, disarm };
  };

  it("stops the loop and shows the kept still when the GPU takes the context", () => {
    const h = harness("data:image/png;base64,AAAA");
    h.lose();
    expect(h.seen.halts).toBe(1);
    expect(h.seen.shown).toEqual(["data:image/png;base64,AAAA"]);
  });

  it("does it once, however many losses follow", () => {
    const h = harness("data:image/png;base64,AAAA");
    h.lose();
    h.lose();
    expect(h.seen.halts).toBe(1);
    expect(h.seen.shown).toHaveLength(1);
  });

  it("still stops the loop when no still was kept (the standalone page)", () => {
    const h = harness(null);
    h.lose();
    expect(h.seen.halts).toBe(1);
    expect(h.seen.shown).toEqual([]);
  });

  it("does nothing before a loss, or after it is disarmed", () => {
    const h = harness("data:image/png;base64,AAAA");
    expect(h.seen.halts).toBe(0);
    h.disarm();
    h.lose();
    expect(h.seen.halts).toBe(0);
  });
});
