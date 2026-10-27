import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadProposals, parseProposals, pendingFor } from "../../scripts/conviction-proposals.mjs";

// The hand-off from a conviction's proposed forward tests to the event lane that owns each row
// (#5482 criterion 2). A proposal is answered by its token in the lane's own fragment or ledger.
const DOC = [
  "# A view",
  "",
  "## Forward tests to register",
  "",
  "Prose before the table.",
  "",
  "| Id | Fragment | Hypothesis | Prediction | Kill switch | Score by | Claim |",
  "|---|---|---|---|---|---|---|",
  "| P1 | `crwv-print` | Bleed repeats | Negative | Positive | 2026-11-25 | 2b |",
  "| P2 | `midterms` | Relief | Basket beats QQQ | At or under | 2026-11-09 | 4 |",
  "| | `nvda-print` | none new | Already FT-nvda-print-3 | | | 5 |",
  "",
  "## The claims in full",
  "",
  "| Id | Fragment |",
  "|---|---|",
  "| P9 | `not-a-proposal` |",
].join("\n");

describe("conviction proposals", () => {
  it("reads each Id'd row under the section as a proposal with its token, and skips citations", () => {
    const got = parseProposals("ai-dip", DOC);
    expect(got.map((p) => [p.key, p.fragment, p.scoreBy])).toEqual([
      ["ai-dip/P1", "crwv-print", "2026-11-25"],
      ["ai-dip/P2", "midterms", "2026-11-09"],
    ]);
  });

  it("a doc without the section, or a table without an Id column, proposes nothing", () => {
    expect(parseProposals("x", "# nothing here")).toEqual([]);
    expect(
      parseProposals("x", "## Forward tests to register\n\n| Fragment |\n|---|\n| `a` |"),
    ).toEqual([]);
  });

  it("is pending for its own event until the token appears in the lane's fragment or ledger", () => {
    const proposals = parseProposals("ai-dip", DOC);
    expect(pendingFor("crwv-print", "2026-10-27", proposals, "").map((p) => p.key)).toEqual([
      "ai-dip/P1",
    ]);
    const registered = "| FT-crwv-print-3 | registered from conviction proposal ai-dip/P1 | … |";
    expect(pendingFor("crwv-print", "2026-10-27", proposals, registered)).toEqual([]);
    const declined = "| 2026-10-28 | D-12 | ai-dip/P1 declined: duplicates FT-crwv-print-2 | — |";
    expect(pendingFor("crwv-print", "2026-10-27", proposals, declined)).toEqual([]);
  });

  it("drops a proposal once its score-by date has passed", () => {
    const proposals = parseProposals("ai-dip", DOC);
    expect(pendingFor("midterms", "2026-11-09", proposals, "")).toHaveLength(1);
    expect(pendingFor("midterms", "2026-11-10", proposals, "")).toEqual([]);
  });

  it("every live proposal names an event this repo has a ledger for", () => {
    const proposals = loadProposals();
    expect(proposals.length).toBeGreaterThan(0);
    for (const p of proposals) {
      expect(existsSync(join("docs/research/events", `${p.fragment}.md`)), p.key).toBe(true);
      expect(p.scoreBy, p.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
