import type { Alert } from "../../src/alerts/alert.js";
import type { AlertDeliveryPrefs, DeliveryMessage } from "../../src/alerts/alert-delivery.js";
import { DELIVERY_OFF, deliveryFingerprint } from "../../src/alerts/alert-delivery.js";
import {
  AlertDeliveryDispatcher,
  MAX_PER_RUN,
} from "../../src/alerts/alert-delivery-dispatcher.js";
import type {
  AlertDeliveryPort,
  AlertDeliveryRecord,
  AlertDeliveryStorePort,
  DeliveryReceipt,
} from "../../src/ports/alert-delivery.js";

/**
 * The dispatcher: once each, loudest first, capped, and a failed send left unmarked so the next
 * pass retries it. These are the four behaviours a member feels — nothing twice, nothing missed,
 * no storm, and no alert silently swallowed by a provider outage.
 */

class FakeStore implements AlertDeliveryStorePort {
  readonly sent = new Map<string, string[]>();
  constructor(private readonly prefsById: Record<string, AlertDeliveryPrefs>) {}
  load(consumerId: string): Promise<AlertDeliveryRecord> {
    return Promise.resolve({
      prefs: this.prefsById[consumerId] ?? DELIVERY_OFF,
      sent: this.sent.get(consumerId) ?? [],
    });
  }
  savePrefs(consumerId: string, prefs: AlertDeliveryPrefs): Promise<void> {
    this.prefsById[consumerId] = prefs;
    return Promise.resolve();
  }
  recordSent(consumerId: string, fingerprint: string): Promise<void> {
    this.sent.set(consumerId, [...(this.sent.get(consumerId) ?? []), fingerprint]);
    return Promise.resolve();
  }
  listMembers(): Promise<readonly string[]> {
    return Promise.resolve(Object.keys(this.prefsById));
  }
}

class FakeTransport implements AlertDeliveryPort {
  readonly channel = "email" as const;
  readonly from = "alerts@x.com";
  readonly sent: DeliveryMessage[] = [];
  constructor(private readonly answer: (n: number) => DeliveryReceipt = () => ({ ok: true })) {}
  send(message: DeliveryMessage): Promise<DeliveryReceipt> {
    this.sent.push(message);
    return Promise.resolve(this.answer(this.sent.length));
  }
}

const alert = (over: Partial<Alert> = {}): Alert => ({
  id: "a1",
  at: 1_000,
  source: "position-watch",
  priority: "info",
  title: "A reminder",
  ...over,
});

const on: AlertDeliveryPrefs = {
  channel: "email",
  minPriority: "info",
  destination: "ann@x.com",
};

describe("AlertDeliveryDispatcher", () => {
  it("sends a matching alert once and never again, even when it is re-derived with a fresh id", async () => {
    const store = new FakeStore({ ann: on });
    const transport = new FakeTransport();
    const dispatcher = new AlertDeliveryDispatcher(store, transport);

    const first = await dispatcher.deliver("ann", [alert()]);
    expect(first.delivered).toEqual([deliveryFingerprint(alert())]);
    const second = await dispatcher.deliver("ann", [alert({ id: "a1-again", at: 2_000 })]);
    expect(second.delivered).toEqual([]);
    expect(transport.sent).toHaveLength(1);
  });

  it("sends nothing for a member who has delivery off, or who set a louder floor", async () => {
    const transport = new FakeTransport();
    const dispatcher = new AlertDeliveryDispatcher(
      new FakeStore({ ann: DELIVERY_OFF, bob: { ...on, minPriority: "critical" } }),
      transport,
    );
    expect((await dispatcher.deliver("ann", [alert({ priority: "critical" })])).delivered).toEqual(
      [],
    );
    expect((await dispatcher.deliver("bob", [alert({ priority: "warning" })])).delivered).toEqual(
      [],
    );
    expect(transport.sent).toEqual([]);
  });

  it("mails the loudest first and holds the rest back rather than sending a storm", async () => {
    const transport = new FakeTransport();
    const dispatcher = new AlertDeliveryDispatcher(new FakeStore({ ann: on }), transport);
    const many = [
      alert({ id: "i1", priority: "info", title: "quiet 1", dedupeKey: "q1" }),
      alert({ id: "i2", priority: "info", title: "quiet 2", dedupeKey: "q2" }),
      alert({ id: "c1", priority: "critical", title: "loud", dedupeKey: "c1" }),
      alert({ id: "w1", priority: "warning", title: "middling", dedupeKey: "w1" }),
      alert({ id: "i3", priority: "info", title: "quiet 3", dedupeKey: "q3" }),
    ];
    const outcome = await dispatcher.deliver("ann", many);
    expect(transport.sent).toHaveLength(MAX_PER_RUN);
    expect(transport.sent.map((m) => m.subject)).toEqual([
      "[Act now] loud",
      "[Worth a look] middling",
      "[FYI] quiet 1",
    ]);
    expect(outcome.heldBack).toBe(many.length - MAX_PER_RUN);
  });

  it("leaves a refused send unmarked, so the next pass tries it again", async () => {
    const store = new FakeStore({ ann: on });
    const transport = new FakeTransport((n) =>
      n === 1 ? { ok: false, reason: "provider down" } : { ok: true },
    );
    const dispatcher = new AlertDeliveryDispatcher(store, transport);
    const failed = await dispatcher.deliver("ann", [alert()]);
    expect(failed.delivered).toEqual([]);
    expect(failed.failed).toEqual([
      { fingerprint: deliveryFingerprint(alert()), reason: "provider down" },
    ]);
    expect(store.sent.get("ann")).toBeUndefined();
    const retried = await dispatcher.deliver("ann", [alert()]);
    expect(retried.delivered).toEqual([deliveryFingerprint(alert())]);
  });

  it("stops mailing a previous owner once the account has changed hands", async () => {
    const transport = new FakeTransport();
    const store = new FakeStore({ ann: on });
    // The account is now owned by someone else; the stored destination is stale.
    const dispatcher = new AlertDeliveryDispatcher(store, transport, () => "bob@x.com");
    expect((await dispatcher.deliver("ann", [alert()])).delivered).toEqual([]);
    expect(transport.sent).toEqual([]);
    // Same owner, different case, is still the owner.
    const same = new AlertDeliveryDispatcher(store, transport, () => "Ann@X.com");
    expect((await same.deliver("ann", [alert()])).delivered).toHaveLength(1);
  });

  it("does not touch the store for an empty list", async () => {
    const transport = new FakeTransport();
    const dispatcher = new AlertDeliveryDispatcher(new FakeStore({ ann: on }), transport);
    expect(await dispatcher.deliver("ann", [])).toEqual({
      delivered: [],
      failed: [],
      heldBack: 0,
    });
  });
});
