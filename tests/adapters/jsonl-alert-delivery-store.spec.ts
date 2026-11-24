import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAlertDeliveryStore,
  JsonlAlertDeliveryStore,
} from "../../src/adapters/jsonl-alert-delivery-store.js";
import { DELIVERY_OFF } from "../../src/alerts/alert-delivery.js";

/**
 * The durable delivery store: a member's choice and their sent-ledger in one append-only file, both
 * surviving the deploy that would otherwise re-mail every standing alert.
 */

describe("JsonlAlertDeliveryStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "alert-delivery-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reads as off for a member who never opted in", async () => {
    const store = new JsonlAlertDeliveryStore(dir);
    expect(await store.load("human-nobody")).toEqual({
      prefs: DELIVERY_OFF,
      sent: [],
      watches: [],
    });
    expect(await store.listMembers()).toEqual([]);
  });

  it("keeps the last choice and the whole sent-ledger across a fresh instance", async () => {
    const first = new JsonlAlertDeliveryStore(dir);
    await first.savePrefs("human-ann", {
      channel: "email",
      minPriority: "info",
      destination: "ann@x.com",
    });
    await first.savePrefs("human-ann", {
      channel: "email",
      minPriority: "critical",
      destination: "ann@x.com",
    });
    await first.recordSent("human-ann", "fp-1");
    await first.recordSent("human-ann", "fp-1");
    const second = new JsonlAlertDeliveryStore(dir);
    expect(await second.load("human-ann")).toEqual({
      prefs: { channel: "email", minPriority: "critical", destination: "ann@x.com" },
      sent: ["fp-1"],
      watches: [],
    });
  });

  it("turning delivery off drops the destination and keeps the ledger", async () => {
    const store = new JsonlAlertDeliveryStore(dir);
    await store.savePrefs("human-ann", {
      channel: "email",
      minPriority: "info",
      destination: "ann@x.com",
    });
    await store.recordSent("human-ann", "fp-1");
    await store.savePrefs("human-ann", DELIVERY_OFF);
    expect(await store.load("human-ann")).toEqual({
      prefs: DELIVERY_OFF,
      sent: ["fp-1"],
      watches: [],
    });
  });

  it("scopes per member and lists only members who saved a choice", async () => {
    const store = new JsonlAlertDeliveryStore(dir);
    await store.savePrefs("human-ann", { channel: "off", minPriority: "critical" });
    await store.savePrefs("human-bob", {
      channel: "email",
      minPriority: "warning",
      destination: "bob@x.com",
    });
    await store.recordSent("human-bob", "fp-9");
    expect([...(await store.listMembers())].sort()).toEqual(["human-ann", "human-bob"]);
    expect((await store.load("human-ann")).sent).toEqual([]);
    expect((await store.load("human-bob")).prefs.destination).toBe("bob@x.com");
  });

  it("builds from the environment with the volume-pinned default", () => {
    expect(createAlertDeliveryStore({})).toBeInstanceOf(JsonlAlertDeliveryStore);
    expect(createAlertDeliveryStore({ SKYNET_ALERT_DELIVERY_DIR: dir })).toBeInstanceOf(
      JsonlAlertDeliveryStore,
    );
  });
  it("keeps one-order watches across a fresh instance, and an unwatch ends one (#8251)", async () => {
    const store = new JsonlAlertDeliveryStore(dir);
    const watch = (orderId: string) => ({
      orderId,
      destination: "owner@x.com",
      link: "https://app.example/app/trade?desk=human-acct&section=orders",
      at: "2026-11-24T02:00:00.000Z",
    });
    await store.saveWatch("human-acct", watch("ord-1"));
    await store.saveWatch("human-acct", watch("ord-2"));
    await store.dropWatch("human-acct", "ord-1");

    const fresh = new JsonlAlertDeliveryStore(dir);
    const record = await fresh.load("human-acct");
    expect(record.watches).toEqual([watch("ord-2")]);
    // A watch is not an account-wide choice: delivery still reads as off.
    expect(record.prefs).toEqual(DELIVERY_OFF);
  });
});
