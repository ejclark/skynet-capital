import {
  ALPACA_DATA_HOST,
  assertPaperOrDataHost,
  assertPaperTradingHost,
  PAPER_TRADING_HOST,
} from "../../src/alpaca/paper-host.js";

// Real-money and look-alike hosts a paper-only app must never be pointed at (#6954 slice 2).
const REFUSED = [
  "https://api.alpaca.markets",
  "https://api.alpaca.markets/v2",
  "http://paper-api.alpaca.markets",
  "https://paper-api.alpaca.markets.evil.example",
  "https://paper-api.alpaca.markets@evil.example",
  "https://evil.example/paper-api.alpaca.markets",
  "https://custom.example.com",
  "not a url",
  "",
];

describe("assertPaperTradingHost", () => {
  it("admits the paper Trading API, with or without a path", () => {
    expect(() => assertPaperTradingHost(`https://${PAPER_TRADING_HOST}`)).not.toThrow();
    expect(() => assertPaperTradingHost(`https://${PAPER_TRADING_HOST}/v2`)).not.toThrow();
  });

  it("admits an offline stand-in: a dotless host no public DNS resolves", () => {
    expect(() => assertPaperTradingHost("http://skynet-broker:8080")).not.toThrow();
    expect(() => assertPaperTradingHost("http://localhost:9000")).not.toThrow();
  });

  it.each(REFUSED)("refuses %j", (baseUrl) => {
    expect(() => assertPaperTradingHost(baseUrl)).toThrow(/paper-only/);
  });

  it("refuses the data host: the fills stream authenticates an account and takes paper alone", () => {
    expect(() => assertPaperTradingHost(`https://${ALPACA_DATA_HOST}`)).toThrow(/paper-only/);
  });
});

describe("assertPaperOrDataHost", () => {
  it("admits exactly the two hosts one transport serves", () => {
    expect(() => assertPaperOrDataHost(`https://${PAPER_TRADING_HOST}`)).not.toThrow();
    expect(() => assertPaperOrDataHost(`https://${ALPACA_DATA_HOST}`)).not.toThrow();
  });

  it("admits an offline stand-in", () => {
    expect(() => assertPaperOrDataHost("http://skynet-broker:8080")).not.toThrow();
  });

  it.each(REFUSED)("refuses %j", (baseUrl) => {
    expect(() => assertPaperOrDataHost(baseUrl)).toThrow(/paper-only/);
  });
});
