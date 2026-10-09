import { describe, expect, it } from "@rstest/core";
import {
  factWords,
  groupStrings,
  KINDS,
  LONG_AT,
  labelSheet,
  labelsText,
  regionCoverage,
  setAsideWhy,
  stringKind,
  type Walk,
} from "../../scripts/study/harvest-plan.mjs";
import { termList } from "../../scripts/study/lint.mjs";

// The harvest (#4943): the interface's own words, from the census walk. labels.txt is what the leak
// check bans from task text (lint.mjs --labels), so it must hold every name a member could read —
// and nothing that would fail a task for naming the world's data or speaking ordinary prose;
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
  it("bans control names and headings seen on screen — once each, case- and space-blind", () => {
    expect(labelSheet([walk()]).banned).toEqual(["Save", "Open the sheet", "Your book", "Notes"]);
  });

  it("still bans a name no screen showed, but marks it", () => {
    const w = walk({ treeHeadings: ["Hidden part"], clipped: [{ name: "Clipped one" }] });
    expect(labelSheet([w]).unseen).toEqual(["Clipped one", "Feedback", "Hidden part"]);
    // A name seen on another walk is not unseen.
    const seen = walk({ route: "/other", controls: [{ name: "Feedback" }] });
    expect(labelSheet([w, seen]).unseen).not.toContain("Feedback");
  });

  it("adds what operating a control put on screen (a sheet's own buttons), marking tree-only ones", () => {
    const w = walk({
      revealed: [
        {
          via: 'button "Open the sheet"',
          names: ["Close sheet", "Save"],
          treeNames: ["Far away"],
          text: [],
        },
      ],
    });
    const sheet = labelSheet([w]);
    expect(sheet.banned).toContain("Close sheet");
    expect(sheet.banned.filter((l) => l === "Save")).toHaveLength(1);
    expect(sheet.unseen).toContain("Far away");
  });

  it("sets aside the world's data, the facts sheet's words, short words and glyphs — with why", () => {
    const opts = {
      dataNames: ["Sauron", "NVDA", "CRWV $80 PUT · 6 NOV 26"],
      vocabulary: factWords([{ label: "shares of NVDA held" }, { label: "Sauron's net worth" }]),
    };
    expect(setAsideWhy("Sauron", opts)).toBe("data");
    expect(setAsideWhy("NVDA 40", opts)).toBe("data");
    expect(setAsideWhy("CRWV $80 PUT · 6 NOV 26", opts)).toBe("data");
    expect(setAsideWhy("Shares", opts)).toBe("facts sheet");
    expect(setAsideWhy("Net worth", opts)).toBe("facts sheet");
    expect(setAsideWhy("All", opts)).toBe("short");
    expect(setAsideWhy("1M", opts)).toBe("short");
    expect(setAsideWhy("✦", opts)).toBe("no words");
    expect(setAsideWhy("40", opts)).toBe("no words");
    // The interface's own words stay banned, a data name inside them included.
    expect(setAsideWhy("Close all", opts)).toBeNull();
    expect(setAsideWhy("Detail for NVDA", opts)).toBeNull();
    expect(setAsideWhy("Week", opts)).toBeNull();
    // A title the sheet quotes is data, so its words never excuse an interface label.
    const quoted = factWords([{ label: 'when "Wholesale Trade" is' }]);
    expect(quoted).not.toContain("trade");
    expect(setAsideWhy("Trade", { vocabulary: quoted })).toBeNull();
  });

  it("writes what lint.mjs bans as lines, and the rest as comments it ignores", () => {
    const sheet = labelSheet([walk({ controls: [{ name: "Save" }, { name: "All" }] })]);
    const text = labelsText(sheet);
    expect(termList(text)).toEqual(["save", "your book", "notes", "feedback"]);
    expect(text).toContain("# short: All");
  });

  it("never emits a blank line, nor a name lint.mjs would read as a comment", () => {
    const empty = labelSheet([
      walk({ controls: [{ name: "" }, { name: "  " }], offscreen: [], headings: [] }),
    ]);
    expect(empty).toEqual({ banned: [], unseen: [], setAside: [] });
    expect(labelSheet([walk()]).banned.some((l) => l.startsWith("#"))).toBe(false);
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
  // Two rows of a table (groups: the row, then the table) and a card elsewhere on the page.
  const seen = walk({
    text: [
      { kind: "control", text: "ABC", groups: [1, 9] },
      { kind: "text", text: "+$1,056", groups: [1, 9] },
      { kind: "text", text: "XYZ", groups: [2, 9] },
      { kind: "text", text: "-$40", groups: [2, 9] },
      { kind: "text", text: "cost $22.10 · now $23.00", groups: [5] },
    ],
  });

  it("matches as the oracle does: case- and space-blind, a substring of one element's text", () => {
    const out = regionCoverage(
      [
        { id: "a", viewer: "member", answerRegion: ["now $23.00"] },
        { id: "b", viewer: "member", answerRegion: ["abc +$1,056"] },
        { id: "c", viewer: "member", answerRegion: ["not on screen", "COST $22.10"] },
        { id: "d", viewer: "member", answerRegion: ["$9,999"] },
      ],
      [seen as Walk & { viewer: string }],
    );
    expect(out).toEqual({ judged: 4, covered: 3, missing: ["member:d"] });
  });

  it("never bridges two places that share no block", () => {
    const out = regionCoverage(
      [
        { id: "row-to-card", viewer: "member", answerRegion: ["-$40 cost $22.10"] },
        { id: "row-to-row", viewer: "member", answerRegion: ["+$1,056 XYZ"] },
      ],
      [seen as Walk & { viewer: string }],
    );
    // The table holds both rows, as the oracle's table element would; the card is elsewhere.
    expect(out.missing).toEqual(["member:row-to-card"]);
  });

  it("judges a fact only against its own viewer's walks", () => {
    const out = regionCoverage(
      [{ id: "x", viewer: "someone-else", answerRegion: ["ABC"] }],
      [seen as Walk & { viewer: string }],
    );
    expect(out).toEqual({ judged: 0, covered: 0, missing: [] });
  });
});
