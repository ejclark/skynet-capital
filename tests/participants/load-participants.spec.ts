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

  // The owner link is what makes an account "connected" (tradeable from its owner's session).
  // Env-declared humans get it from env or not at all — the roster is rebuilt every boot.
  it("stamps ownerEmail from SKYNET_HUMAN_<ID>_EMAIL, normalized to lowercase", () => {
    const env = {
      SKYNET_HUMAN_ERIC_KEY: "hk",
      SKYNET_HUMAN_ERIC_SECRET: "hs",
      SKYNET_HUMAN_ERIC_EMAIL: " EJClark83@Gmail.com ",
    };
    const [eric] = loadParticipants(personas, env);
    expect(eric?.ownerEmail).toBe("ejclark83@gmail.com");
  });

  it("leaves ownerEmail absent when no _EMAIL is declared", () => {
    const env = { SKYNET_HUMAN_ERIC_KEY: "hk", SKYNET_HUMAN_ERIC_SECRET: "hs" };
    const [eric] = loadParticipants(personas, env);
    expect(eric?.ownerEmail).toBeUndefined();
  });
});
