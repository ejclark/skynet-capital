import { positionGuidance } from "../../src/options/position-guidance.js";
import { guidanceToMarkdown } from "../../src/options/position-guidance-markdown.js";
import { inputs } from "./position-guidance-fixture.js";

/**
 * The guidance's markdown template (#3729): the section order is a contract — a member scanning the
 * same sections in the same place every visit is the whole point of a fixed template.
 */

const HEADINGS = [
  "### 1 · Pulse",
  "### 2 · Your stake",
  "### 3 · The calls",
  "### 4 · Until / waiting on",
  "### 5 · Expiry dates",
  "### 6 · Strike ladder",
  "### 7 · What changed since you last looked",
  "### 8 · Assumptions & disclosure",
];

describe("guidanceToMarkdown", () => {
  const md = guidanceToMarkdown(positionGuidance(inputs()));

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
    const bare = guidanceToMarkdown(positionGuidance(inputs({ chain: [], pulse: [] })));
    expect(bare).toContain("_No pulse reported — treat every number below as unverified._");
    expect(bare).toContain("_No strike passes our checks — see the calls above for why._");
    expect(bare.split("\n").filter((l) => l.startsWith("### "))).toEqual(HEADINGS);
  });

  it("dates the waiting-on list and marks the hold decision", () => {
    expect(md).toContain("- [ ] **Nov 2** — Decide whether to hold through earnings");
  });

  it("distinguishes a first visit from 'nothing moved'", () => {
    expect(md).toContain("_First look at this symbol — nothing to compare yet._");
    expect(guidanceToMarkdown(positionGuidance(inputs()), [])).toContain(
      "_Nothing moved since you last looked._",
    );
  });
});

describe("plain language (#3729 step 2b)", () => {
  it("shows no trading jargon or rule ids to the member", () => {
    const md = guidanceToMarkdown(positionGuidance(inputs()));
    for (const word of ["WRITE", " print", "DTE", "PRICE-AT-BID", "lognormal", "annualized"]) {
      expect(md).not.toContain(word);
    }
    expect(md).toContain("Reasonable now");
  });
});
