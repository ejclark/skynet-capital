import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveDeskJson } from "../../src/server/desk-json-routes.js";

/**
 * The desk JSON family's contract (`/api/desk/:id[/activity|/decisions|/pulse]`): an unknown desk
 * is a plain 404, every wired-store absence says so in the body (never an empty lie), and the
 * decisions trail stays bots-only.
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 150, marketValue: 1_760 }],
  activity: [],
};

const human = { ...bot, id: "human-eric", displayName: "Eric", kind: "human" as const };

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [bot, human], collisions: [] }) },
    ...over,
  } as unknown as DashboardServerConfig;
}

const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");

describe("serveDeskJson", () => {
  it("answers an unknown desk with a plain 404", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/nobody", "/api/desk/nobody", configWith());
    expect(out.status).toBe(404);
    expect(answered(out).error).toBe("no such desk");
  });

  it("serves the blotter view for a known desk", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron", "/api/desk/sauron", configWith());
    expect(out.status).toBe(200);
    expect(answered(out).desk).toMatchObject({ id: "sauron", kind: "bot" });
  });

  it("sends landmark dials only for desks the world projection gives a landmark", async () => {
    const { res, out } = fakeRes();
    const landmarked = { ...bot, personaId: "sauron" };
    await serveDeskJson(
      res,
      "/api/desk/sauron",
      "/api/desk/sauron",
      configWith({
        hub: { getState: () => ({ generatedAt: "t", participants: [landmarked], collisions: [] }) },
      } as never),
    );
    const dials = answered(out).landmark as { power: number; health: number };
    expect(dials.power).toBe(1); // the only bot ranks first
    expect(dials.health).toBeCloseTo(260 / 1500); // (1760 − 1500) / 1500, the R2 rule

    const plain = fakeRes();
    await serveDeskJson(plain.res, "/api/desk/human-eric", "/api/desk/human-eric", configWith());
    expect(answered(plain.out).landmark).toBeUndefined();
  });

  // The landmark is the scoreboard only if every view renders the SAME dial — a bot ranked below
  // another must NOT silently render at full power (2026-08-25's regression, ported from the
  // retired /u/:id HTML pin).
  it("dials a trailing bot below full power, never defaulting to 1", async () => {
    // "sauron" is the only persona with a landmark mapped today (universe/project.ts) — both
    // desks need it for the landmark to render at all; what's under test is the RANKING, not
    // which persona owns the tower.
    const leader = { ...bot, id: "leader", personaId: "sauron", equity: 20_000 };
    const trailer = { ...bot, id: "trailer", personaId: "sauron", equity: 10_500 };
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/trailer",
      "/api/desk/trailer",
      configWith({
        hub: {
          getState: () => ({ generatedAt: "t", participants: [leader, trailer], collisions: [] }),
        },
      } as never),
    );
    const dials = answered(out).landmark as { power: number };
    expect(dials.power).toBeLessThan(1);
  });

  it("says when no activity ledger is wired — never an empty lie", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(
      res,
      "/api/desk/sauron/activity",
      "/api/desk/sauron/activity",
      configWith(),
    );
    expect(answered(out)).toEqual({ available: false, activity: [] });

    const wired = fakeRes();
    await serveDeskJson(
      wired.res,
      "/api/desk/sauron/activity",
      "/api/desk/sauron/activity",
      configWith({ readTradeActivity: async () => [] }),
    );
    expect(answered(wired.out).available).toBe(true);
  });

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
    expect(firstBody.nextCursor).toBe("2026-08-23T00:00:00.000Z");

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

  it("serves the pulse with each section owning its empty state", async () => {
    const { res, out } = fakeRes();
    await serveDeskJson(res, "/api/desk/sauron/pulse", "/api/desk/sauron/pulse", configWith());
    const pulse = answered(out).pulse as Record<string, unknown>;
    expect(pulse.curve).toBeNull(); // no history wired — still accruing
    expect(pulse.weeks).toEqual([]); // no closed trade
    expect(Array.isArray(pulse.tiles)).toBe(true); // the live snapshot still speaks
  });
});
