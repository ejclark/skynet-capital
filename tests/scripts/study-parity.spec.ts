import { describe, expect, it } from "@rstest/core";
import {
  interceptorOf,
  judgeVisible,
  type ParityRow,
  parityTable,
  worstExit,
} from "../../scripts/study/parity-judge.mjs";

/**
 * The study's parity check (#4943 slice 2) measures in the browser and judges here: a surface
 * counts as rendered only when, scrolled to, it is on screen and its centre is its own — the same
 * measure / judge split as the phone crawl (crawl-phone.spec.ts).
 */

const viewport = { width: 390, height: 844 };
const box = (left: number, top: number, width = 100, height = 40) => ({ left, top, width, height });

describe("judgeVisible", () => {
  it("counts a box on screen whose centre hits it as seen", () => {
    expect(judgeVisible({ box: box(10, 300), viewport, hitInside: true })).toEqual({ ok: true });
  });

  it("refuses a box with no size", () => {
    expect(judgeVisible({ box: box(10, 300, 0, 0), viewport, hitInside: true }).ok).toBe(false);
  });

  it("refuses a box scrolled past the bottom or clipped off the side", () => {
    const below = judgeVisible({ box: box(10, 900), viewport, hitInside: true });
    expect(below).toEqual({ ok: false, why: "is outside the viewport after scrolling to it" });
    expect(judgeVisible({ box: box(395, 300), viewport, hitInside: true }).ok).toBe(false);
  });

  it("refuses a box something else sits on top of", () => {
    expect(judgeVisible({ box: box(10, 300), viewport, hitInside: false })).toEqual({
      ok: false,
      why: "is covered by something else at its centre",
    });
  });
});

describe("interceptorOf", () => {
  it("names the element that took a tap, and the block it belongs to", () => {
    const log =
      '  - <div class="char-blend">…</div> from <div class="overview-card">…</div> subtree intercepts pointer events';
    expect(interceptorOf(log)).toBe("div.char-blend (in div.overview-card)");
  });

  it("is undefined for any other click failure", () => {
    expect(interceptorOf("TimeoutError: element is not visible")).toBeUndefined();
  });
});

const row = (over: Partial<ParityRow> = {}): ParityRow => ({
  world: "w",
  surface: { label: "a surface" },
  phone: { miss: null, notes: [] },
  desktop: { miss: null, notes: [] },
  ...over,
});

describe("parityTable", () => {
  it("prints one row per surface with a word per frame", () => {
    const table = parityTable([
      row(),
      row({ surface: { label: "noted" }, phone: { miss: null, notes: ["tap taken"] } }),
      row({ surface: { label: "missed" }, desktop: { miss: "not found", notes: [] } }),
    ]);
    expect(table).toContain("| w     | a surface | ok  | ok   |");
    expect(table).toContain("ok*");
    expect(table).toContain("tap taken");
    expect(table).toMatch(/missed\s+\| ok\s+\| MISS \| not found/);
  });

  it("says STRUCK with its reason, never drops the surface", () => {
    const table = parityTable([row({ surface: { label: "gone", struck: "no data for it" } })]);
    expect(table).toContain("STRUCK");
    expect(table).toContain("struck: no data for it");
  });

  it("marks a frame a surface does not run at as n/a", () => {
    const table = parityTable([row({ surface: { label: "wide only", only: "desktop" } })]);
    expect(table).toMatch(/wide only \| n\/a/);
  });
});

describe("worstExit", () => {
  it("is 0 when every surface rendered, notes included", () => {
    expect(worstExit([row(), row({ phone: { miss: null, notes: ["n"] } })])).toBe(0);
  });

  it("is 1 on any miss, and on any unstubbed read", () => {
    expect(worstExit([row({ phone: { miss: "not found", notes: [] } })])).toBe(1);
    expect(worstExit([row()], ["GET /api/x"])).toBe(1);
  });

  it("ignores a struck surface's frames", () => {
    const struck = row({ surface: { label: "s", struck: "why" }, phone: { miss: "x", notes: [] } });
    expect(worstExit([struck])).toBe(0);
  });
});
