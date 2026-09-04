import type { AddressInfo } from "node:net";
import type { AlpacaCredentials } from "../../src/alpaca/credentials.js";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotCredentialsClient } from "../../src/autonomous/bot-credentials-client.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";

const SECRET = "test-bot-credentials-secret";

async function withListener(
  resolve: (id: string) => { apiKey: string; apiSecret: string } | undefined,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createInsightsListener({
    record: () => Promise.resolve(),
    botCredentials: { secret: SECRET, resolve },
  });
  await new Promise<void>((res) => server.listen(0, res));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((res) => server.close(() => res()));
  }
}

function state(bots: ControlsState["bots"]): ControlsState {
  return { bots };
}

describe("resolveBotCredentialsClient", () => {
  it("is a stable no-op when the bridge URL or the secret is unset", async () => {
    const client = resolveBotCredentialsClient(() => true, {} as NodeJS.ProcessEnv);
    await expect(
      client.reconcile(state({ sauron: { credentialsVersion: "v1" } })),
    ).resolves.toBeUndefined();
  });

  it("pulls and applies a bot whose credentialsVersion is new", async () => {
    await withListener(
      (id) => (id === "sauron" ? { apiKey: "NEW-KEY", apiSecret: "new-secret" } : undefined),
      async (base) => {
        const applied: [string, AlpacaCredentials][] = [];
        const client = resolveBotCredentialsClient(
          (id, creds) => {
            applied.push([id, creds]);
            return true;
          },
          {
            SKYNET_INSIGHTS_BRIDGE_URL: base,
            SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: SECRET,
          } as NodeJS.ProcessEnv,
        );

        await client.reconcile(state({ sauron: { credentialsVersion: "v1" } }));

        expect(applied).toEqual([["sauron", { apiKey: "NEW-KEY", apiSecret: "new-secret" }]]);
      },
    );
  });

  it("does not re-pull a version it already synced", async () => {
    let calls = 0;
    await withListener(
      () => {
        calls++;
        return { apiKey: "K", apiSecret: "S" };
      },
      async (base) => {
        const client = resolveBotCredentialsClient(() => true, {
          SKYNET_INSIGHTS_BRIDGE_URL: base,
          SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: SECRET,
        } as NodeJS.ProcessEnv);
        const s = state({ sauron: { credentialsVersion: "v1" } });
        await client.reconcile(s);
        await client.reconcile(s);
        expect(calls).toBe(1);
      },
    );
  });

  it("retries on the next reconcile when onRotated could not apply it (e.g. no broker yet)", async () => {
    let calls = 0;
    await withListener(
      () => {
        calls++;
        return { apiKey: "K", apiSecret: "S" };
      },
      async (base) => {
        let ready = false;
        const client = resolveBotCredentialsClient(() => ready, {
          SKYNET_INSIGHTS_BRIDGE_URL: base,
          SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: SECRET,
        } as NodeJS.ProcessEnv);
        const s = state({ sauron: { credentialsVersion: "v1" } });

        await client.reconcile(s); // onRotated returns false — not yet synced
        expect(calls).toBe(1);

        ready = true;
        await client.reconcile(s); // same version, retried because it was never marked synced
        expect(calls).toBe(2);

        await client.reconcile(s); // now synced — no further pull
        expect(calls).toBe(2);
      },
    );
  });

  it("skips a bot with no credentialsVersion at all", async () => {
    let calls = 0;
    await withListener(
      () => {
        calls++;
        return { apiKey: "K", apiSecret: "S" };
      },
      async (base) => {
        const client = resolveBotCredentialsClient(() => true, {
          SKYNET_INSIGHTS_BRIDGE_URL: base,
          SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: SECRET,
        } as NodeJS.ProcessEnv);
        await client.reconcile(state({ sauron: {} }));
        expect(calls).toBe(0);
      },
    );
  });

  // Confirmed live 2026-09-04: every boot built the clock/news/safety-seed on the env credential,
  // printed a screen of expected 401s, and only THEN swapped in the store credential. `prime`
  // pulls before anything is built, and marks the version synced so the boot reconcile is a no-op.
  it("prime() hands each bot's pair to the caller before any broker exists, and marks it synced", async () => {
    let calls = 0;
    await withListener(
      () => {
        calls++;
        return { apiKey: "STORE-KEY", apiSecret: "store-secret" };
      },
      async (base) => {
        const rotated: string[] = [];
        const client = resolveBotCredentialsClient(
          (id) => {
            rotated.push(id);
            return true;
          },
          {
            SKYNET_INSIGHTS_BRIDGE_URL: base,
            SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: SECRET,
          } as NodeJS.ProcessEnv,
        );
        const primed: [string, AlpacaCredentials][] = [];
        const boot = state({ sauron: { credentialsVersion: "v1" } });

        await client.prime(boot, (id, creds) => primed.push([id, creds]));
        expect(primed).toEqual([["sauron", { apiKey: "STORE-KEY", apiSecret: "store-secret" }]]);
        expect(rotated).toEqual([]); // prime never routes through onRotated — no broker exists yet

        // The boot-time reconcile that follows sees the version already synced: no second pull.
        await client.reconcile(boot);
        expect(calls).toBe(1);
        expect(rotated).toEqual([]);

        // A genuinely new version later still rotates through onRotated as before.
        await client.reconcile(state({ sauron: { credentialsVersion: "v2" } }));
        expect(calls).toBe(2);
        expect(rotated).toEqual(["sauron"]);
      },
    );
  });

  it("prime() is a no-op for a bot the bridge refuses — it boots on env and self-heals later", async () => {
    await withListener(
      () => undefined, // 404: no such bot
      async (base) => {
        const client = resolveBotCredentialsClient(() => true, {
          SKYNET_INSIGHTS_BRIDGE_URL: base,
          SKYNET_BOT_CREDENTIALS_BRIDGE_SECRET: SECRET,
        } as NodeJS.ProcessEnv);
        const primed: string[] = [];
        await client.prime(state({ sauron: { credentialsVersion: "v1" } }), (id) =>
          primed.push(id),
        );
        expect(primed).toEqual([]);
      },
    );
  });
});
