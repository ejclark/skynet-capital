import {
  BEAM_HOLD_MS,
  beamLine,
  beamTip,
  crossing,
  EYE_IN_FRAME,
  easeSpatial,
  fullyInView,
  lightOrigin,
  reachAt,
  requestLight,
  ringLabel,
  scrollToFit,
  tokenMs,
  useEyeLight,
  viewArea,
} from "../../src/shell/eye-light";

// #7216 slice 2 — the Eye's light: where it starts and the item wholly in view. #7487 slice 5 — the
// straight beam that replaced the arc: its line, the cards it crosses, and when its tip reaches each.

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

describe("the Eye's beam · its line (#7487 slice 5)", () => {
  const from = { x: 1000, y: 150 };

  it("runs straight from the Eye to the item, no arc", () => {
    const line = beamLine(from, { x: 400, y: 150 });
    expect(line).toEqual({ x: 1000, y: 150, length: 600, angle: 180 });
    const down = beamLine(from, { x: 1000, y: 450 });
    expect(down.angle).toBeCloseTo(90);
    expect(down.length).toBe(300);
  });

  it("ends at a row's centre, and no lower than 60px into a tall card", () => {
    expect(beamTip({ top: 300, left: 100, width: 400, height: 44 })).toEqual({ x: 300, y: 322 });
    expect(beamTip({ top: 300, left: 100, width: 400, height: 600 })).toEqual({ x: 300, y: 360 });
  });
});

describe("the Eye's beam · the cards it crosses", () => {
  const from = { x: 1000, y: 100 };
  const to = { x: 200, y: 100 };

  it("says how far along the beam its tip enters a card", () => {
    expect(crossing(from, to, { top: 50, left: 500, width: 200, height: 100 })).toBeCloseTo(0.375);
    // The card the item sits in: the tip ends inside it.
    expect(crossing(from, to, { top: 50, left: 100, width: 300, height: 100 })).toBeCloseTo(0.75);
  });

  it("misses a card off its line, and one past its tip", () => {
    expect(crossing(from, to, { top: 300, left: 500, width: 200, height: 100 })).toBeUndefined();
    expect(crossing(from, to, { top: 50, left: 0, width: 100, height: 100 })).toBeUndefined();
  });

  it("enters at once when it starts inside the card", () => {
    expect(crossing(from, to, { top: 0, left: 900, width: 200, height: 200 })).toBe(0);
  });
});

describe("the Eye's beam · its timing, on the house's tokens", () => {
  it("eases on --ease-spatial: fast out of the Eye, settling onto the item", () => {
    expect(easeSpatial(0)).toBeCloseTo(0);
    expect(easeSpatial(1)).toBeCloseTo(1);
    expect(easeSpatial(0.25)).toBeGreaterThan(0.5);
  });

  it("lights each card as the eased tip gets there, not on a straight clock", () => {
    for (const share of [0.1, 0.4, 0.8]) expect(easeSpatial(reachAt(share))).toBeCloseTo(share, 3);
    expect(reachAt(0.5)).toBeLessThan(0.5);
    expect(reachAt(0)).toBeCloseTo(0);
    expect(reachAt(1)).toBeCloseTo(1, 3);
  });

  it("reads a motion token in ms or s, and falls back when it cannot", () => {
    expect(tokenMs("260ms", 1)).toBe(260);
    expect(tokenMs(" 0.26s", 1)).toBe(260);
    expect(tokenMs("0ms", 1)).toBe(0);
    expect(tokenMs("", 260)).toBe(260);
    expect(tokenMs("fast", 260)).toBe(260);
  });

  it("holds 200ms, the spec's pause", () => {
    expect(BEAM_HOLD_MS).toBe(200);
  });
});

describe("the Eye's ring · its label", () => {
  it("names the Eye, and why it looks when there is a reason", () => {
    expect(ringLabel()).toBe("the Eye");
    expect(ringLabel("  ")).toBe("the Eye");
    expect(ringLabel("left its usual range")).toBe("the Eye · left its usual range");
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
