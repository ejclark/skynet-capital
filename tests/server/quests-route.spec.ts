import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { Quest } from "../../src/domain/quest.js";
import { priceOption } from "../../src/options/pricing.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { QUESTS_PATH, serveQuestsApi } from "../../src/server/quests-route.js";

/**
 * GET /api/quests (#7028 slice 1): a member's position quests, judged by position guidance over the
 * same live market read the Guidance tab uses. Identity is the session's; a member holding no calls
 * costs no market read; a hold verdict yields no quest.
 */

const NOW = "2026-09-25T18:00:00Z";
const EXPIRATIONS = ["2026-10-02", "2026-10-16", "2026-11-06", "2026-11-20"];
const HELD = "CRWV261120C00090000";

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

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

/** A broker over the frozen CRWV world: spot $80, 80% IV, every quote fresh. Counts market reads. */
function broker(bid: number) {
  const reads: string[] = [];
  const client = {
    getUnderlyingQuote: (s: string) => {
      reads.push(s);
      return Promise.resolve({ last: 80, prevClose: 79, lastAt: "2026-09-25T17:59:55Z" });
    },
    getExpirations: () => Promise.resolve(EXPIRATIONS),
    getBars: () => Promise.resolve([]),
    getChain: (_s: string, expiration: string, type: "call" | "put") => {
      const days = daysToExpiryFrom(expiration, new Date(NOW)) ?? 1;
      return Promise.resolve(
        [70, 80, 90, 100].map((strike) => {
          const price =
            priceOption({ spot: 80, strike, daysToExpiry: days, volatility: 0.8, type })?.price ??
            0;
          return {
            occSymbol: `${strike}${type}`,
            strike,
            bid: price * 0.98,
            ask: price * 1.02,
            quotedAt: "2026-09-25T17:59:00Z",
          };
        }),
      );
    },
    getContractSnapshots: (occs: readonly string[]) =>
      Promise.resolve(new Map(occs.map((o) => [o, { bid, ask: bid + 0.4 }]))),
  };
  return { client, reads };
}

const deps = {
  edgar: { eightKs: () => Promise.resolve({ fetchedAt: NOW, filings: [] }) },
  now: () => NOW,
};

function config(
  id: string,
  positions: readonly Record<string, unknown>[],
  client: unknown,
): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [{ id, kind: "human", cash: 0, positions }] }) },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? id : undefined),
    now: () => new Date(NOW),
    optionsClientFor: () => client,
    tradingClientFor: () => ({ isMarketOpen: () => Promise.resolve(true) }),
  } as unknown as DashboardServerConfig;
}

const ann = { email: "ann@x.com" } as never;

async function quests(cfg: DashboardServerConfig, query = "", session = ann) {
  const { res, out } = fakeRes();
  const answered = await serveQuestsApi(
    get(`${QUESTS_PATH}${query}`),
    res,
    QUESTS_PATH,
    cfg,
    session,
    deps,
  );
  return {
    answered,
    status: out.status,
    body: JSON.parse(out.body ?? "{}") as {
      available?: boolean;
      reason?: string;
      quests: Quest[];
      unread?: string[];
    },
  };
}

// Two calls bought at $12 a share; the account's own average price is per contract.
const longCall = { symbol: HELD, quantity: 2, avgPrice: 1_200, marketValue: 4_800 };

describe("GET /api/quests — position quests", () => {
  it("offers a take profit on a call bid at twice what was paid, for the session's own account", async () => {
    const { client } = broker(24);
    const { status, body } = await quests(config("ann-1", [longCall], client));
    expect(status).toBe(200);
    expect(body.available).toBe(true);
    expect(body.quests).toHaveLength(1);
    const [q] = body.quests;
    expect(q?.source).toBe("position");
    expect(q?.move.label).toBe("Take profit: sell your 2 CRWV $90 calls (Nov 20)");
    expect(q?.why[0]?.rule).toBe("EXIT-PROFIT");
    expect(q?.baseRate.kind).toBe("untested");
    expect(q?.expires.date).toBe("2026-10-06");
  });

  it("returns nothing for a call guidance says to hold", async () => {
    const { client } = broker(13);
    const { body } = await quests(config("ann-2", [longCall], client));
    expect(body.available).toBe(true);
    expect(body.quests).toEqual([]);
  });

  it("costs no market read for an account holding no calls", async () => {
    const { client, reads } = broker(24);
    const shares = { symbol: "CRWV", quantity: 100, avgPrice: 70, marketValue: 8_000 };
    const { body } = await quests(config("ann-3", [shares], client));
    expect(body.quests).toEqual([]);
    expect(reads).toEqual([]);
  });

  it("answers only to the account's owner", async () => {
    const { client } = broker(24);
    const cfg = config("ann-4", [longCall], client);
    expect((await quests(cfg, "?participantId=someone-else")).status).toBe(404);
    expect((await quests(cfg, "", { email: "bob@x.com" } as never)).status).toBe(404);
    expect((await quests(cfg, "?participantId=ann-4")).status).toBe(200);
  });

  it("says unlinked, with no quests, when the account has no connected broker", async () => {
    const cfg = { ...config("ann-5", [longCall], undefined), optionsClientFor: () => undefined };
    const { body } = await quests(cfg as DashboardServerConfig);
    expect(body).toEqual({ available: false, reason: "unlinked", quests: [] });
  });

  it("leaves other paths alone", async () => {
    const { res } = fakeRes();
    const cfg = config("ann-6", [], broker(1).client);
    expect(await serveQuestsApi(get("/api/other"), res, "/api/other", cfg, ann, deps)).toBe(false);
  });
});
