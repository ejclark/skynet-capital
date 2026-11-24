import { stageTradeMarket } from "../../../src/evals/companion/stage-trade-fixture.js";

/**
 * The "stage a trade" eval judges whether Moneypenny repeats the sizing tool's numbers faithfully,
 * so the NVDA world it prices against has to be self-consistent and hand-checkable: a malformed
 * chain (a missing week, a crossed market, a put priced like a call) would make the eval judge
 * against noise. These specs pin the shape the eval depends on, not any one premium.
 */
const WEDNESDAY = new Date("2026-11-25T15:00:00Z");
const FRIDAY = new Date("2026-11-27T15:00:00Z");

const expirations = (now: Date): string[] => {
  const seen = stageTradeMarket(now).chain.map((q) => q.expiration);
  return [...new Set(seen)];
};

describe("stageTradeMarket", () => {
  describe("when built on a Wednesday", () => {
    const market = stageTradeMarket(WEDNESDAY);

    it("is an open NVDA session at a $180 spot, stamped with the clock it was given", () => {
      expect(market.symbol).toBe("NVDA");
      expect(market.spot).toBe(180);
      expect(market.sessionOpen).toBe(true);
      expect(market.now).toBe("2026-11-25T15:00:00.000Z");
    });

    it("lists eight consecutive weekly Friday expirations, the first being this week's", () => {
      expect(expirations(WEDNESDAY)).toEqual([
        "2026-11-27",
        "2026-12-04",
        "2026-12-11",
        "2026-12-18",
        "2026-12-25",
        "2027-01-01",
        "2027-01-08",
        "2027-01-15",
      ]);
    });

    it("quotes a call and a put at each of thirteen strikes from $140 to $200 for every expiration", () => {
      const strikes = [...new Set(market.chain.map((q) => q.strike))].sort((a, b) => a - b);
      expect(strikes).toEqual([140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200]);
      expect(market.chain).toHaveLength(8 * 13 * 2);
      for (const e of expirations(WEDNESDAY)) {
        const week = market.chain.filter((q) => q.expiration === e);
        expect(week.filter((q) => q.type === "call")).toHaveLength(13);
        expect(week.filter((q) => q.type === "put")).toHaveLength(13);
      }
    });

    it("carries the flat 45% implied volatility on every contract", () => {
      expect(market.chain.every((q) => q.iv === 0.45)).toBe(true);
    });

    it("keeps every market uncrossed, with the ask above the bid", () => {
      for (const q of market.chain) {
        expect(q.bid).toBeDefined();
        expect(q.ask).toBeDefined();
        expect(q.ask as number).toBeGreaterThanOrEqual(q.bid as number);
      }
    });

    it("prices a spread of about six percent around the model price on a liquid contract", () => {
      const atm = market.chain.find(
        (q) => q.expiration === "2026-12-18" && q.strike === 180 && q.type === "call",
      );
      const mid = ((atm?.bid ?? 0) + (atm?.ask ?? 0)) / 2;
      expect(mid).toBeGreaterThan(0);
      expect(((atm?.ask ?? 0) - (atm?.bid ?? 0)) / mid).toBeCloseTo(0.06, 1);
    });

    it("prices a call richer the further it sits in the money, and a put the opposite way", () => {
      const at = (strike: number, type: "call" | "put") =>
        market.chain.find(
          (q) => q.expiration === "2026-12-18" && q.strike === strike && q.type === type,
        );
      expect(at(160, "call")?.bid as number).toBeGreaterThan(at(180, "call")?.bid as number);
      expect(at(180, "call")?.bid as number).toBeGreaterThan(at(200, "call")?.bid as number);
      expect(at(200, "put")?.bid as number).toBeGreaterThan(at(180, "put")?.bid as number);
      expect(at(180, "put")?.bid as number).toBeGreaterThan(at(160, "put")?.bid as number);
    });

    it("prices a later expiration richer than an earlier one at the same strike", () => {
      const at = (expiration: string) =>
        market.chain.find(
          (q) => q.expiration === expiration && q.strike === 180 && q.type === "call",
        );
      expect(at("2027-01-15")?.bid as number).toBeGreaterThan(at("2026-12-04")?.bid as number);
    });

    it("gives calls a positive feed delta and puts a negative one", () => {
      for (const q of market.chain) {
        if (q.feedDelta === undefined) continue;
        if (q.type === "call") expect(q.feedDelta).toBeGreaterThanOrEqual(0);
        else expect(q.feedDelta).toBeLessThanOrEqual(0);
      }
      expect(market.chain.some((q) => q.feedDelta !== undefined)).toBe(true);
    });
  });

  describe("when built on a Friday", () => {
    it("starts the ladder the following Friday, never on the day itself", () => {
      expect(expirations(FRIDAY)[0]).toBe("2026-12-04");
      expect(expirations(FRIDAY)).toHaveLength(8);
    });
  });

  describe("when built twice on the same clock", () => {
    it("returns the same world, so the eval is repeatable", () => {
      expect(stageTradeMarket(WEDNESDAY)).toEqual(stageTradeMarket(new Date(WEDNESDAY)));
    });
  });
});
