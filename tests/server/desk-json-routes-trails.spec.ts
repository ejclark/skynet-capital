import { serveDeskJson } from "../../src/server/desk-json-routes.js";
import { answered, configWith, fakeRes } from "../support/desk-json-fixtures.js";

/** The desk JSON trails — decisions, heartbeat, thesis and activity paging — and their honest empties. */
describe("serveDeskJson", () => {
  it("keeps the decisions trail bots-only, and honest about an unwired store", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/human-eric/decisions",
      "/api/desk/human-eric/decisions",
      configWith(),
    );
    expect(answered(out)).toMatchObject({ available: false, kind: "human" });

    const unwired = fakeRes();
    await serveDeskJson(
      unwired.res,
      "/api/desk/sauron/decisions",
      "/api/desk/sauron/decisions",
      configWith(),
    );
    expect(answered(unwired.out)).toMatchObject({ available: false, kind: "bot" });
  });

  it("serves /heartbeat from the bot's OWN passes only, bots-only, honest when unwired", async () => {
    const human = fakeRes();
    await serveDeskJson(
      human.res,
      "/api/desk/human-eric/heartbeat",
      "/api/desk/human-eric/heartbeat",
      configWith(),
    );
    expect(answered(human.out)).toMatchObject({ available: false, kind: "human" });

    const unwired = fakeRes();
    await serveDeskJson(
      unwired.res,
      "/api/desk/sauron/heartbeat",
      "/api/desk/sauron/heartbeat",
      configWith(),
    );
    expect(answered(unwired.out)).toMatchObject({ available: false, kind: "bot" });

    const asked: string[] = [];
    const wired = fakeRes();
    await serveDeskJson(
      wired.res,
      "/api/desk/sauron/heartbeat",
      "/api/desk/sauron/heartbeat",
      configWith({
        readDecisions: (id) => {
          asked.push(id);
          return Promise.resolve([]);
        },
      }),
    );
    expect(answered(wired.out)).toMatchObject({
      available: true,
      heartbeat: { state: "no-record", lastPassAt: null },
    });
    // Never the pooled account view: a beta-scout pass must not make a dead loop look alive.
    expect(asked).toEqual(["sauron"]);
  });

  it("forwards config.findByOrderId into /thesis so a filled marker carries its reasoning", async () => {
    const activity = [
      {
        orderId: "ord-1",
        participantId: "sauron",
        symbol: "NVDA",
        side: "buy" as const,
        quantity: 10,
        filledQuantity: 10,
        status: "filled",
        at: "2026-09-10T14:00:00.000Z",
        source: "stream" as const,
      },
    ];
    const guardedIntent = {
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 10,
      type: "market" as const,
      reason: "panic fade",
    };
    const config = configWith({
      readTradeActivity: async () => activity,
      findByOrderId: (orderId) =>
        orderId === "ord-1"
          ? {
              record: {
                at: 1,
                personaId: "sauron",
                mode: "live" as const,
                rawIntents: [guardedIntent],
                guardedIntents: [guardedIntent],
                outcomes: [{ intent: guardedIntent, action: "placed" as const }],
              },
              intent: guardedIntent,
            }
          : undefined,
    });
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron/thesis", "/api/desk/sauron/thesis", config);
    const body = answered(out) as { thesis: { markers: { reasoning?: { reason: string } }[] } };
    expect(body.thesis.markers[0]?.reasoning).toMatchObject({ reason: "panic fade" });
  });

  // An absence, never an empty list posing as "this bot has no safeguards" (#3194 slice 6a) —
  // the same posture the heartbeat's own verdict list already takes.
  it("sends a null safeguard ladder when no pass on hand says which plays ran", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron/thesis", "/api/desk/sauron/thesis", configWith());
    expect(answered(out).ladder).toBeNull();
    expect(answered(out).ladderAsOf).toBeUndefined();
  });

  it("attaches each bot activity row's decision, and never a human row's (#3687 slice 4)", async () => {
    const fill = {
      orderId: "ord-1",
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 1,
      filledQuantity: 1,
      status: "filled",
      at: "2026-08-20T00:00:00.000Z",
      source: "stream" as const,
    };
    const scouted = {
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 1,
      type: "market" as const,
      reason: "forced pick",
      playbookId: "BETA-SCOUT",
    };
    const record = {
      at: 1,
      personaId: "beta-scout",
      mode: "live" as const,
      rawIntents: [scouted],
      guardedIntents: [scouted],
      outcomes: [],
    };
    const config = configWith({
      readTradeActivity: async () => [fill],
      findByOrderId: (orderId) => (orderId === "ord-1" ? { record, intent: scouted } : undefined),
    });
    const bot = fakeRes();
    await serveDeskJson(bot.res, "/api/desk/sauron/activity", "/api/desk/sauron/activity", config);
    const botBody = answered(bot.out) as { activity: { reasoning?: Record<string, unknown> }[] };
    expect(botBody.activity[0]?.reasoning).toMatchObject({
      reason: "forced pick",
      personaId: "beta-scout",
      playbookId: "BETA-SCOUT",
    });

    const human = fakeRes();
    await serveDeskJson(
      human.res,
      "/api/desk/human-eric/activity",
      "/api/desk/human-eric/activity",
      config,
    );
    const humanBody = answered(human.out) as { activity: Record<string, unknown>[] };
    expect(humanBody.activity[0]).not.toHaveProperty("reasoning");
  });

  it("walks /decisions back through the whole trail, not just the store's newest 30 (found 2026-09-24)", async () => {
    // 60 halted passes (a halted cycle never collapses into a quiet run, so one pass = one row),
    // behind a store whose default read is its newest 30 — exactly the production bridge.
    const ats = Array.from({ length: 60 }, (_, i) => 1_000 + i);
    const readDecisions = (_id: string, page?: { before?: number; limit?: number }) =>
      Promise.resolve(
        ats
          .filter((at) => at < (page?.before ?? Number.POSITIVE_INFINITY))
          .sort((x, y) => y - x)
          .slice(0, page?.limit ?? 30)
          .map((at) => ({
            at,
            personaId: "sauron",
            mode: "live" as const,
            rawIntents: [],
            guardedIntents: [],
            outcomes: [],
            halted: "manual",
          })),
      );
    const seen: string[] = [];
    let url = "/api/desk/sauron/decisions?per_page=30";
    for (let guard = 0; guard < 10; guard++) {
      const page = fakeRes();
      await serveDeskJson(
        page.res,
        "/api/desk/sauron/decisions",
        url,
        configWith({ readDecisions }),
      );
      const body = answered(page.out) as { cycles: { at: string }[]; nextCursor?: number };
      seen.push(...body.cycles.map((c) => c.at));
      if (body.nextCursor === undefined) break;
      url = `/api/desk/sauron/decisions?per_page=30&before=${body.nextCursor}`;
    }
    expect(seen).toHaveLength(60);
    expect(new Set(seen).size).toBe(60);
  });

  it("serves only the passes that placed nothing with ?trades=none (#3687 slice 4)", async () => {
    const buy = {
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 1,
      type: "market" as const,
      reason: "fade",
    };
    const pass = (at: number, extra: Record<string, unknown>) => ({
      at,
      personaId: "sauron",
      mode: "live" as const,
      rawIntents: [],
      guardedIntents: [],
      outcomes: [],
      ...extra,
    });
    const records = [
      pass(3_000, { outcomes: [{ intent: buy, action: "placed" }] }),
      pass(2_000, { halted: "daily-loss" }),
      pass(1_000, {}),
    ];
    const config = configWith({ readDecisions: () => Promise.resolve(records) });
    const all = fakeRes();
    await serveDeskJson(
      all.res,
      "/api/desk/sauron/decisions",
      "/api/desk/sauron/decisions",
      config,
    );
    expect((answered(all.out) as { cycles: unknown[] }).cycles).toHaveLength(3);
    const idle = fakeRes();
    await serveDeskJson(
      idle.res,
      "/api/desk/sauron/decisions",
      "/api/desk/sauron/decisions?trades=none",
      config,
    );
    const body = answered(idle.out) as { cycles: { status: string }[] };
    expect(body.cycles.map((c) => c.status)).toEqual(["halted", "quiet"]);
  });

  it("paginates activity via per_page/before query params (PR 5, issue #2287)", async () => {
    const records = Array.from({ length: 5 }, (_, i) => ({
      orderId: `ord-${i}`,
      participantId: "sauron",
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 1,
      filledQuantity: 1,
      status: "filled",
      at: `2026-08-2${i}T00:00:00.000Z`,
      source: "stream" as const,
    }));
    const config = configWith({ readTradeActivity: async () => records });

    const first = fakeRes();
    await serveDeskJson(
      first.res,
      "/api/desk/sauron/activity",
      "/api/desk/sauron/activity?per_page=2",
      config,
    );
    const firstBody = answered(first.out) as {
      activity: { orderId: string }[];
      nextCursor: string;
    };
    expect(firstBody.activity.map((r) => r.orderId)).toEqual(["ord-4", "ord-3"]);
    expect(firstBody.nextCursor).toBe("2026-08-23T00:00:00.000Z|ord-3"); // time|id (#4802)

    const next = fakeRes();
    await serveDeskJson(
      next.res,
      "/api/desk/sauron/activity",
      `/api/desk/sauron/activity?per_page=2&before=${firstBody.nextCursor}`,
      config,
    );
    const nextBody = answered(next.out) as { activity: { orderId: string }[] };
    expect(nextBody.activity.map((r) => r.orderId)).toEqual(["ord-2", "ord-1"]);
  });

  it("ignores a malformed before cursor on /decisions rather than emptying the page", async () => {
    const config = configWith({
      readDecisions: async () => [
        {
          at: 1,
          personaId: "sauron",
          mode: "observe",
          rawIntents: [],
          guardedIntents: [],
          outcomes: [],
        },
      ],
    });
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron/decisions",
      "/api/desk/sauron/decisions?before=not-a-number",
      config,
    );
    expect((answered(out).cycles as unknown[]).length).toBe(1);
  });
});

/** #4953: a verdict's "since" is dated from the store, not the 30-pass page. */
describe("/heartbeat — a verdict's exact start", () => {
  const verdict = { playbookId: "S1-NVDA", mode: "standard", state: "long" } as const;
  const passAt = (at: number) => ({
    at,
    personaId: "sauron",
    mode: "live",
    rawIntents: [],
    guardedIntents: [],
    outcomes: [],
    playbookVerdicts: [verdict],
  });

  it("asks the store for this bot's run and serves its start as exact", async () => {
    const asked: unknown[] = [];
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron/heartbeat",
      "/api/desk/sauron/heartbeat",
      configWith({
        readDecisions: () => Promise.resolve([passAt(2_000_000), passAt(1_985_000)] as never),
        readVerdictRunStart: (id, startAt, v) => {
          asked.push([id, startAt, v]);
          return { at: 1_000_000, reachesOldest: false };
        },
      }),
    );
    expect(asked).toEqual([["sauron", 2_000_000, verdict]]);
    const { heartbeat } = answered(out) as { heartbeat: { playbooks: unknown[] } };
    expect(heartbeat.playbooks[0]).toMatchObject({
      since: new Date(1_000_000).toISOString(),
      sinceIsLowerBound: false,
    });
  });
});
