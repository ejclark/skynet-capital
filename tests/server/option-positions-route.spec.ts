import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  clearBetaCache,
  serveOptionPositionsApi,
} from "../../src/server/option-positions-route.js";

/**
 * The option positions route (#3407 P2 slice 3): own account only, snapshots fetched for every
 * held contract in one call and a spot per underlying, an honest `unlinked` without a client.
 */

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
  return { res, out };
}

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

const desk = {
  id: "human-ann",
  cash: 1_000,
  positions: [
    { symbol: "MSFT260918P00420000", quantity: 2, avgPrice: 10.7, marketValue: 2_400 },
    { symbol: "AAPL", quantity: 100, avgPrice: 140, marketValue: 15_000 },
  ],
};

function config(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ participants: [desk] }) },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    now: () => new Date("2026-09-01T14:00:00Z"),
    ...over,
  } as unknown as DashboardServerConfig;
}

const ann = { email: "ann@x.com" } as never;

describe("GET /api/trade/option-positions", () => {
  it("answers rows with greeks, in-the-money and days, plus the book, for the own account", async () => {
    const asked: string[][] = [];
    const client = {
      getContractSnapshots: (symbols: string[]) => {
        asked.push(symbols);
        return Promise.resolve(
          new Map([["MSFT260918P00420000", { greeks: { delta: -0.42 }, bid: 11, ask: 11.4 }]]),
        );
      },
      getUnderlyingPrice: (u: string) => Promise.resolve(u === "MSFT" ? 410 : undefined),
    };
    const { res, out } = fakeRes();
    await serveOptionPositionsApi(
      get("/api/trade/option-positions?participantId=human-ann"),
      res,
      "/api/trade/option-positions",
      config({ optionsClientFor: () => client }),
      ann,
    );
    expect(out.status).toBe(200);
    const body = JSON.parse(out.body ?? "{}");
    expect(body.available).toBe(true);
    expect(asked).toEqual([["MSFT260918P00420000"]]); // only the option leg, one call
    expect(body.rows[0]).toMatchObject({
      strike: 420,
      inTheMoney: true, // spot 410 under a 420 put
      positionGreeks: { delta: -84 },
    });
    expect(body.rows[0].daysToExpiry).toBeCloseTo(17.25, 1);
    expect(body.representative).toBe(true);
  });

  describe("beta-weighted book delta (#4327)", () => {
    beforeEach(() => clearBetaCache());

    /** A year of adjusted closes where MSFT moves exactly 1.5× SPY. */
    function barsFor(symbol: string) {
      let spy = 500;
      let msft = 400;
      return Array.from({ length: 200 }, (_, i) => {
        const r = Math.sin(i * 1.3) * 0.01;
        spy *= 1 + r;
        msft *= 1 + 1.5 * r;
        const t = new Date(Date.UTC(2025, 11, 1) + i * 86_400_000).toISOString();
        return { t, o: 0, h: 0, l: 0, v: 0, c: symbol === "SPY" ? spy : msft };
      });
    }
    const snapshots = () =>
      Promise.resolve(new Map([["MSFT260918P00420000", { greeks: { delta: -0.42 } }]]));

    it("weights the book to SPY from measured betas, asking for adjusted closes", async () => {
      const asked: string[] = [];
      const client = {
        getContractSnapshots: snapshots,
        getUnderlyingPrice: (u: string) => Promise.resolve(u === "MSFT" ? 410 : 600),
        getBars: (sym: string, _s: string, _e: string, _l: number, adjustment: string) => {
          asked.push(`${sym}:${adjustment}`);
          return Promise.resolve(barsFor(sym));
        },
      };
      const { res, out } = fakeRes();
      await serveOptionPositionsApi(
        get("/api/trade/option-positions?participantId=human-ann"),
        res,
        "/api/trade/option-positions",
        config({ optionsClientFor: () => client }),
        ann,
      );
      const body = JSON.parse(out.body ?? "{}");
      expect(asked.sort()).toEqual(["MSFT:all", "SPY:all"]);
      expect(body.betaWeighted.benchmark).toBe("SPY");
      expect(body.betaWeighted.weighted.MSFT.beta).toBeCloseTo(1.5, 6);
      expect(body.betaWeighted.weighted.MSFT.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // −84 share-deltas × 1.5 × $410 = −$51,660 of SPY; ÷ $600 = −86.1 SPY shares.
      expect(body.betaWeighted.dollarDelta).toBeCloseTo(-51_660, 3);
      expect(body.betaWeighted.delta).toBeCloseTo(-86.1, 3);
      expect(body.betaWeighted.unweighted).toEqual({});
    });

    it("leaves a name un-weighted and named when its history can't be read — never a guessed beta", async () => {
      const client = {
        getContractSnapshots: snapshots,
        getUnderlyingPrice: (u: string) => Promise.resolve(u === "MSFT" ? 410 : 600),
        getBars: (sym: string) => Promise.resolve(sym === "SPY" ? barsFor("SPY") : []),
      };
      const { res, out } = fakeRes();
      await serveOptionPositionsApi(
        get("/api/trade/option-positions?participantId=human-ann"),
        res,
        "/api/trade/option-positions",
        config({ optionsClientFor: () => client }),
        ann,
      );
      const body = JSON.parse(out.body ?? "{}");
      expect(body.betaWeighted.weighted).toEqual({});
      expect(body.betaWeighted.unweighted).toEqual({ MSFT: -84 });
    });
  });

  it("404s an account the session doesn't own and says unlinked without a client", async () => {
    const stranger = fakeRes();
    await serveOptionPositionsApi(
      get("/api/trade/option-positions?participantId=human-bob"),
      stranger.res,
      "/api/trade/option-positions",
      config(),
      ann,
    );
    expect(stranger.out.status).toBe(404);

    const unlinked = fakeRes();
    await serveOptionPositionsApi(
      get("/api/trade/option-positions?participantId=human-ann"),
      unlinked.res,
      "/api/trade/option-positions",
      config({ optionsClientFor: () => undefined }),
      ann,
    );
    expect(JSON.parse(unlinked.out.body ?? "{}")).toMatchObject({
      available: false,
      reason: "unlinked",
    });
  });

  it("claims only its path", async () => {
    const { res } = fakeRes();
    expect(
      await serveOptionPositionsApi(
        get("/api/trade/orders"),
        res,
        "/api/trade/orders",
        config(),
        ann,
      ),
    ).toBe(false);
  });
});
