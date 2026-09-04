import type { Participant } from "../../src/participants/participant.js";
import { resolveBotCredentials } from "../../src/server/bot-credentials-gate.js";

/**
 * `resolveBotCredentials` — the ONLY code allowed to hand a live Alpaca credential to the
 * internal bridge (`envelope.json`). Mirrors `account-identity-gate.spec.ts`'s house shape.
 */

const sauron: Participant = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  personaId: "sauron",
  credentials: { apiKey: "KID", apiSecret: "SECRET", baseUrl: "https://paper-api.alpaca.markets" },
};

const ann: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "human-key", apiSecret: "human-secret" },
};

describe("resolveBotCredentials", () => {
  const findParticipant = (id: string) => [sauron, ann].find((p) => p.id === id);

  it("resolves a bot's own credentials", () => {
    expect(resolveBotCredentials({ findParticipant }, "sauron")).toEqual({
      apiKey: "KID",
      apiSecret: "SECRET",
      baseUrl: "https://paper-api.alpaca.markets",
    });
  });

  it("refuses a human participant, even by a valid id", () => {
    expect(resolveBotCredentials({ findParticipant }, "ann")).toBeUndefined();
  });

  it("refuses an unknown id", () => {
    expect(resolveBotCredentials({ findParticipant }, "ghost")).toBeUndefined();
  });

  it("omits baseUrl when the bot has none", () => {
    const noBaseUrl: Participant = { ...sauron, credentials: { apiKey: "k", apiSecret: "s" } };
    const result = resolveBotCredentials({ findParticipant: () => noBaseUrl }, "sauron");
    expect(result).toEqual({ apiKey: "k", apiSecret: "s" });
    expect(result).not.toHaveProperty("baseUrl");
  });
});
