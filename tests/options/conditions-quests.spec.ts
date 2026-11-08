import type { DailyHighReading } from "../../src/domain/daily-high.js";
import { type Quest, rankQuests } from "../../src/domain/quest.js";
import {
  CASH_SHARE_FLOOR,
  type ConditionsMarket,
  cashShare,
  conditionHolds,
  conditionsQuests,
} from "../../src/options/conditions-quests.js";

/**
 * Quests from cash × conditions (#7028 slice 3). The condition is the drawdown study's own (10%+
 * under the year high AND VIX 25+); the book gate is half cash and cash that covers the move; each
 * quest carries the study's measured numbers, says its edge is untested, and never calls a time good.
 */

const reading = (close: number, high = 100, session = "2026-11-06"): DailyHighReading => ({
  session,
  close,
  high,
});

function market(over: Partial<ConditionsMarket> = {}): ConditionsMarket {
  return {
    session: "2026-11-06",
    vix: 25.64,
    indexes: [{ symbol: "QQQ", reading: reading(86.4) }],
    ...over,
  };
}

const richBook = { cash: 80_000, equity: 100_000 };

describe("conditionHolds — the study's condition, both halves", () => {
  it("holds at exactly 10% under the high and VIX 25, and at nothing less", () => {
    expect(conditionHolds(reading(90), 25)).toBe(true);
    expect(conditionHolds(reading(90.01), 25)).toBe(false);
    expect(conditionHolds(reading(90), 24.99)).toBe(false);
  });
});

describe("cashShare", () => {
  it("is cash over the account's worth, and 0 for a negative balance or an empty account", () => {
    expect(cashShare({ cash: 50, equity: 100 })).toBe(0.5);
    expect(cashShare({ cash: -10, equity: 100 })).toBe(0);
    expect(cashShare({ cash: 10, equity: 0 })).toBe(0);
  });
});

describe("conditionsQuests", () => {
  it("offers the cash-secured put and the shares when the condition holds and the book is mostly cash", () => {
    const quests = conditionsQuests("ann-1", market(), richBook);
    expect(quests.map((q) => q.move.label)).toEqual([
      "Sell a cash-secured put on QQQ",
      "Buy QQQ shares",
    ]);
    for (const q of quests) {
      expect(q.source).toBe("conditions");
      expect(q.move.symbol).toBe("QQQ");
    }
  });

  it("never offers the long call", () => {
    const kinds = conditionsQuests("ann-1", market(), richBook).map((q) => q.move.kind);
    expect(kinds).not.toContain("buy-call");
  });

  it("offers nothing when the book is under half cash", () => {
    const thin = { cash: 100_000 * CASH_SHARE_FLOOR - 1, equity: 100_000 };
    expect(conditionsQuests("ann-1", market(), thin)).toEqual([]);
  });

  it("offers nothing when VIX is calm, even 14% under the high", () => {
    expect(conditionsQuests("ann-1", market({ vix: 19 }), richBook)).toEqual([]);
  });

  it("offers nothing when the index is shallower than 10% under", () => {
    const shallow = market({ indexes: [{ symbol: "SPY", reading: reading(94.4) }] });
    expect(conditionsQuests("ann-1", shallow, richBook)).toEqual([]);
  });

  it("keys each quest to the index that holds the condition, with that index's own rates", () => {
    const both = market({
      indexes: [
        { symbol: "SPY", reading: reading(88) },
        { symbol: "QQQ", reading: reading(86.4) },
      ],
    });
    const quests = conditionsQuests("ann-1", both, richBook);
    const rate = (sym: string, move: string) => {
      const q = quests.find((x) => x.move.symbol === sym && x.move.kind === move);
      return q?.baseRate.kind === "measured" ? q.baseRate : undefined;
    };
    expect(rate("SPY", "buy-shares")?.sample).toBe(73);
    expect(rate("QQQ", "buy-shares")?.sample).toBe(76);
    expect(rate("SPY", "sell-cash-secured-put")?.worstSingle).toBeCloseTo(-0.1386, 4);
    expect(rate("QQQ", "sell-cash-secured-put")?.worstSingle).toBeCloseTo(-0.2702, 4);
  });

  describe("the put's collateral", () => {
    const priced = (close: number) =>
      market({ indexes: [{ symbol: "QQQ", reading: reading(close, close / 0.85) }] });

    it("is offered only when cash covers a contract at the last close × 100", () => {
      const q = (cash: number) =>
        conditionsQuests("ann-1", priced(600), { cash, equity: cash * 1.2 }).map(
          (x) => x.move.kind,
        );
      expect(q(60_000)).toEqual(["sell-cash-secured-put", "buy-shares"]);
      expect(q(59_999)).toEqual(["buy-shares"]);
    });

    it("leaves the shares out too when cash can't buy one", () => {
      expect(conditionsQuests("ann-1", priced(600), { cash: 500, equity: 700 })).toEqual([]);
    });
  });

  describe("honesty", () => {
    const quests = conditionsQuests("ann-1", market(), richBook);

    it("carries the study's numbers with sample, episodes and worst decile as a measured base rate", () => {
      const put = quests[0];
      expect(put?.baseRate).toMatchObject({
        kind: "measured",
        sample: 76,
        episodes: 20,
        episodesNeeded: 32,
        source: "docs/research/drawdown-quests-2026-11.md",
      });
    });

    it("says the edge is untested in words, and makes no call", () => {
      for (const q of quests) {
        expect(q.baseRate.kind === "measured" && q.baseRate.note).toMatch(/edge untested/i);
        expect(q.houseCall).toBe("no-edge");
      }
    });

    it("names the put's worst case in its reasons", () => {
      const text = quests[0]?.why.map((w) => w.text).join(" ") ?? "";
      expect(text).toMatch(/worst sale .*lost 27%/);
      expect(text).toMatch(/assigned in 12%/);
    });

    it("tells the member VIX carried the result, not the drawdown", () => {
      expect(quests[0]?.why[0]?.text).toMatch(/VIX did the work/);
    });

    it("never says a time is good or great to buy", () => {
      for (const q of quests) {
        const text = [q.move.label, ...q.why.map((w) => w.text), ...q.exits.map((e) => e.text)];
        expect(text.join(" ")).not.toMatch(
          /\b(good|great|best|perfect)\b.*\b(time|moment|chance)\b/i,
        );
        expect(text.join(" ")).not.toMatch(/\b(good|great) time\b/i);
      }
    });

    it("names the move by its job and drafts it on Trade for its owner to fire", () => {
      expect(quests[0]?.move.href).toBe("/app/trade?desk=ann-1&symbol=QQQ&play=201");
      expect(quests[1]?.move.href).toBe("/app/trade?desk=ann-1&symbol=QQQ&play=101");
    });
  });

  describe("expiry", () => {
    it("holds until the next close, skipping the weekend", () => {
      const fri = conditionsQuests("a", market(), richBook)[0];
      expect(fri?.expires.date).toBe("2026-11-09");
      expect(fri?.expires.why).toMatch(/closes within 10% of its high or VIX closes under 25/);
      const thu = market({
        session: "2026-11-05",
        indexes: [{ symbol: "QQQ", reading: reading(86.4, 100, "2026-11-05") }],
      });
      expect(conditionsQuests("a", thu, richBook)[0]?.expires.date).toBe("2026-11-06");
    });

    it("is not derived once the condition stops holding", () => {
      expect(conditionsQuests("a", market(), richBook)).toHaveLength(2);
      expect(conditionsQuests("a", market({ vix: 22 }), richBook)).toEqual([]);
    });
  });
});

describe("rankQuests — measured quests", () => {
  const [put, shares] = conditionsQuests("ann-1", market(), richBook) as [Quest, Quest];
  const tested: Quest = {
    ...put,
    id: "tested",
    source: "position",
    houseCall: "take",
    baseRate: { kind: "tested", rate: 0.6, sample: 80, worstDecile: -0.1, source: "x.md" },
  };
  const untested: Quest = {
    ...put,
    id: "untested",
    source: "position",
    houseCall: "take",
    baseRate: { kind: "untested", note: "" },
  };

  it("ranks below every tested quest", () => {
    expect(rankQuests([put, shares, tested]).map((q) => q.id)[0]).toBe("tested");
  });

  it("ranks the house's untested 'take' ahead of a measured quest that claims no edge", () => {
    expect(rankQuests([put, untested]).map((q) => q.id)[0]).toBe("untested");
  });

  it("orders measured quests by the share of past entries that paid", () => {
    expect(rankQuests([shares, put]).map((q) => q.move.kind)).toEqual([
      "sell-cash-secured-put",
      "buy-shares",
    ]);
  });
});
