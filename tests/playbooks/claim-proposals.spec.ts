import {
  describeNarrowing,
  proposalKey,
  proposalsFor,
  refinementText,
  renderProposals,
} from "../../src/playbooks/claim-proposals.js";
import type { ClaimScore } from "../../src/playbooks/claim-score.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";

/** #5482 slice 5, criterion 6 — what a scored claim implies for a pair, as honest text. A dry run:
 *  it names a change for a reviewer and changes nothing. */

/** The seed with no score attached: the live ledger's scores must never move these specs. */
const UNSCORED: Conviction = {
  ...AI_DIP_2026_10,
  claims: AI_DIP_2026_10.claims.map(({ score: _, ...c }) => c),
};

const scored = (labels: Record<string, ClaimScore["outcome"]>): Conviction => ({
  ...UNSCORED,
  claims: UNSCORED.claims.map((c) => {
    const label = c.statement.match(/^(\d+[a-z]?)\./)?.[1] ?? "";
    const outcome = labels[label];
    if (outcome !== "pass" && outcome !== "fail") return c;
    return {
      ...c,
      score: {
        outcome,
        basis: `the ${label} reading`,
        dueOn: c.scoreBy ?? "2027-01-20",
        scoredOn: "2027-01-21",
      },
    };
  }),
});

describe("proposalsFor", () => {
  it("proposes nothing while every claim is pending or untestable", () => {
    expect(proposalsFor(UNSCORED)).toEqual([]);
    expect(renderProposals(UNSCORED)).toContain("No proposal yet");
  });

  it("after a pass, proposes carrying the fence that claim backs into the pair's own settings", () => {
    const [p, ...rest] = proposalsFor(scored({ "7": "pass" }));
    expect(rest).toEqual([]);
    expect(p).toMatchObject({ kind: "carry-into-playbook", pair: "CRWV-WHEEL", claim: "7" });
    expect(p?.narrowings).toEqual(["strike at or under claim 7's floor band"]);
  });

  it("after a fail, proposes narrowing or retiring each pair the claim backs", () => {
    const proposals = proposalsFor(scored({ "8": "fail" }));
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ kind: "narrow-or-retire", pair: "CRWV-LONG-CALL" });
    expect(proposals[0]?.narrowings).toContain("no expiry before 2027-03-18");
  });

  it("proposes once per pair a claim backs, and nothing for a claim no fence rests on", () => {
    expect(proposalsFor(scored({ "5": "pass" }))).toEqual([]);
    const both = proposalsFor(scored({ "1": "pass", "9": "fail" }));
    expect(both.map((p) => `${p.pair}:${p.kind}`)).toEqual([
      "CRWV-WHEEL:carry-into-playbook",
      "CRWV-LONG-CALL:narrow-or-retire",
    ]);
  });
});

describe("renderProposals — honest text", () => {
  const text = renderProposals(scored({ "7": "pass", "8": "fail" }));

  it("says it is for review, edits nothing, and that adopting one is its own pull request", () => {
    expect(text).toContain("**For review.**");
    expect(text).toContain("edits nothing");
    expect(text).toContain("changes no pair's live settings");
    expect(text).toContain("adopting a proposal is its own pull request");
  });

  it("keys each section by view, claim and pair, for the lane that opens a change PR", () => {
    expect(text).toContain("<!-- refinement: ai-dip-2026-10/7/CRWV-WHEEL -->");
    expect(text).toContain("<!-- refinement: ai-dip-2026-10/8/CRWV-LONG-CALL -->");
  });

  it("states the scorecard and each claim's outcome", () => {
    expect(text).toContain("**Scorecard:** 1 pass / 1 fail / 6 pending · 6 untestable");
    expect(text).toContain("| 7 | pass | 2027-01-21 |");
    expect(text).toContain("| 8 | fail | 2027-01-21 |");
  });

  it("never implies an edge, a size, or a widening", () => {
    expect(text).toContain("not an edge");
    expect(text).toContain("sizes nothing");
    expect(text).toContain("no reason to widen any bound");
    expect(text).toContain("needs its own study");
    expect(text).not.toMatch(/\b(profit|guarantee|will win|increase size|raise size|widen the)\b/i);
  });

  it("offers a failed pair both ways out and keeps exits running", () => {
    expect(text).toContain("Narrow CRWV-LONG-CALL further");
    expect(text).toContain("Retire CRWV-LONG-CALL from this view");
    expect(text).toContain("Exits keep running");
  });

  it("names the command that adopts option 1 as its own held pull request", () => {
    expect(text).toContain(
      "`npm run research:refine -- ai-dip-2026-10/8/CRWV-LONG-CALL` writes it as one ledger line",
    );
  });

  it("is deterministic text, with no timestamp that would make a re-run differ", () => {
    expect(renderProposals(scored({ "7": "pass" }))).toBe(renderProposals(scored({ "7": "pass" })));
  });
});

describe("refinementText — what the scoring pass commits", () => {
  it("is nothing while no claim a fence rests on is decided, so a lane's PR carries no empty file", () => {
    expect(refinementText(UNSCORED)).toBeUndefined();
    expect(refinementText(scored({ "5": "pass" }))).toBeUndefined();
  });

  it("is the reviewer's text once one is", () => {
    const decided = scored({ "2a": "fail" });
    expect(refinementText(decided)).toBe(renderProposals(decided));
    expect(refinementText(decided)).toContain("### CRWV-WHEEL · claim 2a failed");
  });

  it("keys a proposal the same way every time", () => {
    const [p] = proposalsFor(scored({ "2a": "fail" }));
    expect(p && proposalKey(UNSCORED, p)).toBe("ai-dip-2026-10/2a/CRWV-WHEEL");
  });
});

describe("describeNarrowing", () => {
  it("says each kind in a member's words", () => {
    expect(describeNarrowing({ kind: "expiry-from", day: "2027-03-18" })).toBe(
      "no expiry before 2027-03-18",
    );
    expect(describeNarrowing({ kind: "strike-ceiling", ceiling: 53.5 })).toBe(
      "no strike above $53.50",
    );
    expect(describeNarrowing({ kind: "contracts", max: 1 })).toBe("at most 1 contract");
    expect(describeNarrowing({ kind: "dte", min: 30 })).toBe("days to expiry 30 to any");
    expect(describeNarrowing({ kind: "quiet", sessionsAfterPrint: 6 })).toContain("6 sessions");
  });
});
