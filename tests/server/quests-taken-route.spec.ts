import { mkdtempSync, rmSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { QuestScore, QuestTypeScore } from "../../src/domain/quest-score.js";
import type { ActivityView } from "../../src/observatory/participant-snapshot.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { QUESTS_TAKEN_PATH, serveQuestsTakenApi } from "../../src/server/quests-taken-route.js";
import { TakenQuestStore } from "../../src/server/taken-quest-store.js";
import { serveTradeApi } from "../../src/server/trade-api-routes.js";

/**
 * #7028 slice 6, end to end: a quest's ticket sends its id with the order; the accepted order is
 * recorded as the quest taken; `GET /api/quests/taken` scores it from the account's own fills, for
 * the account's owner alone.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
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

function request(method: "GET" | "POST", url: string, body?: unknown): IncomingMessage {
  const req = Readable.from(
    body === undefined ? [] : [JSON.stringify(body)],
  ) as unknown as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = { "content-type": "application/json" };
  return req;
}

let dir: string;
let activity: ActivityView[];
let config: DashboardServerConfig;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "quests-taken-"));
  activity = [];
  const desk = { id: "ann-1", kind: "human", cash: 60_000, equity: 100_000, positions: [] };
  config = {
    hub: {
      getState: () => ({ participants: [{ ...desk, activity }] }),
    },
    tradingEnabled: true,
    auth: { providerIds: ["google"] },
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "ann-1" : undefined),
    now: () => new Date("2026-11-10T15:00:00Z"),
    takenQuests: new TakenQuestStore(join(dir, "taken-quests.json")),
    submitTrade: () =>
      Promise.resolve({ ok: true, orderId: "o-buy", status: "accepted", symbol: "QQQ" }),
  } as unknown as DashboardServerConfig;
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const ann = { email: "ann@x.com" } as never;
const bob = { email: "bob@x.com" } as never;

async function buyQqq(quest?: string) {
  const { res, out } = fakeRes();
  const body = { participantId: "ann-1", symbol: "QQQ", quantity: 10, action: "buy", quest };
  await serveTradeApi(
    request("POST", "/api/trade/submit", body),
    res,
    "/api/trade/submit",
    config,
    ann,
  );
  return JSON.parse(out.body ?? "{}") as { ok: boolean; quest?: unknown };
}

async function takenFor(session: never, query = "") {
  const { res, out } = fakeRes();
  const answered = await serveQuestsTakenApi(
    request("GET", `${QUESTS_TAKEN_PATH}${query}`),
    res,
    QUESTS_TAKEN_PATH,
    config,
    session,
  );
  return {
    answered,
    status: out.status,
    body: JSON.parse(out.body ?? "{}") as { taken: QuestScore[]; byType: QuestTypeScore[] },
  };
}

const fill = (orderId: string, side: "buy" | "sell", price: number, at: string): ActivityView => ({
  orderId,
  symbol: "QQQ",
  side,
  quantity: 10,
  filledQuantity: 10,
  price,
  status: "filled",
  at,
});

describe("GET /api/quests/taken", () => {
  it("claims only its own path", async () => {
    const { res } = fakeRes();
    expect(
      await serveQuestsTakenApi(request("GET", "/api/quests"), res, "/api/quests", config, ann),
    ).toBe(false);
  });

  it("scores a quest taken through the share ticket: unseen, then open, then closed and paid", async () => {
    const answer = await buyQqq("conditions:QQQ:buy-shares");
    expect(answer.ok).toBe(true);
    // The order's answer is the broker's, unchanged: the quest is recorded beside it, not in it.
    expect(answer.quest).toBeUndefined();

    let { status, body } = await takenFor(ann);
    expect(status).toBe(200);
    expect(body.taken).toHaveLength(1);
    expect(body.taken[0]).toMatchObject({
      state: "unseen",
      taken: {
        questId: "conditions:QQQ:buy-shares",
        orderId: "o-buy",
        baseRate: { kind: "measured" },
      },
    });

    activity.push(fill("o-buy", "buy", 400, "2026-11-10T15:01:00Z"));
    ({ body } = await takenFor(ann));
    expect(body.taken[0]?.state).toBe("open");

    activity.push(fill("o-sell", "sell", 420, "2026-12-10T15:01:00Z"));
    ({ body } = await takenFor(ann));
    expect(body.taken[0]).toMatchObject({
      state: "closed",
      realized: 200,
      returnPct: 5,
      paid: true,
    });
    expect(body.byType).toEqual([
      expect.objectContaining({
        source: "conditions",
        moveKind: "buy-shares",
        taken: 1,
        closed: 1,
        paid: 1,
        rated: 1,
        verdict: "too-few",
      }),
    ]);
  });

  it("records nothing for an order sent with no quest, or with a quest it is not the move of", async () => {
    await buyQqq();
    await buyQqq("conditions:SPY:buy-shares");
    await buyQqq("conditions:QQQ:sell-cash-secured-put");
    const { body } = await takenFor(ann);
    expect(body).toEqual({ taken: [], byType: [] });
  });

  it("answers to the account's owner alone", async () => {
    await buyQqq("conditions:QQQ:buy-shares");
    expect((await takenFor(bob)).status).toBe(404);
    expect((await takenFor(bob, "?participantId=ann-1")).status).toBe(404);
    expect((await takenFor(ann, "?participantId=ann-1")).body.taken).toHaveLength(1);
  });
});
