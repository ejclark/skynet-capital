import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { Quest } from "../../src/domain/quest.js";
import { priceOption } from "../../src/options/pricing.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { QUESTS_PATH, serveQuestsApi } from "../../src/server/quests-route.js";

/**
 * GET /api/quests (#7028 slices 1 and 3): a member's position quests and, for a half-cash account
 * under the drawdown study's condition, conditions quests. Position quests: judged by position guidance over the
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

// ── conditions quests (slice 3) ───────────────────────────────────────────────────────────────────

/** 300 weekday sessions ending 2026-09-24 (yesterday of NOW): flat at 100, then the last close. */
function indexBars(lastClose: number, lastSession = "2026-09-24") {
  const bars: { t: string; c: number }[] = [];
  const d = new Date(`${lastSession}T00:00:00Z`);
  while (bars.length < 300) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
      bars.unshift({ t: `${d.toISOString().slice(0, 10)}T04:00:00Z`, c: 100 });
    d.setUTCDate(d.getUTCDate() - 1);
  }
  bars[bars.length - 1] = { t: bars[bars.length - 1]?.t as string, c: lastClose };
  return bars;
}

/** A broker whose SPY and QQQ daily bars are given; CRWV's read stays the frozen world's. */
function brokerWithIndexes(closes: { SPY: number; QQQ: number }, lastSession = "2026-09-24") {
  const { client, reads } = broker(24);
  const bars: string[] = [];
  return {
    reads: { ...reads, bars },
    client: {
      ...client,
      getBars: (symbol: string) => {
        bars.push(symbol);
        return Promise.resolve(
          symbol === "SPY" || symbol === "QQQ" ? indexBars(closes[symbol], lastSession) : [],
        );
      },
    },
  };
}

const vix =
  (close: number, session = "2026-09-24") =>
  () =>
    Promise.resolve({ session, close });

function configWithCash(id: string, cash: number, equity: number, client: unknown) {
  const cfg = config(id, [], client);
  return {
    ...cfg,
    hub: {
      getState: () => ({ participants: [{ id, kind: "human", cash, equity, positions: [] }] }),
    },
  } as unknown as DashboardServerConfig;
}

async function conditions(cfg: DashboardServerConfig, readVix: () => Promise<unknown>) {
  const { res, out } = fakeRes();
  await serveQuestsApi(get(`${QUESTS_PATH}?refresh=1`), res, QUESTS_PATH, cfg, ann, {
    ...deps,
    vix: readVix,
  } as never);
  return JSON.parse(out.body ?? "{}") as { quests: Quest[]; unread: string[] };
}

describe("GET /api/quests — conditions quests", () => {
  it("offers the put and the shares for the index under its high while VIX is 25 or more", async () => {
    const { client } = brokerWithIndexes({ SPY: 98, QQQ: 86 });
    const body = await conditions(configWithCash("c-1", 90_000, 100_000, client), vix(25.64));
    expect(body.quests.map((q) => `${q.source} ${q.move.label}`)).toEqual([
      "conditions Sell a cash-secured put on QQQ",
      "conditions Buy QQQ shares",
    ]);
    expect(body.quests[0]?.baseRate).toMatchObject({ kind: "measured", sample: 76, episodes: 20 });
    expect(body.unread).toEqual([]);
  });

  it("offers nothing while VIX is calm", async () => {
    const { client } = brokerWithIndexes({ SPY: 98, QQQ: 86 });
    const body = await conditions(configWithCash("c-2", 90_000, 100_000, client), vix(18));
    expect(body.quests).toEqual([]);
  });

  it("costs no market read for an account under half cash", async () => {
    const { client, reads } = brokerWithIndexes({ SPY: 98, QQQ: 86 });
    let vixReads = 0;
    const body = await conditions(configWithCash("c-3", 40_000, 100_000, client), () => {
      vixReads++;
      return Promise.resolve({ session: "2026-09-24", close: 30 });
    });
    expect(body.quests).toEqual([]);
    expect(reads.bars).toEqual([]);
    expect(vixReads).toBe(0);
  });

  it("says conditions went unread, and offers none, when the VIX read fails", async () => {
    const { client } = brokerWithIndexes({ SPY: 98, QQQ: 86 });
    const body = await conditions(configWithCash("c-4", 90_000, 100_000, client), () =>
      Promise.resolve(undefined),
    );
    expect(body.quests).toEqual([]);
    expect(body.unread).toEqual(["conditions"]);
  });

  it("refuses a VIX close from a different session than the index's", async () => {
    const { client } = brokerWithIndexes({ SPY: 98, QQQ: 86 });
    const body = await conditions(
      configWithCash("c-5", 90_000, 100_000, client),
      vix(30, "2026-09-23"),
    );
    expect(body.quests).toEqual([]);
    expect(body.unread).toEqual(["conditions"]);
  });

  it("ranks conditions quests below a tested one and merges with position quests", async () => {
    const { client } = brokerWithIndexes({ SPY: 98, QQQ: 86 });
    const cfg = configWithCash("c-6", 90_000, 100_000, client);
    const withCall = {
      ...cfg,
      hub: {
        getState: () => ({
          participants: [
            { id: "c-6", kind: "human", cash: 90_000, equity: 100_000, positions: [longCall] },
          ],
        }),
      },
    } as unknown as DashboardServerConfig;
    const body = await conditions(withCall, vix(25.64));
    expect(body.quests.map((q) => q.source)).toEqual(["position", "conditions", "conditions"]);
  });
});
