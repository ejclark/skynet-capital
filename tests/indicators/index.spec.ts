import {
  BOLLINGER_GLOSS,
  bollingerBands as bollingerDirect,
} from "../../src/indicators/bollinger.js";
import { EMA_GLOSS, ema as emaDirect } from "../../src/indicators/ema.js";
import { bollingerBands, ema, INDICATOR_GLOSS, rsi, sma } from "../../src/indicators/index.js";
import { RSI_GLOSS, rsi as rsiDirect } from "../../src/indicators/rsi.js";
import { SMA_GLOSS, sma as smaDirect } from "../../src/indicators/sma.js";

const SERIES = [10, 12, 11, 13, 12, 14, 15, 13, 16, 17];

describe("the indicators entry point", () => {
  describe("when a chart asks it for the four indicators", () => {
    it("computes the same SMA as the indicator's own module", () => {
      expect(sma(SERIES, 3)).toEqual(smaDirect(SERIES, 3));
      expect(sma([1, 2, 3, 4, 5], 3)).toEqual([undefined, undefined, 2, 3, 4]);
    });

    it("computes the same EMA as the indicator's own module", () => {
      expect(ema(SERIES, 4)).toEqual(emaDirect(SERIES, 4));
    });

    it("computes the same RSI as the indicator's own module", () => {
      expect(rsi(SERIES, 5)).toEqual(rsiDirect(SERIES, 5));
      expect(rsi([1, 2, 3, 4], 3)[3]).toBe(100);
    });

    it("computes the same Bollinger bands as the indicator's own module", () => {
      expect(bollingerBands(SERIES, 5, 2)).toEqual(bollingerDirect(SERIES, 5, 2));
      expect(bollingerBands([5, 5, 5], 3)[2]).toEqual({ middle: 5, upper: 5, lower: 5 });
    });

    it("returns absence, not a fabricated value, while the window is still filling", () => {
      const filling = [sma([1, 2], 5), ema([1, 2], 5), rsi([1, 2], 5), bollingerBands([1, 2], 5)];
      for (const out of filling) expect(out).toEqual([undefined, undefined]);
    });
  });

  describe("when the chart shows its 'how to read this' lines", () => {
    it("has one reading per indicator, keyed by the indicator's name", () => {
      expect(Object.keys(INDICATOR_GLOSS).sort()).toEqual(["bollinger", "ema", "rsi", "sma"]);
    });

    it("carries each indicator's own reading, not another's", () => {
      expect(INDICATOR_GLOSS.sma).toBe(SMA_GLOSS);
      expect(INDICATOR_GLOSS.ema).toBe(EMA_GLOSS);
      expect(INDICATOR_GLOSS.bollinger).toBe(BOLLINGER_GLOSS);
      expect(INDICATOR_GLOSS.rsi).toBe(RSI_GLOSS);
    });

    it("gives four distinct, non-empty plain-language lines", () => {
      const lines = Object.values(INDICATOR_GLOSS);
      for (const line of lines) expect(line.trim().length).toBeGreaterThan(20);
      expect(new Set(lines).size).toBe(4);
    });

    it("stays in the no-hype voice, naming the caveat beside each over-read", () => {
      for (const line of Object.values(INDICATOR_GLOSS)) expect(line).not.toContain("!");
      expect(INDICATOR_GLOSS.rsi).toMatch(/70/);
      expect(INDICATOR_GLOSS.rsi).toMatch(/30/);
      expect(INDICATOR_GLOSS.rsi).toMatch(/can stay extreme/);
      expect(INDICATOR_GLOSS.bollinger).toMatch(/isn't automatically a reversal/);
    });
  });
});
