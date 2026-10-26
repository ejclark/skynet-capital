import { fitFor } from "../../src/playbooks/fit-finder.js";
import { pairFor, STRATEGIES } from "../../src/playbooks/pair-table.js";

/** The fit finder (#4469 slice 4): a ticker's strategies, best first, each with its reason. Every
 *  row is the pair table's own, so the finder and the Store's card cannot disagree. */

const NOW = "2026-10-26T15:00:00Z";
const strategyOf = (symbol: string, id: string, asOf = NOW) =>
  fitFor(symbol, asOf).fits.find((row) => row.strategy === id);

describe("fitFor", () => {
  it("lists only the strategies that trade one chosen ticker — never a basket or the scout", () => {
    const ids = fitFor("NVDA", NOW).fits.map((row) => row.strategy);
    expect(ids.sort()).toEqual(
      Object.values(STRATEGIES)
        .filter((s) => s.act !== undefined)
        .map((s) => s.id)
        .sort(),
    );
    expect(ids).not.toContain("persona-rules");
    expect(ids).not.toContain("forced-pick");
    expect(ids).not.toContain("shadow-scan");
  });

  it("leads with a current ✓ and carries the row's own call, confidence, number and study", () => {
    const [first] = fitFor("GOOG", NOW).fits;
    const row = pairFor("pre-print-run-up", "GOOG");
    expect(first?.strategy).toBe("pre-print-run-up");
    expect(first?.status).toBe("researched");
    expect(first?.glyph).toBe("✓");
    expect(first?.reason).toBe(row?.evidence.call);
    expect(first?.confidence).toBe("medium");
    expect(first?.number).toBe(row?.evidence.number);
    expect(first?.study).toBe(row?.evidence.study);
    expect(first?.until).toBe(row?.evidence.shelfOn);
  });

  it("says a weakened ✓ is weakened, in words", () => {
    expect(strategyOf("NVDA", "pre-print-run-up")?.word).toBe("researched, weakened");
  });

  it("keeps a stand-aside ◆ conviction visible with its check date, and ranks it after a ✓", () => {
    const { fits } = fitFor("CRWV", NOW);
    const wheel = fits.find((row) => row.strategy === "wheel");
    expect(wheel?.status).toBe("conviction");
    expect(wheel?.until).toBe("2027-01-29");
    expect(fits.findIndex((r) => r.strategy === "wheel")).toBeLessThan(
      fits.findIndex((r) => r.strategy === "event"),
    );
  });

  it("reads a ✓ past its shelf date as stale, not as a fit", () => {
    const row = strategyOf("NVDA", "pre-print-run-up", "2027-04-02T15:00:00Z");
    expect(row?.status).toBe("stale");
    expect(row?.word).toBe("stale, due for re-research");
    expect(row?.glyph).toBe("△");
  });

  it("offers a ticker the house has not studied its free screen, with the ticker filled in", () => {
    const wheel = strategyOf("AMZN", "wheel");
    expect(wheel?.status).toBe("not-studied");
    expect(wheel?.askable).toBe(true);
    expect(wheel?.screen).toBe("node scripts/research/premium-fit.mjs AMZN");
    expect(wheel?.act).toContain("on AMZN");
    expect(wheel?.act).not.toContain("<SYM>");
  });

  it("says a date-keyed strategy cannot run where the calendar has no print, and offers no ask", () => {
    const row = strategyOf("ZZZZ", "pre-print-run-up");
    expect(row?.status).toBe("cant-run");
    expect(row?.reason).toContain("ZZZZ's next earnings date is not on the calendar");
    expect(row?.askable).toBeUndefined();
  });

  it("offers no ask where no screen exists: the event play cannot run, the long call needs a conviction", () => {
    const event = strategyOf("AMZN", "event");
    expect(event?.status).toBe("cant-run");
    expect(event?.askable).toBeUndefined();
    const longCall = strategyOf("AMZN", "long-call");
    expect(longCall?.status).toBe("not-studied");
    expect(longCall?.askable).toBeUndefined();
    expect(longCall?.reason).toMatch(/conviction/);
  });

  it("never names a pair id: the answer is by strategy and ticker", () => {
    const body = JSON.stringify(fitFor("NVDA", NOW));
    for (const id of ["S1-NVDA", "NVDA-CALL-SPREAD", "G1-GOOG", "CRWV-WHEEL"]) {
      expect(body).not.toContain(id);
    }
  });

  it("answers every strategy for any ticker, upper-cased", () => {
    const answer = fitFor("amzn", NOW);
    expect(answer.symbol).toBe("AMZN");
    expect(answer.fits.length).toBeGreaterThan(0);
  });
});
