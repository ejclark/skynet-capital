import type { ServerResponse } from "node:http";
import type { AlpacaPortfolioHistory } from "../alpaca/alpaca-trading-client.js";
import {
  type AccountNetWorthInput,
  accountsNetWorthView,
  type NetWorthWindowInput,
  type NetWorthWindowKey,
} from "../observatory/networth-json-view.js";
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

/** The last finite value in an Alpaca history array — skips the `null`s the broker emits for spans
 *  it had no value for, so a trailing gap never reads as a 0 return. */
function lastFinite(arr: readonly (number | null)[] | undefined): number | undefined {
  if (!arr) return undefined;
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function emptyWindows(): Record<NetWorthWindowKey, NetWorthWindowInput> {
  return { "7D": {}, "1M": {}, "3M": {}, "1Y": {} };
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
    readonly error?: string;
  },
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
  // history calls each give one window's flow-adjusted base→end arc. All five run in parallel and
  // fail independently — a history timeout turns one window to "—", not the whole row.
  const [account, ...histories] = await Promise.all([
    client.getAccount().catch(() => undefined),
    ...WINDOW_KEYS.map((key) => client.getPortfolioHistory(PERIOD[key]).catch(() => undefined)),
  ]);

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
      return accountNetWorth(config, found);
    }),
  );

  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(accountsNetWorthView(state.generatedAt, inputs)));
}
