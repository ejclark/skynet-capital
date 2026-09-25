import { ridged, vnoise } from "../../src/three/kit/noise.js";
import { DEFAULT_PARAMS, resolveTowerParams } from "../../src/three/kit/params.js";
import { crownY, DEFAULT_PROFILE, SHAFT_FOOT, scaleProfile } from "../../src/three/kit/profile.js";
import { createRng } from "../../src/three/kit/rng.js";
import {
  almondify,
  bezier,
  bladeShape,
  finShape,
  hornGeometry,
} from "../../src/three/kit/shapes.js";
import { hornSpecs } from "../../src/three/pieces/crown.js";

/**
 * The 3D kit's pure math — the parts that decide the tower's SHAPE and how it responds to game
 * state. These need no browser, so they get real behavioural coverage; the WebGL-bound builders are
 * verified by the screenshot harness (scripts/shoot/tower.mjs) instead.
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

describe("DEFAULT_PROFILE (the handoff's tier table)", () => {
  it("stacks seven tiers with no gaps between them", () => {
    const { tiers } = DEFAULT_PROFILE;
    expect(tiers).toHaveLength(7);
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i]?.y0).toBe(tiers[i - 1]?.y1);
    }
  });

  it("rises out of the fortress and crowns at y = 302", () => {
    expect(DEFAULT_PROFILE.tiers[0]?.y0).toBe(SHAFT_FOOT);
    expect(crownY(DEFAULT_PROFILE)).toBe(302);
  });

  it("steps in at every ledge — each tier's foot is narrower than the lip below it", () => {
    const { tiers } = DEFAULT_PROFILE;
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i]?.rBottom ?? 0).toBeLessThan(tiers[i - 1]?.rTop ?? 0);
    }
  });
});

describe("scaleProfile", () => {
  it("makes a dominant tower taller than a lagging one", () => {
    expect(crownY(scaleProfile(DEFAULT_PROFILE, 1))).toBeGreaterThan(
      crownY(scaleProfile(DEFAULT_PROFILE, 0)),
    );
  });

  it("keeps the shaft rooted in the fortress at every power", () => {
    for (const p of [0, 0.5, 1]) {
      expect(scaleProfile(DEFAULT_PROFILE, p).tiers[0]?.y0).toBe(SHAFT_FOOT);
    }
  });

  it("keeps a lagging tower standing rather than collapsing it", () => {
    // Positive reinforcement: losing shrinks the landmark, it never erases it.
    const shaft = crownY(DEFAULT_PROFILE) - SHAFT_FOOT;
    expect(crownY(scaleProfile(DEFAULT_PROFILE, 0)) - SHAFT_FOOT).toBeGreaterThan(shaft * 0.5);
  });

  it("reproduces the handoff's proportions at the standalone default power", () => {
    expect(crownY(scaleProfile(DEFAULT_PROFILE, DEFAULT_PARAMS.power))).toBeCloseTo(302, -1);
  });

  it("clamps power outside 0..1", () => {
    expect(crownY(scaleProfile(DEFAULT_PROFILE, 5))).toBeCloseTo(
      crownY(scaleProfile(DEFAULT_PROFILE, 1)),
    );
  });
});

describe("rock noise", () => {
  it("is deterministic — the same point always sculpts the same rock", () => {
    expect(vnoise(1.3, 2.7, -0.4)).toBe(vnoise(1.3, 2.7, -0.4));
    expect(ridged(0.2, 0.9, 3.1)).toBe(ridged(0.2, 0.9, 3.1));
  });

  it("keeps value noise within [-1, 1]", () => {
    for (let i = 0; i < 200; i++) {
      const v = vnoise(i * 0.37, i * 0.11, -i * 0.23);
      expect(Math.abs(v)).toBeLessThanOrEqual(1);
    }
  });
});

/** Every consecutive pair of profile points turns the same way round vertex 0 (star-shaped). */
const sweepsMonotonically = (pts: readonly (readonly [number, number])[]): boolean => {
  const ang = pts.slice(1).map(([x, y]) => Math.atan2(y, x));
  return ang.every((a, i) => i === 0 || a > (ang[i - 1] ?? 0));
};

describe("fin and blade profiles", () => {
  it("fan out from the origin, so extrusion caps triangulate cleanly", () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      expect(
        sweepsMonotonically(
          finShape(rng, rng.range(1.5, 4.5), rng.range(20, 38), rng.range(0.5, 4.5)),
        ),
      ).toBe(true);
      expect(sweepsMonotonically(bladeShape(rng, rng.range(1, 7)))).toBe(true);
    }
  });

  it("gives every fin a spike over its top edge", () => {
    const fin = finShape(createRng(5), 3, 30, 2);
    expect(Math.max(...fin.map(([, y]) => y))).toBe(32);
  });
});

describe("horns", () => {
  const [left, right] = hornSpecs(0, 302, 0);

  it("are deliberately unequal — a mirrored pair would read as a logo", () => {
    expect(left?.r0).not.toBe(right?.r0);
    expect(left?.ridges).not.toBe(right?.ridges);
    expect(left?.curve[3][1]).not.toBe(right?.curve[3][1]);
  });

  it("sweep outward from the crown and rise above the Eye", () => {
    for (const spec of [left, right]) {
      if (!spec) throw new Error("two horns expected");
      const tip = bezier(spec.curve, 1).point;
      expect(Math.sign(tip[0])).toBe(spec.side);
      expect(tip[1]).toBeGreaterThan(302 + 30);
    }
  });

  it("face outward — every triangle's normal points away from the spine", () => {
    if (!left) throw new Error("left horn expected");
    const { positions: p, indices: idx } = hornGeometry(left, 20, 12);
    let inward = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [idx[t] ?? 0, idx[t + 1] ?? 0, idx[t + 2] ?? 0].map((i) => [
        p[i * 3] ?? 0,
        p[i * 3 + 1] ?? 0,
        p[i * 3 + 2] ?? 0,
      ]) as [number[], number[], number[]];
      const ab = [0, 1, 2].map((k) => (b[k] ?? 0) - (a[k] ?? 0));
      const ac = [0, 1, 2].map((k) => (c[k] ?? 0) - (a[k] ?? 0));
      const n = [
        (ab[1] ?? 0) * (ac[2] ?? 0) - (ab[2] ?? 0) * (ac[1] ?? 0),
        (ab[2] ?? 0) * (ac[0] ?? 0) - (ab[0] ?? 0) * (ac[2] ?? 0),
        (ab[0] ?? 0) * (ac[1] ?? 0) - (ab[1] ?? 0) * (ac[0] ?? 0),
      ];
      const ring = Math.floor((idx[t] ?? 0) / 12);
      const spine = bezier(left.curve, ring / 20).point;
      const out = [0, 1, 2].map((k) => (a[k] ?? 0) - spine[k as 0 | 1 | 2]);
      if (
        (n[0] ?? 0) * (out[0] ?? 0) + (n[1] ?? 0) * (out[1] ?? 0) + (n[2] ?? 0) * (out[2] ?? 0) <
        0
      )
        inward++;
    }
    expect(inward).toBe(0);
  });
});

describe("almondify", () => {
  it("pinches both canthi to a point and leaves the centre full height", () => {
    const pts = [1, 0.5, 0.5, 0, 1, 1, -1, 0.3, 0.3];
    almondify(pts);
    expect(pts.slice(0, 3)).toEqual([1, 0, 0]);
    expect(pts.slice(3, 6)).toEqual([0, 1, 1]);
  });

  it("leaves z alone for the pupil", () => {
    const pts = [0.6, 1, 1];
    almondify(pts, false);
    expect(pts[1]).toBeCloseTo(0.8);
    expect(pts[2]).toBe(1);
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
