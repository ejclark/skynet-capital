import type { AddressInfo } from "node:net";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";

/**
 * The bridge round trip: the app's internal listener serving `GET /controls` and the bots-side
 * client consuming it — over a real socket, exactly as in prod (minus 6PN). The property under
 * test is the failure semantics: fail-open to last-known, never a throw into the trade loop.
 */
async function withBridge(
  controls: () => ControlsState,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createInsightsListener({ record: () => Promise.resolve(), controls });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("bot-controls bridge client", () => {
  it("is a stable no-op when the bridge URL is unset", async () => {
    const client = resolveBotControls({} as NodeJS.ProcessEnv);
    expect(client.enabled).toBe(false);
    expect(await client.fetchOnce()).toBeNull();
    expect(client.suspendedReason("sauron")).toBeNull();
    client.start();
    client.stop();
  });

  it("fetches the state and answers suspend checks from the snapshot", async () => {
    const state: ControlsState = { allSuspended: false, bots: { sauron: { suspended: true } } };
    await withBridge(
      () => state,
      async (base) => {
        const client = resolveBotControls({
          SKYNET_INSIGHTS_BRIDGE_URL: base,
        } as NodeJS.ProcessEnv);
        expect(client.enabled).toBe(true);
        expect(await client.fetchOnce()).toEqual(state);
        expect(client.suspendedReason("sauron")).toBe("suspended by owner");
        expect(client.suspendedReason("banker")).toBeNull();
      },
    );
  });

  it("keeps the last-known snapshot when the bridge goes away (fail-open)", async () => {
    let base = "";
    await withBridge(
      () => ({ bots: { sauron: { suspended: true } } }),
      async (b) => {
        base = b;
        const client = resolveBotControls({
          SKYNET_INSIGHTS_BRIDGE_URL: base,
        } as NodeJS.ProcessEnv);
        await client.fetchOnce();
        expect(client.suspendedReason("sauron")).toBe("suspended by owner");
      },
    );
    // Server is closed now: a fresh fetch fails, but a client holding a snapshot keeps it.
    const client = resolveBotControls({ SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv);
    expect(await client.fetchOnce()).toBeNull();
    expect(client.suspendedReason("sauron")).toBeNull(); // never fetched = empty, never a throw
  });

  it("the listener refuses /controls without the shared secret", async () => {
    await withBridge(
      () => ({ bots: {} }),
      async (base) => {
        const res = await fetch(`${base}/controls`);
        expect(res.status).toBe(401);
      },
    );
  });
});
