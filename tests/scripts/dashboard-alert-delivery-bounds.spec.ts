import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WATCH_MAX_AGE_MS } from "../../src/alerts/fill-watch.js";
import type { ActivityEvent } from "../../src/observatory/activity-event.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import {
  type AlertDeliveryWiring,
  wireAlertDelivery,
} from "../../src/scripts/dashboard-alert-delivery.js";
import type { DeskAlertsDeps } from "../../src/server/desk-alerts-route.js";

/**
 * The BOUNDS on a watched order's sweep retry (#8352). `dashboard-alert-delivery.spec.ts` proves
 * the sweep retries a refused send; these prove it stops: after `WATCH_MAX_SEND_FAILURES` refusals,
 * and for a watch older than `WATCH_MAX_AGE_MS`. Real wiring, real JSONL store, real transport over
 * a stubbed fetch, a 30 ms sweep, and NO further order event — "one small retry, never a loop".
 */

const ACCOUNT = "human-acct";
const OWNER = "owner@x.com";
const realFetch = globalThis.fetch;

const filled = (at: string): ActivityEvent => ({
  id: `ord-1:order.filled:${at}`,
  eventType: "order.filled",
  actor: { participantId: ACCOUNT },
  target: { kind: "order", id: "ord-1" },
  at,
  correlationId: "ord-1",
  source: "stream",
  outcome: "success",
  visibility: "owner-only",
  payload: { symbol: "NVDA", quantity: 3, filledQuantity: 3, price: 120 },
});

/** The provider answers each send with the next status in `statuses` (the last one repeats). */
function stubProvider(statuses: readonly number[]): number[] {
  const answered: number[] = [];
  globalThis.fetch = (() => {
    const status = statuses[Math.min(answered.length, statuses.length - 1)] ?? 200;
    answered.push(status);
    const body = status === 200 ? JSON.stringify({ id: `msg-${answered.length}` }) : "slow down";
    return Promise.resolve(new Response(body, { status }));
  }) as typeof fetch;
  return answered;
}

async function until(check: () => boolean | Promise<boolean>, ms = 2_000): Promise<void> {
  const deadline = Date.now() + ms;
  while (!(await check())) {
    if (Date.now() > deadline) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("wireAlertDelivery — a watched order's sweep retry is bounded (#8352)", () => {
  let dir: string;
  let bus: InMemoryActivityEventBus;
  let wiring: AlertDeliveryWiring | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "alert-wiring-"));
    bus = new InMemoryActivityEventBus();
  });
  afterEach(() => {
    wiring?.stop();
    wiring = undefined;
    globalThis.fetch = realFetch;
    rmSync(dir, { recursive: true, force: true });
  });

  function wire(): AlertDeliveryWiring {
    const hub = {
      getState: () => ({ participants: [{ id: ACCOUNT, kind: "human", positions: [] }] }),
    } as unknown as DeskAlertsDeps["hub"];
    wiring = wireAlertDelivery({
      env: {
        SKYNET_ALERT_DELIVERY_DIR: dir,
        SKYNET_ALERT_EMAIL_API_KEY: "test-key",
        SKYNET_ALERT_EMAIL_FROM: "alerts@x.com",
        SKYNET_ALERT_SWEEP_MINUTES: "0.0005",
      },
      deps: () => ({ hub, activityLog: bus }),
      activityEvents: bus,
      ownerEmailFor: () => OWNER,
    });
    return wiring;
  }

  const watch = (at: string) => ({
    orderId: "ord-1",
    destination: OWNER,
    link: "https://app.example/app/trade?section=orders",
    at,
  });

  it("gives up after a bounded number of refused sends and drops the watch, rather than retrying forever", async () => {
    const answered = stubProvider([429]);
    const { store } = wire();
    await store.saveWatch(ACCOUNT, watch(new Date().toISOString()));
    await bus.publish(filled(new Date().toISOString()));

    await until(async () => (await store.load(ACCOUNT)).watches.length === 0);
    const sends = answered.length;
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect((await store.load(ACCOUNT)).watches).toEqual([]);
    expect(sends).toBe(5);
    expect(answered).toHaveLength(5);
  });

  it("drops a watch past the age limit on the next sweep, sending nothing, so it stops holding a slot", async () => {
    const answered = stubProvider([200]);
    const { store } = wire();
    const old = new Date(Date.now() - WATCH_MAX_AGE_MS - 60_000).toISOString();
    await store.saveWatch(ACCOUNT, watch(old));

    await until(async () => (await store.load(ACCOUNT)).watches.length === 0);

    expect((await store.load(ACCOUNT)).watches).toEqual([]);
    expect(answered).toEqual([]);
  });

  it("keeps a young watch whose order is still working", async () => {
    const answered = stubProvider([200]);
    const { store } = wire();
    await store.saveWatch(ACCOUNT, watch(new Date().toISOString()));

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect((await store.load(ACCOUNT)).watches).toHaveLength(1);
    expect(answered).toEqual([]);
  });
});
