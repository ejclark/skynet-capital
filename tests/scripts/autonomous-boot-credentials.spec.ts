import type { AlpacaCredentials } from "../../src/alpaca/credentials.js";
import type { BotCredentialsClient } from "../../src/autonomous/bot-credentials-client.js";
import type { Bot } from "../../src/bots/bot.js";
import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { primeBotCredentials } from "../../src/scripts/autonomous-boot-credentials.js";

class Silent implements Persona {
  constructor(readonly id: string) {}
  readonly name = "Silent";
  readonly thesis = "test";
  decide(_c: MarketContext, _p: Portfolio): OrderIntent[] {
    return [];
  }
}

const ENV_CREDS: AlpacaCredentials = { apiKey: "ENV-KEY", apiSecret: "env-secret" };
const STORE_CREDS: AlpacaCredentials = { apiKey: "STORE-KEY", apiSecret: "store-secret" };

/** A credentials client whose `prime` serves exactly the given ids — no network. */
function clientServing(served: Record<string, AlpacaCredentials>): BotCredentialsClient {
  return {
    reconcile: () => Promise.resolve(),
    prime: (_state, apply) => {
      for (const [id, creds] of Object.entries(served)) apply(id, creds);
      return Promise.resolve();
    },
  };
}

// Confirmed live 2026-09-04: every boot built the clock/news/safety-seed on the env credential and
// printed expected 401s before the store credential was swapped in. Priming replaces the env pair
// before anything is built — and leaves a bot the bridge can't serve on env, untouched.
describe("primeBotCredentials", () => {
  const bots: Bot[] = [
    { persona: new Silent("sauron"), credentials: ENV_CREDS },
    { persona: new Silent("prospector"), credentials: ENV_CREDS },
  ];

  it("swaps in the store credential for every bot the bridge serves, before any broker exists", async () => {
    const logged: string[] = [];
    const primed = await primeBotCredentials(
      clientServing({ sauron: STORE_CREDS }),
      { bots: { sauron: { credentialsVersion: "v1" } } },
      bots,
      (line) => logged.push(line),
    );

    expect(primed.map((b) => b.credentials)).toEqual([STORE_CREDS, ENV_CREDS]);
    expect(primed.map((b) => b.persona.id)).toEqual(["sauron", "prospector"]);
    expect(logged).toEqual(["[creds] sauron: booting on the store credential (env superseded)"]);
    // Never mutates the caller's bots — env stays the break-glass default in that array.
    expect(bots[0]?.credentials).toBe(ENV_CREDS);
  });

  it("leaves every bot on env when the bridge serves nothing (down, or no store rows yet)", async () => {
    const logged: string[] = [];
    const primed = await primeBotCredentials(clientServing({}), { bots: {} }, bots, (line) =>
      logged.push(line),
    );
    expect(primed).toEqual(bots);
    expect(logged).toEqual([]);
  });
});
