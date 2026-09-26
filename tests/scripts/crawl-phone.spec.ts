import { describe, expect, it } from "@rstest/core";
import type { Box, Field, Rect, Target } from "../../scripts/crawl/phone.mjs";
import {
  circleHitsRect,
  dedupe,
  isInlineTarget,
  isUaDefault,
  leaks,
  outermostLeaks,
  phoneFindings,
  spacedEnough,
  tapFindings,
  zoomFindings,
} from "../../scripts/crawl/phone.mjs";
import { foldPhoneRows } from "../../scripts/crawl/phone-ledger.mjs";

// The phone checks judge plain measurements, so every rule is testable without a browser: the
// page side only records rects and computed styles (scripts/crawl/phone.mjs → `snapshot`).

const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
});

let next = 0;
const target = (r: Rect, over: Partial<Target> = {}): Target => ({
  i: next++,
  tag: "button",
  type: "",
  appearance: "auto",
  display: "inline-block",
  hostText: "",
  ownText: "Go",
  desc: "<button>",
  label: "Go",
  rect: r,
  ancestors: [],
  ...over,
});

const box = (i: number, over: Partial<Box> = {}): Box => ({
  i,
  scrollWidth: 400,
  clientWidth: 300,
  overflowX: "visible",
  name: `.b${i}`,
  text: `box ${i}`,
  ancestors: [],
  ...over,
});

describe("leaks — copied from layout-resize-scan", () => {
  it("counts only overflow-x: visible past the tolerance", () => {
    expect(leaks({ scrollWidth: 310, clientWidth: 300, overflowX: "visible" })).toBe(true);
    expect(leaks({ scrollWidth: 304, clientWidth: 300, overflowX: "visible" })).toBe(false);
    expect(leaks({ scrollWidth: 900, clientWidth: 300, overflowX: "auto" })).toBe(false);
    expect(leaks({ scrollWidth: 900, clientWidth: 300, overflowX: "hidden" })).toBe(false);
  });
});

describe("outermostLeaks", () => {
  it("reports the outermost leaking box of a subtree, not every descendant", () => {
    const boxes = [box(0), box(1, { ancestors: [0] }), box(2, { ancestors: [1, 0] })];
    expect(outermostLeaks(boxes).map((b) => b.i)).toEqual([0]);
  });

  it("reports a leak inside a contained (auto) ancestor", () => {
    const boxes = [box(0, { overflowX: "auto" }), box(1, { ancestors: [0] })];
    expect(outermostLeaks(boxes).map((b) => b.i)).toEqual([1]);
  });
});

describe("tap-target exceptions (WCAG 2.2 SC 2.5.8)", () => {
  it("treats a link inside a sentence as inline", () => {
    expect(
      isInlineTarget({
        display: "inline",
        hostText: "Read the guide before you trade",
        ownText: "the guide",
      }),
    ).toBe(true);
  });

  it("does not treat a lone link in a nav item, or an inline-block chip, as inline", () => {
    expect(isInlineTarget({ display: "inline", hostText: "Trade", ownText: "Trade" })).toBe(false);
    expect(
      isInlineTarget({ display: "inline-block", hostText: "Read the guide now", ownText: "guide" }),
    ).toBe(false);
  });

  it("leaves an unstyled native checkbox to the user agent", () => {
    expect(isUaDefault({ tag: "input", type: "checkbox", appearance: "auto" })).toBe(true);
    expect(isUaDefault({ tag: "input", type: "checkbox", appearance: "none" })).toBe(false);
    expect(isUaDefault({ tag: "input", type: "text", appearance: "auto" })).toBe(false);
  });

  it("measures circle-to-rect overlap, touching is not overlapping", () => {
    expect(circleHitsRect({ x: 0, y: 0 }, 12, rect(11, -5, 10, 10))).toBe(true);
    expect(circleHitsRect({ x: 0, y: 0 }, 12, rect(12, -5, 10, 10))).toBe(false);
    expect(circleHitsRect({ x: 0, y: 0 }, 12, rect(9, 9, 10, 10))).toBe(false); // corner, √162 > 12
  });

  it("passes an undersized target with nothing inside its 24px circle", () => {
    const a = target(rect(0, 0, 16, 16));
    const b = target(rect(40, 0, 16, 16));
    expect(spacedEnough(a, [a, b])).toBe(true);
  });

  it("fails two undersized targets whose circles overlap", () => {
    const a = target(rect(0, 0, 16, 16));
    const b = target(rect(20, 0, 16, 16));
    expect(spacedEnough(a, [a, b])).toBe(false);
  });

  it("ignores a target that contains the one being checked", () => {
    const outer = target(rect(0, 0, 60, 30));
    const inner = target(rect(2, 2, 16, 16), { ancestors: [outer.i] });
    expect(spacedEnough(inner, [outer, inner])).toBe(true);
  });
});

describe("tapFindings", () => {
  it("files a crowded 20px button as AA medium and a 30px one as AAA low", () => {
    const a = target(rect(0, 0, 20, 20), { label: "Buy" });
    const b = target(rect(22, 0, 20, 20), { label: "Sell" });
    const c = target(rect(0, 100, 30, 30), { label: "Next" });
    const found = tapFindings([a, b, c]);
    expect(found.filter((f) => f.kind === "tap-target").map((f) => f.snippet)).toEqual([
      "Buy",
      "Sell",
    ]);
    expect(found.find((f) => f.snippet === "Next")).toMatchObject({
      kind: "tap-target-aaa",
      severity: "low",
    });
  });

  it("files a well-spaced undersized target only as advisory", () => {
    const found = tapFindings([target(rect(0, 0, 16, 16), { label: "i" })]);
    expect(found.map((f) => f.kind)).toEqual(["tap-target-aaa"]);
  });

  it("skips inline links, user-agent controls and zero-size boxes", () => {
    const found = tapFindings([
      target(rect(0, 0, 40, 14), {
        tag: "a",
        display: "inline",
        ownText: "guide",
        hostText: "Read the guide before trading",
      }),
      target(rect(50, 0, 13, 13), { tag: "input", type: "checkbox" }),
      target(rect(80, 0, 0, 0)),
      target(rect(0, 200, 48, 48)),
    ]);
    expect(found).toEqual([]);
  });
});

describe("zoomFindings", () => {
  const field = (over: Partial<Field>): Field => ({
    tag: "input",
    type: "text",
    fontSize: 13,
    desc: "<input type=text>",
    label: "Symbol",
    ...over,
  });

  it("flags a text field under 16px and leaves 16px and non-text inputs alone", () => {
    const found = zoomFindings([
      field({}),
      field({ fontSize: 16, label: "ok" }),
      field({ type: "checkbox", label: "box" }),
      field({ tag: "select", type: "", label: "Order type" }),
    ]);
    expect(found.map((f) => [f.kind, f.snippet, f.severity])).toEqual([
      ["input-zoom", "Symbol", "medium"],
      ["input-zoom", "Order type", "medium"],
    ]);
  });
});

describe("phoneFindings", () => {
  it("flags a page wider than the window as high", () => {
    const found = phoneFindings({
      innerWidth: 390,
      scrollWidth: 420,
      boxes: [],
      targets: [],
      inputs: [],
    });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ kind: "page-sideways-scroll", severity: "high" });
  });

  it("names an overflow by the element that reaches furthest, and locates by its text", () => {
    const found = phoneFindings({
      innerWidth: 390,
      scrollWidth: 390,
      boxes: [box(0, { culprit: { name: ".board-table", text: "Filter research" } })],
      targets: [],
      inputs: [],
    });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ kind: "overflow", snippet: "Filter research" });
    expect(found[0]?.what).toContain("widest inside: .board-table");
  });

  it("stays quiet within the 4px tolerance", () => {
    expect(
      phoneFindings({ innerWidth: 390, scrollWidth: 394, boxes: [], targets: [], inputs: [] }),
    ).toEqual([]);
  });
});

describe("dedupe", () => {
  it("folds identical findings on one page and counts them", () => {
    const f = {
      kind: "tap-target-aaa",
      what: "x",
      snippet: "x",
      severity: "low" as const,
      fix: "S" as const,
    };
    expect(dedupe([f, f, { ...f, what: "y" }]).map((d) => d.what)).toEqual(["x — ×2", "y"]);
  });
});

describe("foldPhoneRows", () => {
  it("makes one row per page · finding and lists every member and step that hit it", () => {
    const base = {
      page: "/app/trade",
      kind: "input-zoom",
      what: "Symbol at 13px",
      where: "—",
      severity: "medium",
      fix: "S",
    };
    const rows = foldPhoneRows([
      { ...base, member: "eric", journey: "J1 Trade", step: "s1" },
      { ...base, member: "eric", journey: "J2 Close", step: "s3" },
      { ...base, member: "phone-only", journey: "J1 Trade", step: "s1" },
      { ...base, page: "/app/accounts", member: "eric", journey: "J1 Trade", step: "s2" },
    ]);
    expect(rows.map((r) => r.page)).toEqual(["/app/accounts", "/app/trade"]);
    expect([...(rows[1]?.hits ?? [])]).toEqual([
      ["eric", ["J1·s1", "J2·s3"]],
      ["phone-only", ["J1·s1"]],
    ]);
  });
});
