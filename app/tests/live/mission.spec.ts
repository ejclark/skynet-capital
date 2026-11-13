import { FRESH_TRAIL, parseWindow, slideSide, stepTrail, type Trail } from "../../src/live/mission";

/**
 * Campaign mission control (#7487 slice 1): one window on the stage at a time, a trail of the
 * windows reached this session, and a slide from the side the new window sits on. Pinned here: the
 * trail's insert-after-current rule (the prototype's, not append), the `?w=` cleaning, and the
 * Overview/Party glances — the Party never ranks members against each other.
 */

describe("parseWindow", () => {
  it("accepts every non-default window", () => {
    for (const w of ["market", "calendar", "quests", "party"]) expect(parseWindow(w)).toBe(w);
  });

  it("returns undefined for the default window, so overview is never written to the URL", () => {
    expect(parseWindow("overview")).toBeUndefined();
  });

  it("rejects unknown and non-string values", () => {
    expect(parseWindow("trade")).toBeUndefined();
    expect(parseWindow("")).toBeUndefined();
    expect(parseWindow("Market")).toBeUndefined();
    expect(parseWindow(undefined)).toBeUndefined();
    expect(parseWindow(null)).toBeUndefined();
    expect(parseWindow(3)).toBeUndefined();
    expect(parseWindow(["market"])).toBeUndefined();
  });
});

describe("stepTrail", () => {
  it("adds a new window right after the current one and remembers where it came from", () => {
    const t = stepTrail(FRESH_TRAIL, "overview", "market");
    expect(t.order).toEqual(["overview", "market"]);
    expect(t.from).toEqual({ market: "overview" });
  });

  it("inserts after the current window, not at the end of the trail", () => {
    let t = stepTrail(FRESH_TRAIL, "overview", "market");
    t = stepTrail(t, "market", "calendar");
    // Back on overview, open party: it lands between overview and market.
    t = stepTrail(t, "overview", "party");
    expect(t.order).toEqual(["overview", "party", "market", "calendar"]);
    expect(t.from).toEqual({ market: "overview", calendar: "market", party: "overview" });
  });

  it("reopening a window already on the trail moves nothing and keeps its first origin", () => {
    let t = stepTrail(FRESH_TRAIL, "overview", "market");
    t = stepTrail(t, "market", "calendar");
    const again = stepTrail(t, "calendar", "market");
    expect(again.order).toEqual(["overview", "market", "calendar"]);
    expect(again.from).toEqual({ market: "overview", calendar: "market" });
    expect(again).toBe(t);
  });

  it("a deep-linked current window not on the trail joins it before the new one", () => {
    const t = stepTrail(FRESH_TRAIL, "calendar", "quests");
    expect(t.order).toEqual(["overview", "calendar", "quests"]);
    expect(t.from).toEqual({ quests: "calendar" });
  });

  it("stepping to the current window leaves no self-origin", () => {
    const t = stepTrail(FRESH_TRAIL, "party", "party");
    expect(t.order).toEqual(["overview", "party"]);
    expect(t.from).toEqual({});
  });

  it("never mutates the trail it was given", () => {
    const before: Trail = { order: ["overview", "market"], from: { market: "overview" } };
    const snapshot = JSON.parse(JSON.stringify(before)) as Trail;
    stepTrail(before, "overview", "party");
    expect(before).toEqual(snapshot);
  });
});

describe("slideSide", () => {
  const t: Trail = { order: ["overview", "party", "market"], from: {} };

  it("slides in from the right when the new window sits after the current one", () => {
    expect(slideSide(t, "overview", "market")).toBe(1);
    expect(slideSide(t, "party", "market")).toBe(1);
  });

  it("slides in from the left when the new window sits before the current one", () => {
    expect(slideSide(t, "market", "overview")).toBe(-1);
    expect(slideSide(t, "market", "party")).toBe(-1);
  });

  it("a freshly inserted window slides in from the right", () => {
    const next = stepTrail(t, "overview", "calendar");
    expect(slideSide(next, "overview", "calendar")).toBe(1);
  });
});
