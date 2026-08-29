import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SubscriptionStore } from "../../src/server/subscription-store.js";

const AT = new Date("2026-08-29T12:00:00.000Z");
const LATER = new Date("2026-08-29T13:00:00.000Z");

describe("SubscriptionStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-subscriptions-"));
    path = join(dir, "playbook-subscriptions.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads the empty state when no file exists", () => {
    expect(new SubscriptionStore(path).load()).toEqual({});
  });

  it("subscribes an account to a playbook, stamping created/updated", () => {
    const store = new SubscriptionStore(path);
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );

    const state = store.load();
    expect(state["acct-1"]).toEqual([
      {
        accountId: "acct-1",
        playbookId: "S1-NVDA",
        mode: "standard",
        capitalAllocated: 5_000,
        enabled: true,
        createdAt: AT.toISOString(),
        updatedAt: AT.toISOString(),
      },
    ]);
  });

  it("replacing an existing subscription preserves its original createdAt", () => {
    const store = new SubscriptionStore(path);
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "aggressive", capitalAllocated: 8_000, enabled: true },
      LATER,
    );

    const [sub] = store.load()["acct-1"] ?? [];
    expect(sub).toMatchObject({
      mode: "aggressive",
      capitalAllocated: 8_000,
      createdAt: AT.toISOString(),
      updatedAt: LATER.toISOString(),
    });
  });

  it("keeps subscriptions to different playbooks separate, scoped to their own account", () => {
    const store = new SubscriptionStore(path);
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );
    store.subscribe(
      "acct-1",
      { playbookId: "G1-GOOG", mode: "standard", capitalAllocated: 2_000, enabled: true },
      AT,
    );
    store.subscribe(
      "acct-2",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 9_000, enabled: true },
      AT,
    );

    const state = store.load();
    expect(state["acct-1"]?.map((s) => s.playbookId).sort()).toEqual(["G1-GOOG", "S1-NVDA"]);
    expect(state["acct-2"]).toHaveLength(1);
    expect(state["acct-2"]?.[0]?.capitalAllocated).toBe(9_000);
  });

  it("unsubscribe removes just that playbook, leaving the account's other subscriptions intact", () => {
    const store = new SubscriptionStore(path);
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );
    store.subscribe(
      "acct-1",
      { playbookId: "G1-GOOG", mode: "standard", capitalAllocated: 2_000, enabled: true },
      AT,
    );
    store.unsubscribe("acct-1", "S1-NVDA");

    const state = store.load();
    expect(state["acct-1"]?.map((s) => s.playbookId)).toEqual(["G1-GOOG"]);
  });

  it("unsubscribing an account's last subscription removes the account key entirely", () => {
    const store = new SubscriptionStore(path);
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );
    store.unsubscribe("acct-1", "S1-NVDA");

    expect(store.load()).toEqual({});
  });

  it("setEnabled flips just the enabled flag and stamps updatedAt", () => {
    const store = new SubscriptionStore(path);
    store.subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );
    store.setEnabled("acct-1", "S1-NVDA", false, LATER);

    const [sub] = store.load()["acct-1"] ?? [];
    expect(sub).toMatchObject({
      enabled: false,
      capitalAllocated: 5_000,
      createdAt: AT.toISOString(),
      updatedAt: LATER.toISOString(),
    });
  });

  it("setEnabled on a non-existent subscription is a no-op", () => {
    const store = new SubscriptionStore(path);
    expect(store.setEnabled("acct-1", "S1-NVDA", true)).toEqual({});
  });

  it("treats a torn/malformed file as empty and reports, never throws", async () => {
    await writeFile(path, "{ definitely not js", "utf8");
    const reports: string[] = [];
    const store = new SubscriptionStore(path, (m) => reports.push(m));
    expect(store.load()).toEqual({});
    expect(reports).toHaveLength(1);
  });

  it("drops individually malformed subscriptions without discarding the rest of the file", async () => {
    await writeFile(
      path,
      JSON.stringify({
        "acct-1": [
          {
            playbookId: "S1-NVDA",
            mode: "standard",
            capitalAllocated: 5_000,
            enabled: true,
            createdAt: AT.toISOString(),
            updatedAt: AT.toISOString(),
          },
          { playbookId: "bad-mode", mode: "extreme", capitalAllocated: 1, enabled: true },
        ],
      }),
      "utf8",
    );
    const state = new SubscriptionStore(path).load();
    expect(state["acct-1"]).toHaveLength(1);
    expect(state["acct-1"]?.[0]?.playbookId).toBe("S1-NVDA");
  });

  it("writes durable JSON a fresh store can read back", async () => {
    new SubscriptionStore(path).subscribe(
      "acct-1",
      { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 5_000, enabled: true },
      AT,
    );
    const raw = JSON.parse(await readFile(path, "utf8"));
    expect(raw["acct-1"][0].playbookId).toBe("S1-NVDA");
    expect(new SubscriptionStore(path).load()["acct-1"]?.[0]?.playbookId).toBe("S1-NVDA");
  });
});
