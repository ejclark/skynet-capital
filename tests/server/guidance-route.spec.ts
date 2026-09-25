import type { ServerResponse } from "node:http";
import { positionGuidance } from "../../src/options/position-guidance.js";
import type { GuidanceMarket } from "../../src/options/position-guidance-types.js";
import { priceOption } from "../../src/options/pricing.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveGuidance, sidesFrom } from "../../src/server/guidance-route.js";

/**
 * GET /api/trade/guidance (#3729 slice 3): live reads through the member's own account, pulse-
 * checked against the feed's own timestamps, fetched only where the guidance may price, and coalesced
 * for 15 seconds so a double-tap costs one pull.
 */

const NOW = "2026-09-25T18:00:00Z";
const EXPIRATIONS = [
  "2026-10-02",
  "2026-10-09",
  "2026-10-30",
  "2026-11-06",
  "2026-11-13",
  "2026-11-20",
];

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out, json: () => JSON.parse(out.body ?? "{}") };
}

function broker(spot = 80, chainShift = 0) {
  const chainCalls: string[] = [];
  const client = {
    getUnderlyingQuote: () =>
      Promise.resolve({ last: spot, prevClose: 79, lastAt: "2026-09-25T17:59:55Z" }),
    getExpirations: () => Promise.resolve(EXPIRATIONS),
    getBars: () =>
      Promise.resolve(
        Array.from({ length: 30 }, (_, i) => ({
          t: `d${i}`,
          o: 80,
          h: 80,
          l: 80,
          c: 80 * (i % 2 ? 1.03 : 1),
          v: 1,
        })),
      ),
    getChain: (_s: string, expiration: string, type: "call" | "put") => {
      chainCalls.push(`${expiration}:${type}`);
      const days = daysToExpiryFrom(expiration, new Date(NOW)) ?? 1;
      return Promise.resolve(
        [70, 75, 80, 85, 90, 95, 100].map((strike) => {
          const price =
            priceOption({
              spot: 80 + chainShift,
              strike,
              daysToExpiry: days,
              volatility: 0.8,
              type,
            })?.price ?? 0;
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
  };
  const config = {
    optionsClientFor: () => client,
    tradingClientFor: () => ({ isMarketOpen: () => Promise.resolve(true) }),
  } as unknown as DashboardServerConfig;
  return { config, chainCalls };
}

const deps = {
  edgar: {
    eightKs: () =>
      Promise.resolve({ fetchedAt: NOW, filings: [{ date: "2026-09-22", items: "1.01" }] }),
  },
  now: () => NOW,
};
const URL = "/api/trade/guidance?symbol=CRWV";
const STAKE = { shares: 400, costBasis: 70, cash: 40_000, goal: "income" as const };

/** What the member's browser does with the answer: apply the stake it never sent. */
const inBrowser = (market: GuidanceMarket) => positionGuidance({ ...market, stake: STAKE });

describe("serveGuidance", () => {
  it("400s a non-symbol, and tells an unlinked session the honest note", async () => {
    const a = fakeRes();
    await serveGuidance(a.res, "/x?symbol=!!", broker().config, "ann", deps);
    expect(a.out.status).toBe(400);
    const b = fakeRes();
    await serveGuidance(b.res, URL, {} as DashboardServerConfig, "ann", deps);
    expect(b.json().reason).toBe("unlinked");
  });

  it("answers the market half only; the browser applies the stake", async () => {
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, broker().config, "guidance-a", deps);
    const { market } = r.json();
    expect(market.stake).toBeUndefined();
    expect(inBrowser(market).calls.map((c) => c.lever)).toEqual([
      "shares",
      "covered-calls",
      "cash-secured-puts",
    ]);
  });

  it("never reads or echoes a stake someone puts in the URL", async () => {
    const r = fakeRes();
    await serveGuidance(
      r.res,
      `${URL}&shares=400&basis=70&cash=40000&refresh=1`,
      broker().config,
      "guidance-f",
      deps,
    );
    expect(r.out.body).not.toMatch(/costBasis|"cash"|"shares"/);
  });

  it("prices only expiries guidance may trade — never one spanning the earnings window", async () => {
    const { config, chainCalls } = broker();
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, config, "guidance-b", deps);
    expect(chainCalls.some((c) => c.startsWith("2026-11-13") || c.startsWith("2026-11-20"))).toBe(
      false,
    );
    const strip = inBrowser(r.json().market).dteStrip;
    expect(strip.find((m) => m.expiration === "2026-11-13")?.verdict).toBe("spans-print");
  });

  it("prices only the sides asked for (plus the parity pair)", async () => {
    const { config, chainCalls } = broker();
    await serveGuidance(fakeRes().res, `${URL}&sides=calls&refresh=1`, config, "guidance-g", deps);
    expect(chainCalls.filter((c) => c.endsWith(":put"))).toEqual(["2026-10-02:put"]);
  });

  it("grades each input off the feed's own timestamps — and never grades the indicative feed fresh", async () => {
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, broker().config, "guidance-c", deps);
    const pulse = Object.fromEntries(
      r.json().market.pulse.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    expect(pulse).toMatchObject({
      spot: "fresh",
      chain: "aging",
      "earnings-date": "aging",
      session: "fresh",
    });
  });

  it("warns — does not refuse — when option parity disagrees with spot in session", async () => {
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, broker(80, 4).config, "guidance-d", deps);
    const market = r.json().market as GuidanceMarket;
    expect(market.pulse.find((p) => p.id === "spot")).toMatchObject({ status: "aging" });
    const calls = inBrowser(market).calls;
    expect(calls.some((c) => c.call === "NO ANSWER")).toBe(false);
    expect(calls.every((c) => c.confidence !== "high")).toBe(true);
  });

  it("coalesces a double-tap into one pull, and refresh=1 forces a new one", async () => {
    const { config, chainCalls } = broker();
    await serveGuidance(fakeRes().res, URL, config, "guidance-e", deps);
    const once = chainCalls.length;
    await serveGuidance(fakeRes().res, URL, config, "guidance-e", deps);
    expect(chainCalls.length).toBe(once);
    await serveGuidance(fakeRes().res, `${URL}&refresh=1`, config, "guidance-e", deps);
    expect(chainCalls.length).toBe(once * 2);
  });

  it("reads sides, defaulting to both", () => {
    expect(sidesFrom(null)).toEqual(["call", "put"]);
    expect(sidesFrom("puts")).toEqual(["put"]);
    expect(sidesFrom("junk")).toEqual(["call", "put"]);
  });
});
