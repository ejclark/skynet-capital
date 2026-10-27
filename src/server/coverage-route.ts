/**
 * `GET /api/research/coverage` (#3811 slice 3) — R&D's Coverage section as data: the slice-1 join
 * (`shelfCoverage`) for THIS viewer's holdings, plus each sector fund's month from the viewer's own
 * linked account.
 *
 * Identity doctrine as `/api/accounts/networth` (`networth-api-routes.ts`): holdings are the
 * session's own accounts only (open question 4's default — the map shows what YOU hold), and bars
 * load only through an options client one of those accounts owns. No linked client → no number,
 * and a note saying why; never a stale or invented one (criterion 5).
 */
import type { ServerResponse } from "node:http";
import { allEvents } from "../domain/market-events.js";
import { GICS_SECTORS } from "../domain/sector-coverage.js";
import { coverageJsonView } from "../observatory/coverage-json-view.js";
import {
  type FundStats,
  fundStats,
  SECTOR_FUND_LOOKBACK_DAYS,
} from "../observatory/sector-fund-stats.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { shelfCoverage } from "./sector-coverage-service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const NO_ACCOUNT_NOTE =
  "No market data — sector-fund prices load through your own linked account, and none is linked.";

/**
 * An owned account whose broker read failed sits on the hub as `degraded()` — `positions: []` plus
 * an `error` — until a later read succeeds (`broker-sync.ts`). Its empty list is "unknown", not
 * "holds nothing", so it never counts as a holdings read; the note says what could not be read
 * (#6273, the same errored rows `networth-api-routes.ts` excludes from its aggregate).
 */
function unreadableNote(errored: number, owned: number): string | undefined {
  if (errored === 0) return undefined;
  if (errored < owned) {
    return `${errored} of ${owned} accounts unreadable right now — counting the rest only`;
  }
  return owned === 1
    ? "positions unreadable right now — your account couldn't be read"
    : `positions unreadable right now — none of your ${owned} accounts could be read`;
}

/** Every sector fund's month through one owned client — or the note for why there are none. */
async function sectorFunds(
  config: DashboardServerConfig,
  ownedIds: readonly string[],
  now: Date,
): Promise<{ byFund: ReadonlyMap<string, FundStats> } | { note: string }> {
  const client = ownedIds.map((id) => config.optionsClientFor?.(id)).find(Boolean);
  if (!client) return { note: NO_ACCOUNT_NOTE };
  const start = new Date(now.getTime() - SECTOR_FUND_LOOKBACK_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const end = now.toISOString().slice(0, 10);
  // Adjusted closes ("all"): a return across an ex-dividend date or a split must not read the
  // payout as a price drop — `getBars`' own note; the chart keeps `raw` because it prints trades.
  const read = (sym: string) => client.getBars(sym, start, end, 1000, "all").catch(() => undefined);
  // Twelve reads in parallel, each failing alone: one fund's hiccup blanks its own row, not the column.
  const [spy, ...funds] = await Promise.all([
    read("SPY"),
    ...GICS_SECTORS.map((s) => read(s.fund)),
  ]);
  const byFund = new Map<string, FundStats>();
  GICS_SECTORS.forEach((s, i) => {
    const bars = funds[i];
    const stats = bars ? fundStats(bars, spy) : undefined;
    if (stats) byFund.set(s.fund, stats);
  });
  return { byFund };
}

export async function serveCoverageJson(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const ownedIds = config.auth ? resolveOwnedIds(session, config) : [];
  const owned = config.hub.getState().participants.filter((p) => ownedIds.includes(p.id));
  const now = config.now?.() ?? new Date();
  const asOfIso = now.toISOString();
  const read = owned.filter((p) => !p.error);
  const held = read.flatMap((p) => p.positions.map((pos) => pos.symbol));
  const holdingsNote = unreadableNote(owned.length - read.length, owned.length);
  const view = coverageJsonView({
    asOfIso,
    map: shelfCoverage(asOfIso, held),
    upcoming: allEvents(asOfIso),
    holdingsRead: read.length > 0,
    ...(holdingsNote ? { holdingsNote } : {}),
    funds: await sectorFunds(config, ownedIds, now),
  });
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(view));
}
