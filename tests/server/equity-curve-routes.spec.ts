import type { ServerResponse } from "node:http";
import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveEquityCurveJson } from "../../src/server/equity-curve-routes.js";

/**
 * The hero chart's data route (`GET /api/accounts/:id/equity-curve`, #3186 slice 2): the session's
 * own account only, the range param mapped to the right Alpaca call shape (period for the fixed
 * windows, an explicit date range for YTD/ALL), and an honest empty series wherever the broker
 * can't answer — never an error the chart would have to special-case.
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

const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");

function fakeClient(opts: {
  readonly periodCalls?: string[];
  readonly rangeCalls?: [string, string | undefined][];
  readonly fail?: boolean;
}): AlpacaTradingClient {
  return {
    getPortfolioHistory: (period: string) => {
      opts.periodCalls?.push(period);
      if (opts.fail) return Promise.reject(new Error("broker down"));
      return Promise.resolve({
        timestamp: [1, 2],
        equity: [100_000, 105_000],
        profit_loss: [0, 5_000],
        profit_loss_pct: [0, 0.05],
        base_value: 100_000,
      });
    },
    getPortfolioHistoryByRange: (dateStart: string, dateEnd?: string) => {
      opts.rangeCalls?.push([dateStart, dateEnd]);
      if (opts.fail) return Promise.reject(new Error("broker down"));
      return Promise.resolve({
        timestamp: [1],
        equity: [100_000],
        profit_loss: [0],
        profit_loss_pct: [0],
        base_value: 100_000,
      });
    },
  } as unknown as AlpacaTradingClient;
}

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [], collisions: [] }) },
    auth: { providerIds: ["google"] } as never,
    resolveOwnerIds: () => ["human-eric"],
    ...over,
  } as unknown as DashboardServerConfig;
}

const session = { email: "eric@example.com" } as never;

describe("serveEquityCurveJson", () => {
  it("answers 404 for an account the session doesn't own", async () => {
    const { res, out } = fakeRes();
    await serveEquityCurveJson(
      res,
      "someone-elses-account",
      "/api/accounts/someone-elses-account/equity-curve",
      configWith(),
      session,
    );
    expect(out.status).toBe(404);
    expect(answered(out).error).toBe("no such account");
  });

  it("maps a fixed-window range to the matching Alpaca period token", async () => {
    const periodCalls: string[] = [];
    const { res, out } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=3M",
      configWith({ tradingClientFor: () => fakeClient({ periodCalls }) }),
      session,
    );
    expect(periodCalls).toEqual(["3M"]);
    const body = answered(out);
    expect(body.range).toBe("3M");
    expect((body.points as unknown[]).length).toBe(2);
  });

  it("routes YTD through the explicit date range, starting Jan 1 of the current year", async () => {
    const rangeCalls: [string, string | undefined][] = [];
    const { res } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=YTD",
      configWith({
        tradingClientFor: () => fakeClient({ rangeCalls }),
        now: () => new Date("2026-09-16T00:00:00Z"),
      }),
      session,
    );
    expect(rangeCalls).toEqual([["2026-01-01", undefined]]);
  });

  it("routes ALL through the explicit date range from a fixed early start", async () => {
    const rangeCalls: [string, string | undefined][] = [];
    const { res } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=ALL",
      configWith({ tradingClientFor: () => fakeClient({ rangeCalls }) }),
      session,
    );
    expect(rangeCalls).toEqual([["2000-01-01", undefined]]);
  });

  it("defaults to 1M for a missing or unknown range", async () => {
    const periodCalls: string[] = [];
    const { res, out } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=nonsense",
      configWith({ tradingClientFor: () => fakeClient({ periodCalls }) }),
      session,
    );
    expect(periodCalls).toEqual(["1M"]);
    expect(answered(out).range).toBe("1M");
  });

  it("degrades to an empty series when no trading client is wired", async () => {
    const { res, out } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=7D",
      configWith({ tradingClientFor: () => undefined }),
      session,
    );
    expect(out.status).toBe(200);
    expect(answered(out).points).toEqual([]);
  });

  it("degrades to an empty series when the broker read fails — never a 500", async () => {
    const { res, out } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=7D",
      configWith({ tradingClientFor: () => fakeClient({ fail: true }) }),
      session,
    );
    expect(out.status).toBe(200);
    expect(answered(out).points).toEqual([]);
  });

  it("skips the ownership check entirely when no auth is configured (offline mode)", async () => {
    const periodCalls: string[] = [];
    const { res, out } = fakeRes();
    await serveEquityCurveJson(
      res,
      "human-eric",
      "/api/accounts/human-eric/equity-curve?range=7D",
      configWith({
        auth: undefined,
        resolveOwnerIds: undefined,
        tradingClientFor: () => fakeClient({ periodCalls }),
      }),
      undefined,
    );
    expect(out.status).toBe(200);
    expect(periodCalls).toEqual(["1W"]);
  });
});
