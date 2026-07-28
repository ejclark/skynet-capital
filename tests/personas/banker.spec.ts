import { BankerPersona } from "../../src/personas/banker.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

/**
 * The Banker is the house's income engine. It underwrites the steady names in its book
 * ONLY when the tape is calm, banks gains with discipline the moment they mature, and
 * protects the vault on drawdown. It never chases a loud market and never speculates
 * outside its book.
 */
describe("BankerPersona", () => {
  const persona = new BankerPersona();

  describe("when a book name trades on a calm tape and nothing is held", () => {
    it("underwrites a position sized to its entry notional", () => {
      const context = aContext({ SPY: { last: 500, momentum: 0.005 } });

      const intents = persona.decide(context, aPortfolio());

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "SPY", side: "buy", type: "market" });
      // $100k notional at the ask (500.05) buys 199 whole shares.
      expect(intents[0]?.quantity).toBe(199);
    });

    it("underwrites each calm book name independently", () => {
      const context = aContext({
        SPY: { last: 500, momentum: 0.001 },
        GLD: { last: 200, momentum: -0.002 },
      });

      const intents = persona.decide(context, aPortfolio());

      expect(intents.map((i) => i.symbol).sort()).toEqual(["GLD", "SPY"]);
      expect(intents.every((i) => i.side === "buy")).toBe(true);
    });
  });

  describe("when the tape turns loud", () => {
    it("never chases — no entries in either direction", () => {
      const context = aContext({
        SPY: { last: 500, momentum: 0.02 },
        GLD: { last: 200, momentum: -0.03 },
      });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("when a name outside its book looks attractive", () => {
    it("ignores it — the bank only underwrites its own book", () => {
      const context = aContext({ NVDA: { last: 140, momentum: 0.001 } });

      expect(persona.decide(context, aPortfolio())).toEqual([]);
    });
  });

  describe("when a held position matures past the harvest threshold", () => {
    it("banks the whole gain", () => {
      const context = aContext({ SPY: { last: 104 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "SPY", quantity: 80, avgPrice: 100 })],
      });

      const intents = persona.decide(context, portfolio);

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "SPY", side: "sell", quantity: 80 });
    });

    it("banks it even on a loud tape — discipline is not momentum-gated", () => {
      const context = aContext({ SPY: { last: 110, momentum: 0.05 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "SPY", quantity: 80, avgPrice: 100 })],
      });

      const intents = persona.decide(context, portfolio);

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "SPY", side: "sell" });
    });
  });

  describe("when a held position draws down past the protect threshold", () => {
    it("protects the vault — cuts the whole position, no doubling down", () => {
      const context = aContext({ SPY: { last: 95 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "SPY", quantity: 80, avgPrice: 100 })],
      });

      const intents = persona.decide(context, portfolio);

      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "SPY", side: "sell", quantity: 80 });
    });
  });

  describe("when a held position sits between harvest and protect", () => {
    it("holds — no churn, and no pyramiding on a calm tape", () => {
      const context = aContext({ SPY: { last: 101, momentum: 0.001 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "SPY", quantity: 80, avgPrice: 100 })],
      });

      expect(persona.decide(context, portfolio)).toEqual([]);
    });
  });

  describe("when a quote is dead (no positive last price)", () => {
    it("does nothing on that symbol — no entry, no forced exit on bad data", () => {
      const context = aContext({ SPY: { last: 0 } });
      const portfolio = aPortfolio({
        positions: [aPosition({ symbol: "SPY", quantity: 80, avgPrice: 100 })],
      });

      expect(persona.decide(context, portfolio)).toEqual([]);
    });
  });

  describe("with a custom configuration", () => {
    it("honors the configured book and calm band — knobs are config, not hardcoded", () => {
      const tightBank = new BankerPersona({
        book: ["KO"],
        calmBand: 0.001,
        harvestPct: 0.04,
        protectPct: 0.05,
        entryNotional: 10_000,
      });
      // SPY is calm but off-book; KO is on-book but louder than the tight band.
      const loud = aContext({ SPY: { last: 500 }, KO: { last: 60, momentum: 0.002 } });
      expect(tightBank.decide(loud, aPortfolio())).toEqual([]);

      const calm = aContext({ KO: { last: 60, momentum: 0.0005 } });
      const intents = tightBank.decide(calm, aPortfolio());
      expect(intents).toHaveLength(1);
      expect(intents[0]).toMatchObject({ symbol: "KO", side: "buy" });
    });
  });

  describe("every intent it produces", () => {
    it("carries a human-readable reason", () => {
      const entries = persona.decide(aContext({ SPY: { last: 500 } }), aPortfolio());
      const exits = persona.decide(
        aContext({ SPY: { last: 110 } }),
        aPortfolio({ positions: [aPosition({ symbol: "SPY", quantity: 10, avgPrice: 100 })] }),
      );

      for (const intent of [...entries, ...exits]) {
        expect(intent.reason.length).toBeGreaterThan(0);
      }
    });
  });
});
