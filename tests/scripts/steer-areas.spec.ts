import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { type LintEnv, lintDesign } from "../../scripts/redesign/lint-rules.mjs";
import {
  AREAS_HOW,
  areaAt,
  areaSpecProblems,
  areasFor,
  LANE,
  lineY,
} from "../../scripts/steer/areas.mjs";
import { designDecisions } from "../../scripts/steer/design.mjs";
import { readback } from "../../scripts/steer/readback.mjs";
import { contrast } from "../support/contrast";
import { focusQuestion, pageOf, REC, roundOf, SECTIONS } from "./steer-focus-fixture";

// #5391 — Eric picked option E on #5350 round 2 ("Build option e"): "outline the piece of scope in
// question then use an arrow/line to expand on context where there is no/minimal collision with
// the content under review", with "faint outlines, one (or more if necessary) active outlines".
// A question's `areas` draws every area as a dashed outline numbered in the margin, the `active`
// ones solid with their words beside the picture; a mark inside one is read back by its number.
// Opt-in: a question without `areas` renders exactly as before.

/** Area 3 is the section "Order card" ({20, 40, 60, 20}); area 5 an explicit phone box at the top;
 *  only area 3 is asked about this round. */
const AREAS = [
  {
    n: 3,
    label: "Order card",
    problem: "P2 · the total is hard to find",
    words: "Total reads first",
  },
  { n: 5, box: { phone: [0, 0, 100, 10] }, problem: "P4 · the header crowds the name" },
];
const areaQuestion = (over: Record<string, unknown> = {}) =>
  focusQuestion({ focus: undefined, areas: AREAS, active: [3], ...over });
const ROUND = roundOf(areaQuestion());
const html = pageOf(ROUND);
const today = html.slice(html.indexOf('data-option="today"'), html.indexOf('id="d-5300-q1-A"'));

describe("resolving a question's areas on a picture", () => {
  const phone = { size: "phone" as const, sections: SECTIONS };

  it("takes a label's section, or its own box for the frame, and marks the active ones", () => {
    const got = areasFor({ areas: AREAS, active: [3] }, phone);
    expect(
      got.map(({ n, x, y, w, h, active, label }) => ({ n, x, y, w, h, active, label })),
    ).toEqual([
      { n: 3, x: 20, y: 40, w: 60, h: 20, active: true, label: "Order card" },
      { n: 5, x: 0, y: 0, w: 100, h: 10, active: false, label: null },
    ]);
    expect(got[0]?.words).toBe("Total reads first");
    expect(got[0]?.ly).toBe(50);
    expect(got[1]?.ly).toBeNull();
  });

  it("leaves off an area this frame doesn't hold", () => {
    expect(areasFor({ areas: AREAS }, { size: "desk" as const }).map((a) => a.n)).toEqual([]);
  });

  it("puts the line at a height that crosses no other area's box", () => {
    const a = { n: 1, x: 10, y: 40, w: 30, h: 20 };
    const blocker = { n: 2, x: 60, y: 45, w: 30, h: 10 };
    expect(lineY(a, [a, blocker])).toBe(44);
    // a box holding the whole area is its container: the line can only leave through it
    expect(lineY(a, [a, { n: 9, x: 0, y: 30, w: 100, h: 40 }])).toBe(50);
    expect(lineY(a, [a, { n: 3, x: 50, y: 30, w: 40, h: 40 }])).toBeNull();
  });

  it("names the smallest area holding a spot", () => {
    const got = areasFor({ areas: AREAS }, phone);
    expect(areaAt(got, 50, 50)?.n).toBe(3);
    expect(areaAt(got, 50, 5)?.n).toBe(5);
    expect(areaAt(got, 50, 80)).toBeNull();
  });

  it("refuses an active number that isn't an area, and an area with neither label nor box", () => {
    expect(areaSpecProblems({ areas: AREAS, active: [3] }, "q1")).toEqual([]);
    expect(areaSpecProblems({ areas: AREAS, active: [7] }, "q1")).toEqual([
      "q1: \"active\" 7 isn't an area's number",
    ]);
    expect(areaSpecProblems({ areas: [{ n: 1, problem: "p" }] }, "q1")).toEqual([
      'q1 area 1: needs a "label" (a section\'s) or a "box"',
    ]);
    expect(() => designDecisions([areaQuestion({ active: [7] })], { issue: 5300 })).toThrow(
      /"active" 7 isn't an area's number/,
    );
    expect(() => designDecisions([areaQuestion({ focus: "Order card" })], { issue: 5300 })).toThrow(
      /by "focus" or by "areas", not both/,
    );
  });
});

describe("the areas on the page", () => {
  it("draws every area as an outline with its number in the margin, the active one solid", () => {
    expect(html).toContain(
      'class="shot phone pinned markable areas" data-key="5300-q1" data-option="today"',
    );
    expect(today).toContain(
      '<div class="abox" data-on data-n="3" style="left:20%;top:40%;width:60%;height:20%" aria-hidden="true"></div>' +
        '<span class="anum" data-on style="top:40%" aria-hidden="true">3</span>',
    );
    expect(today).toContain(
      '<div class="abox" data-n="5" style="left:0%;top:0%;width:100%;height:10%" aria-hidden="true"></div>' +
        '<span class="anum" style="top:0%" aria-hidden="true">5</span>',
    );
  });

  it("puts an active area's words beside the picture, joined by a line to its right edge", () => {
    expect(today).toContain(
      `<span class="aline" style="top:50%;left:80%;--d:${LANE}px" aria-hidden="true"></span>`,
    );
    expect(today).toContain('<p class="agut" style="top:50%">Total reads first</p>');
    // at phone width, in the band below the picture (its middle is in the bottom half), its line
    // running up the right margin from the band to the outline's height
    const below = today.slice(today.indexOf('<div class="aband below">'));
    expect(below).toContain(
      `<p class="acall" style="--d:${LANE}px"><span class="anum" data-on aria-hidden="true">3</span><span class="aw">Total reads first</span>`,
    );
    expect(today).toContain(`<span class="arail" style="top:50%;bottom:0;--d:${LANE}px"`);
    expect(today).not.toContain('<div class="aband above">');
  });

  it("keeps the pins and the picture on the plane the outlines are drawn on", () => {
    const plane = today.slice(today.indexOf('<div class="aplane">'));
    expect(plane).toContain('<div class="frame"><img src="today-phone.jpg"');
    expect(plane).toContain(
      'data-pin="today:phone:1" data-name="Pin 1: the order line" style="left:50%;top:50%"',
    );
  });

  it("draws an option's frame the same way when it holds the areas", () => {
    const sectioned = areaQuestion({
      options: [
        { key: "A", name: "Total first", delta: "Moves.", phone: "a.jpg", sections: SECTIONS },
      ],
    });
    const page = pageOf(roundOf(sectioned));
    expect(page).toContain('data-option="A" data-frame="phone" data-areas="2"');
  });

  it("says how the outlines work in the folded how-to", () => {
    expect(html.slice(html.indexOf('<details class="how">'))).toContain(AREAS_HOW);
  });

  it("renders a question without areas exactly as before", () => {
    const plain = roundOf(focusQuestion({ focus: undefined }));
    const withEmpty = roundOf(areaQuestion({ areas: undefined, active: undefined }));
    expect(pageOf(withEmpty)).toBe(pageOf(plain));
    expect(pageOf(plain)).not.toContain('class="aplane"');
    expect(pageOf(plain)).not.toContain(AREAS_HOW);
  });
});

describe("the read-back names the area a mark landed in", () => {
  const ACTIVE = "today:phone:ma1";
  const FAINT = "today:phone:mb2";
  const NONE = "today:phone:mc3";
  const records = {
    [REC]: {
      pins: { [ACTIVE]: "down", [FAINT]: "up", [NONE]: "mixed" },
      marks: {
        [ACTIVE]: { x: 50, y: 50, at: "2026-10-15T18:01:00Z", beforeReveal: false },
        [FAINT]: { x: 50, y: 5, at: "2026-10-15T18:02:00Z", beforeReveal: false },
        [NONE]: { x: 50, y: 80, at: "2026-10-15T18:03:00Z", beforeReveal: false },
      },
      react: {},
    },
  };
  const plan = readback(ROUND, records);
  const body = plan.actions.find((a) => a.kind === "comment")?.body ?? "";

  it("by number and label, and whether this round asks about it", () => {
    expect(body).toContain(
      [
        "Your marks:",
        "- Today, phone · on area 3, “Order card”, which this round asks about (50% across, 50% down) — 👎 don't like",
        "- Today, phone · on area 5, outlined but not asked about this round (50% across, 5% down) — 👍 like",
        "- Today, phone · 50% across, 80% down — ✏︎ would change",
      ].join("\n"),
    );
  });

  it("carries the area into the next round's instruction", () => {
    expect(plan.nextRound[0]?.instruction).toContain(
      "Today, phone on area 3, “Order card”, which this round asks about (50% across, 50% down): don't like",
    );
  });
});

describe("the lint on a round's areas", () => {
  const ui = { text: "Review order", lower: "review order" };
  const env: LintEnv = { pictureSize: () => 1024, sourcesFor: () => "", ui };
  const problems = (q: Record<string, unknown>) =>
    lintDesign({ issue: 5300, round: 2, questions: [q] }, env).filter((p) => /area|active/.test(p));

  it("passes the round above", () => {
    expect(problems(areaQuestion())).toEqual([]);
  });

  it("refuses an active number that isn't an area", () => {
    expect(problems(areaQuestion({ active: [3, 4] }))).toEqual([
      "q1: \"active\" 4 isn't an area's number",
    ]);
  });

  it("refuses an area with neither label nor box, and a label no frame's sections hold", () => {
    expect(problems(areaQuestion({ areas: [{ n: 1, problem: "p" }], active: [] }))).toEqual([
      'q1 area 1: needs a "label" (a section\'s) or a "box"',
    ]);
    expect(
      problems(areaQuestion({ areas: [{ n: 1, label: "Order total", problem: "p" }], active: [] })),
    ).toEqual([
      "q1 area 1: label “Order total” isn't a section on any frame — checked today phone",
    ]);
  });

  it("refuses a callout past six words, an area with no problem, and a line with no clear way", () => {
    const long = {
      n: 3,
      label: "Order card",
      problem: "p",
      words: "one two three four five six seven",
    };
    expect(problems(areaQuestion({ areas: [long], active: [3] }))).toEqual([
      'q1 area 3: "words" is 7 words — keep it to 6',
    ]);
    expect(problems(areaQuestion({ areas: [{ n: 3, label: "Order card" }], active: [] }))).toEqual([
      'q1 area 3: needs "problem" — the open problem it belongs to',
    ]);
    const walled = [
      { n: 1, box: { phone: [10, 40, 30, 20] }, problem: "p", words: "Here" },
      { n: 2, box: { phone: [50, 30, 40, 40] }, problem: "p" },
    ];
    // a box applies on every phone frame, so each one is named
    expect(problems(areaQuestion({ areas: walled, active: [1] }))).toEqual(
      ["today", "option A", "option B"].map(
        (f) =>
          `q1 ${f} phone: area 1's line can't reach its outline without crossing another area — move or resize a box`,
      ),
    );
  });
});

describe("the outlines' contrast", () => {
  // Criterion 7, docs/BRAND.md → Accessibility: a non-text signal holds ≥ 3:1. A frame is the app
  // shot in either theme, so the faint outline is held against both grounds in both of the page's
  // themes; the active one against its own theme's ground, and its ring (that ground) against the
  // other. Faint vs active rides on dashed vs solid and hollow vs filled, never colour alone.
  const css = readFileSync(new URL("../../scripts/steer/page.css", import.meta.url), "utf8");
  const token = (block: string, name: string) =>
    new RegExp(`--${name}: (#[0-9a-f]{6})`).exec(block)?.[1] ?? "";
  const dark = css.slice(0, css.indexOf("@media (prefers-color-scheme: light)"));
  const light = css.slice(css.indexOf(':root[data-theme="light"]'));
  const grounds = { dark: token(dark, "bg"), light: token(light, "bg") };

  it("holds 3:1 on a dark frame and a light one, in both themes", () => {
    for (const block of [dark, light])
      for (const ground of Object.values(grounds))
        expect(contrast(token(block, "area"), ground)).toBeGreaterThanOrEqual(3);
    expect(contrast(token(dark, "area-on"), grounds.dark)).toBeGreaterThanOrEqual(3);
    expect(contrast(token(light, "area-on"), grounds.light)).toBeGreaterThanOrEqual(3);
    expect(contrast(grounds.dark, grounds.light)).toBeGreaterThanOrEqual(3);
  });

  it("tells faint from active by shape, not colour", () => {
    expect(css).toMatch(/\.abox \{[^}]*border: 1\.5px dashed var\(--area\)/);
    expect(css).toMatch(/\.abox\[data-on\] \{[^}]*border: 2\.5px solid var\(--area-on\)/);
    expect(css).toMatch(/\.anum\[data-on\] \{[^}]*background: var\(--area-on\)/);
  });
});
