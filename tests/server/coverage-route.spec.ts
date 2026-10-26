import type { ServerResponse } from "node:http";
import type { AlpacaOptionsClient } from "../../src/alpaca/alpaca-options-client.js";
import type { CoverageJson } from "../../src/observatory/coverage-json-view.js";
import { serveCoverageJson } from "../../src/server/coverage-route.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * `GET /api/research/coverage` (#3811 slice 3): the viewer's OWN holdings only, and sector-fund
 * numbers only through a client one of their accounts owns — otherwise "no market data" and no
 * number (criterion 5). One fund's failed read blanks its own row, never the column.
 */

function fakeRes(): { res: ServerResponse; read: () => CoverageJson } {
  let body = "";
  const res = {
    writeHead: () => res,
    end: (b?: string) => {
      body = b ?? "";
    },
  } as unknown as ServerResponse;
  return { res, read: () => JSON.parse(body) as CoverageJson };
}

const NOW = new Date("2026-10-26T15:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const bars = (rise: number) =>
  Array.from({ length: 45 }, (_, i) => ({
    t: new Date(NOW.getTime() - (44 - i) * DAY).toISOString(),
    o: 100,
    h: 100,
    l: 100,
    c: i < 15 ? 100 : 100 + rise,
    v: 1,
  }));

const adjustments: string[] = [];
const fakeOptions = (failing: string[] = []) =>
  ({
    getBars: (symbol: string, _start: string, _end: string, _limit: number, adjustment: string) => {
      adjustments.push(adjustment);
      return failing.includes(symbol)
        ? Promise.reject(new Error("feed down"))
        : Promise.resolve(bars(symbol === "SPY" ? 2 : symbol === "XLE" ? 6 : 1));
    },
  }) as unknown as AlpacaOptionsClient;

const eric = {
  id: "human-eric",
  displayName: "Eric",
  kind: "human" as const,
  cash: 0,
  equity: 0,
  positions: [
    { symbol: "XOM", quantity: 1, avgPrice: 100, marketValue: 100 },
    { symbol: "EEM", quantity: 1, avgPrice: 40, marketValue: 40 },
  ],
};
const other = {
  ...eric,
  id: "human-joe",
  positions: [{ symbol: "JPM", quantity: 1, avgPrice: 1, marketValue: 1 }],
};

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [eric, other], collisions: [] }) },
    auth: { providerIds: ["google"] } as never,
    resolveOwnerIds: () => ["human-eric"],
    now: () => NOW,
    ...over,
  } as unknown as DashboardServerConfig;
}

const session = { email: "eric@example.com" } as never;
const sector = (view: CoverageJson, name: string) => view.sectors.find((s) => s.sector === name);

describe("GET /api/research/coverage", () => {
  it("reads the viewer's own positions, never another member's", async () => {
    const { res, read } = fakeRes();
    await serveCoverageJson(res, configWith(), session);
    const view = read();
    expect(view.holdingsRead).toBe(true);
    expect(sector(view, "Energy")?.held).toEqual(["XOM"]);
    expect(sector(view, "Financials")?.held).toEqual([]);
    expect(view.unclassified.held).toEqual(["EEM"]);
  });

  it("says there is no market data, and shows no number, with no linked client", async () => {
    const { res, read } = fakeRes();
    await serveCoverageJson(res, configWith(), session);
    const view = read();
    expect(view.funds.available).toBe(false);
    expect(view.sectors.every((s) => s.fundLine === undefined)).toBe(true);
  });

  it("formats each fund's month through the viewer's own client", async () => {
    const { res, read } = fakeRes();
    await serveCoverageJson(
      res,
      configWith({ optionsClientFor: (id) => (id === "human-eric" ? fakeOptions() : undefined) }),
      session,
    );
    const view = read();
    expect(view.funds).toMatchObject({ available: true, window: "1M" });
    expect(sector(view, "Energy")?.fundLine).toMatchObject({
      ret: "+6.0%",
      vsSpy: "+4.0 pts vs S&P",
    });
    // Adjusted closes, so an ex-dividend date never reads as a price drop.
    expect(new Set(adjustments)).toEqual(new Set(["all"]));
  });

  it("blanks only the fund whose read failed", async () => {
    const { res, read } = fakeRes();
    await serveCoverageJson(
      res,
      configWith({ optionsClientFor: () => fakeOptions(["XLE"]) }),
      session,
    );
    const view = read();
    expect(sector(view, "Energy")?.fundLine).toBeUndefined();
    expect(sector(view, "Technology")?.fundLine?.ret).toBe("+1.0%");
  });

  it("reads no holdings when no auth is configured", async () => {
    const { res, read } = fakeRes();
    await serveCoverageJson(res, configWith({ auth: undefined }), undefined);
    const view = read();
    expect(view.holdingsRead).toBe(false);
    expect(view.sectors).toHaveLength(11);
  });
});
