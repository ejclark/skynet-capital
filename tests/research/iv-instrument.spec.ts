import { ScriptedAtmQuotes } from "../../src/adapters/scripted-atm-quotes.js";
import { priceOption } from "../../src/options/pricing.js";
import type { AtmOptionQuote } from "../../src/ports/atm-quotes.js";
import { InMemoryIvHistory } from "../../src/research/in-memory-iv-history.js";
import { recordIvTick, solveAtmIv } from "../../src/research/iv-instrument.js";

const AT = "2026-08-26T20:00:00.000Z";

/** A quote built BY the pricer at a known vol, so the solve has a truth to recover. */
const quoteAtVol = (symbol: string, volatility: number): AtmOptionQuote => {
  const valued = priceOption({
    spot: 100,
    strike: 100,
    daysToExpiry: 30,
    volatility,
    type: "call",
  });
  if (!valued) throw new Error("spec fixture: pricer declined a well-formed contract");
  return {
    symbol,
    spot: 100,
    strike: 100,
    daysToExpiry: 30,
    type: "call",
    midPrice: valued.price,
  };
};

describe("solveAtmIv", () => {
  it("recovers the volatility a quote was priced at", () => {
    const { samples } = solveAtmIv([quoteAtVol("NVDA", 0.42)], AT);
    expect(samples).toHaveLength(1);
    expect(samples[0]?.atmIv).toBeCloseTo(0.42, 6);
  });

  it("stamps every sample with the tick's time, spot and tenor", () => {
    const { samples } = solveAtmIv([quoteAtVol("NVDA", 0.42)], AT);
    expect(samples[0]).toMatchObject({ at: AT, symbol: "NVDA", spot: 100, daysToExpiry: 30 });
  });

  it("drops an unsolvable quote instead of recording a fabricated zero", () => {
    // A premium above the call's no-arbitrage ceiling: no σ in the search band reproduces it.
    const impossible: AtmOptionQuote = {
      symbol: "MU",
      spot: 100,
      strike: 100,
      daysToExpiry: 30,
      type: "call",
      midPrice: 150,
    };
    const { samples, unsolved } = solveAtmIv([impossible], AT);
    expect(samples).toEqual([]);
    expect(unsolved).toEqual(["MU"]);
  });

  it("keeps the solvable names when one quote in the batch is unusable", () => {
    const expired: AtmOptionQuote = { ...quoteAtVol("MU", 0.3), daysToExpiry: 0 };
    const { samples, unsolved } = solveAtmIv([quoteAtVol("NVDA", 0.42), expired], AT);
    expect(samples.map((s) => s.symbol)).toEqual(["NVDA"]);
    expect(unsolved).toEqual(["MU"]);
  });

  it("is pure — the same inputs give the same samples", () => {
    const quotes = [quoteAtVol("NVDA", 0.42)];
    expect(solveAtmIv(quotes, AT)).toEqual(solveAtmIv(quotes, AT));
  });
});

describe("recordIvTick", () => {
  it("appends one sample per tracked underlying to the store", async () => {
    const store = new InMemoryIvHistory();
    const quotes = new ScriptedAtmQuotes([quoteAtVol("NVDA", 0.42), quoteAtVol("GOOG", 0.24)]);

    const report = await recordIvTick({ quotes, store, at: AT, symbols: ["GOOG", "NVDA"] });

    expect(report.recorded).toHaveLength(2);
    expect((await store.list("NVDA"))[0]?.atmIv).toBeCloseTo(0.42, 6);
    expect((await store.list("GOOG"))[0]?.atmIv).toBeCloseTo(0.24, 6);
  });

  it("names the tracked symbols the feed had no quote for", async () => {
    const store = new InMemoryIvHistory();
    const quotes = new ScriptedAtmQuotes([quoteAtVol("NVDA", 0.42)]);

    const report = await recordIvTick({ quotes, store, at: AT, symbols: ["NVDA", "MU", "AVGO"] });

    expect(report.unquoted).toEqual(["MU", "AVGO"]);
    expect(report.unsolved).toEqual([]);
    expect(await store.list()).toHaveLength(1);
  });

  it("writes nothing at all when the feed is dark — a silent tick, not a zeroed one", async () => {
    const store = new InMemoryIvHistory();
    const report = await recordIvTick({
      quotes: new ScriptedAtmQuotes([]),
      store,
      at: AT,
      symbols: ["NVDA"],
    });
    expect(report.recorded).toEqual([]);
    expect(await store.list()).toEqual([]);
  });

  it("defaults to the derived tracked set when no symbols are given", async () => {
    const store = new InMemoryIvHistory();
    const report = await recordIvTick({
      quotes: new ScriptedAtmQuotes([quoteAtVol("NVDA", 0.42)]),
      store,
      at: AT,
    });
    expect(report.recorded.map((s) => s.symbol)).toEqual(["NVDA"]);
    expect(report.unquoted.length).toBeGreaterThan(0);
  });

  it("stamps the report with the tick's time", async () => {
    const report = await recordIvTick({
      quotes: new ScriptedAtmQuotes([]),
      store: new InMemoryIvHistory(),
      at: AT,
      symbols: [],
    });
    expect(report.at).toBe(AT);
  });
});
