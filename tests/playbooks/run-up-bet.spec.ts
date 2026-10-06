import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { G1_GOOG, NVDA_CALL_SPREAD, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";
import { oneRunUpBet, runUpBetTickers } from "../../src/playbooks/run-up-bet.js";
import { withPlaybooks } from "../../src/playbooks/with-playbooks.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * #4469 slice 2e — one run-up bet per account. While an account holds shares on a ticker the run-up
 * trades, or an open call-spread vertical on one the spread trades, neither opens on a second
 * ticker. Exits always pass; the same ticker is not a second bet; a play with no pair row is never
 * counted. Its own spec file so the rule reverts alone.
 */

const on = (playbook: EnabledPlaybook["playbook"]): EnabledPlaybook => ({
  playbook,
  mode: "standard",
});

const buy = (symbol: string, playbookId: string): OrderIntent => ({
  symbol,
  side: "buy",
  quantity: 5,
  type: "market",
  reason: "test",
  playbookId,
  playbookMode: "standard",
});
const sell = (symbol: string, playbookId: string): OrderIntent => ({
  ...buy(symbol, playbookId),
  side: "sell",
});

const EXPIRATION = "2026-11-13";
const occ = (strike: number) =>
  buildOccSymbol({ underlying: "NVDA", expiration: EXPIRATION, type: "call", strike });
const vertical: Portfolio = aPortfolio({
  cash: 50_000,
  positions: [
    aPosition({ symbol: occ(200), quantity: 1, avgPrice: 8 }),
    aPosition({ symbol: occ(210), quantity: -1, avgPrice: 4 }),
  ],
});
const nvdaShares: Portfolio = aPortfolio({
  cash: 50_000,
  positions: [aPosition({ symbol: "NVDA", quantity: 100 })],
});
const flat: Portfolio = aPortfolio({ cash: 50_000 });

describe("runUpBetTickers", () => {
  it("reads shares on a run-up ticker as that run-up's bet", () => {
    expect([...runUpBetTickers([on(S1_NVDA), on(G1_GOOG)], nvdaShares)]).toEqual(["NVDA"]);
  });

  it("reads an open call-spread vertical as the spread's bet", () => {
    expect([...runUpBetTickers([on(NVDA_CALL_SPREAD), on(G1_GOOG)], vertical)]).toEqual(["NVDA"]);
  });

  it("counts nothing for a flat book, a lone leg, or a ticker no run-up strategy is enabled on", () => {
    const loneLeg = aPortfolio({ positions: [aPosition({ symbol: occ(200), quantity: 1 })] });
    expect(runUpBetTickers([on(S1_NVDA), on(NVDA_CALL_SPREAD)], flat).size).toBe(0);
    expect(runUpBetTickers([on(NVDA_CALL_SPREAD)], loneLeg).size).toBe(0);
    expect(runUpBetTickers([on(G1_GOOG)], nvdaShares).size).toBe(0);
  });

  it("does not count the event play's shares: it is not a run-up", () => {
    const djt = aPortfolio({ positions: [aPosition({ symbol: "DJT", quantity: 50 })] });
    expect(runUpBetTickers([on(TACO_DJT), on(S1_NVDA)], djt).size).toBe(0);
  });
});

describe("oneRunUpBet", () => {
  it("refuses a run-up open on a second ticker while one is held, naming both, once per intent", () => {
    const lines: string[] = [];
    const kept = oneRunUpBet(
      [on(S1_NVDA), on(G1_GOOG)],
      [buy("GOOG", "G1-GOOG")],
      nvdaShares,
      (line) => lines.push(line),
    );
    expect(kept).toEqual([]);
    expect(lines).toEqual([
      "G1-GOOG refused — the account already holds a run-up bet on NVDA, so it does not open one on GOOG too",
    ]);
  });

  it("holds across the two strategies: a held spread blocks the run-up on another ticker", () => {
    expect(
      oneRunUpBet([on(NVDA_CALL_SPREAD), on(G1_GOOG)], [buy("GOOG", "G1-GOOG")], vertical),
    ).toEqual([]);
  });

  it("lets every exit through, even on the second ticker", () => {
    const exit = sell("GOOG", "G1-GOOG");
    expect(oneRunUpBet([on(S1_NVDA), on(G1_GOOG)], [exit], nvdaShares)).toEqual([exit]);
  });

  it("lets the held ticker's own strategy keep opening and exiting there", () => {
    const intents = [sell("NVDA", "S1-NVDA"), buy("NVDA", "S1-NVDA")];
    expect(oneRunUpBet([on(S1_NVDA), on(G1_GOOG)], intents, nvdaShares)).toEqual(intents);
  });

  it("leaves a flat book alone", () => {
    const intents = [buy("GOOG", "G1-GOOG")];
    expect(oneRunUpBet([on(S1_NVDA), on(G1_GOOG)], intents, flat)).toEqual(intents);
  });

  it("lets the first of two simultaneous opens win, so one cycle cannot open both", () => {
    const first = buy("NVDA", "S1-NVDA");
    const lines: string[] = [];
    const kept = oneRunUpBet(
      [on(S1_NVDA), on(G1_GOOG)],
      [first, buy("GOOG", "G1-GOOG")],
      flat,
      (line) => lines.push(line),
    );
    expect(kept).toEqual([first]);
    expect(lines).toHaveLength(1);
  });

  it("never touches an intent from a play with no pair row (a member's own, a persona's reflex)", () => {
    const authored = buy("GOOG", "AUTHORED-GOOG");
    const reflex: OrderIntent = { ...buy("AAPL", "x"), playbookId: undefined as never };
    expect(oneRunUpBet([on(S1_NVDA)], [authored, reflex], nvdaShares)).toEqual([authored, reflex]);
  });
});

describe("withPlaybooks — the rule on a live roster", () => {
  const calendar: readonly EarningsPrint[] = [
    { symbol: "NVDA", date: "2026-11-18", status: "confirmed", source: "test" },
    // 15 sessions out on 2026-10-06: inside G1's 20-session window.
    { symbol: "GOOG", date: "2026-10-27", status: "confirmed", source: "test" },
  ];
  const base: Persona = { id: "base", name: "Base", thesis: "test", decide: () => [] };
  const context = aContext({ NVDA: { last: 200 }, GOOG: { last: 250 } }, "2026-10-06T15:00:00Z");
  const roster = [on(S1_NVDA), on(G1_GOOG)];

  it("opens GOOG on a flat book: the window is open and nothing else is held", () => {
    const intents = withPlaybooks(base, roster, calendar).decide(context, flat);
    expect(intents.map((i) => i.playbookId)).toEqual(["G1-GOOG"]);
  });

  it("holds GOOG back while NVDA shares are held, and says so once however many cycles run", () => {
    const lines: string[] = [];
    const persona = withPlaybooks(base, roster, calendar, [], undefined, (line) =>
      lines.push(line),
    );
    expect(persona.decide(context, nvdaShares)).toEqual([]);
    expect(persona.decide(context, nvdaShares)).toEqual([]);
    expect(lines).toEqual([expect.stringContaining("G1-GOOG refused")]);
  });
});
