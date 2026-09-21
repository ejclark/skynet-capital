import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveOptionPositionsApi } from "../../src/server/option-positions-route.js";

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
