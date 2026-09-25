import { aimAt, blendGaze, GLANCE, GLANCE_CAP, glanceWeight } from "../../src/three/kit/glance.js";

/**
 * The Eye's glance toward a clicked filter (plan #3725) must stay subtle and short-lived: it eases
 * in, holds, eases out and is gone, and it never pulls the gaze further than the cap.
 */
describe("glanceWeight", () => {
  const total = GLANCE.attack + GLANCE.hold + GLANCE.release;

  it("is zero before the click and once the glance is over", () => {
    expect(glanceWeight(-0.1)).toBe(0);
    expect(glanceWeight(total + 0.01)).toBe(0);
  });

  it("is over within three seconds of the click", () => {
    expect(total).toBeLessThanOrEqual(3);
  });

  it("eases in, holds at full, then eases out", () => {
    expect(glanceWeight(GLANCE.attack / 2)).toBeGreaterThan(0);
    expect(glanceWeight(GLANCE.attack / 2)).toBeLessThan(1);
    expect(glanceWeight(GLANCE.attack + GLANCE.hold / 2)).toBe(1);
    expect(glanceWeight(GLANCE.attack + GLANCE.hold + GLANCE.release / 2)).toBeCloseTo(0.5);
  });
});

describe("aimAt", () => {
  it("looks straight down +z with no yaw or pitch", () => {
    const g = aimAt([0, 0, 0], [0, 0, 10]);
    expect(g.yaw).toBeCloseTo(0);
    expect(g.pitch).toBeCloseTo(0);
  });

  it("turns toward +x as positive yaw, and down as positive pitch", () => {
    expect(aimAt([0, 0, 0], [10, 0, 10]).yaw).toBeCloseTo(Math.PI / 4);
    expect(aimAt([0, 0, 0], [0, -10, 10]).pitch).toBeCloseTo(Math.PI / 4);
  });
});

describe("blendGaze", () => {
  const sweep = { yaw: 0.2, pitch: 0.16 };

  it("leaves the sweep alone at zero weight", () => {
    expect(blendGaze(sweep, { yaw: 1, pitch: -0.3 }, 0)).toEqual(sweep);
  });

  it("reaches a near target at full weight", () => {
    const g = blendGaze(sweep, { yaw: 0.6, pitch: 0.1 }, 1);
    expect(g.yaw).toBeCloseTo(0.6);
    expect(g.pitch).toBeCloseTo(0.1);
  });

  it("never pulls further than the cap — subtle, not a snap-to", () => {
    const g = blendGaze(sweep, { yaw: sweep.yaw + 2.5, pitch: sweep.pitch - 2 }, 1);
    expect(g.yaw - sweep.yaw).toBeCloseTo(GLANCE_CAP);
    expect(sweep.pitch - g.pitch).toBeCloseTo(GLANCE_CAP);
  });

  it("turns the short way round across ±π", () => {
    const g = blendGaze({ yaw: 3.0, pitch: 0 }, { yaw: -3.0, pitch: 0 }, 1);
    expect(g.yaw).toBeGreaterThan(3.0);
  });
});
