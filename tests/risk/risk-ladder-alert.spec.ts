import { alertFingerprint, matchesFilter } from "../../src/alerts/alert.js";
import { type RiskReading, readRiskLadder } from "../../src/risk/risk-ladder.js";
import { RISK_ALERT_SOURCE, riskLadderAlert } from "../../src/risk/risk-ladder-alert.js";

const BASELINE = 100_000;
const AT = 1_700_000_000_000;

/** A real reading, produced by the real ladder — never a hand-built one that could drift from it. */
const reading = (drawdownPct: number): RiskReading => {
  const r = readRiskLadder(BASELINE, BASELINE - Math.round(BASELINE * drawdownPct));
  if (!r) throw new Error(`no reading at ${drawdownPct}`);
  return r;
};

describe("riskLadderAlert", () => {
  describe("loudness per rung", () => {
    it("says nothing louder than info while clear", () => {
      expect(riskLadderAlert(reading(0.01), AT).priority).toBe("info");
    });

    it("warns — not blocks — at the soft rung", () => {
      expect(riskLadderAlert(reading(0.04), AT).priority).toBe("warning");
    });

    it("goes critical once the system stops doing what was asked", () => {
      expect(riskLadderAlert(reading(0.06), AT).priority).toBe("critical");
      expect(riskLadderAlert(reading(0.12), AT).priority).toBe("critical");
    });
  });

  describe("what it says", () => {
    it("states what the SYSTEM will do, and that exits stay open", () => {
      const alert = riskLadderAlert(reading(0.06), AT);
      expect(alert.title).toContain("blocked");
      expect(alert.title).toContain("exits stay open");
    });

    it("reports the drawdown, the rung crossed, and the headroom to the next one", () => {
      const alert = riskLadderAlert(reading(0.04), AT);
      expect(alert.body).toContain("Down 4.0%");
      expect(alert.body).toContain("3.0%"); // the watch threshold it crossed
      expect(alert.body).toContain("1.0% of headroom before restricted");
    });

    it("says a good day is a good day rather than printing a negative drawdown", () => {
      expect(riskLadderAlert(reading(-0.02), AT).body).toContain("Up 2.0% on the day");
    });

    it("names no headroom at the bottom rung — there is nowhere further to fall", () => {
      expect(riskLadderAlert(reading(0.2), AT).body).not.toContain("headroom");
    });
  });

  describe("as a citizen of the alert bus", () => {
    it("carries the rung as structured data, so a panel never parses the prose", () => {
      const alert = riskLadderAlert(reading(0.06), AT);
      expect(alert.data).toMatchObject({ tier: "restricted" });
      expect(alert.source).toBe(RISK_ALERT_SOURCE);
      expect(alert.at).toBe(AT);
    });

    it("is reachable by a consumer filtering on this producer alone", () => {
      const alert = riskLadderAlert(reading(0.04), AT);
      expect(matchesFilter(alert, { sources: [RISK_ALERT_SOURCE] })).toBe(true);
      expect(matchesFilter(alert, { sources: ["news-sentiment"] })).toBe(false);
    });

    it("carries no ticker — the ladder is about the account, not a name", () => {
      expect(riskLadderAlert(reading(0.06), AT).symbol).toBeUndefined();
    });

    it("dedupes per rung, so dismissing the warning does not silence the restriction", () => {
      const watch = riskLadderAlert(reading(0.04), AT);
      const restricted = riskLadderAlert(reading(0.06), AT);
      expect(alertFingerprint(watch)).not.toBe(alertFingerprint(restricted));
    });

    it("keeps one fingerprint per rung across re-emissions at different times", () => {
      const first = riskLadderAlert(reading(0.04), AT);
      const later = riskLadderAlert(reading(0.045), AT + 60_000);
      expect(first.id).not.toBe(later.id); // a fresh emission is a fresh id
      expect(alertFingerprint(first)).toBe(alertFingerprint(later)); // …but the same condition
    });
  });
});
