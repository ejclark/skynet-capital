import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { answered, bot, configWith, fakeRes } from "../support/desk-json-fixtures.js";

/** #4777 AC7: a lot priced by the stream but sold by nothing reaches the bot's owner on the roll
 *  call — judged from the hub's broker read and the Store's subscriptions, paused ones included. */
describe("/heartbeat — a held lot nothing on the bot will sell", () => {
  const holdsGoog = {
    ...bot,
    positions: [
      { symbol: "NVDA", quantity: 10, avgPrice: 150, marketValue: 1_760 },
      { symbol: "GOOG", quantity: 5, avgPrice: 170, marketValue: 900 },
    ],
  };
  const subscriptionsWith = (rows: { playbookId: string; enabled: boolean }[]) =>
    ({
      loadIfReadable: () => ({ sauron: rows.map((r) => ({ ...r, accountId: "sauron" })) }),
    }) as unknown as DashboardServerConfig["subscriptions"];
  const heartbeatFor = async (over: Partial<DashboardServerConfig>, participant = holdsGoog) => {
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron/heartbeat",
      "/api/desk/sauron/heartbeat",
      configWith({
        hub: {
          getState: () => ({ generatedAt: "t", participants: [participant], collisions: [] }),
        } as never,
        readDecisions: () => Promise.resolve([]),
        ...over,
      }),
    );
    return answered(out).heartbeat as Record<string, unknown>;
  };

  it("names GOOG once G1-GOOG is unsubscribed, and not while it is only paused", async () => {
    expect((await heartbeatFor({ subscriptions: subscriptionsWith([]) })).unmanaged).toEqual([
      "GOOG",
    ]);
    const paused = subscriptionsWith([{ playbookId: "G1-GOOG", enabled: false }]);
    expect((await heartbeatFor({ subscriptions: paused })).unmanaged).toEqual([]);
  });

  it("makes no claim when the subscriptions or the broker read are unavailable", async () => {
    expect(await heartbeatFor({})).not.toHaveProperty("unmanaged");
    const failed = { ...holdsGoog, error: "401" };
    expect(await heartbeatFor({ subscriptions: subscriptionsWith([]) }, failed)).not.toHaveProperty(
      "unmanaged",
    );
  });

  it("counts a playbook the bots app's own setting runs exits-only on this bot as covering its lot", async () => {
    const report = { accounts: ["sauron"], roster: [{ playbookId: "G1-GOOG", mode: "standard" }] };
    const over = { subscriptions: subscriptionsWith([]), readHouseRoster: () => report } as never;
    expect((await heartbeatFor(over)).unmanaged).toEqual([]);
  });

  it("withholds the list from a member who does not own the bot", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron/heartbeat",
      "/api/desk/sauron/heartbeat",
      configWith({
        auth: {} as never,
        resolveOwnerIds: () => ["human-eric"],
        hub: {
          getState: () => ({ generatedAt: "t", participants: [holdsGoog], collisions: [] }),
        } as never,
        readDecisions: () => Promise.resolve([]),
        subscriptions: subscriptionsWith([]),
      }),
      { email: "guest@x", provider: "google", exp: 0 },
    );
    expect(answered(out).heartbeat).not.toHaveProperty("unmanaged");
  });
});

/** #4650: the roll call reads this bot's Store subscriptions, so a paused playbook reads Paused and
 *  a fresh one Starts next pass instead of both reading Off until a pass says otherwise. */
describe("/heartbeat — the roll call reads the bot's subscriptions", () => {
  const rows = (...subs: [string, boolean][]) =>
    ({
      loadIfReadable: () => ({
        sauron: subs.map(([playbookId, enabled]) => ({ accountId: "sauron", playbookId, enabled })),
        // Another account's subscriptions never reach this bot's roll call.
        other: [{ accountId: "other", playbookId: "G1-GOOG", enabled: false }],
      }),
    }) as unknown as DashboardServerConfig["subscriptions"];
  const read = async (over: Partial<DashboardServerConfig>, who?: string) => {
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron/heartbeat",
      "/api/desk/sauron/heartbeat",
      configWith({ readDecisions: () => Promise.resolve([]), ...over }),
      who ? { email: who, provider: "google", exp: 0 } : undefined,
    );
    return { body: out.body ?? "", heartbeat: answered(out).heartbeat as Record<string, unknown> };
  };
  const lineFor = (heartbeat: Record<string, unknown>, id: string) =>
    (heartbeat.rollCall as { playbookId: string; status: string; reason: string }[]).find(
      (l) => l.playbookId === id,
    );

  it("says Paused for a paused subscription and Starts next pass for a fresh one", async () => {
    const { heartbeat } = await read({
      subscriptions: rows(["CRWV-WHEEL", false], ["NVDA-CALL-SPREAD", true]),
    });
    expect(lineFor(heartbeat, "CRWV-WHEEL")?.status).toBe("paused");
    expect(lineFor(heartbeat, "NVDA-CALL-SPREAD")?.status).toBe("starting");
    expect(lineFor(heartbeat, "G1-GOOG")?.status).toBe("off");
  });

  it("names exits-only only for a bot the bots app says its own playbook setting runs on", async () => {
    const report = (accounts: string[]) => () => ({
      accounts,
      roster: [{ playbookId: "G1-GOOG", mode: "conservative" as const }],
    });
    const runs = await read({ subscriptions: rows(), readHouseRoster: report(["sauron"]) });
    expect(lineFor(runs.heartbeat, "G1-GOOG")?.reason).toMatch(/exit rules still sell/);
    const elsewhere = await read({ subscriptions: rows(), readHouseRoster: report(["gandalf"]) });
    expect(lineFor(elsewhere.heartbeat, "G1-GOOG")?.reason).not.toMatch(/exit rules/);
  });

  it("judges from the passes alone when the subscriptions file cannot be read", async () => {
    const unreadable = { loadIfReadable: () => undefined } as never;
    const { heartbeat } = await read({ subscriptions: unreadable });
    expect(lineFor(heartbeat, "CRWV-WHEEL")?.status).toBe("off");
  });

  it("gives the owner the new lines and a non-owner none of them", async () => {
    const gated: Partial<DashboardServerConfig> = {
      auth: {} as never,
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
      subscriptions: rows(["CRWV-WHEEL", false], ["NVDA-CALL-SPREAD", true]),
    };
    const owner = await read(gated, "owner@x");
    expect(lineFor(owner.heartbeat, "CRWV-WHEEL")?.status).toBe("paused");
    const guest = await read(gated, "guest@x");
    expect(guest.heartbeat).not.toHaveProperty("rollCall");
    for (const word of ["CRWV-WHEEL", "NVDA-CALL-SPREAD", "paused", "starting", "Paused"]) {
      expect(guest.body).not.toContain(word);
    }
  });
});

/** #4950: the Overview's idea cards skip a playbook the bot already runs — on the owner's copy only,
 *  since a non-owner's copy missing exactly those ideas would name them (#885). */
describe("the desk's ideas skip a playbook the account already subscribes to", () => {
  const subscribedTo = (...ids: string[]) =>
    ({
      loadIfReadable: () => ({
        sauron: ids.map((playbookId) => ({ playbookId, enabled: false, accountId: "sauron" })),
      }),
    }) as unknown as DashboardServerConfig["subscriptions"];
  const ideasFor = async (who: string, subscriptions = subscribedTo()) => {
    const { res, out } = fakeRes();
    const gated = configWith({
      auth: {} as never,
      resolveOwnerIds: (email: string) => (email === "owner@x" ? ["sauron"] : ["human-eric"]),
      subscriptions,
    });
    await serveDeskJson(res, "/api/desk/sauron", "/api/desk/sauron", gated, {
      email: who,
      provider: "google",
      exp: 0,
    });
    const desk = answered(out).desk as {
      considerations: { id: string; action: { href: string } }[];
    };
    return desk.considerations;
  };

  it("pitches the NVDA playbook until the owner's bot subscribes, even paused", async () => {
    const before = await ideasFor("owner@x");
    const nvda = before.filter((c) => c.id.endsWith("-NVDA"));
    expect(nvda.length).toBeGreaterThan(0);
    const ids = nvda.map((c) => c.id.replace(/^opportunity-/, "").replace(/-NVDA$/, ""));
    expect(await ideasFor("owner@x", subscribedTo(...ids))).toEqual([]);
    expect(nvda[0]?.action.href).toBe("/app/research?section=playbooks&account=sauron");
  });

  it("filters nothing on a non-owner's copy", async () => {
    const owners = await ideasFor("owner@x");
    expect(owners.length).toBeGreaterThan(0);
    const ids = owners.map((c) => c.id.replace(/^opportunity-/, "").replace(/-NVDA$/, ""));
    expect(await ideasFor("guest@x", subscribedTo(...ids))).toEqual(owners);
  });
});
