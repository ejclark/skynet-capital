import type { ServerResponse } from "node:http";
import { priceOption } from "../../src/options/pricing.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveGuidance, stakeFromQuery } from "../../src/server/guidance-route.js";

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
const URL = "/api/trade/guidance?symbol=CRWV&shares=400&basis=70&cash=40000&goal=income";

describe("serveGuidance", () => {
  it("400s a non-symbol, and tells an unlinked session the honest note", async () => {
    const a = fakeRes();
    await serveGuidance(a.res, "/x?symbol=!!", broker().config, "ann", deps);
    expect(a.out.status).toBe(400);
    const b = fakeRes();
    await serveGuidance(b.res, URL, {} as DashboardServerConfig, "ann", deps);
    expect(b.json().reason).toBe("unlinked");
  });

  it("answers the guidance and its markdown template from live reads", async () => {
    const { config } = broker();
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, config, "guidance-a", deps);
    const { guidance, markdown } = r.json();
    expect(guidance.calls.map((c: { lever: string }) => c.lever)).toEqual([
      "shares",
      "covered-calls",
      "cash-secured-puts",
    ]);
    expect(guidance.stake).toMatchObject({ shares: 400, costBasis: 70, cash: 40000 });
    expect(markdown.split("\n")[0]).toContain("## CRWV · $80.00");
  });

  it("prices only expiries the guidance may trade — never one spanning the print window", async () => {
    const { config, chainCalls } = broker();
    await serveGuidance(fakeRes().res, `${URL}&refresh=1`, config, "guidance-b", deps);
    expect(chainCalls.some((c) => c.startsWith("2026-11-13") || c.startsWith("2026-11-20"))).toBe(
      false,
    );
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, config, "guidance-b2", deps);
    const strip = r.json().guidance.dteStrip;
    expect(strip.find((m: { expiration: string }) => m.expiration === "2026-11-13").verdict).toBe(
      "spans-print",
    );
  });

  it("grades each input off the feed's own timestamps", async () => {
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, broker().config, "guidance-c", deps);
    const pulse = Object.fromEntries(
      r.json().guidance.pulse.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    expect(pulse).toMatchObject({
      spot: "fresh",
      chain: "fresh",
      "earnings-date": "aging",
      session: "fresh",
    });
  });

  it("refuses to answer when option parity says spot is wrong", async () => {
    const r = fakeRes();
    await serveGuidance(r.res, `${URL}&refresh=1`, broker(80, 4).config, "guidance-d", deps);
    const calls = r.json().guidance.calls as { call: string }[];
    expect(calls.every((c) => c.call === "NO ANSWER")).toBe(true);
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

  it("reads the stake from the query, dropping junk and defaulting the goal", () => {
    expect(stakeFromQuery(new URLSearchParams("shares=400&basis=abc&cash=-5&goal=moon"))).toEqual({
      goal: "income",
      shares: 400,
    });
  });
});
