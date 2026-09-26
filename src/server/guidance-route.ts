import { existsSync, readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { join } from "node:path";
import { EdgarFilings } from "../adapters/edgar-filings.js";
import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { allEvents } from "../domain/market-events.js";
import {
  atmIv,
  daysBetween,
  etDateOf,
  MIN_DTE,
  optionsCutoff,
  richnessExpiry,
} from "../options/position-guidance-rules.js";
import type { GuidanceMarket, GuidanceQuote } from "../options/position-guidance-types.js";
import { daysToExpiryFrom } from "../options/single-leg-odds.js";
import { printEvidenceFor } from "../research/print-evidence.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { marketOpen } from "./desk-gate.js";
import {
  activePrint,
  ivRankOf,
  parityImpliedSpot,
  realizedVolatility,
  toGuidanceQuote,
} from "./guidance-market.js";
import {
  chainPulse,
  clockSessionOpen,
  earningsPulse,
  filingsPulse,
  researchPulse,
  sessionPulse,
  spotCheckOf,
  spotPulse,
} from "./guidance-pulse.js";
import { readLedger } from "./ledger-stance.js";
import { sendJson } from "./page-shell.js";

/**
 * GET /api/trade/guidance — the MARKET half of position guidance over live data (#3729).
 *
 * `?symbol=CRWV[&refresh=1]` → `{ market }` (a `GuidanceMarket`).
 *
 * The member's stake — shares, cost basis, cash — never comes here: the browser runs
 * `positionGuidance({ ...market, stake })` itself (the app already runs `src/` code client-side), so
 * a real-portfolio number never lands in a URL or a server log. One market read also serves every
 * stake, which is what makes the coalesce below safe to share.
 *
 * Every market input is fetched LIVE per request through the member's own connected account, then
 * pulse-checked against its source's own timestamps. The one sharing is a 15-second coalesce of
 * identical in-flight reads (a double-tap costs one Alpaca pull, not two); `refresh=1` bypasses it.
 *
 * Cost posture (Eric, 2026-09-25: "cost efficient", never cheap): quotes are fetched only for the
 * expiries the guidance may actually price (≥ 7 DTE and before the earnings window) and only for
 * both sides; every listed expiry is still shown on the strip.
 */

const COALESCE_MS = 15_000;
const MAX_EXPIRATIONS = 12;
const BARS_LOOKBACK_DAYS = 45;

/** What the route reads besides the member's broker — injectable so specs run offline and on a fixed clock. */
export interface GuidanceDeps {
  readonly edgar: Pick<EdgarFilings, "eightKs">;
  readonly now: () => string;
}
const LIVE: GuidanceDeps = { edgar: new EdgarFilings(), now: () => new Date().toISOString() };

interface MarketRead {
  readonly at: number;
  readonly inputs: Promise<GuidanceMarket | { readonly reason: string; readonly note: string }>;
}
const inflight = new Map<string, MarketRead>();

function ledgerFor(symbol: string, printDate: string | undefined) {
  if (!printDate) return undefined;
  const slug = `events/${symbol.toLowerCase()}-${printDate}-print`;
  const path = join(process.cwd(), "docs", "research", `${slug}.md`);
  if (!existsSync(path)) return undefined;
  return {
    read: readLedger(readFileSync(path, "utf8"), symbol),
    source: `docs/research/${slug}.md`,
  };
}

async function chainFor(
  client: AlpacaOptionsClient,
  symbol: string,
  expiration: string,
  type: "call" | "put",
): Promise<readonly OptionChainRow[]> {
  try {
    return await client.getChain(symbol, expiration, type);
  } catch {
    return [];
  }
}

/** Read every market input live, pulse-check it, and hand back the engine's inputs minus the stake. */
async function readMarket(
  client: AlpacaOptionsClient,
  config: DashboardServerConfig,
  requesterId: string,
  symbol: string,
  deps: GuidanceDeps,
  refresh: boolean,
): Promise<GuidanceMarket | { readonly reason: string; readonly note: string }> {
  const now = deps.now();
  const today = etDateOf(now);
  const active = activePrint(UPCOMING_PRINTS, symbol, today);
  const print = active?.print;
  const earnings = active?.window;
  const trading = config.tradingClientFor?.(requesterId);
  const barsFrom = new Date(Date.parse(now) - BARS_LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const [quote, expirations, bars, open, filings, ivSamples] = await Promise.all([
    client.getUnderlyingQuote(symbol),
    client.getExpirations(symbol, today, MAX_EXPIRATIONS).catch(() => [] as string[]),
    client.getBars(symbol, barsFrom, today),
    trading ? marketOpen(trading) : Promise.resolve(undefined),
    deps.edgar.eightKs(symbol, { fresh: refresh }),
    // The IV clock's history (local disk): a failed read degrades to "no rank yet", never a 500.
    config.ivHistory?.list(symbol).catch(() => []) ?? Promise.resolve([]),
  ]);
  if (!quote)
    return { reason: "failed", note: `No live quote for ${symbol} — nothing to advise on.` };
  if (expirations.length === 0)
    return { reason: "no-options", note: `No listed options for ${symbol}.` };
  const spot = quote.last;
  const sessionOpen = open ?? clockSessionOpen(now);
  const priceable = expirations.filter(
    (e) => daysBetween(today, e) >= MIN_DTE && !(earnings && e >= earnings.start),
  );
  // Parity reads spot off the nearest expiry at least a day out, both sides: the least time for a
  // dividend (which parity cannot see) to fall inside it, without 0-DTE's wide, gamma-driven marks.
  const parityExp =
    expirations.find((e) => daysBetween(today, e) >= 1) ?? (expirations[0] as string);
  const pages = await Promise.all(
    [...new Set([parityExp, ...priceable])].flatMap((expiration) =>
      (["call", "put"] as const).map(async (type) => ({
        expiration,
        type,
        rows: await chainFor(client, symbol, expiration, type),
      })),
    ),
  );
  const days = (e: string) =>
    daysToExpiryFrom(e, new Date(now)) ?? Math.max(1, daysBetween(today, e));
  const chain: GuidanceQuote[] = pages.flatMap(({ expiration, type, rows }) =>
    rows.map((row) => toGuidanceQuote(row, expiration, type, spot, days(expiration))),
  );
  const parityRows = (t: "call" | "put") =>
    pages.find((p) => p.expiration === parityExp && p.type === t)?.rows ?? [];
  const parity = parityImpliedSpot(parityRows("call"), parityRows("put"), spot, days(parityExp));
  const stamps = pages.flatMap((p) => p.rows.flatMap((r) => (r.quotedAt ? [r.quotedAt] : [])));
  const total = pages.reduce((n, p) => n + p.rows.length, 0);
  const ledger = ledgerFor(symbol, print?.date);
  const evidence = printEvidenceFor(symbol);
  // In session today's bar is a partial day; counting it would understate realized vol and flatter
  // the implied ÷ realized ratio.
  const closes = (bars ?? [])
    .filter((b) => !(sessionOpen && etDateOf(b.t) === today))
    .map((b) => b.c);
  const realizedVol = realizedVolatility(closes);
  const atm = atmIv(
    chain,
    spot,
    richnessExpiry(
      priceable
        .filter((e) => {
          const cutoff = optionsCutoff(earnings, undefined);
          return !(cutoff && e > cutoff.date);
        })
        .map((e) => ({ expiration: e, dte: daysBetween(today, e) })),
    ),
  );
  const mid =
    quote.bid !== undefined && quote.ask !== undefined ? (quote.bid + quote.ask) / 2 : undefined;
  const ivRank = ivRankOf(ivSamples, symbol, now);
  const observed = {
    last: spot,
    ...(quote.lastAt ? { lastAt: quote.lastAt } : {}),
    ...(parity !== undefined ? { parity } : {}),
    ...(mid !== undefined ? { mid } : {}),
  };
  // Counted, never gating: a failed write must not cost the member their read.
  void config.spotChecks
    ?.save(spotCheckOf(symbol, observed, now, sessionOpen))
    .catch(() => undefined);
  return {
    symbol,
    now,
    spot,
    sessionOpen,
    chain,
    expirations,
    ...(realizedVol !== undefined ? { realizedVol } : {}),
    ...(ivRank !== undefined ? { ivRank } : {}),
    ...(earnings ? { earnings } : {}),
    ...(evidence ? { printEvidence: evidence.text } : {}),
    catalysts: allEvents(now)
      .filter((e) => e.symbols.includes(symbol) && !e.id.endsWith("-print") && e.date >= today)
      .map((e) => ({ date: e.date, label: e.title, source: e.source })),
    ...(ledger
      ? {
          ledger: {
            buySignal: ledger.read.buySignal,
            buyConfidence: ledger.read.buySignal ? (ledger.read.confidence ?? "low") : "none",
            stance: ledger.read.stance ?? "no call on record",
            source: ledger.source,
          },
        }
      : {}),
    pulse: [
      spotPulse(observed, now, sessionOpen),
      chainPulse(stamps, total, now, sessionOpen),
      researchPulse(
        ledger ? { ...ledger.read, source: ledger.source } : undefined,
        spot,
        atm,
        today,
      ),
      earningsPulse(print),
      filingsPulse(filings, ledger?.read.assessed, now),
      sessionPulse(open, now),
    ],
  };
}

export async function serveGuidance(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
  deps: GuidanceDeps = LIVE,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) {
    sendJson(res, 400, { error: "guidance wants ?symbol=<underlying>" });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!(client && requesterId)) {
    sendJson(res, 200, {
      reason: "unlinked",
      note: "The guidance reads live quotes through your own connected account, and your session isn't linked to one yet.",
    });
    return;
  }
  // The stake never reaches the server, not even as a coarse fact: shares, basis and cash stay in
  // the member's browser, where the engine applies them to this market read. Both sides are always
  // priced — a "calls only" flag would itself say "holds 100+ shares, no cash" — and one read then
  // serves every stake, so changing the stake never re-fetches.
  const refresh = params.get("refresh") === "1";
  const key = `${requesterId}:${symbol}`;
  const cached = inflight.get(key);
  const fresh = cached && Date.now() - cached.at < COALESCE_MS && !refresh;
  const read: MarketRead = fresh
    ? cached
    : {
        at: Date.now(),
        inputs: readMarket(client, config, requesterId, symbol, deps, refresh),
      };
  if (!fresh) {
    for (const [k, v] of inflight) if (Date.now() - v.at >= COALESCE_MS) inflight.delete(k);
    inflight.set(key, read);
  }
  try {
    const market = await read.inputs;
    if ("reason" in market) {
      sendJson(res, 200, market);
      return;
    }
    sendJson(res, 200, { market });
  } catch {
    inflight.delete(key);
    // A fixed sentence, never the exception text — a raw error can carry internals (desk-gate.ts).
    sendJson(res, 200, {
      reason: "failed",
      note: "Couldn't build the guidance right now — try again shortly.",
    });
  }
}
