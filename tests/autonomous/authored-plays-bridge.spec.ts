import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAuthoredPlaysWire } from "../../src/autonomous/authored-plays-wire.js";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import { authoredPlaysHolder } from "../../src/scripts/autonomous-authored-plays.js";
import { AuthoredPlayStore } from "../../src/server/authored-play-store.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { aSpec } from "../support/authored-shadow.js";
import { LOADED_SUITE_BRIDGE_BUDGET } from "../support/bridge-budget.js";

/**
 * THE PROMOTED PLAYS, ACROSS THE BRIDGE (#5457 slice 3), over a real socket: the app's store →
 * `GET /controls` → the bots' client → the holder the roster builds read. Only a promoted play
 * crosses, only its author's bot compiles it, and it arrives BEFORE the subscriptions on the same poll.
 */

const CONTROLS: ControlsState = { bots: {} };
const ID = "U-futurist-amd-run-up";

describe("promoted plays over the bridge", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "skynet-plays-bridge-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function withApp(store: AuthoredPlayStore, run: (base: string) => Promise<void>) {
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      controls: () => CONTROLS,
      authoredPlays: () => buildAuthoredPlaysWire(store.load(), Date.now()),
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      await run(`http://127.0.0.1:${port}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  it("a draft and a shadow test cross as nothing; a promoted play crosses and compiles on its author's bot only", async () => {
    const store = new AuthoredPlayStore(join(dir, "authored-plays.json"));
    store.save("member-a", "AMD run-up", aSpec());
    await withApp(store, async (base) => {
      const holder = authoredPlaysHolder();
      let changes = 0;
      holder.onChange(() => changes++);
      const client = resolveBotControls(
        { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
        undefined,
        undefined,
        undefined,
        undefined,
        (wire) => holder.accept(wire),
        undefined,
        LOADED_SUITE_BRIDGE_BUDGET,
      );

      await client.fetchOnce();
      expect(holder.rosterFor("futurist").plays).toEqual([]);
      store.setShadow("member-a", ID, true);
      await client.fetchOnce();
      expect(holder.rosterFor("futurist").plays).toEqual([]);
      expect(changes).toBe(0);

      store.promote("member-a", ID);
      await client.fetchOnce();
      expect(holder.rosterFor("futurist").plays.map((p) => p.id)).toEqual([ID]);
      expect(holder.rosterFor("dragon").plays).toEqual([]);
      expect(changes).toBe(1);

      // The same set again is no change: nothing is rebuilt for a quiet poll.
      await client.fetchOnce();
      expect(changes).toBe(1);
    });
  });

  it("an app that predates the field leaves what the bots had", async () => {
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      controls: () => CONTROLS,
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const holder = authoredPlaysHolder();
      holder.accept({ kind: "authored-plays.v1", at: 1, plays: [aSpec()] });
      const client = resolveBotControls(
        { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` } as NodeJS.ProcessEnv,
        undefined,
        undefined,
        undefined,
        undefined,
        (wire) => holder.accept(wire),
        undefined,
        LOADED_SUITE_BRIDGE_BUDGET,
      );
      await client.fetchOnce();
      expect(holder.rosterFor("futurist").plays).toHaveLength(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
