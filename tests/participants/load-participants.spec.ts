import { loadParticipants } from "../../src/participants/load-participants.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";

describe("loadParticipants", () => {
  const personas = createDefaultPersonas();

  it("loads bots (with persona) and humans (without) from the environment", () => {
    const env = {
      SKYNET_BOT_NEWS_FADER_KEY: "bk",
      SKYNET_BOT_NEWS_FADER_SECRET: "bs",
      SKYNET_HUMAN_ERIC_CLARK_KEY: "hk",
      SKYNET_HUMAN_ERIC_CLARK_SECRET: "hs",
    };

    const participants = loadParticipants(personas, env);

    const bot = participants.find((p) => p.kind === "bot");
    const human = participants.find((p) => p.kind === "human");
    expect(bot?.personaId).toBe("news-fader");
    expect(human?.displayName).toBe("Eric Clark");
    expect(human?.personaId).toBeUndefined();
    expect(human?.credentials.apiKey).toBe("hk");
    expect(human?.timezone).toBe("America/Chicago");
  });

  it("ignores a human key with no matching secret", () => {
    const env = { SKYNET_HUMAN_JOE_KEY: "hk" };
    expect(loadParticipants(personas, env)).toHaveLength(0);
  });
});
