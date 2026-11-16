import {
  ARC_MS,
  arcControl,
  DIM_MAX,
  EYE_IN_FRAME,
  FOCUS_MS,
  fullyInView,
  LAND_MS,
  LIGHT_MS,
  lightAt,
  lightOrigin,
  onArc,
  RING_DRAW_MS,
  requestLight,
  scrollToFit,
  touchShare,
  useEyeLight,
  viewArea,
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

describe("the Eye's light · the landing, articulated (#7227)", () => {
  const from = { x: 262, y: 152 };
  const to = { x: 810, y: 420 };
  const landed = FOCUS_MS + ARC_MS;

  it("starts the ring the moment the spark lands, and has it drawn inside 300 ms", () => {
    expect(lightAt(landed - 1, from, to).ring).toBe(false);
    expect(lightAt(landed, from, to)).toMatchObject({ step: 3, ring: true });
    expect(RING_DRAW_MS).toBeLessThanOrEqual(300);
  });

  // A card 200 × 100 at (100, 100); its outline is 600 long, clockwise from the top-left corner.
  const card = { top: 100, left: 100, width: 200, height: 100 };
  it("draws from where the light touched the edge, on whichever side it came in", () => {
    expect(touchShare(card, { x: 200, y: -400 })).toBeCloseTo(100 / 600); // straight down: top middle
    expect(touchShare(card, { x: 900, y: 150 })).toBeCloseTo(250 / 600); // from the right: right middle
    expect(touchShare(card, { x: 200, y: 900 })).toBeCloseTo(400 / 600); // from below: bottom middle
    expect(touchShare(card, { x: -500, y: 150 })).toBeCloseTo(550 / 600); // from the left
    expect(touchShare(card, { x: 0, y: 50 })).toBeCloseTo(0); // through the top-left corner
  });
});

describe("the Eye's light · the item wholly in view (#7227 criterion 3)", () => {
  const win = { width: 1280, height: 800 };
  /** The area, which these cases all have (the phone's full cover is its own case below). */
  const seen = (...args: Parameters<typeof viewArea>) => {
    const a = viewArea(...args);
    if (!a) throw new Error("expected part of the page in view");
    return a;
  };
  const row = (top: number, left = 200, width = 600) => ({ top, left, width, height: 40 });

  it("keeps the item under the topbar and inside the window", () => {
    const a = seen(56, win, null);
    expect(a).toEqual({ top: 56, bottom: 800, left: 0, right: 1280 });
    expect(fullyInView(row(300), a)).toBe(true);
    expect(fullyInView(row(40), a)).toBe(false); // under the topbar
    expect(fullyInView(row(780), a)).toBe(false); // clipped by the window's foot
  });

  it("with the chat open beside the page, keeps the item clear of it", () => {
    const chat = { top: 0, left: 840, width: 440, height: 800 };
    const a = seen(56, win, chat);
    expect(a.right).toBe(840);
    expect(fullyInView(row(300, 200, 600), a)).toBe(true);
    expect(fullyInView(row(300, 400, 600), a)).toBe(false); // runs under the chat
  });

  it("with the phone's chat over the whole page, has nothing in view, so the light waits", () => {
    const phone = { width: 390, height: 844 };
    expect(viewArea(56, phone, { top: 0, left: 0, width: 390, height: 844 })).toBeUndefined();
  });

  it("scrolls an item into the middle of what is seen, or its top to the top when it is taller", () => {
    const a = seen(56, win, null);
    const middle = (56 + 800) / 2;
    expect(scrollToFit(row(1200), a)).toBe(1200 + 20 - middle);
    expect(scrollToFit(row(20), a)).toBe(20 + 20 - middle);
    expect(scrollToFit({ top: 900, left: 0, width: 600, height: 2000 }, a)).toBe(900 - 56);
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
