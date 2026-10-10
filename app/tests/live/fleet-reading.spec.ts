import { fleetReading, type OpsStatusView } from "../../src/live/ops-status";

/**
 * The fleet's half of the top bar's status line (#5037 round 2, question 9). The fleet dot left the
 * bar; what it said now rides the line as WORDS, and only when there is something to say. Two ways
 * the line could quietly lie, each held here: a healthy-looking line over a fleet nobody could read
 * (it fails closed, #1307), and a colour carrying the alarm alone (a standing reader is red/green
 * colourblind, docs/BRAND.md → Accessibility).
 */

const view = (verdicts: readonly ("ok" | "attention" | "unknown")[]): OpsStatusView => ({
  available: true,
  status: {
    generatedAt: "2026-10-10T14:00:00Z",
    degraded: false,
    signals: verdicts.map((verdict, i) => ({ id: `s${i}`, label: `s${i}`, verdict, detail: "" })),
  },
});

describe("fleetReading", () => {
  it("adds nothing to the line while the fleet is fine — the line is the market's", () => {
    const r = fleetReading(view(["ok", "ok", "unknown", "ok"]), false);
    expect(r.verdict).toBe("ok");
    expect(r.line).toBeUndefined();
    expect(r.summary).toBe("Fleet health · nothing needs attention");
  });

  it("says a degraded fleet in words, counted", () => {
    expect(fleetReading(view(["attention", "ok"]), false)).toEqual({
      verdict: "attention",
      line: "1 fleet alert",
      summary: "Fleet health · 1 ops signal needs attention",
    });
    expect(fleetReading(view(["attention", "attention", "ok"]), false).line).toBe("2 fleet alerts");
  });

  it("fails closed: a reading that never arrived is said on the line, never shown as healthy", () => {
    const r = fleetReading(undefined, true);
    expect(r.verdict).toBe("unknown");
    expect(r.line).toBe("fleet status unknown");
    expect(r.summary).toBe("Fleet health · no reading right now");
    // the phone bar's shorter words for the same fact, beside the market's own word
    expect(r.brief).toBe("fleet unknown");
  });

  it("stays off the line while the first read is in flight, and where no panel is wired", () => {
    expect(fleetReading(undefined, false)).toEqual({
      verdict: "unknown",
      summary: "Fleet health · reading…",
    });
    expect(fleetReading({ available: false }, false)).toEqual({
      verdict: "unknown",
      summary: "Fleet health · not wired in this deployment",
    });
  });
});
