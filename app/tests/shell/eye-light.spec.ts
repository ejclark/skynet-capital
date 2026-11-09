import {
  ARC_MS,
  arcControl,
  DIM_MAX,
  EYE_IN_FRAME,
  FOCUS_MS,
  LAND_MS,
  LIGHT_MS,
  lightAt,
  lightOrigin,
  onArc,
  requestLight,
  useEyeLight,
} from "../../src/shell/eye-light";

// #7216 slice 2 — the Eye's light: where it starts, the arc it flies, and the four steps in order.

const frame = { top: 74, left: 32, width: 384, height: 664 };

describe("the Eye's light · where it starts", () => {
  it("starts at the tower's Eye while the Eye is on screen", () => {
    const o = lightOrigin(frame, null, 52);
    expect(o?.kind).toBe("tower");
    expect(o?.x).toBeCloseTo(32 + 384 * EYE_IN_FRAME.x);
    expect(o?.y).toBeCloseTo(74 + 664 * EYE_IN_FRAME.y);
  });

  it("drops in under the topbar, straight below the Eye, when the Eye is scrolled above", () => {
    const scrolled = { ...frame, top: -400 };
    const o = lightOrigin(scrolled, null, 52);
    expect(o?.kind).toBe("edge");
    expect(o?.y).toBe(52);
    expect(o?.x).toBeCloseTo(32 + 384 * EYE_IN_FRAME.x);
  });

  it("starts at the topbar's Eye where no column is drawn", () => {
    const brand = { top: 12, left: 14, width: 28, height: 28 };
    expect(lightOrigin(null, brand, 52)).toEqual({ kind: "brand", x: 28, y: 26 });
  });

  it("has no start where no Eye is drawn, so only the ring shows", () => {
    expect(lightOrigin(null, null, 52)).toBeUndefined();
  });
});

describe("the Eye's light · the arc", () => {
  const from = { x: 262, y: 152 };
  const to = { x: 810, y: 420 };

  it("rises above both ends, so the spark arcs over the page", () => {
    expect(arcControl(from, to).y).toBeLessThan(from.y);
  });

  it("never flies above the topbar's foot", () => {
    const edge = { x: 262, y: 52 };
    for (let t = 0; t <= 1; t += 0.05) expect(onArc(edge, to, t, 52).y).toBeGreaterThanOrEqual(52);
  });

  it("runs from the Eye to the item", () => {
    expect(onArc(from, to, 0)).toEqual(from);
    const end = onArc(from, to, 1);
    expect(end.x).toBeCloseTo(to.x);
    expect(end.y).toBeCloseTo(to.y);
  });
});

describe("the Eye's light · the four steps", () => {
  const from = { x: 262, y: 152 };
  const to = { x: 810, y: 420 };

  it("step 1: the Eye focuses under a small pool of light", () => {
    const f = lightAt(FOCUS_MS / 2, from, to);
    expect(f.step).toBe(1);
    expect(f.pool?.r).toBeGreaterThan(0);
    expect(f.spark).toBeUndefined();
    expect(f.ring).toBe(false);
  });

  it("step 2: a spark arcs over the page with a short trail", () => {
    const f = lightAt(FOCUS_MS + ARC_MS / 2, from, to);
    expect(f.step).toBe(2);
    expect(f.spark).toBeDefined();
    expect(f.trail?.length).toBeGreaterThan(2);
    expect(f.trail?.at(-1)).toEqual(f.spark);
  });

  it("step 3: it lands as the page dims around the item, inside one second", () => {
    expect(FOCUS_MS + ARC_MS + LAND_MS).toBe(1000);
    const f = lightAt(FOCUS_MS + ARC_MS + LAND_MS - 1, from, to);
    expect(f.step).toBe(3);
    expect(f.dim).toBeGreaterThan(DIM_MAX * 0.9);
    expect(f.spark).toBeUndefined();
  });

  it("step 4: the dim lifts and the ring stays", () => {
    const lifting = lightAt(LIGHT_MS - 1, from, to);
    expect(lifting.step).toBe(4);
    expect(lifting.ring).toBe(true);
    expect(lifting.dim).toBeLessThan(0.05);
    expect(lightAt(LIGHT_MS + 500, from, to)).toEqual({ step: "done", ring: true });
  });
});

describe("the Eye's light · asking for it", () => {
  beforeEach(() => useEyeLight.setState({ request: undefined }));

  it("asks for the item a link's hash names, again on every tap", () => {
    requestLight("/accounts#pos-NVDA");
    expect(useEyeLight.getState().request).toEqual({ anchor: "pos-NVDA", seq: 1 });
    requestLight("/accounts#pos-NVDA");
    expect(useEyeLight.getState().request?.seq).toBe(2);
  });

  it("decodes an option's symbol", () => {
    requestLight("/accounts#pos-NVDA%20261218P00100000");
    expect(useEyeLight.getState().request?.anchor).toBe("pos-NVDA 261218P00100000");
  });

  it("asks nothing for a link to a page", () => {
    requestLight("/trade");
    expect(useEyeLight.getState().request).toBeUndefined();
  });
});
