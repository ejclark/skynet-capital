import { structureLabel } from "../../src/options/candidate-mechanics.js";
import {
  OUTLOOK_DIRECTIONS,
  OUTLOOK_HORIZON_DAYS,
  OUTLOOK_MAGNITUDES,
  type VolRegimeReading,
} from "../../src/options/outlook.js";
import type { CandidateAbsence } from "../../src/options/structure-candidates.js";
import { absenceWords, boundWords, volRegimeWords } from "../../src/options/structure-words.js";

/**
 * The words a ranked list is read in. The point of these cases is the ONE rule the plan's criteria
 * state: an absent value reads as absent WITH A REASON, never as a dash or a zero. So every machine
 * reason the engine can emit is asserted to have a sentence, and both unbounded cases are asserted
 * to say so in words rather than in a sampled number.
 */

const EVERY_ABSENCE: readonly CandidateAbsence[] = [
  "no-expected-move",
  "no-expiry-at-horizon",
  "missing-strike",
  "strikes-collapsed",
  "strike-out-of-reach",
  "missing-quote",
  "missing-iv",
  "not-scoreable",
];

describe("absenceWords", () => {
  it("has a sentence for every reason the engine can emit", () => {
    for (const reason of EVERY_ABSENCE) {
      const words = absenceWords(reason);
      expect(words.length).toBeGreaterThan(10);
      expect(words).not.toContain("—");
    }
  });

  it("gives each reason its own distinct words", () => {
    const all = EVERY_ABSENCE.map(absenceWords);
    expect(new Set(all).size).toBe(EVERY_ABSENCE.length);
  });

  it("says whose limit it is — the listing's, or our own read", () => {
    expect(absenceWords("strike-out-of-reach")).toContain("listed strike");
    expect(absenceWords("missing-iv")).toContain("couldn't solve");
  });

  it("never tells the reader what to do", () => {
    for (const reason of EVERY_ABSENCE) {
      expect(absenceWords(reason)).not.toMatch(/\byou should\b|\btry instead\b|\bbuy\b|\bsell\b/i);
    }
  });

  // This value arrives over the wire: a reason added to the engine and deployed before a client
  // reload would otherwise render as an empty string after the dash — the blank this module exists
  // to prevent, reappearing by the one route nobody looks at.
  it("still answers in words for a reason it has none for", () => {
    const unknown = absenceWords("something-the-engine-added" as CandidateAbsence);
    expect(unknown.length).toBeGreaterThan(10);
    expect(unknown).toContain("doesn't know yet");
  });
});

describe("the vocabulary the pane and the route share", () => {
  it("offers every direction and magnitude the engine's own types name", () => {
    expect([...OUTLOOK_DIRECTIONS].sort()).toEqual(["bearish", "bullish", "neutral"]);
    expect([...OUTLOOK_MAGNITUDES].sort()).toEqual(["moderate", "slight", "strong"]);
  });

  // The pane renders one segment per entry and the route accepts exactly these — a horizon offered
  // on one side and refused on the other turns every ask into a note blaming the broker.
  it("offers horizons that are whole, positive days, ascending", () => {
    expect(OUTLOOK_HORIZON_DAYS.length).toBeGreaterThan(0);
    for (const days of OUTLOOK_HORIZON_DAYS) {
      expect(Number.isInteger(days)).toBe(true);
      expect(days).toBeGreaterThan(0);
    }
    expect([...OUTLOOK_HORIZON_DAYS]).toEqual([...OUTLOOK_HORIZON_DAYS].sort((a, b) => a - b));
  });
});

describe("volRegimeWords", () => {
  it("names the regime and the rank when one could be read", () => {
    const reading: VolRegimeReading = { kind: "regime", regime: "rich", rank: 72.4 };
    expect(volRegimeWords(reading)).toBe("Premium is rich for this name — IV rank 72.");
  });

  it("says why no rank could be read, rather than calling it middling", () => {
    const reading: VolRegimeReading = { kind: "absent", reason: "no-iv-history" };
    const words = volRegimeWords(reading);
    expect(words).toContain("can't be called rich or cheap");
    expect(words).toContain("no IV history is recorded");
    expect(words).not.toContain("middling");
  });

  it("carries words for every absence iv-rank itself can report", () => {
    for (const reason of ["short-history", "gapped-history", "flat-range"] as const) {
      expect(volRegimeWords({ kind: "absent", reason })).not.toContain("no IV rank could be read");
    }
  });

  it("still answers in a sentence for a reason it has no words for", () => {
    const reading = { kind: "absent", reason: "something-new" } as unknown as VolRegimeReading;
    expect(volRegimeWords(reading)).toContain("no IV rank could be read");
  });
});

describe("boundWords", () => {
  it("renders a bounded amount as grouped dollars and cents", () => {
    expect(boundWords({ kind: "amount", amount: 1234.5 })).toBe("$1,234.50");
  });

  it("renders an unbounded loss as the word, never a sampled number", () => {
    expect(boundWords({ kind: "unbounded" })).toBe("unlimited");
    expect(boundWords({ kind: "unbounded" })).not.toMatch(/\d/);
  });

  it("renders a zero bound as $0.00 — a real measured zero, not an absence", () => {
    expect(boundWords({ kind: "amount", amount: 0 })).toBe("$0.00");
  });
});

describe("structureLabel", () => {
  it("names each kind the same way the mechanics sentence does", () => {
    expect(structureLabel("iron-condor")).toBe("Iron condor");
    expect(structureLabel("short-put-spread")).toBe("Short put spread");
  });
});
