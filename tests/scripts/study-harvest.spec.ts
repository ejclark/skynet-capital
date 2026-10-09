import { describe, expect, it } from "@rstest/core";
import {
  groupStrings,
  KINDS,
  LONG_AT,
  labelLines,
  regionCoverage,
  stringKind,
  type Walk,
} from "../../scripts/study/harvest-plan.mjs";

// The harvest (#4943): the interface's own words, from the census walk. labels.txt is what the leak
// check bans from task text (lint.mjs --labels), so it must hold every name a member could read;
// strings.json is the words pass's input, by route and kind.

const walk = (over: Partial<Walk> = {}): Walk => ({
  route: "/page",
  viewport: "phone",
  viewer: "member",
  controls: [{ name: "Save" }, { name: "save " }, { name: "Open the sheet" }],
  offscreen: [{ name: "Feedback" }],
  headings: ["Your book", "#Notes"],
  text: [],
  ...over,
});

describe("labels.txt", () => {
  it("lists control names, off-screen ones too, then headings — once each, case- and space-blind", () => {
    expect(labelLines([walk()])).toEqual([
      "Save",
      "Open the sheet",
      "Feedback",
      "Your book",
      "Notes",
    ]);
  });

  it("adds what operating a control revealed (a sheet's own buttons)", () => {
    const w = walk({
      revealed: [{ via: 'button "Open the sheet"', names: ["Close sheet", "Save"], text: [] }],
    });
    expect(labelLines([w])).toContain("Close sheet");
    expect(labelLines([w]).filter((l) => l === "Save")).toHaveLength(1);
  });

  it("keeps a heading-like name lint.mjs would otherwise read as a comment", () => {
    // termList drops lines starting with "#": the label must still be matched.
    expect(labelLines([walk()]).some((l) => l.startsWith("#"))).toBe(false);
  });

  it("never emits a blank line", () => {
    expect(
      labelLines([walk({ controls: [{ name: "" }, { name: "  " }], offscreen: [], headings: [] })]),
    ).toEqual([]);
  });
});

describe("strings.json", () => {
  it("sorts a unit into heading, button/link, label, short status or long text", () => {
    expect(stringKind({ kind: "heading", text: "Positions" })).toBe("heading");
    expect(stringKind({ kind: "control", text: "Review" })).toBe("buttonOrLink");
    expect(stringKind({ kind: "label", text: "Account" })).toBe("label");
    expect(stringKind({ kind: "text", text: "x".repeat(LONG_AT - 1) })).toBe("shortStatus");
    expect(stringKind({ kind: "text", text: "x".repeat(LONG_AT) })).toBe("longText");
    expect(KINDS).toHaveLength(5);
  });

  it("groups by route and kind, each string once with every viewport that showed it", () => {
    const phone = walk({
      text: [
        { kind: "heading", text: "Positions" },
        { kind: "text", text: " 3  open " },
      ],
    });
    const desktop = walk({ viewport: "desktop", text: [{ kind: "heading", text: "Positions" }] });
    const other = walk({ route: "/other", text: [{ kind: "heading", text: "Positions" }] });
    const out = groupStrings([phone, desktop, other]);
    expect(out.routes["/page"]?.heading).toEqual([
      { text: "Positions", viewports: ["phone", "desktop"] },
    ]);
    expect(out.routes["/page"]?.shortStatus).toEqual([{ text: "3 open", viewports: ["phone"] }]);
    expect(out.routes["/other"]?.heading).toHaveLength(1);
    // Counts are distinct strings across routes.
    expect(out.counts).toMatchObject({ heading: 1, shortStatus: 1, buttonOrLink: 0 });
  });

  it("includes text a control revealed on the same page", () => {
    const w = walk({
      revealed: [{ names: [], text: [{ kind: "text", text: "Why it was sold" }] }],
    });
    expect(groupStrings([w]).routes["/page"]?.shortStatus.map((s) => s.text)).toEqual([
      "Why it was sold",
    ]);
  });
});

describe("answer regions against what the walk saw", () => {
  const seen = walk({
    text: [
      { kind: "control", text: "ABC" },
      { kind: "text", text: "+$1,056" },
      { kind: "text", text: "cost $22.10 · now $23.00" },
    ],
  });

  it("matches as the oracle does: case- and space-blind, a substring, across adjacent units", () => {
    const out = regionCoverage(
      [
        { id: "a", viewer: "member", answerRegion: ["now $23.00"] },
        { id: "b", viewer: "member", answerRegion: ["abc +$1,056"] },
        { id: "c", viewer: "member", answerRegion: ["not on screen", "COST $22.10"] },
        { id: "d", viewer: "member", answerRegion: ["$9,999"] },
      ],
      [seen as Walk & { viewer: string }],
    );
    expect(out).toEqual({ judged: 4, covered: 3, missing: ["d"] });
  });

  it("judges a fact only against its own viewer's walks", () => {
    const out = regionCoverage(
      [{ id: "x", viewer: "someone-else", answerRegion: ["ABC"] }],
      [seen as Walk & { viewer: string }],
    );
    expect(out).toEqual({ judged: 0, covered: 0, missing: [] });
  });
});
