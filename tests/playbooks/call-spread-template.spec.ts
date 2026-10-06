import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { sessionsBefore } from "../../src/domain/market-calendar.js";
import type { Portfolio } from "../../src/domain/types.js";
import { callSpread } from "../../src/playbooks/call-spread.js";
import { type Pair, pairFor, pairTable } from "../../src/playbooks/pair-table.js";
import { NVDA_CALL_SPREAD } from "../../src/playbooks/registry.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import { aContext, anOptionQuote, aPortfolio, withOptionQuotes } from "../support/builders.js";

/**
 * #4469 slice 2d — the call spread takes its ticker as a setting. The NVDA instance is held to the
 * hand-written playbook it replaced by `call-spread.spec.ts` (the same copy, strategy tags and
 * intents, unchanged); this file holds what the template adds: a second ticker reads its own name,
 * its own window and its own tags, and a pair with no row has no id.
 */

// A pair row the real table does not have yet (3a offers new pairs): Broadcom's call spread.
const AVGO_PAIR: Pair = {
  id: "AVGO-CALL-SPREAD",
  strategy: "call-spread",
  symbols: ["AVGO"],
  evidence: { status: "screened", call: "a test row" },
};

// The real table plus that row, as `callSpread`'s lookup.
const lookup: typeof pairFor = (strategy, symbol) =>
  strategy === "call-spread" && symbol === "AVGO" ? AVGO_PAIR : pairFor(strategy, symbol);

const PRINT = "2026-12-10";
const calendar = (status: EarningsPrint["status"] = "confirmed"): readonly EarningsPrint[] => [
  { symbol: "AVGO", date: PRINT, status, source: "test" },
];
const SETTING = {
  symbol: "AVGO",
  enter: 10,
  exit: 3,
  thesis: "a test spread",
  evidence: "docs/research/multi-symbol-sweep.md",
} as const;
const AVGO = callSpread(SETTING, lookup);
const at = (day: string, time = "15:00:00Z") => `${day}T${time}`;

describe("callSpread — a second ticker", () => {
  it("takes its id from the pair table and derives from no run-up the table does not have", () => {
    expect(AVGO.id).toBe("AVGO-CALL-SPREAD");
    expect(AVGO.symbols).toEqual(["AVGO"]);
    expect(AVGO.options).toEqual({
      underlyings: ["AVGO"],
      holdsShortToExpiry: [],
      requiredLevel: 3,
    });
    expect(AVGO).not.toHaveProperty("derivesFrom");
  });

  it("derives from the run-up pair on the same ticker when there is one", () => {
    expect(NVDA_CALL_SPREAD.derivesFrom).toBe("S1-NVDA");
  });

  it("counts its own window: long from D-10, flat from D-3, in trading sessions", () => {
    const enter = sessionsBefore(PRINT, 10);
    const lastLong = sessionsBefore(PRINT, 4);
    const out = sessionsBefore(PRINT, 3);
    expect(AVGO.desiredState(at(sessionsBefore(PRINT, 11)), calendar())).toBe("no-window");
    expect(AVGO.desiredState(at(enter), calendar())).toBe("long");
    expect(AVGO.desiredState(at(lastLong), calendar())).toBe("long");
    expect(AVGO.desiredState(at(out), calendar())).toBe("flat");
    expect(AVGO.desiredState(at(enter), calendar("estimate"))).toBe("no-window");
  });

  it("opens one spread under its own strategy tag, naming its own company and exit", () => {
    const day = sessionsBefore(PRINT, 8);
    const asOf = at(day, "15:00:00Z");
    // Expiry after the exit day (D-3 = 12-07) and before the print blackout (from 12-10).
    const expiration = "2026-12-08";
    const occ = (strike: number) =>
      buildOccSymbol({ underlying: "AVGO", expiration, type: "call", strike });
    const rows: readonly (readonly [number, number, number, number])[] = [
      [340, 0.52, 14, 14.4],
      [350, 0.4, 9.8, 10.1],
      [360, 0.3, 6.6, 6.9],
      [370, 0.22, 4.4, 4.6],
    ];
    const quotes = rows.map(([strike, delta, bid, ask]) =>
      anOptionQuote(occ(strike), { bid, ask, delta, openInterest: 2_000, at: asOf }),
    );
    const context = withOptionQuotes(aContext({ AVGO: { last: 340 } }, asOf), quotes, {
      AVGO: ["2026-11-27", expiration, "2026-12-11"],
    });
    const portfolio: Portfolio = aPortfolio({ cash: 50_000, positions: [] });
    const [open] = AVGO.decide?.(context, portfolio, calendar(), "standard") ?? [];
    expect(open).toMatchObject({ symbol: "AVGO", strategy: "avgo-spread-open" });
    expect(open?.reason).toContain("the options form of AVGO's pre-earnings run-up");
    // No company override: the ticker directory's own name, and the setting's own exit.
    expect(open?.reason).toContain("Broadcom confirmed its 2026-12-10 print");
    expect(open?.reason).toContain("three sessions before");
    expect(open?.forecast?.invalidator).toContain("AVGO's D-10→D-3 return");
  });
});

describe("callSpread — a pair with no row has no id", () => {
  it("throws for GOOG: its run-up is held to the print-day close, and a spread cannot be", () => {
    expect(() => callSpread({ ...SETTING, symbol: "GOOG" }, lookup)).toThrow(/no pair-table row/);
  });

  it("holds the real table to one call-spread pair, NVDA's", () => {
    const spreads = pairTable().filter((pair) => pair.strategy === "call-spread");
    expect(spreads.map((pair) => pair.id)).toEqual(["NVDA-CALL-SPREAD"]);
  });
});

describe("NVDA-CALL-SPREAD — still the playbook it was", () => {
  it("equals main's playbook field by field (criterion 7)", () => {
    expect(NVDA_CALL_SPREAD).toMatchObject({
      id: "NVDA-CALL-SPREAD",
      symbols: ["NVDA"],
      thesis:
        "S1-NVDA's pre-earnings run-up as a call debit spread — the loss capped at the debit paid; " +
        "opens only on a confirmed print date, out five sessions before it.",
      evidence:
        "docs/research/nvda-earnings-cycle.md F1-F2 — the run-up into a print, 15 of 15 positive " +
        "since 2023 (P=0.0032, docs/research/events/nvda-2026-11-18-print.md); D-5→D a coin flip",
      size: { conservative: 0, standard: 0, aggressive: 0 },
      keyedOn: "earnings",
      derivesFrom: "S1-NVDA",
      options: { underlyings: ["NVDA"], holdsShortToExpiry: [], requiredLevel: 3 },
    });
  });
});
