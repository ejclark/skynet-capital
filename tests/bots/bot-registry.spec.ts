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

describe("when a persona has no dedicated account but a shared one exists", () => {
  const personas = [{ id: "prospector", name: "The Prospector", thesis: "t", decide: () => [] }];

  it("borrows the shared account rather than demanding a brand-new brokerage account", () => {
    const { bots, missing, sharedAccount } = loadBots(personas, {
      SKYNET_BOT_KEY: "shared-key",
      SKYNET_BOT_SECRET: "shared-secret",
    });

    expect(missing).toEqual([]);
    expect(sharedAccount).toEqual(["prospector"]);
    expect(bots[0]?.credentials).toMatchObject({
      apiKey: "shared-key",
      apiSecret: "shared-secret",
    });
  });

  it("still prefers its own account when it has one", () => {
    const { bots, sharedAccount } = loadBots(personas, {
      SKYNET_BOT_PROSPECTOR_KEY: "own-key",
      SKYNET_BOT_PROSPECTOR_SECRET: "own-secret",
      SKYNET_BOT_KEY: "shared-key",
      SKYNET_BOT_SECRET: "shared-secret",
    });

    expect(sharedAccount).toEqual([]);
    expect(bots[0]?.credentials).toMatchObject({ apiKey: "own-key" });
  });

  it("refuses to seat TWO personas on one account — merged positions are a broken experiment", () => {
    const two = [...personas, { id: "day-trader", name: "DT", thesis: "t", decide: () => [] }];

    const { bots, missing, sharedAccount } = loadBots(two, {
      SKYNET_BOT_KEY: "shared-key",
      SKYNET_BOT_SECRET: "shared-secret",
    });

    expect(bots).toEqual([]);
    expect(sharedAccount).toEqual([]);
    expect(missing).toEqual(expect.arrayContaining(["prospector", "day-trader"]));
  });

  it("lets one persona keep its own account while another borrows the shared one", () => {
    const two = [...personas, { id: "day-trader", name: "DT", thesis: "t", decide: () => [] }];

    const { bots, sharedAccount } = loadBots(two, {
      SKYNET_BOT_DAY_TRADER_KEY: "dt-key",
      SKYNET_BOT_DAY_TRADER_SECRET: "dt-secret",
      SKYNET_BOT_KEY: "shared-key",
      SKYNET_BOT_SECRET: "shared-secret",
    });

    expect(sharedAccount).toEqual(["prospector"]);
    expect(bots).toHaveLength(2);
  });
});
