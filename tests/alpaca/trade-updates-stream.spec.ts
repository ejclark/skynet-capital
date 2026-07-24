import { streamUrlFromBase } from "../../src/alpaca/trade-updates-stream.js";

describe("streamUrlFromBase", () => {
  it("derives the wss /stream URL from the paper base", () => {
    expect(streamUrlFromBase("https://paper-api.alpaca.markets")).toBe(
      "wss://paper-api.alpaca.markets/stream",
    );
  });

  it("tolerates a trailing /v2 on the base", () => {
    expect(streamUrlFromBase("https://paper-api.alpaca.markets/v2")).toBe(
      "wss://paper-api.alpaca.markets/stream",
    );
  });
});
