import type { AddressInfo } from "node:net";
import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { resolveBotControls } from "../../src/autonomous/bot-controls-client.js";
import { createSubscriptionSync } from "../../src/autonomous/subscription-sync.js";
import {
  buildSubscriptionsSnapshot,
  type SubscriptionsSnapshot,
} from "../../src/autonomous/subscriptions-wire.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import type { SubscriptionsState } from "../../src/subscriptions/subscription-state.js";

/**
 * The whole bridge, over a real socket (issue #3595): the dashboard folding its Playbook Store
 * into `GET /controls`, the bots client reading it back off the poll it already makes, and the
 * swap deciding what to do with it. The gap this closes was invisible to every unit — each side
 * worked, and nothing connected them.
 */

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-20T00:00:00.000Z",
  ...overrides,
});

const CONTROLS: ControlsState = { bots: {} };

/** The listener + a client pointed at it, exactly as in prod minus 6PN. `subscriptions` is
 *  omitted entirely when `store` is undefined — the app build that predates this field. */
async function withBridge(
  store: (() => SubscriptionsState) | undefined,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createInsightsListener({
    record: () => Promise.resolve(),
    controls: () => CONTROLS,
    ...(store ? { subscriptions: () => buildSubscriptionsSnapshot(store(), Date.now()) } : {}),
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("the Playbook Store bridge, end to end", () => {
  it("carries a subscribe from the dashboard's store to a running bot on the next poll", async () => {
    let state: SubscriptionsState = {};
    await withBridge(
      () => state,
      async (base) => {
        const applied: (readonly PlaybookSubscription[])[] = [];
        const sync = createSubscriptionSync({
          bots: [{ personaId: "sauron", applySubscriptions: (subs) => applied.push(subs) }],
        });
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          undefined,
          undefined,
          (snapshot) => sync.accept(snapshot),
        );

        // Boot: nothing subscribed. The bot trades the house roster only.
        await client.fetchOnce();
        expect(applied).toEqual([[]]);
        const houseVersion = sync.version();
        expect(houseVersion).toBeDefined();

        // The member subscribes in the UI — one poll later, the running bot has it.
        state = { sauron: [sub()] };
        await client.fetchOnce();
        expect(applied.at(-1)).toEqual([sub()]);
        expect(sync.version()).not.toBe(houseVersion);

        // A poll with nothing changed does not touch the roster again.
        await client.fetchOnce();
        expect(applied).toHaveLength(2);
      },
    );
  });

  it("reports no version at all against an app build that sends no subscriptions", async () => {
    await withBridge(undefined, async (base) => {
      const applied: unknown[] = [];
      const sync = createSubscriptionSync({
        bots: [{ personaId: "sauron", applySubscriptions: (subs) => applied.push(subs) }],
      });
      const client = resolveBotControls(
        { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
        undefined,
        undefined,
        (snapshot: SubscriptionsSnapshot) => sync.accept(snapshot),
      );

      expect(await client.fetchOnce()).toEqual(CONTROLS);
      expect(applied).toEqual([]);
      // Load-bearing: "never heard from the dashboard" must not be reported as a version, and an
      // empty local file must never be dressed up as success.
      expect(sync.version()).toBeUndefined();
    });
  });

  it("keeps the last roster it received when the bridge goes away", async () => {
    let base = "";
    const applied: (readonly PlaybookSubscription[])[] = [];
    const sync = createSubscriptionSync({
      bots: [{ personaId: "sauron", applySubscriptions: (subs) => applied.push(subs) }],
    });
    await withBridge(
      () => ({ sauron: [sub()] }),
      async (b) => {
        base = b;
        const client = resolveBotControls(
          { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
          undefined,
          undefined,
          (snapshot) => sync.accept(snapshot),
        );
        await client.fetchOnce();
        expect(applied).toEqual([[sub()]]);
      },
    );

    // Server closed: the poll fails, nothing is offered to the swap, and the version in force
    // stays exactly where it was — the fleet keeps trading what it last heard.
    const inForce = sync.version();
    const client = resolveBotControls(
      { SKYNET_INSIGHTS_BRIDGE_URL: base } as NodeJS.ProcessEnv,
      undefined,
      undefined,
      (snapshot) => sync.accept(snapshot),
    );
    expect(await client.fetchOnce()).toBeNull();
    expect(applied).toHaveLength(1);
    expect(sync.version()).toBe(inForce);
  });
});
