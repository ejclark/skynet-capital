import { loadBots } from "../../src/bots/bot-registry.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";

describe("loadBots", () => {
  const personas = createDefaultPersonas();

  it("builds a bot for every persona whose credentials are present", () => {
    const env = {
      SKYNET_BOT_NEWS_FADER_KEY: "k1",
      SKYNET_BOT_NEWS_FADER_SECRET: "s1",
      SKYNET_BOT_GOLD_BUG_KEY: "k2",
      SKYNET_BOT_GOLD_BUG_SECRET: "s2",
    };

    const { bots, missing } = loadBots(personas, env);

    expect(bots.map((b) => b.persona.id).sort()).toEqual(["gold-bug", "news-fader"]);
    expect(bots.find((b) => b.persona.id === "news-fader")?.credentials.apiKey).toBe("k1");
    expect(missing).toContain("retail-investor");
    expect(missing).toContain("futurist");
  });

  it("treats a key without its secret as missing (no half-configured bot)", () => {
    const env = { SKYNET_BOT_FUTURIST_KEY: "k" };

    const { bots, missing } = loadBots(personas, env);

    expect(bots).toHaveLength(0);
    expect(missing).toContain("futurist");
  });

  it("passes through an optional custom base URL", () => {
    const env = {
      SKYNET_BOT_NEWS_FADER_KEY: "k1",
      SKYNET_BOT_NEWS_FADER_SECRET: "s1",
      ALPACA_PAPER_BASE_URL: "https://example.test",
    };

    const { bots } = loadBots(personas, env);

    expect(bots[0]?.credentials.baseUrl).toBe("https://example.test");
  });
});
