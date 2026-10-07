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

  describe("configure (#4649) — re-tune without changing whether it runs", () => {
    const seed = (store: SubscriptionStore, enabled: boolean) =>
      store.subscribe(
        "acct-1",
        {
          playbookId: "HC-SAURON",
          mode: "standard",
          capitalAllocated: 5_000,
          enabled,
          symbols: ["NVDA"],
          compoundAllocation: true,
        },
        AT,
      );

    it("replaces mode, capital, symbols and compounding, keeping a paused subscription paused", () => {
      const store = new SubscriptionStore(path);
      seed(store, false);
      store.configure(
        "acct-1",
        "HC-SAURON",
        { mode: "aggressive", capitalAllocated: 8_000, symbols: ["NVDA", "CRWV"] },
        LATER,
      );
      expect(store.load()["acct-1"]).toEqual([
        {
          accountId: "acct-1",
          playbookId: "HC-SAURON",
          mode: "aggressive",
          capitalAllocated: 8_000,
          enabled: false,
          symbols: ["NVDA", "CRWV"],
          createdAt: AT.toISOString(),
          updatedAt: LATER.toISOString(),
        },
      ]);
    });

    it("keeps an active subscription active", () => {
      const store = new SubscriptionStore(path);
      seed(store, true);
      store.configure("acct-1", "HC-SAURON", { mode: "conservative", capitalAllocated: 1_000 });
      expect(store.load()["acct-1"]?.[0]?.enabled).toBe(true);
    });

    it("absent capital is uncapped and absent symbols is the whole basket", () => {
      const store = new SubscriptionStore(path);
      seed(store, true);
      store.configure("acct-1", "HC-SAURON", { mode: "standard" });
      const [sub] = store.load()["acct-1"] ?? [];
      expect(sub).not.toHaveProperty("capitalAllocated");
      expect(sub).not.toHaveProperty("symbols");
      expect(sub).not.toHaveProperty("compoundAllocation");
    });

    it("never creates a subscription: an unknown one answers undefined and writes nothing", () => {
      const store = new SubscriptionStore(path);
      seed(store, true);
      expect(store.configure("acct-1", "S1-NVDA", { mode: "standard" })).toBeUndefined();
      expect(store.configure("acct-2", "HC-SAURON", { mode: "standard" })).toBeUndefined();
      expect(store.load()["acct-1"]).toHaveLength(1);
      expect(store.load()).not.toHaveProperty("acct-2");
    });

    it("leaves the account's other subscriptions untouched and in place", () => {
      const store = new SubscriptionStore(path);
      store.subscribe(
        "acct-1",
        { playbookId: "S1-NVDA", mode: "standard", capitalAllocated: 2_000, enabled: true },
        AT,
      );
      seed(store, true);
      store.configure("acct-1", "S1-NVDA", { mode: "aggressive", capitalAllocated: 3_000 }, LATER);
      const subs = store.load()["acct-1"] ?? [];
      expect(subs.map((s) => s.playbookId)).toEqual(["S1-NVDA", "HC-SAURON"]);
      expect(subs[1]).toMatchObject({ mode: "standard", symbols: ["NVDA"] });
    });
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

  describe("a rewrite keeps what this build could not read (#4772)", () => {
    const record = (playbookId: string, over: Record<string, unknown> = {}) => ({
      accountId: "sauron",
      playbookId,
      mode: "standard",
      capitalAllocated: 50_000,
      enabled: true,
      createdAt: AT.toISOString(),
      updatedAt: AT.toISOString(),
      ...over,
    });
    // What a newer build might have written: a field on a record, a record this build cannot
    // parse, and a file-level key.
    const newerField = record("CRWV-WHEEL", { window: { avoid: ["print"] } });
    const unread = record("G1-GOOG", { mode: "observe-v2" });
    const allocations = { sauron: { wheel: { capitalAllocated: 75_000, updatedAt: "x" } } };
    const file = { sauron: [newerField, unread], $allocations: allocations };

    const writes: readonly [string, (store: SubscriptionStore) => unknown][] = [
      [
        "subscribe",
        (store) =>
          store.subscribe(
            "banker",
            { playbookId: "S1-NVDA", mode: "standard", enabled: true },
            LATER,
          ),
      ],
      ["setEnabled", (store) => store.setEnabled("sauron", "CRWV-WHEEL", false, LATER)],
      [
        "configure",
        (store) =>
          store.configure(
            "sauron",
            "CRWV-WHEEL",
            { mode: "aggressive", capitalAllocated: 9 },
            LATER,
          ),
      ],
      ["unsubscribe", (store) => store.unsubscribe("sauron", "S1-NVDA")],
      ["replace", (store) => store.replace(store.load())],
    ];

    for (const [name, write] of writes) {
      it(`${name} keeps a newer build's field, an unread record and the allocations, and says so`, async () => {
        await writeFile(path, JSON.stringify(file), "utf8");
        const reports: string[] = [];
        const store = new SubscriptionStore(path, (m) => reports.push(m));

        write(store);

        const raw = JSON.parse(await readFile(path, "utf8"));
        expect(
          raw.sauron.find((r: { playbookId: string }) => r.playbookId === "CRWV-WHEEL").window,
        ).toEqual({
          avoid: ["print"],
        });
        expect(raw.sauron).toContainEqual(unread);
        expect(raw.$allocations).toEqual(allocations);
        expect(reports).toEqual([expect.stringContaining("sauron: kept 1 record unchanged")]);
      });
    }

    it("a re-subscribe keeps the conviction and newer fields on the record it replaces", async () => {
      const conviction = { reason: "Eric's call", checkOn: "2027-01-29" };
      await writeFile(path, JSON.stringify({ sauron: [{ ...newerField, conviction }] }), "utf8");
      const store = new SubscriptionStore(path);

      store.subscribe(
        "sauron",
        { playbookId: "CRWV-WHEEL", mode: "aggressive", enabled: true },
        LATER,
      );

      const [after] = store.load().sauron ?? [];
      expect(after).toMatchObject({ mode: "aggressive", conviction, window: { avoid: ["print"] } });
      expect(after).not.toHaveProperty("capitalAllocated");
    });

    it("reads the allocations, and an empty set for a file with none or a torn one", async () => {
      await writeFile(path, JSON.stringify(file), "utf8");
      expect(new SubscriptionStore(path).loadAllocations()).toEqual(allocations);
      await writeFile(path, JSON.stringify({ sauron: [newerField] }), "utf8");
      expect(new SubscriptionStore(path).loadAllocations()).toEqual({});
      await writeFile(path, "{ torn", "utf8");
      expect(new SubscriptionStore(path).loadAllocations()).toEqual({});
    });
  });
});
