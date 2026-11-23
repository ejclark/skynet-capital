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
  KNOWN_PROBLEMS,
  knownProblem,
  matchLine,
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
      expect(parseProblemMatch({ plan: 1.5 })).toBeUndefined();
      expect(parseProblemMatch("U1")).toBeUndefined();
      expect(parseProblemMatch(undefined)).toBeUndefined();
    });
  });

  describe("when a matched filing is written", () => {
    it("labels it by row, so GitHub counts it beside member-<id>", () => {
      expect(problemLabel("U1")).toBe("ia-U1");
    });

    it("says what it is evidence on in the ledger's words, with the row's own plan", () => {
      expect(planFor({ row: "U3" })).toBe(5206);
      expect(planFor({ row: "U15" })).toBeUndefined(); // two owners: no single plan to name
      expect(planFor({ row: "U1", plan: 7000 })).toBe(7000);
      expect(matchLine({ row: "U3" })).toBe(
        "U3 in docs/IA.md §10: A section switch that can't hold its sections at 390 · plan #5206. Evidence on a known problem, not a new feature.",
      );
      expect(matchLine({ plan: 6948 })).toBe(
        "plan #6948. Evidence on a known problem, not a new feature.",
      );
    });

    it("names the problem in plain words for the card, never the row code", () => {
      const words = matchWords({ row: "U1" });
      expect(words).toContain("One history, three homes");
      expect(words).toContain("each list orders with their own controls");
      expect(words).not.toContain("U1");
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
