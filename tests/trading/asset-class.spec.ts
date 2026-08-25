import {
  assetClassOf,
  humanizeCryptoSymbol,
  isCryptoSymbol,
  parseCryptoPair,
} from "../../src/trading/asset-class.js";

describe("asset class", () => {
  it("reads both spellings Alpaca uses for the same pair", () => {
    expect(parseCryptoPair("BTC/USD")).toEqual({ base: "BTC", quote: "USD" });
    expect(parseCryptoPair("BTCUSD")).toEqual({ base: "BTC", quote: "USD" });
    expect(parseCryptoPair("shib/usdt")).toEqual({ base: "SHIB", quote: "USDT" });
    expect(parseCryptoPair("ETHUSDC")).toEqual({ base: "ETH", quote: "USDC" });
  });

  it("splits the longest quote suffix, so USDT never reads as USD", () => {
    expect(parseCryptoPair("SOLUSDT")).toEqual({ base: "SOL", quote: "USDT" });
  });

  it("refuses to promote an unknown ticker to crypto on shape alone", () => {
    expect(parseCryptoPair("FOOUSD")).toBeUndefined();
    expect(isCryptoSymbol("NVDA")).toBe(false);
    expect(isCryptoSymbol("")).toBe(false);
  });

  it("classifies the three things an account can hold", () => {
    expect(assetClassOf("NVDA")).toBe("equity");
    expect(assetClassOf("MSFT260918P00420000")).toBe("option");
    expect(assetClassOf("BTC/USD")).toBe("crypto");
    expect(assetClassOf("DOGEUSD")).toBe("crypto");
  });

  it("humanizes a pair and passes everything else through unchanged", () => {
    expect(humanizeCryptoSymbol("BTCUSD")).toBe("BTC/USD");
    expect(humanizeCryptoSymbol("ETH/USD")).toBe("ETH/USD");
    expect(humanizeCryptoSymbol("NVDA")).toBe("NVDA");
  });
});
