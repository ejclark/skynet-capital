import { priceOption } from "../../src/options/pricing.js";
import { probabilityAbove, probabilityBelow } from "../../src/options/terminal-odds.js";
import {
  type CitedTrade,
  metricsFor,
  type SuggestionMetric,
} from "../../src/options/trade-suggestions-metrics.js";

/**
 * The numbers a suggested trade cites (#7547). Each chance is cross-checked against the closed-form
 * terminal odds the member-facing sentence claims to quote, and each dollar figure against plain
 * arithmetic on the trade's own limit, size and strike — so a spec fails if a sentence cites a
 * number the engine did not use, or labels a model chance as anything but the model's.
 */

const base: CitedTrade = {
  strategy: "long-call",
  spot: 100,
  strike: 105,
  type: "call",
  iv: 0.4,
  absDelta: 0.35,
  days: 30,
  limit: 2,
  contracts: 2,
  equity: 10_000,
};

const trade = (over: Partial<CitedTrade> = {}): CitedTrade => ({ ...base, ...over });

const SHORT_CALL = {
  strategy: "covered-call",
  type: "call",
  strike: 110,
  limit: 1.5,
  contracts: 1,
  absDelta: 0.2,
} as const;
const SHORT_PUT = {
  strategy: "cash-secured-put",
  type: "put",
  strike: 90,
  limit: 1.25,
  contracts: 1,
  absDelta: 0.2,
} as const;

const find = (
  metrics: readonly SuggestionMetric[],
  id: SuggestionMetric["id"],
): SuggestionMetric => {
  const m = metrics.find((x) => x.id === id);
  if (!m) throw new Error(`no ${id} metric in [${metrics.map((x) => x.id).join(", ")}]`);
  return m;
};
const ids = (metrics: readonly SuggestionMetric[]): string[] => metrics.map((m) => m.id);
const odds = (t: CitedTrade) => ({
  spot: t.spot,
  daysForward: t.days,
  volatility: t.iv,
  rate: t.rate ?? 0,
});

describe("trade suggestion metrics", () => {
  describe("when the trade is a bought call", () => {
    const t = trade();
    const metrics = metricsFor(t);

    it("cites the long-option numbers in a member's reading order", () => {
      expect(ids(metrics)).toEqual([
        "delta",
        "chance-of-profit",
        "chance-in-the-money",
        "theta-per-day",
        "iv",
        "premium",
        "max-loss",
        "account-at-risk",
      ]);
    });

    it("quotes the model chance of clearing the strike plus the premium paid", () => {
      const expected = probabilityAbove({ ...odds(t), target: 107 }) ?? Number.NaN;
      const profit = find(metrics, "chance-of-profit");
      expect(profit.value).toBeCloseTo(expected, 12);
      expect(profit.text).toContain("model chance of a profit at expiry (break-even $107.00)");
    });

    it("quotes the model chance of finishing above the strike", () => {
      const expected = probabilityAbove({ ...odds(t), target: 105 }) ?? Number.NaN;
      const inMoney = find(metrics, "chance-in-the-money");
      expect(inMoney.value).toBeCloseTo(expected, 12);
      expect(inMoney.text).toContain("model chance it finishes in the money, above $105.00.");
    });

    it("puts a profit less likely than finishing in the money, since the premium must be covered", () => {
      expect(find(metrics, "chance-of-profit").value).toBeLessThan(
        find(metrics, "chance-in-the-money").value,
      );
    });

    it("sizes the premium and the max loss as the premium paid for every share", () => {
      expect(find(metrics, "premium").value).toBe(400);
      expect(find(metrics, "premium").text).toBe("$400.00 premium paid if filled at the limit.");
      expect(find(metrics, "max-loss").value).toBe(400);
      expect(find(metrics, "max-loss").text).toContain(
        "the premium paid, the most this trade can lose",
      );
    });

    it("states the share of the account at that loss", () => {
      const risk = find(metrics, "account-at-risk");
      expect(risk.value).toBeCloseTo(0.04, 12);
      expect(risk.text).toBe("4.0% of your account at that max loss.");
    });

    it("cites time decay as a cost for the whole size, matching the model's theta", () => {
      const valuation = priceOption({
        spot: 100,
        strike: 105,
        daysToExpiry: 30,
        volatility: 0.4,
        rate: 0,
        type: "call",
      });
      const decay = find(metrics, "theta-per-day");
      expect(decay.value).toBeGreaterThan(0);
      expect(decay.value).toBeCloseTo(-(valuation?.theta ?? 0) * 200, 10);
      expect(decay.text).toContain("lost to time decay today, if nothing else moves (model)");
    });

    it("reports the contract's own IV and the delta it was picked at", () => {
      expect(find(metrics, "iv").value).toBe(0.4);
      expect(find(metrics, "iv").text).toBe("Implied volatility 40% on this contract.");
      expect(find(metrics, "delta").text).toBe(
        "Delta 0.35: the option moves about $0.35 per $1 the stock moves.",
      );
    });

    it("never calls any chance anything but the model's", () => {
      for (const m of metrics.filter((x) => x.id.startsWith("chance"))) {
        expect(m.text).toContain("model chance");
      }
    });
  });

  describe("when the trade is a bought put", () => {
    const t = trade({ strategy: "long-put", type: "put", strike: 95, limit: 1.5, absDelta: 0.3 });
    const metrics = metricsFor(t);

    it("measures profit below the strike less the premium", () => {
      const expected = probabilityBelow({ ...odds(t), target: 93.5 }) ?? Number.NaN;
      const profit = find(metrics, "chance-of-profit");
      expect(profit.value).toBeCloseTo(expected, 12);
      expect(profit.text).toContain("(break-even $93.50)");
    });

    it("says it finishes in the money below the strike", () => {
      const expected = probabilityBelow({ ...odds(t), target: 95 }) ?? Number.NaN;
      const inMoney = find(metrics, "chance-in-the-money");
      expect(inMoney.value).toBeCloseTo(expected, 12);
      expect(inMoney.text).toContain("finishes in the money, below $95.00.");
    });
  });

  describe("when a rate is supplied", () => {
    it("feeds it into the odds the sentences quote", () => {
      const withRate = trade({ rate: 0.05 });
      const expected = probabilityAbove({ ...odds(withRate), target: 105 }) ?? Number.NaN;
      const chance = find(metricsFor(withRate), "chance-in-the-money").value;
      expect(chance).toBeCloseTo(expected, 12);
      expect(chance).toBeGreaterThan(find(metricsFor(trade()), "chance-in-the-money").value);
    });
  });

  describe("when the account has no equity", () => {
    it("reports zero at risk rather than dividing by zero, for a bought option", () => {
      expect(find(metricsFor(trade({ equity: 0 })), "account-at-risk").value).toBe(0);
    });

    it("reports zero at risk rather than dividing by zero, for a sold option", () => {
      const sold = metricsFor(trade({ ...SHORT_PUT, equity: 0 }));
      expect(find(sold, "account-at-risk").value).toBe(0);
      expect(find(sold, "account-at-risk").text).toBe("0.0% of your account at that max loss.");
    });
  });

  describe("when the contract has an IV rank", () => {
    it("cites it, rounded, after the IV", () => {
      const metrics = metricsFor(trade({ ivRank: 62.4 }));
      expect(ids(metrics).indexOf("iv-rank")).toBe(ids(metrics).indexOf("iv") + 1);
      expect(find(metrics, "iv-rank").text).toBe("IV rank 62 of 100 over the past year.");
      expect(find(metrics, "iv-rank").value).toBe(62.4);
    });

    it("cites it for a sold option as well", () => {
      expect(ids(metricsFor(trade({ ...SHORT_PUT, ivRank: 80 })))).toContain("iv-rank");
    });
  });

  describe("when the instrument has no full IV window", () => {
    it("leaves the rank out when it is missing", () => {
      expect(ids(metricsFor(trade()))).not.toContain("iv-rank");
    });

    it("leaves the rank out when it is not a finite number", () => {
      expect(ids(metricsFor(trade({ ivRank: Number.NaN })))).not.toContain("iv-rank");
      expect(ids(metricsFor(trade({ ivRank: Number.POSITIVE_INFINITY })))).not.toContain("iv-rank");
    });

    it("still cites a rank of zero, which is a real reading", () => {
      expect(find(metricsFor(trade({ ivRank: 0 })), "iv-rank").text).toBe(
        "IV rank 0 of 100 over the past year.",
      );
    });
  });

  describe("when a bought option expires on or after the earnings window", () => {
    it("warns with the window's start and distance and sits before the premium", () => {
      const metrics = metricsFor(trade({ print: { start: "2026-12-03", days: 12 } }));
      const earnings = find(metrics, "earnings");
      expect(earnings.value).toBe(12);
      expect(earnings.text).toContain("window opens Dec 3, 12 days out");
      expect(earnings.text).toContain("Implied volatility tends to drop once the news is out");
      expect(ids(metrics).indexOf("earnings")).toBeLessThan(ids(metrics).indexOf("premium"));
    });

    it("says the window is open now when it already is", () => {
      const earnings = find(
        metricsFor(trade({ print: { start: "2026-12-03", days: 0 } })),
        "earnings",
      );
      expect(earnings.value).toBe(0);
      expect(earnings.text).toContain("the window is open now");
      expect(earnings.text).not.toContain("days out");
    });

    it("says nothing about earnings when there is no print", () => {
      expect(ids(metricsFor(trade()))).not.toContain("earnings");
    });

    it("leaves the warning off a sold option, whose metrics carry no earnings line", () => {
      const sold = metricsFor(trade({ ...SHORT_PUT, print: { start: "2026-12-03", days: 12 } }));
      expect(ids(sold)).not.toContain("earnings");
    });
  });

  describe("when the trade is a covered call", () => {
    const t = trade(SHORT_CALL);
    const metrics = metricsFor(t);

    it("cites the sold-option numbers, with assignment rather than in-the-money", () => {
      expect(ids(metrics)).toEqual([
        "delta",
        "chance-of-profit",
        "chance-assigned",
        "theta-per-day",
        "iv",
        "premium",
        "max-loss",
        "account-at-risk",
      ]);
    });

    it("measures profit from today's price less the premium, since the shares are already held", () => {
      const expected = probabilityAbove({ ...odds(t), target: 98.5 }) ?? Number.NaN;
      const profit = find(metrics, "chance-of-profit");
      expect(profit.value).toBeCloseTo(expected, 12);
      expect(profit.text).toContain("(break-even $98.50)");
    });

    it("quotes the model chance the shares are called away at the strike", () => {
      const expected = probabilityAbove({ ...odds(t), target: 110 }) ?? Number.NaN;
      const assigned = find(metrics, "chance-assigned");
      expect(assigned.value).toBeCloseTo(expected, 12);
      expect(assigned.text).toContain("model chance the shares are called away at $110.00.");
    });

    it("sizes the premium collected and the shares' risk less that premium", () => {
      expect(find(metrics, "premium").value).toBeCloseTo(150, 10);
      expect(find(metrics, "premium").text).toBe(
        "$150.00 premium collected if filled at the limit.",
      );
      expect(find(metrics, "max-loss").value).toBeCloseTo(9_850, 10);
      expect(find(metrics, "max-loss").text).toContain(
        "The call adds no downside to shares you already hold.",
      );
    });

    it("cites decay as earned, not paid", () => {
      const decay = find(metrics, "theta-per-day");
      expect(decay.value).toBeGreaterThan(0);
      expect(decay.text).toContain("from time decay today");
      expect(decay.text).not.toContain("lost to time decay");
    });

    it("divides the account's risk by its equity", () => {
      expect(find(metrics, "account-at-risk").value).toBeCloseTo(9_850 / 10_000, 10);
      expect(find(metrics, "account-at-risk").text).toBe("98.5% of your account at that max loss.");
    });
  });

  describe("when the trade is a cash-secured put", () => {
    const t = trade({ ...SHORT_PUT, contracts: 2 });
    const metrics = metricsFor(t);

    it("measures profit above the strike less the premium", () => {
      const expected = probabilityAbove({ ...odds(t), target: 88.75 }) ?? Number.NaN;
      const profit = find(metrics, "chance-of-profit");
      expect(profit.value).toBeCloseTo(expected, 12);
      expect(profit.text).toContain("(break-even $88.75)");
    });

    it("quotes the model chance of being assigned below the strike", () => {
      const expected = probabilityBelow({ ...odds(t), target: 90 }) ?? Number.NaN;
      const assigned = find(metrics, "chance-assigned");
      expect(assigned.value).toBeCloseTo(expected, 12);
      expect(assigned.text).toBe(
        `${(expected * 100).toFixed(0)}% model chance you are assigned and buy 200 shares at $90.00.`,
      );
    });

    it("loses the strike less the premium on every share if the stock goes to zero", () => {
      expect(find(metrics, "max-loss").value).toBeCloseTo(17_750, 10);
      expect(find(metrics, "max-loss").text).toBe(
        "$17,750.00 if assigned and the stock went to zero (strike less the premium).",
      );
    });

    it("collects the premium on every share", () => {
      expect(find(metrics, "premium").value).toBeCloseTo(250, 10);
    });
  });

  describe("when the contract is degenerate", () => {
    it("falls back to zero chances and zero decay instead of throwing", () => {
      const metrics = metricsFor(trade({ spot: 0, strike: 0 }));
      expect(find(metrics, "chance-of-profit").value).toBe(0);
      expect(find(metrics, "chance-in-the-money").value).toBe(0);
      expect(find(metrics, "theta-per-day").value).toBeCloseTo(0, 12);
    });
  });
});
