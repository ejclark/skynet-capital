import { DEFAULT_PARAMS, resolveTowerParams } from "../../src/three/kit/params.js";
import {
  DEFAULT_PROFILE,
  layoutRings,
  radiusAt,
  scaleProfile,
} from "../../src/three/kit/profile.js";
import { createRng } from "../../src/three/kit/rng.js";

/**
 * The 3D kit's pure math — the parts that decide the tower's SHAPE and how it responds to game
 * state. These need no browser, so they get real behavioural coverage; the WebGL-bound builders are
 * verified by the screenshot harness (scripts/shoot-tower.mjs) instead.
 */

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng(1337);
    const b = createRng(1337);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("stays within the unit interval", () => {
    const rng = createRng(42);
    for (let i = 0; i < 200; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("centres jitter on zero", () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      const j = rng.jitter(4);
      expect(Math.abs(j)).toBeLessThanOrEqual(2);
    }
  });

  it("keeps range() within its bounds", () => {
    const rng = createRng(9);
    for (let i = 0; i < 100; i++) {
      const v = rng.range(10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
    }
  });
});

describe("radiusAt", () => {
  it("returns the base radius at the bottom", () => {
    expect(radiusAt(DEFAULT_PROFILE, 0)).toBeCloseTo(DEFAULT_PROFILE.baseRadius);
  });

  it("returns the crown radius at the top", () => {
    expect(radiusAt(DEFAULT_PROFILE, 1)).toBeCloseTo(DEFAULT_PROFILE.crownRadius);
  });

  it("narrows monotonically from base to crown", () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let t = 0; t <= 1; t += 0.05) {
      const r = radiusAt(DEFAULT_PROFILE, t);
      expect(r).toBeLessThanOrEqual(previous + 1e-9);
      previous = r;
    }
  });

  it("necks in fast — half height is already well below half radius", () => {
    // The Barad-dûr read depends on this: a straight cone would sit at the midpoint.
    const midpoint = (DEFAULT_PROFILE.baseRadius + DEFAULT_PROFILE.crownRadius) / 2;
    expect(radiusAt(DEFAULT_PROFILE, 0.5)).toBeLessThan(midpoint);
  });

  it("clamps out-of-range heights instead of extrapolating", () => {
    expect(radiusAt(DEFAULT_PROFILE, -1)).toBeCloseTo(DEFAULT_PROFILE.baseRadius);
    expect(radiusAt(DEFAULT_PROFILE, 5)).toBeCloseTo(DEFAULT_PROFILE.crownRadius);
  });
});

describe("layoutRings", () => {
  it("produces one layout per ring in the profile", () => {
    expect(layoutRings(DEFAULT_PROFILE)).toHaveLength(DEFAULT_PROFILE.rings);
  });

  it("stacks rings upward without gaps", () => {
    const rings = layoutRings(DEFAULT_PROFILE);
    for (let i = 1; i < rings.length; i++) {
      const prev = rings[i - 1];
      const cur = rings[i];
      if (!(prev && cur)) throw new Error("ring layout must be dense");
      expect(cur.y).toBeGreaterThan(prev.y);
      expect(cur.y).toBeCloseTo(prev.y + prev.height, 5);
    }
  });

  it("uses fewer slats as the tower narrows, keeping stone size constant", () => {
    const rings = layoutRings(DEFAULT_PROFILE);
    expect(rings.at(0)?.slats ?? 0).toBeGreaterThan(rings.at(-1)?.slats ?? 0);
  });

  it("buttresses only the lower rings", () => {
    const rings = layoutRings(DEFAULT_PROFILE);
    expect(rings.at(0)?.buttressed).toBe(true);
    expect(rings.at(-1)?.buttressed).toBe(false);
  });

  it("never drops below a floor of slats, even at the crown", () => {
    for (const ring of layoutRings(DEFAULT_PROFILE)) {
      expect(ring.slats).toBeGreaterThanOrEqual(8);
    }
  });
});

describe("scaleProfile", () => {
  it("makes a dominant tower taller than a lagging one", () => {
    expect(scaleProfile(DEFAULT_PROFILE, 1).height).toBeGreaterThan(
      scaleProfile(DEFAULT_PROFILE, 0).height,
    );
  });

  it("keeps a lagging tower standing rather than collapsing it", () => {
    // Positive reinforcement: losing dims and shrinks, it never erases the player's landmark.
    const weak = scaleProfile(DEFAULT_PROFILE, 0);
    expect(weak.height).toBeGreaterThan(DEFAULT_PROFILE.height * 0.5);
    expect(weak.rings).toBeGreaterThan(0);
  });

  it("clamps power outside 0..1", () => {
    expect(scaleProfile(DEFAULT_PROFILE, 5).height).toBeCloseTo(
      scaleProfile(DEFAULT_PROFILE, 1).height,
    );
  });
});

describe("resolveTowerParams", () => {
  it("burns brighter and reaches further at higher standing", () => {
    const low = resolveTowerParams({ prominence: 0.1, health: 0 });
    const high = resolveTowerParams({ prominence: 0.95, health: 0 });
    expect(high.eyeIntensity).toBeGreaterThan(low.eyeIntensity);
    expect(high.gazeReach).toBeGreaterThan(low.gazeReach);
    expect(high.stormDensity).toBeGreaterThan(low.stormDensity);
  });

  it("dims the forge when positions are bleeding", () => {
    const bleeding = resolveTowerParams({ prominence: 0.6, health: -1 });
    const thriving = resolveTowerParams({ prominence: 0.6, health: 1 });
    expect(bleeding.forgeIntensity).toBeLessThan(thriving.forgeIntensity);
  });

  it("grants more masonry detail only at higher standing", () => {
    expect(resolveTowerParams({ prominence: 0.2 }).detailPasses).toBe(0);
    expect(resolveTowerParams({ prominence: 0.9 }).detailPasses).toBe(2);
  });

  it("treats a missing health reading as neutral rather than failing", () => {
    expect(resolveTowerParams({ prominence: 0.5 }).health).toBe(0);
  });

  it("clamps inputs outside their honest ranges", () => {
    const p = resolveTowerParams({ prominence: 9, health: -9 });
    expect(p.power).toBe(1);
    expect(p.health).toBe(-1);
  });

  it("exposes a sensible default for the standalone scene", () => {
    expect(DEFAULT_PARAMS.power).toBeGreaterThan(0);
    expect(DEFAULT_PARAMS.gazeReach).toBeGreaterThan(0);
  });
});
