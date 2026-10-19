import {
  type Conviction,
  type ConvictionClaim,
  convictionProblems,
} from "../../src/playbooks/conviction-record.js";
import { findPair } from "../../src/playbooks/pair-table.js";

/**
 * #5482 slice 2 — the rules a conviction record must keep before it may be stored. Each rule is
 * one spec: criterion 1 (claims, tags, evidence, a dated falsifier), the three buckets, the check
 * date after the statement, and steering only ◆ pairs.
 */

const claim = (over: Partial<ConvictionClaim> = {}): ConvictionClaim => ({
  tag: "underrated",
  statement: "CRWV's print moves run larger than priced.",
  bucket: "tested",
  evidence: "Q2: ~15.5% implied, ~18.6% realized.",
  falsifier: "The next print moves less than its straddle.",
  scoreBy: "2026-11-17",
  ...over,
});

const view = (over: Partial<Conviction> = {}): Conviction => ({
  id: "my-view",
  owner: "Eric",
  statedOn: "2026-10-16",
  checkOn: "2027-01-29",
  claims: [claim()],
  steers: ["CRWV-WHEEL"],
  ...over,
});

const problems = (over: Partial<Conviction> = {}) => convictionProblems(view(over));

describe("convictionProblems", () => {
  it("passes a well-formed record", () => {
    expect(problems()).toEqual([]);
  });

  describe("the record", () => {
    it("needs a kebab-case id, 64 characters at most", () => {
      expect(problems({ id: "My View" })).toContain("id must be kebab-case, 64 characters at most");
      expect(problems({ id: "a".repeat(65) })).toContain(
        "id must be kebab-case, 64 characters at most",
      );
      expect(problems({ id: "ai-dip-2026-10" })).toEqual([]);
    });

    it("needs an owner", () => {
      expect(problems({ owner: "  " })).toContain("owner is empty");
    });

    it("needs real calendar days", () => {
      expect(problems({ statedOn: "2026-02-30" })).toContain("statedOn is not a calendar day");
      expect(problems({ checkOn: "soon" })).toContain("checkOn is not a calendar day");
    });

    it("is checked after the day it was stated, never on it", () => {
      expect(problems({ checkOn: "2026-10-16" })).toContain("checkOn must come after statedOn");
      expect(problems({ checkOn: "2026-10-01" })).toContain("checkOn must come after statedOn");
    });
  });

  describe("claims (criterion 1)", () => {
    it("needs at least one", () => {
      expect(problems({ claims: [] })).toContain("a conviction needs at least one claim");
    });

    it("tags each one missing, underrated or overrated", () => {
      for (const tag of ["missing", "underrated", "overrated"] as const) {
        expect(problems({ claims: [claim({ tag })] })).toEqual([]);
      }
      expect(problems({ claims: [claim({ tag: "obvious" as never })] })).toContain(
        "claim 1: tag must be missing, underrated, overrated",
      );
    });

    it("puts each one in a bucket: tested, forward or untestable", () => {
      expect(problems({ claims: [claim({ bucket: "vibes" as never })] })).toContain(
        "claim 1: bucket must be tested, forward, untestable",
      );
    });

    it("needs a statement, evidence and a falsifier, numbered by position", () => {
      const out = problems({
        claims: [claim(), claim({ statement: "", evidence: " ", falsifier: "" })],
      });
      expect(out).toEqual(
        expect.arrayContaining([
          "claim 2: statement is empty",
          "claim 2: evidence is empty",
          "claim 2: falsifier is empty",
        ]),
      );
      expect(out.some((p) => p.startsWith("claim 1"))).toBe(false);
    });

    it("dates every falsifier: a scoreBy day, or a day named in its words", () => {
      const undated = claim({ scoreBy: undefined, falsifier: "It turns out wrong." });
      expect(problems({ claims: [undated] })).toContain(
        "claim 1: the falsifier is not dated (name a day, or set scoreBy)",
      );
      const named = claim({ scoreBy: undefined, falsifier: "No close above $63 by 2027-02-01." });
      expect(problems({ claims: [named] })).toEqual([]);
      const fake = claim({ scoreBy: undefined, falsifier: "Wrong by 2027-02-30." });
      expect(problems({ claims: [fake] })).toContain(
        "claim 1: the falsifier is not dated (name a day, or set scoreBy)",
      );
    });

    it("scores a claim on a real day, never before it was stated", () => {
      expect(problems({ claims: [claim({ scoreBy: "2026-13-01" })] })).toContain(
        "claim 1: scoreBy is not a calendar day",
      );
      expect(problems({ claims: [claim({ scoreBy: "2026-10-15" })] })).toContain(
        "claim 1: scored before it was stated",
      );
    });

    it("gives a forward test a scoreBy day", () => {
      const forward = claim({
        bucket: "forward",
        scoreBy: undefined,
        falsifier: "Positive by 2026-11-25.",
      });
      expect(problems({ claims: [forward] })).toContain(
        "claim 1: a forward test needs a scoreBy day",
      );
    });

    it("lets an untestable claim stand with a dated falsifier and no score day", () => {
      const untestable = claim({
        bucket: "untestable",
        scoreBy: undefined,
        falsifier: "Nothing can by 2027-01-29.",
      });
      expect(problems({ claims: [untestable] })).toEqual([]);
    });
  });

  describe("steering", () => {
    it("steers at least one pair, each once", () => {
      expect(problems({ steers: [] })).toContain("steers no pair");
      expect(problems({ steers: ["CRWV-WHEEL", "CRWV-WHEEL"] })).toContain("steers a pair twice");
    });

    it("steers only pairs the table holds", () => {
      expect(problems({ steers: ["CRWV-STRADDLE"] })).toContain(
        "steers CRWV-STRADDLE, which no pair row holds",
      );
    });

    it("steers only ◆ conviction pairs: a ✓ pair's study is cited, never counted twice", () => {
      expect(findPair("S1-NVDA")?.evidence.status).toBe("researched");
      expect(problems({ steers: ["S1-NVDA"] })).toContain(
        "steers S1-NVDA, which is not a ◆ conviction pair (cite its study instead)",
      );
      expect(problems({ steers: ["CRWV-WHEEL", "CRWV-LONG-CALL"] })).toEqual([]);
    });

    it("reads pairs through the lookup it is given", () => {
      expect(convictionProblems(view(), () => undefined)).toContain(
        "steers CRWV-WHEEL, which no pair row holds",
      );
    });
  });
});
