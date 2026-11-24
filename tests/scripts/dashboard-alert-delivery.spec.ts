import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonlAlertDeliveryStore } from "../../src/adapters/jsonl-alert-delivery-store.js";
import type { FillWatch } from "../../src/alerts/fill-watch.js";
import {
  type AlertDeliveryWiring,
  wireAlertDelivery,
} from "../../src/scripts/dashboard-alert-delivery.js";
import type { DeskAlertsDeps } from "../../src/server/desk-alerts-route.js";

/**
 * The delivery wiring's retry path for a one-order watch (#8352, found auditing #8301). A member
 * with account-wide email off taps "Email me when it fills"; the fill's one delivery pass meets a
 * provider that answers 429. Nothing else happens on the account. The hourly sweep is the only
 * trigger left, so it must reach a member who holds an open watch — not just one who switched the
 * account-wide channel on — or the email is never sent and the watch never ends.
 */

const NOW = new Date("2026-11-24T14:31:00Z");

const watch: FillWatch = {
  orderId: "ord-1",
  destination: "ann@x.com",
  link: "https://app.example/app/trade?desk=human-ann&section=orders",
  at: "2026-11-24T02:00:00.000Z",
};

const filled = {
  id: "e-1",
  eventType: "order.filled",
  actor: { participantId: "human-ann" },
  correlationId: "ord-1",
  source: "stream",
  outcome: "success" as const,
  target: { kind: "order", id: "ord-1" },
  at: "2026-11-24T14:30:00Z",
  visibility: "owner-only" as const,
  payload: { symbol: "NVDA", side: "buy", quantity: 5, filledQuantity: 5, price: 181.32 },
};

/** The fewest deps the strip's derivation needs to see one filled order on one account. */
function deps(): DeskAlertsDeps {
  return {
    hub: { getState: () => ({ participants: [{ id: "human-ann", cash: 0, positions: [] }] }) },
    optionsClientFor: () => undefined,
    now: () => NOW,
    activityLog: { list: () => Promise.resolve([filled]) },
  } as unknown as DeskAlertsDeps;
}

/** Wait for `done`, polling; fails the spec with `what` rather than hanging it. */
async function until(done: () => boolean, what: string, ms = 2_000): Promise<void> {
  const start = Date.now();
  while (!done()) {
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("wireAlertDelivery — a watched order's failed send is retried by the sweep (#8352)", () => {
  let dir: string;
  let wiring: AlertDeliveryWiring | undefined;
  let statuses: number[];
  let derivations: number;
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "alert-wiring-"));
    statuses = [];
    derivations = 0;
    // The provider refuses the first send (rate limited), then recovers.
    globalThis.fetch = (() => {
      const status = statuses.length === 0 ? 429 : 200;
      statuses.push(status);
      const body = status === 200 ? JSON.stringify({ id: "msg-1" }) : "rate limited";
      return Promise.resolve(new Response(body, { status }));
    }) as typeof fetch;
  });
  afterEach(() => {
    wiring?.stop();
    wiring = undefined;
    globalThis.fetch = realFetch;
    rmSync(dir, { recursive: true, force: true });
  });

  function wire(): AlertDeliveryWiring {
    wiring = wireAlertDelivery({
      env: {
        SKYNET_ALERT_DELIVERY_DIR: dir,
        SKYNET_ALERT_EMAIL_API_KEY: "test-key",
        SKYNET_ALERT_EMAIL_FROM: "Skynet <alerts@example.com>",
        // 30 ms, so a spec sees dozens of sweeps in well under a second.
        SKYNET_ALERT_SWEEP_MINUTES: "0.0005",
      },
      deps: () => {
        derivations += 1;
        return deps();
      },
      activityEvents: { subscribe: () => ({ unsubscribe: () => undefined }) },
      ownerEmailFor: () => "ann@x.com",
    });
    return wiring;
  }

  it("retries a tap-only watch (no account-wide choice saved) until it sends, then ends it", async () => {
    await new JsonlAlertDeliveryStore(dir).saveWatch("human-ann", watch);
    const { nudge, store } = wire();
    // The fill's one pass: the provider answers 429.
    nudge?.("human-ann");
    await until(() => statuses.length >= 1, "the fill's first send");
    await until(() => statuses.length >= 2, "the sweep's retry");
    // The send lands before its ledger line and the watch's end are written; give those a beat.
    let record = await store.load("human-ann");
    const start = Date.now();
    while (record.watches.length > 0 && Date.now() - start < 2_000) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      record = await store.load("human-ann");
    }
    expect(record.sent).toEqual(["fill-watch:ord-1"]);
    expect(record.watches).toEqual([]);
    // Ended: later sweeps neither send it again nor keep visiting the account for it.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(statuses).toEqual([429, 200]);
  });

  it("retries the same way when the member's account-wide channel is explicitly off", async () => {
    const seed = new JsonlAlertDeliveryStore(dir);
    await seed.savePrefs("human-ann", { channel: "off", minPriority: "critical" });
    await seed.saveWatch("human-ann", watch);
    const { nudge } = wire();
    nudge?.("human-ann");
    await until(() => statuses.length >= 2, "the sweep's retry");
    expect(statuses).toEqual([429, 200]);
  });

  it("runs one pass at boot, so a restart retries an open watch instead of resetting the hour (#8398)", async () => {
    // Production's config: no sweep interval set, so the timer is an hour. Releases restart the
    // dashboard far more often than that, so the boot pass is the retry that actually lands.
    await new JsonlAlertDeliveryStore(dir).saveWatch("human-ann", watch);
    let releaseReconcile: () => void = () => undefined;
    const reconciled = new Promise<void>((resolve) => {
      releaseReconcile = resolve;
    });
    wiring = wireAlertDelivery({
      env: {
        SKYNET_ALERT_DELIVERY_DIR: dir,
        SKYNET_ALERT_EMAIL_API_KEY: "test-key",
        SKYNET_ALERT_EMAIL_FROM: "Skynet <alerts@example.com>",
      },
      deps: () => {
        derivations += 1;
        return deps();
      },
      activityEvents: { subscribe: () => ({ unsubscribe: () => undefined }) },
      ownerEmailFor: () => "ann@x.com",
      ready: reconciled,
    });
    // The boot pass waits for the boot reconcile, so it reads the broker window's fills.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(derivations).toBe(0);
    releaseReconcile();
    await until(() => statuses.length >= 1, "the boot pass's send");
    expect(statuses).toEqual([429]);
  });

  it("does no work for a member with the channel off and no open watch", async () => {
    await new JsonlAlertDeliveryStore(dir).savePrefs("human-ann", {
      channel: "off",
      minPriority: "critical",
    });
    wire();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(derivations).toBe(0);
    expect(statuses).toEqual([]);
  });
});
