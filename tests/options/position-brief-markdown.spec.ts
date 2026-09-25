import { positionBrief } from "../../src/options/position-brief.js";
import { briefToMarkdown } from "../../src/options/position-brief-markdown.js";
import { inputs } from "./position-brief-fixture.js";

/**
 * The Brief's markdown template (#3729): the section order is a contract — a member scanning the
 * same sections in the same place every visit is the whole point of a fixed template.
 */

const HEADINGS = [
  "### 1 · Pulse",
  "### 2 · Your stake",
  "### 3 · The calls",
  "### 4 · Until / waiting on",
  "### 5 · DTE strip",
  "### 6 · Strike ladder",
  "### 7 · What changed since you last looked",
  "### 8 · Assumptions & disclosure",
];

describe("briefToMarkdown", () => {
  const md = briefToMarkdown(positionBrief(inputs()));

  it("opens with the symbol, spot and as-of line", () => {
    expect(md.split("\n")[0]).toBe("## CRWV · $80.00 · as of 2026-09-25T18:00:00Z · market open");
  });

  it("renders every section, in the fixed order", () => {
    const found = md.split("\n").filter((l) => l.startsWith("### "));
    expect(found).toEqual(HEADINGS);
  });

  it("never lets colour carry a grade — each confidence is dots plus a word", () => {
    expect(md).toContain("●●○ medium");
    expect(md).toContain("●○○ low");
  });

  it("says why an empty section is empty rather than dropping it", () => {
    const bare = briefToMarkdown(positionBrief(inputs({ chain: [], pulse: [] })));
    expect(bare).toContain("_No pulse reported — treat every number below as unverified._");
    expect(bare).toContain("_No strike passes the rules — see the calls above for why._");
    expect(bare.split("\n").filter((l) => l.startsWith("### "))).toEqual(HEADINGS);
  });

  it("dates the waiting-on list and marks the hold decision", () => {
    expect(md).toContain("- [ ] **2026-11-02** — Hold-through-the-print decision falls due (S2)");
  });

  it("distinguishes a first visit from 'nothing moved'", () => {
    expect(md).toContain("_First Brief for this symbol — nothing to compare yet._");
    expect(briefToMarkdown(positionBrief(inputs()), [])).toContain(
      "_Nothing moved since you last looked._",
    );
  });
});
