import type { ServerResponse } from "node:http";
import type { AlpacaTradingClient } from "../../src/alpaca/alpaca-trading-client.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveNetWorthJson } from "../../src/server/networth-api-routes.js";

/**
 * The net-worth route's contract (`GET /api/accounts/networth`): the session's OWN accounts only,
 * per-account broker reads with one unreachable account never blanking the rest, errored / not-on-
 * the-board accounts excluded from the aggregate, and the 200 payload shape the shell renders.
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

type WinKey = "7D" | "1M" | "3M" | "1Y";
type WinMap = Partial<
  Record<WinKey, { readonly pct: number; readonly base: number; readonly end: number }>
>;

const PERIOD_TO_KEY: Record<string, WinKey> = { "1W": "7D", "1M": "1M", "3M": "3M", "1A": "1Y" };

function fakeClient(opts: {
  readonly lastEquity?: string;
  readonly windows?: WinMap;
  readonly failHistory?: boolean;
}): AlpacaTradingClient {
  return {
    getAccount: async () => ({
      id: "x",
      cash: "50000",
      portfolio_value: "101000",
      status: "ACTIVE",
      ...(opts.lastEquity !== undefined ? { last_equity: opts.lastEquity } : {}),
    }),
    getPortfolioHistory: (period: string) => {
      if (opts.failHistory) return Promise.reject(new Error("history down"));
      const key = PERIOD_TO_KEY[period];
      if (!key)
        return Promise.resolve({
          timestamp: [],
          equity: [],
          profit_loss: [],
          profit_loss_pct: [],
          base_value: null,
        });
      const w = opts.windows?.[key];
      if (!w)
        return Promise.resolve({
          timestamp: [],
          equity: [],
          profit_loss: [],
          profit_loss_pct: [],
          base_value: null,
        });
      return Promise.resolve({
        timestamp: [1, 2],
        equity: [w.base, w.end],
        profit_loss: [0, w.end - w.base],
        profit_loss_pct: [0, w.pct],
        base_value: w.base,
      });
    },
  } as unknown as AlpacaTradingClient;
}

const eric = {
  id: "human-eric",
  displayName: "Eric",
  kind: "human" as const,
  cash: 50_000,
  equity: 101_000,
  positions: [{ symbol: "NVDA", quantity: 1, avgPrice: 100, marketValue: 110 }],
};
const sauron = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 0,
  equity: 200_000,
  positions: [],
};

function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [eric, sauron], collisions: [] }) },
    auth: { providerIds: ["google"] } as never,
    resolveOwnerIds: () => ["human-eric", "sauron"],
    tradingClientFor: (id: string) =>
      id === "human-eric"
        ? fakeClient({
            lastEquity: "100000",
            windows: { "7D": { pct: 0.01, base: 100_000, end: 101_000 } },
          })
        : id === "sauron"
          ? fakeClient({
              lastEquity: "200000",
              windows: { "7D": { pct: 0.025, base: 200_000, end: 205_000 } },
            })
          : undefined,
    accountAdmin: {
      profileFor: (id: string) =>
        id === "human-eric" ? { displayName: "Eric", timezone: "America/Denver" } : undefined,
    } as never,
    ...over,
  } as unknown as DashboardServerConfig;
}

/** Narrow an array/index lookup to a defined value — the biome-safe stand-in for `!` in specs. */
function must<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) throw new Error(`expected ${label} to be defined`);
  return value;
}

const session = { email: "eric@example.com" } as never;
const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");
type TotalView = { value: string; windows: { label: string; value: string; partial?: boolean }[] };
const totalOf = (body: Record<string, unknown>): TotalView => body.total as TotalView;

describe("serveNetWorthJson", () => {
  it("answers 200 with the session's owned accounts only", async () => {
    const { res, out } = fakeRes();
    await serveNetWorthJson(res, configWith({ resolveOwnerIds: () => ["human-eric"] }), session);
    expect(out.status).toBe(200);
    const body = answered(out);
    const ids = (body.accounts as { id: string }[]).map((a) => a.id);
    expect(ids).toEqual(["human-eric"]);
  });

  it("returns an empty book when no auth is configured", async () => {
    const { res, out } = fakeRes();
    await serveNetWorthJson(
      res,
      configWith({ auth: undefined, resolveOwnerIds: undefined }),
      undefined,
    );
    const body = answered(out);
    expect(body.accounts).toEqual([]);
    expect(body.total).toBeNull();
  });

  it("aggregates value across accounts and lifts the 7D window to the book level", async () => {
    const { res, out } = fakeRes();
    await serveNetWorthJson(res, configWith(), session);
    const body = answered(out);
    expect(totalOf(body).value).toBe("$301,000");
    const w7 = totalOf(body).windows.find((w) => w.label === "7D");
    // (101000 + 205000) / (100000 + 200000) − 1 = +2.00%
    expect(w7?.value).toBe("+2.00%");
    expect((body.accounts as unknown[]).length).toBe(2);
  });

  it("swallows a per-account history failure: that account's windows read '—' and the aggregate window is partial", async () => {
    const { res, out } = fakeRes();
    await serveNetWorthJson(
      res,
      configWith({
        tradingClientFor: (id: string) =>
          id === "human-eric"
            ? fakeClient({
                lastEquity: "100000",
                windows: { "7D": { pct: 0.01, base: 100_000, end: 101_000 } },
              })
            : fakeClient({ lastEquity: "200000", failHistory: true }),
      }),
      session,
    );
    const body = answered(out);
    const sauronRow = must(
      (body.accounts as { id: string; windows: { label: string; value: string }[] }[]).find(
        (a) => a.id === "sauron",
      ),
      "sauron row",
    );
    expect(sauronRow.windows.every((w) => w.value === "—")).toBe(true);
    // Sauron's equity is still known (snapshot), so the total value still includes it.
    expect(totalOf(body).value).toBe("$301,000");
    const w7 = must(
      totalOf(body).windows.find((w) => w.label === "7D"),
      "7D window",
    );
    expect(w7.value).toBe("+1.00%");
    expect(w7.partial).toBe(true);
  });

  it("excludes an owned account that isn't on the board yet, surfacing it as an errored row", async () => {
    const { res, out } = fakeRes();
    await serveNetWorthJson(
      res,
      configWith({ resolveOwnerIds: () => ["human-eric", "ghost"] }),
      session,
    );
    const body = answered(out);
    const ghost = must(
      (body.accounts as { id: string; error?: string; value: string }[]).find(
        (a) => a.id === "ghost",
      ),
      "ghost row",
    );
    expect(ghost.error).toBe("not on the board yet");
    expect(ghost.value).toBe("—");
    // The total reflects only the on-board account.
    expect(totalOf(body).value).toBe("$101,000");
  });
});
