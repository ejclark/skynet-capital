import { ALPACA_PAPER_BASE_URL, credentialEnvNames } from "../../src/bots/bot.js";

describe("credentialEnvNames", () => {
  it("derives KEY/SECRET env var names from a simple persona id", () => {
    expect(credentialEnvNames("futurist")).toEqual({
      key: "SKYNET_BOT_FUTURIST_KEY",
      secret: "SKYNET_BOT_FUTURIST_SECRET",
    });
  });

  it("replaces hyphens with underscores for multi-word persona ids", () => {
    expect(credentialEnvNames("news-fader")).toEqual({
      key: "SKYNET_BOT_NEWS_FADER_KEY",
      secret: "SKYNET_BOT_NEWS_FADER_SECRET",
    });
  });

  it("upper-cases an already-mixed-case persona id", () => {
    expect(credentialEnvNames("Gold-Bug")).toEqual({
      key: "SKYNET_BOT_GOLD_BUG_KEY",
      secret: "SKYNET_BOT_GOLD_BUG_SECRET",
    });
  });

  it("collapses multiple hyphens consistently (each becomes an underscore)", () => {
    expect(credentialEnvNames("multi-word-persona-id")).toEqual({
      key: "SKYNET_BOT_MULTI_WORD_PERSONA_ID_KEY",
      secret: "SKYNET_BOT_MULTI_WORD_PERSONA_ID_SECRET",
    });
  });

  it("still returns well-formed env var names for the empty-string edge case", () => {
    expect(credentialEnvNames("")).toEqual({
      key: "SKYNET_BOT__KEY",
      secret: "SKYNET_BOT__SECRET",
    });
  });
});

describe("ALPACA_PAPER_BASE_URL", () => {
  it("points at Alpaca's paper trading API host", () => {
    expect(ALPACA_PAPER_BASE_URL).toBe("https://paper-api.alpaca.markets");
  });
});
