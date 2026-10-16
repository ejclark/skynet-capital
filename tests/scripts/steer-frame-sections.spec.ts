import { describe, expect, it } from "@rstest/core";
import { sectionAt, sectionsFromBoxes } from "../../scripts/steer/frame-sections.mjs";
import { decisionMarks, markLine } from "../../scripts/steer/marks.mjs";

// A mark is a spot Eric chose, saved as % of the frame. The shoot script records where each named
// part of the screen sits beside the frame, so the read-back can say which part he marked — "on
// “Place order”" — instead of a position he would have to measure.

const frame = { width: 400, height: 800 };

describe("sections from the page's boxes", () => {
  it("turns page boxes into % of the frame, keeps a few words of each label, drops the unusable", () => {
    const got = sectionsFromBoxes(
      [
        { text: "  Place   order ", x: 20, y: 400, w: 160, h: 40 },
        {
          text: "The order sentence: sell 1 CRWV $80 put for $2.55, good for the day",
          x: 0,
          y: 360,
          w: 400,
          h: 120,
        },
        { text: "", x: 0, y: 0, w: 400, h: 100 },
        { text: "No size", x: 10, y: 10, w: 0, h: 20 },
        { text: "Below the frame", x: 0, y: 900, w: 400, h: 50 },
        { text: "  Place   order ", x: 20, y: 400, w: 160, h: 40 },
      ],
      frame,
    );
    expect(got).toEqual([
      { label: "Place order", x: 5, y: 50, w: 40, h: 5 },
      { label: "The order sentence: sell 1 CRWV $80 put for $2.5", x: 0, y: 45, w: 100, h: 15 },
    ]);
  });

  it("clips a box that runs past the frame's foot", () => {
    expect(sectionsFromBoxes([{ text: "Footer", x: 0, y: 760, w: 400, h: 100 }], frame)).toEqual([
      { label: "Footer", x: 0, y: 95, w: 100, h: 5 },
    ]);
  });
});

describe("the part a spot lands on", () => {
  const sections = [
    { label: "The order card", x: 0, y: 40, w: 100, h: 30 },
    { label: "Place order", x: 5, y: 60, w: 40, h: 5 },
  ];

  it("names the smallest part that holds the spot", () => {
    expect(sectionAt(sections, 10, 62)).toBe("Place order");
    expect(sectionAt(sections, 80, 45)).toBe("The order card");
  });

  it("names nothing outside every part, or with no sections", () => {
    expect(sectionAt(sections, 50, 10)).toBeNull();
    expect(sectionAt(undefined, 50, 50)).toBeNull();
  });
});

describe("a mark read back by the part it sits on", () => {
  const sections = [{ label: "Place order", x: 5, y: 60, w: 40, h: 5 }];
  const d = {
    key: "q1",
    problems: true,
    opening: true,
    today: {
      pictures: [{ src: "p.jpg", alt: "Today", size: "phone" }],
      clean: [{ src: "c.jpg", alt: "Today, before any pin", size: "phone", sections }],
    },
    options: [],
  };
  const r = {
    pins: { "today:phone:ma1": "down", "today:phone:mb2": "up" },
    marks: {
      "today:phone:ma1": { x: 10, y: 62, at: "2026-10-14T15:00:00Z", beforeReveal: true },
      "today:phone:mb2": { x: 80, y: 10, at: "2026-10-14T15:01:00Z", beforeReveal: true },
    },
  };

  it("says the part's name with the position beside it, and the position alone off every part", () => {
    // biome-ignore lint/suspicious/noExplicitAny: a minimal decision, only the fields marks read
    const lines = decisionMarks(d as any, r as any).map(markLine);
    expect(lines[0]).toBe(
      "- Today, phone · on “Place order” (10% across, 62% down) — 👎 don't like (before Claude's problems were shown)",
    );
    expect(lines[1]).toBe(
      "- Today, phone · 80% across, 10% down — 👍 like (before Claude's problems were shown)",
    );
  });
});
