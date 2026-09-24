import type { ServerResponse } from "node:http";
import type { AlpacaPortfolioHistory } from "../alpaca/alpaca-trading-client.js";
import { BENCHMARK_LOOKBACK_DAYS, benchmarkReturns } from "../observatory/benchmark-returns.js";
import { lastFinite } from "../observatory/month-return-sync.js";
import {
  type AccountNetWorthInput,
  accountsNetWorthView,
  type BenchmarkInput,
  type NetWorthWindowInput,
  type NetWorthWindowKey,
} from "../observatory/networth-json-view.js";
import { participantUnrealized } from "../observatory/participant-card.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * `/api/accounts/networth` — the Accounts page's Summary section, as data. The session's OWN
 * accounts only (`resolveOwnedIds`, the same link `/api/settings` uses — never a client-supplied
 * id), each with total equity, the day's move, and flow-adjusted ROI over 7D/1M/3M/1Y, plus an
 * "all accounts" aggregate. Read-only, member-tier (the auth gate already held the boundary); the
 * ownership check here is what keeps one member out of another's book.
 *
 * One unreachable account never blanks the rest: a broker-read failure (history or the account
 * fetch) is swallowed per-account, that account's windows read "—", and it's excluded from the
 * aggregate — the same posture `buildParticipantSnapshot` takes for the board.
 */

/** Alpaca `period` for each window this view shows (`1A` = one year). */
const PERIOD: Record<NetWorthWindowKey, string> = {
  "7D": "1W",
  "1M": "1M",
  "3M": "3M",
  "1Y": "1A",
};

const WINDOW_KEYS: readonly NetWorthWindowKey[] = ["7D", "1M", "3M", "1Y"];

function emptyWindows(): Record<NetWorthWindowKey, NetWorthWindowInput> {
  return { "7D": {}, "1M": {}, "3M": {}, "1Y": {} };
}

/** The highest finite daily equity in a full-history read, with its day (#3689's high line). */
function highestClose(
  h: AlpacaPortfolioHistory | undefined,
): { value: number; at: string } | undefined {
  if (!h) return undefined;
  let best: { value: number; at: string } | undefined;
  h.equity.forEach((v, i) => {
    const ts = h.timestamp[i];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || typeof ts !== "number") return;
    if (!best || v > best.value) best = { value: v, at: new Date(ts * 1000).toISOString() };
  });
  return best;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** SPY's per-window return, through the first owned account with a market-data client. One feed
 *  read serves every account and the aggregate. Any failure leaves the "vs S&P" column out rather
 *  than guessing. */
async function spyBenchmark(
  config: DashboardServerConfig,
  ownedIds: readonly string[],
): Promise<BenchmarkInput> {
  const client = ownedIds.map((id) => config.optionsClientFor?.(id)).find(Boolean);
  if (!client) return {};
  const end = config.now?.() ?? new Date();
  const start = new Date(end.getTime() - BENCHMARK_LOOKBACK_DAYS * DAY_MS);
  const bars = await client
    .getBars("SPY", start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
    .catch(() => undefined);
  return bars ? benchmarkReturns(bars) : {};
}

async function accountNetWorth(
  config: DashboardServerConfig,
  found: {
    readonly id: string;
    readonly displayName: string;
    readonly kind: "human" | "bot";
    readonly equity: number;
    readonly cash: number;
    readonly positions: readonly unknown[];
    readonly realizedPl?: number;
    readonly error?: string;
  },
  unrealizedPl?: number,
): Promise<AccountNetWorthInput> {
  const id = found.id;
  const base = {
    id,
    name: found.displayName,
    kind: found.kind,
    positionCount: found.positions.length,
  };

  // An errored snapshot (or one with no broker client wired, e.g. offline) carries no equity and no
  // history — the row renders "—" throughout and is excluded from the aggregate by its `error`.
  const client = config.tradingClientFor?.(id);
  const errored = typeof found.error === "string" ? found.error : undefined;
  if (!client || errored) {
    return {
      ...base,
      ...(errored ? { error: errored } : {}),
      windows: emptyWindows(),
    };
  }

  // The account fetch gives `last_equity` (the previous close the day move measures from); the four
  // window history calls each give one window's flow-adjusted base→end arc; a sixth reads the whole
  // history for the all-time high the hero draws (#3689). All six run in parallel and fail
  // independently — a history timeout turns one window (or the high line) to "—", not the whole row.
  const [account, fullHistory, ...histories] = await Promise.all([
    client.getAccount().catch(() => undefined),
    client.getPortfolioHistoryByRange("2000-01-01").catch(() => undefined),
    ...WINDOW_KEYS.map((key) => client.getPortfolioHistory(PERIOD[key]).catch(() => undefined)),
  ]);
  const allTimeHigh = highestClose(fullHistory);

  const lastEquityStr = account?.last_equity;
  const lastEquity =
    typeof lastEquityStr === "string" && lastEquityStr.length > 0
      ? Number(lastEquityStr)
      : undefined;

  const windows = emptyWindows();
  WINDOW_KEYS.forEach((key, i) => {
    const h = histories[i] as AlpacaPortfolioHistory | undefined;
    const returnFraction = lastFinite(h?.profit_loss_pct);
    const baseValue = h?.base_value;
    const end = lastFinite(h?.equity);
    if (
      returnFraction !== undefined &&
      typeof baseValue === "number" &&
      Number.isFinite(baseValue) &&
      end !== undefined
    ) {
      windows[key] = { returnFraction, base: baseValue, end };
    }
  });

  return {
    ...base,
    equity: found.equity,
    cash: found.cash,
    ...(lastEquity !== undefined && Number.isFinite(lastEquity) ? { lastEquity } : {}),
    ...(typeof found.realizedPl === "number" ? { realizedPl: found.realizedPl } : {}),
    ...(typeof unrealizedPl === "number" && Number.isFinite(unrealizedPl) ? { unrealizedPl } : {}),
    ...(allTimeHigh ? { allTimeHigh } : {}),
    windows,
  };
}

/** Handle `GET /api/accounts/networth`. */
export async function serveNetWorthJson(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const ownedIds = config.auth ? resolveOwnedIds(session, config) : [];
  const state = config.hub.getState();
  const board = state.participants;

  const benchmarkRead = spyBenchmark(config, ownedIds);
  const inputs = await Promise.all(
    ownedIds.map((id): Promise<AccountNetWorthInput> => {
      const found = board.find((p) => p.id === id);
      if (!found) {
        // An owned id not yet on the board (just linked, broker read pending) — name it honestly
        // and exclude from totals via `error`, mirroring `/api/settings`' not-found synthesis.
        const profile = config.accountAdmin?.profileFor(id);
        return Promise.resolve({
          id,
          name: profile?.displayName ?? id,
          kind: "human",
          positionCount: 0,
          error: "not on the board yet",
          windows: emptyWindows(),
        });
      }
      return accountNetWorth(config, found, participantUnrealized(found));
    }),
  );

  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(accountsNetWorthView(state.generatedAt, inputs, await benchmarkRead)));
}
