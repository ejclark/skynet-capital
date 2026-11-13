import type { GuidanceQuote } from "../../src/options/position-guidance-types.js";
import {
  type SuggestedTrade,
  type SuggestionInputs,
  suggestTrades,
  type TierOption,
} from "../../src/options/trade-suggestions.js";
import { LONG_DTE, SUGGESTION_DTE, TIER_RULES } from "../../src/options/trade-suggestions-rules.js";
import { CHAIN, NOW, SPOT } from "./position-guidance-fixture.js";

/**
 * Suggested trades (#7547 slice 1). The world is the position guidance's frozen CRWV fixture: spot
 * $80, every contract priced by our own Black-Scholes at 80% IV with a 6% spread, listed weekly from
 * Oct 2 to Nov 20 with "now" on Sep 25 — so the 21–45 day window holds Oct 16, 23, 30 and Nov 6, and
 * Oct 23 (28 days) sits nearest the 30-day target.
 */

const input = (over: Partial<SuggestionInputs> = {}): SuggestionInputs => ({
  symbol: "CRWV",
  strategy: "covered-call",
  now: NOW,
  spot: SPOT,
  sessionOpen: true,
  chain: CHAIN,
  account: { equity: 100_000, cash: 40_000, shares: 400 },
  ...over,
});

const available = (options: readonly TierOption[]): SuggestedTrade[] =>
  options.filter((o): o is SuggestedTrade => o.available);
const metric = (o: SuggestedTrade, id: string): number => {
  const m = o.metrics.find((x) => x.id === id);
  if (!m) throw new Error(`no ${id} metric`);
  return m.value;
};
const firstAvailable = (options: readonly TierOption[]): SuggestedTrade => {
  const [o] = available(options);
  if (!o) throw new Error("no tier available");
  return o;
};
const ruleOf = (o: TierOption) => {
  const rule = TIER_RULES.find((r) => r.tier === o.tier);
  if (!rule) throw new Error(`no rule for ${o.tier}`);
  return rule;
};
const ALL_TEXT = (o: TierOption): string =>
  [o.rule, ...(o.available ? [o.summary, ...o.metrics.map((m) => m.text)] : [o.reason])].join(" ");

describe("suggestTrades — the three tiers", () => {
  it("returns exactly three options, conservative · standard · high risk, each labelled SIM with a word and a shape", () => {
    const { options } = suggestTrades(input());
    expect(options.map((o) => o.tier)).toEqual(["conservative", "standard", "high-risk"]);
    expect(options.map((o) => o.word)).toEqual(["Conservative", "Standard", "High risk"]);
    expect(new Set(options.map((o) => o.mark)).size).toBe(3);
    for (const o of options) expect(o.label).toBe("SIM");
  });

  it("states each tier's written rule as a sentence", () => {
    const [c] = suggestTrades(input({ strategy: "cash-secured-put" })).options;
    expect(c.rule).toBe(
      "Conservative: a strike near 0.15–0.20 delta, 21–45 days out, at most 2% of the account lost if the stock went to zero.",
    );
  });
});

describe("suggestTrades — covered call", () => {
  it("sells the strike nearest each tier's delta band at the expiry nearest 30 days", () => {
    const options = available(suggestTrades(input()).options);
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.strike)).toEqual([100, 95, 85]);
    for (const o of options) {
      expect(o.expiration).toBe("2026-10-23");
      expect(o.type).toBe("call");
      expect(o.side).toBe("sell");
    }
  });

  it("keeps each strike's delta inside its tier's band", () => {
    const options = suggestTrades(input()).options;
    options.forEach((o) => {
      if (!o.available) throw new Error(`${o.tier} unavailable`);
      const { min, max } = ruleOf(o).delta;
      expect(metric(o, "delta")).toBeGreaterThanOrEqual(min);
      expect(metric(o, "delta")).toBeLessThanOrEqual(max);
    });
  });

  it("sizes by the share of free 100-share lots: 4 lots → 1, 2, 4", () => {
    const options = available(suggestTrades(input()).options);
    expect(options.map((o) => o.contracts)).toEqual([1, 2, 4]);
  });

  it("never writes on lots already under a call", () => {
    const options = available(
      suggestTrades(input({ account: { equity: 100_000, cash: 0, shares: 400, callsSold: 2 } }))
        .options,
    );
    expect(options.map((o) => o.contracts)).toEqual([1, 1, 2]);
  });

  it("never sells a strike below the member's cost basis", () => {
    const { options } = suggestTrades(
      input({ account: { equity: 100_000, cash: 0, shares: 400, costBasis: 96 } }),
    );
    for (const o of available(options)) expect(o.strike).toBeGreaterThanOrEqual(96);
  });

  it("says plainly that a member without 100 free shares cannot write one", () => {
    const { options } = suggestTrades(input({ account: { equity: 100_000, cash: 40_000 } }));
    for (const o of options) {
      expect(o.available).toBe(false);
      if (!o.available) expect(o.reason).toContain("100 shares per contract");
    }
  });

  it("cites that the call adds no downside to shares already held", () => {
    const c = firstAvailable(suggestTrades(input()).options);
    const maxLoss = c.metrics.find((m) => m.id === "max-loss");
    expect(maxLoss?.text).toContain("adds no downside");
  });
});

describe("suggestTrades — cash-secured put", () => {
  const csp = (account: SuggestionInputs["account"]) =>
    suggestTrades(input({ strategy: "cash-secured-put", account }));

  it("keeps every put out of the money, inside its band and inside the DTE window", () => {
    const options = available(csp({ equity: 2_000_000, cash: 1_000_000 }).options);
    expect(options).toHaveLength(3);
    options.forEach((o) => {
      const { min, max } = ruleOf(o).delta;
      expect(o.type).toBe("put");
      expect(o.strike).toBeLessThan(SPOT);
      expect(metric(o, "delta")).toBeGreaterThanOrEqual(min);
      expect(metric(o, "delta")).toBeLessThanOrEqual(max);
      expect(o.dte).toBeGreaterThanOrEqual(SUGGESTION_DTE.min);
      expect(o.dte).toBeLessThanOrEqual(SUGGESTION_DTE.max);
    });
  });

  it("caps the max loss at each tier's share of the account", () => {
    const { options } = csp({ equity: 1_000_000, cash: 1_000_000 });
    options.forEach((o) => {
      if (!o.available) throw new Error(`${o.tier} unavailable`);
      expect(o.contracts).toBeGreaterThanOrEqual(1);
      expect(metric(o, "account-at-risk")).toBeLessThanOrEqual(ruleOf(o).maxAccountAtRisk);
      expect(metric(o, "max-loss")).toBeCloseTo((o.strike - o.limit) * 100 * o.contracts, 6);
    });
  });

  it("declines a tier one contract would overrun, naming the share of the account", () => {
    const [c] = csp({ equity: 100_000, cash: 100_000 }).options;
    expect(c.available).toBe(false);
    if (!c.available) expect(c.reason).toMatch(/\(6\.3% of your account\) .* caps that at 2%/);
  });

  it("never sizes past the cash that secures the put", () => {
    const { options } = csp({ equity: 10_000_000, cash: 15_000 });
    for (const o of available(options)) {
      expect(o.strike * 100 * o.contracts).toBeLessThanOrEqual(15_000);
    }
    const broke = csp({ equity: 10_000_000, cash: 1_000 }).options;
    for (const o of broke) {
      expect(o.available).toBe(false);
      if (!o.available) expect(o.reason).toContain("in cash to secure");
    }
  });
});

describe("suggestTrades — long call and long put (#7547 slice 4)", () => {
  const long = (
    strategy: "long-call" | "long-put",
    account: SuggestionInputs["account"] = { equity: 1_000_000, cash: 1_000_000 },
    over: Partial<SuggestionInputs> = {},
  ) => suggestTrades(input({ strategy, account, ...over }));

  it("buys, inside each tier's BOUGHT delta band and the 45–90 day window", () => {
    for (const strategy of ["long-call", "long-put"] as const) {
      const options = available(long(strategy).options);
      expect(options).toHaveLength(3);
      options.forEach((o) => {
        const { min, max } = ruleOf(o).longDelta;
        expect(o.side).toBe("buy");
        expect(o.type).toBe(strategy === "long-call" ? "call" : "put");
        expect(metric(o, "delta")).toBeGreaterThanOrEqual(min);
        expect(metric(o, "delta")).toBeLessThanOrEqual(max);
        expect(o.dte).toBeGreaterThanOrEqual(LONG_DTE.min);
        expect(o.dte).toBeLessThanOrEqual(LONG_DTE.max);
        expect(o.summary).toMatch(/^Buy \d+ CRWV /);
      });
    }
  });

  it("runs the delta the other way from a sale: conservative in the money, high risk out of it", () => {
    const [c, s, h] = available(long("long-call").options);
    if (!(c && s && h)) throw new Error("tier missing");
    expect(c.strike).toBeLessThan(SPOT);
    expect(h.strike).toBeGreaterThan(SPOT);
    expect(metric(c, "delta")).toBeGreaterThan(metric(s, "delta"));
    expect(metric(s, "delta")).toBeGreaterThan(metric(h, "delta"));
    expect(metric(c, "chance-in-the-money")).toBeGreaterThan(metric(h, "chance-in-the-money"));
  });

  it("states the bought rule: the band, the window and the premium cap", () => {
    const [c] = long("long-put").options;
    expect(c.rule).toBe(
      "Conservative: a strike near 0.65–0.80 delta, 45–90 days out, at most 2% of the account lost if it expires worthless.",
    );
  });

  it("caps the premium paid — its max loss — at each tier's share of the account", () => {
    const { options } = long("long-call", { equity: 200_000, cash: 200_000 });
    options.forEach((o) => {
      if (!o.available) throw new Error(`${o.tier} unavailable`);
      expect(metric(o, "max-loss")).toBeCloseTo(o.limit * 100 * o.contracts, 6);
      expect(metric(o, "premium")).toBe(metric(o, "max-loss"));
      expect(metric(o, "account-at-risk")).toBeLessThanOrEqual(ruleOf(o).maxAccountAtRisk);
    });
  });

  it("declines a tier one contract would overrun, and never sizes past the cash", () => {
    const [c] = long("long-call", { equity: 20_000, cash: 20_000 }).options;
    expect(c.available).toBe(false);
    if (!c.available) expect(c.reason).toMatch(/all of it lost if it expires worthless; .* 2%/);
    for (const o of long("long-call", { equity: 10_000_000, cash: 100 }).options) {
      expect(o.available).toBe(false);
      if (!o.available) expect(o.reason).toContain("in cash");
    }
  });

  it("says plainly when the account has no equity to size against, never a broken percentage", () => {
    for (const strategy of ["long-put", "cash-secured-put"] as const) {
      for (const o of suggestTrades(input({ strategy, account: { equity: 0, cash: 50_000 } }))
        .options) {
        expect(o.available).toBe(false);
        if (!o.available)
          expect(o.reason).toBe("Your account shows no equity to size a trade against.");
      }
    }
  });

  it("prices the limit at the mid, rounding a tie toward the buyer", () => {
    for (const o of available(long("long-put").options)) {
      const q = CHAIN.find(
        (x) => x.expiration === o.expiration && x.strike === o.strike && x.type === o.type,
      );
      if (!(q?.bid && q.ask)) throw new Error("quote missing");
      expect(o.limit).toBeGreaterThanOrEqual(q.bid);
      expect(o.limit).toBeLessThanOrEqual((q.bid + q.ask) / 2 + 1e-9);
    }
  });

  it("buys across earnings, citing the print instead of hiding the expiry", () => {
    const earnings = {
      start: "2026-11-09",
      end: "2026-11-16",
      status: "estimate",
      source: "8-K cadence",
    } as const;
    for (const o of available(long("long-call", undefined, { earnings }).options)) {
      expect(o.expiration >= earnings.start).toBe(true);
      const cite = o.metrics.find((m) => m.id === "earnings");
      expect(cite?.value).toBe(45);
      expect(cite?.text).toContain("Implied volatility tends to drop");
    }
    const open = { ...earnings, start: "2026-09-24" };
    const during = firstAvailable(long("long-call", undefined, { earnings: open }).options);
    const cite = during.metrics.find((m) => m.id === "earnings");
    expect(cite?.value).toBe(0);
    expect(cite?.text).toContain("the window is open now");
    const none = firstAvailable(long("long-call").options);
    expect(none.metrics.some((m) => m.id === "earnings")).toBe(false);
  });

  it("cites a buyer's numbers: decay as a cost, premium paid, no assignment", () => {
    const o = firstAvailable(long("long-call").options);
    const text = (id: string) => o.metrics.find((m) => m.id === id)?.text ?? "";
    expect(text("theta-per-day")).toContain("lost to time decay");
    expect(text("premium")).toContain("premium paid");
    expect(text("max-loss")).toContain("the most this trade can lose");
    expect(o.metrics.some((m) => m.id === "chance-assigned")).toBe(false);
    expect(metric(o, "theta-per-day")).toBeGreaterThan(0);
  });
});

describe("suggestTrades — prices, honesty, determinism", () => {
  it("prices the limit at the mid on the contract's tick grid, inside the quote", () => {
    for (const o of available(suggestTrades(input()).options)) {
      const q = CHAIN.find(
        (x) => x.expiration === o.expiration && x.strike === o.strike && x.type === o.type,
      );
      if (!(q?.bid && q.ask)) throw new Error("quote missing");
      expect(o.limit).toBeGreaterThanOrEqual(q.bid);
      expect(o.limit).toBeLessThanOrEqual(q.ask);
      expect(Math.abs(o.limit - (q.bid + q.ask) / 2)).toBeLessThanOrEqual(0.05);
      expect(o.summary).toContain(`$${o.limit.toFixed(2)}`);
    }
  });

  it("gives the same three options for the same chain in any order", () => {
    const reversed = suggestTrades(input({ chain: [...CHAIN].reverse() }));
    expect(reversed).toEqual(suggestTrades(input()));
  });

  it("skips a quote too wide or too thin to trade against", () => {
    const wide: GuidanceQuote[] = CHAIN.map((q) =>
      q.expiration === "2026-10-23" && q.strike === 100 && q.type === "call"
        ? { ...q, ask: (q.bid ?? 0) * 2 }
        : q,
    );
    const c = firstAvailable(suggestTrades(input({ chain: wide })).options);
    expect(`${c.expiration}:${c.strike}`).not.toBe("2026-10-23:100");
  });

  it("never sells premium across earnings", () => {
    const earnings = {
      start: "2026-10-10",
      end: "2026-10-12",
      status: "confirmed",
      source: "IR",
    } as const;
    const { options } = suggestTrades(input({ earnings }));
    for (const o of options) {
      expect(o.available).toBe(false);
      // Not a dead end (Eric, 2026-11-13): the print's date, why, and what can be sized instead.
      if (!o.available) {
        expect(o.reason).toContain("reports earnings on");
        expect(o.reason).toContain("never sell premium across a print");
        expect(o.reason).toContain("A bought call or put can be sized instead");
      }
    }
  });

  it("says only that the window is empty when no print is what blocks it", () => {
    const { options } = suggestTrades(input({ chain: [] }));
    for (const o of options)
      if (!o.available) expect(o.reason).toMatch(/^No expiry 21–45 days out is listed\.$/);
  });

  it("cites every probability as the model's, with its own number, and never promises a gain", () => {
    for (const strategy of ["covered-call", "cash-secured-put", "long-call", "long-put"] as const) {
      const { options } = suggestTrades(
        input({ strategy, account: { equity: 1_000_000, cash: 1_000_000, shares: 400 } }),
      );
      for (const o of options) {
        expect(ALL_TEXT(o)).not.toMatch(/likely|guarantee|will (profit|make|gain)|safe bet|sure/i);
      }
      for (const o of available(options)) {
        const pop = o.metrics.find((m) => m.id === "chance-of-profit");
        expect(pop?.text).toContain(`${Math.round((pop?.value ?? 0) * 100)}% model chance`);
      }
    }
  });

  it("cites IV rank only when the instrument has one", () => {
    const without = firstAvailable(suggestTrades(input()).options);
    const withRank = firstAvailable(suggestTrades(input({ ivRank: 62 })).options);
    expect(without.metrics.some((m) => m.id === "iv-rank")).toBe(false);
    expect(withRank.metrics.find((m) => m.id === "iv-rank")?.text).toContain("IV rank 62");
  });

  it("marks a read taken while the market is closed as a plan for the next open", () => {
    expect(suggestTrades(input({ sessionOpen: false })).atOpen).toBe(true);
    expect(suggestTrades(input()).disclosure).toContain("SIM");
  });
});
