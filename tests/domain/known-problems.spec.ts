/**
 * Known problems — the IA ledger rows as the app reads them (#8005 slice 7). A match rides the
 * draft to the browser and back, so these pin that it is re-checked against the ledger, that the
 * issue line is built from the ledger's words, and that evidence counts members once each.
 *
 * EARS lines this spec pins:
 *   - WHEN a filing POST names a row the ledger does not hold, the match SHALL be dropped.
 *   - The issue's line SHALL carry only the ledger's own words and a plan number, never posted text.
 *   - WHEN filings match a row, its evidence SHALL count each member once, by their opaque id.
 */
import {
  evidenceByRow,
  fixFor,
  fixPlansFor,
  KNOWN_PROBLEMS,
  knownProblem,
  matchMeta,
  matchWords,
  parseProblemMatch,
  planFor,
  problemLabel,
} from "../../src/domain/known-problems.js";

describe("known problems", () => {
  describe("when the ledger is read", () => {
    it("holds the §10 rows by id", () => {
      expect(KNOWN_PROBLEMS.length).toBeGreaterThanOrEqual(17);
      expect(knownProblem("U1")?.problem).toBe("One history, three homes");
      expect(knownProblem("U3")?.plans).toEqual([5206]);
      expect(knownProblem("U99")).toBeUndefined();
    });
  });

  describe("when a match comes back on a filing", () => {
    it("keeps a real row, normalised, and a plan number", () => {
      expect(parseProblemMatch({ row: " u1 " })).toEqual({ row: "U1" });
      expect(parseProblemMatch({ row: "U3", plan: "#5206" })).toEqual({ row: "U3", plan: 5206 });
      expect(parseProblemMatch({ plan: 6948 })).toEqual({ plan: 6948 });
    });

    it("drops a row the ledger does not hold, and anything that is not a match at all", () => {
      expect(parseProblemMatch({ row: "U99" })).toBeUndefined();
      expect(parseProblemMatch({ row: "U1; drop table" })).toBeUndefined();
      expect(parseProblemMatch({ row: "U1", plan: -4 })).toEqual({ row: "U1" });
    });

    it("keeps a plan beside a row only when the row lists it (red-team, 2026-11-23)", () => {
      expect(parseProblemMatch({ row: "U3", plan: 1 })).toEqual({ row: "U3" });
      expect(parseProblemMatch({ row: "U1", plan: 7000 })).toEqual({ row: "U1" });
      expect(parseProblemMatch({ row: "U3", plan: 5206 })).toEqual({ row: "U3", plan: 5206 });
      expect(parseProblemMatch({ plan: 1.5 })).toBeUndefined();
      expect(parseProblemMatch("U1")).toBeUndefined();
      expect(parseProblemMatch(undefined)).toBeUndefined();
    });
  });

  describe("when a matched filing is written", () => {
    it("labels it by row, so GitHub counts it beside member-<id>", () => {
      expect(problemLabel("U1")).toBe("ia-U1");
    });

    it("says only what happened, in the ledger's words, with the row's own plan", () => {
      expect(planFor({ row: "U3" })).toBe(5206);
      // a row with two owner plans names neither: there is no single plan to point at
      const twoOwners = KNOWN_PROBLEMS.find((r) => r.plans.length > 1);
      if (twoOwners) expect(planFor({ row: twoOwners.id })).toBeUndefined();
      expect(matchMeta({ row: "U3" })).toEqual([
        "Known problem",
        "Matched in chat to U3 in docs/IA.md §10: A section switch that can't hold its sections at 390 · plan #5206.",
      ]);
      expect(matchMeta({ plan: 6948 })).toEqual(["Open plan", "Matched in chat to plan #6948."]);
      expect(matchMeta({ row: "U1" }).join(" ")).not.toMatch(/not a new feature|evidence/i);
    });

    it("names the problem by its title for the card, never the row code or its engineer prose", () => {
      expect(matchWords({ row: "U1" })).toMatch(/^a known problem: One history, three homes/);
      expect(matchWords({ row: "U1" })).not.toMatch(/U1|each list orders/);
      expect(matchWords({ row: "U3" })).toContain("· plan #5206");
      expect(matchWords({ plan: 7031 }, '"Test every build"')).toBe(
        'an open plan: #7031 "Test every build"',
      );
    });
  });

  describe("when evidence is counted", () => {
    it("counts each member once per row by opaque id, every filing, and nothing unmatched", () => {
      const evidence = evidenceByRow([
        { opaqueMemberId: "aa11", match: { row: "U1" } },
        { opaqueMemberId: "aa11", match: { row: "U1" } },
        { opaqueMemberId: "bb22", match: { row: "U1", plan: 1 } },
        { opaqueMemberId: "bb22", match: { row: "U3" } },
        { opaqueMemberId: "cc33", match: { plan: 6948 } },
        { opaqueMemberId: "dd44", match: { row: "U99" } },
        { opaqueMemberId: "ee55" },
      ]);
      expect(evidence.get("U1")).toEqual({ members: 2, filings: 3 });
      expect(evidence.get("U3")).toEqual({ members: 1, filings: 1 });
      expect([...evidence.keys()].sort()).toEqual(["U1", "U3"]);
    });
  });
});

describe("known problems — try it, once the fix ships", () => {
  const never = () => false;

  it("reads a matched filing as fixed when its row's plan closed as built, with the row's first screen", () => {
    const fix = fixFor({ row: "U3" }, (plan) => plan === 5206);
    expect(fix?.problem).toBe("A section switch that can't hold its sections at 390");
    expect(fix?.tryAt).toEqual(knownProblem("U3")?.screens[0]);
    expect(fix?.tryAt?.route).not.toContain("account=");
  });

  it("reads a plan-only match as fixed once that plan ships, with no screen to offer", () => {
    expect(fixFor({ plan: 7000 }, (plan) => plan === 7000)).toEqual({ problem: "plan #7000" });
  });

  it("is not fixed when only an owner plan of a waiting row closed", () => {
    const owned = KNOWN_PROBLEMS.find((r) => r.state === "waiting" && r.plans.length > 0);
    expect(owned, "a waiting row with an owner plan to test against").toBeDefined();
    if (!owned) return;
    expect(fixPlansFor({ row: owned.id, plan: owned.plans[0] })).toEqual([]);
    expect(fixFor({ row: owned.id, plan: owned.plans[0] }, () => true)).toBeUndefined();
  });

  it("reads a row through the one overhaul plan filed for it", () => {
    for (const row of KNOWN_PROBLEMS.filter((r) => r.state === "plan filed")) {
      expect(fixPlansFor({ row: row.id })).toEqual(row.plans);
    }
  });

  it("is not fixed while the plan is open, and nothing is fixed without a match", () => {
    expect(fixFor({ row: "U3" }, never)).toBeUndefined();
    const bare = KNOWN_PROBLEMS.find((r) => r.state === "waiting" && r.plans.length === 0);
    if (bare) expect(fixFor({ row: bare.id }, () => true)).toBeUndefined();
    expect(fixFor(undefined, () => true)).toBeUndefined();
  });
});
