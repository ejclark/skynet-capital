import type { AddressInfo } from "node:net";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import type { ControlsPollReport } from "../../src/autonomous/controls-poll-wire.js";
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

  it("fires onFetched with the parsed state on every successful poll", async () => {
    const state: ControlsState = { bots: { sauron: { credentialsVersion: "v1" } } };
    await withBridge(
      () => state,
      async (base) => {
        const seen: ControlsState[] = [];
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          (s) => seen.push(s),
        );
        await client.fetchOnce();
        expect(seen).toEqual([state]);
      },
    );
  });

  it("never lets a throwing onFetched hook fail the poll it rides on", async () => {
    await withBridge(
      () => ({ bots: {} }),
      async (base) => {
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          () => {
            throw new Error("hook exploded");
          },
        );
        await expect(client.fetchOnce()).resolves.toEqual({ bots: {} });
      },
    );
  });
});

/**
 * The self-report round trip (#666): the bots process's own `GIT_SHA` riding the poll it already
 * makes, over a real socket. This is what lets the owner's ops-status panel answer "on what
 * commit?" without a Fly credential — so the thing worth proving is that the app receives exactly
 * what the process claimed, and receives nothing when it claimed nothing.
 */
async function withReportingBridge(
  run: (base: string, reports: ControlsPollReport[]) => Promise<void>,
): Promise<void> {
  const reports: ControlsPollReport[] = [];
  const server = createInsightsListener({
    record: () => Promise.resolve(),
    controls: () => ({ bots: {} }),
    onControlsPoll: (report) => reports.push(report),
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`, reports);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("the bots process's running commit on the controls poll", () => {
  const SHA = "9a1b2c3d4e5f60000000000000000000000000ab";

  it("carries GIT_SHA from the polling process to the app that serves the panel", async () => {
    await withReportingBridge(async (base, reports) => {
      const client = resolveBotControls({
        SKYNET_INSIGHTS_BRIDGE_URL: base,
        GIT_SHA: SHA,
      } as NodeJS.ProcessEnv);
      await client.fetchOnce();
      expect(reports).toEqual([{ gitSha: SHA }]);
    });
  });

  it("reports nothing when the process has no GIT_SHA — a rollback drops it (fly.toml)", async () => {
    await withReportingBridge(async (base, reports) => {
      const client = resolveBotControls({
        SKYNET_INSIGHTS_BRIDGE_URL: base,
      } as NodeJS.ProcessEnv);
      await client.fetchOnce();
      expect(reports).toEqual([{}]);
    });
  });

  it("still serves the poll when the report is junk, rather than passing it on", async () => {
    await withReportingBridge(async (base, reports) => {
      const client = resolveBotControls({
        SKYNET_INSIGHTS_BRIDGE_URL: base,
        GIT_SHA: "not-a-commit",
      } as NodeJS.ProcessEnv);
      expect(await client.fetchOnce()).toEqual({ bots: {} });
      expect(reports).toEqual([{}]);
    });
  });
});
