import { existsSync, readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { join } from "node:path";
import { EdgarFilings } from "../adapters/edgar-filings.js";
import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { nextPrint } from "../domain/earnings-calendar.js";
import { allEvents } from "../domain/market-events.js";
import { positionBrief } from "../options/position-brief.js";
import { briefToMarkdown } from "../options/position-brief-markdown.js";
import { atmIv, daysBetween, etDateOf, MIN_DTE } from "../options/position-brief-rules.js";
import type {
  BriefGoal,
  BriefInputs,
  BriefQuote,
  BriefStake,
} from "../options/position-brief-types.js";
import { daysToExpiryFrom } from "../options/single-leg-odds.js";
import { printEvidenceFor } from "../research/print-evidence.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import {
  earningsWindowOf,
  parityImpliedSpot,
  realizedVolatility,
  toBriefQuote,
} from "./brief-market.js";
import {
  chainPulse,
  clockSessionOpen,
  earningsPulse,
  filingsPulse,
  researchPulse,
  sessionPulse,
  spotPulse,
} from "./brief-pulse.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { marketOpen } from "./desk-gate.js";
import { readLedger } from "./ledger-stance.js";
import { sendJson } from "./page-shell.js";

/**
 * GET /api/research/brief — the Position Brief over live data (#3729, slice 3).
 *
 * `?symbol=CRWV&shares=400&basis=70&cash=40000&goal=income&own=65&portfolio=250000[&refresh=1]`
 *
 * Every market input is fetched LIVE per request through the member's own connected account, then
 * pulse-checked against its source's own timestamps before the engine sees it. The one sharing is
 * a 15-second coalesce of identical in-flight market reads (so a double-tap costs one Alpaca pull,
 * not two); `refresh=1` bypasses even that. The stake rides in the query and is never stored.
 *
 * Cost posture (Eric, 2026-09-25: "cost efficient", never cheap): quotes are fetched only for the
 * expiries the Brief may actually price (≥ 7 DTE and before the print window) and only for the
 * sides the stake can use; every listed expiry is still shown on the strip.
 */

const COALESCE_MS = 15_000;
const MAX_EXPIRATIONS = 12;
const BARS_LOOKBACK_DAYS = 45;
const GOALS: readonly BriefGoal[] = ["income", "keep-shares", "exit"];

/** What the route reads besides the member's broker — injectable so specs run offline and on a fixed clock. */
export interface BriefDeps {
  readonly edgar: Pick<EdgarFilings, "eightKs">;
  readonly now: () => string;
}
const LIVE: BriefDeps = { edgar: new EdgarFilings(), now: () => new Date().toISOString() };

interface MarketRead {
  readonly at: number;
  readonly inputs: Promise<
    Omit<BriefInputs, "stake"> | { readonly reason: string; readonly note: string }
  >;
}
const inflight = new Map<string, MarketRead>();

const queryNumber = (v: string | null): number | undefined => {
  if (v === null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export function stakeFromQuery(params: URLSearchParams): BriefStake {
  const goal = params.get("goal") as BriefGoal | null;
  const pick = (key: string, field: keyof BriefStake) => {
    const n = queryNumber(params.get(key));
    return n !== undefined ? { [field]: n } : {};
  };
  return {
    goal: goal && GOALS.includes(goal) ? goal : "income",
    ...pick("shares", "shares"),
    ...pick("basis", "costBasis"),
    ...pick("cash", "cash"),
    ...pick("own", "happyToOwnAt"),
    ...pick("portfolio", "portfolioValue"),
  };
}

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
  wantCalls: boolean,
  wantPuts: boolean,
  deps: BriefDeps,
): Promise<Omit<BriefInputs, "stake"> | { readonly reason: string; readonly note: string }> {
  const now = deps.now();
  const today = etDateOf(now);
  const print = nextPrint(symbol, now);
  const earnings = earningsWindowOf(print);
  const trading = config.tradingClientFor?.(requesterId);
  const barsFrom = new Date(Date.parse(now) - BARS_LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const [quote, expirations, bars, open, filings] = await Promise.all([
    client.getUnderlyingQuote(symbol),
    client.getExpirations(symbol, today, MAX_EXPIRATIONS).catch(() => [] as string[]),
    client.getBars(symbol, barsFrom, today),
    trading ? marketOpen(trading) : Promise.resolve(undefined),
    deps.edgar.eightKs(symbol),
  ]);
  if (!quote)
    return { reason: "failed", note: `No live quote for ${symbol} — nothing to brief on.` };
  if (expirations.length === 0)
    return { reason: "no-options", note: `No listed options for ${symbol}.` };
  const spot = quote.last;
  const sessionOpen = open ?? clockSessionOpen(now);
  const priceable = expirations.filter(
    (e) => daysBetween(today, e) >= MIN_DTE && !(earnings && e >= earnings.start),
  );
  // The nearest listed expiry always gets both sides: it feeds the parity cross-check on spot.
  const parityExp = priceable[0] ?? (expirations[0] as string);
  const pages = await Promise.all(
    [...new Set([parityExp, ...priceable])].flatMap((expiration) =>
      (["call", "put"] as const)
        .filter((t) => expiration === parityExp || (t === "call" ? wantCalls : wantPuts))
        .map(async (type) => ({
          expiration,
          type,
          rows: await chainFor(client, symbol, expiration, type),
        })),
    ),
  );
  const days = (e: string) =>
    daysToExpiryFrom(e, new Date(now)) ?? Math.max(1, daysBetween(today, e));
  const chain: BriefQuote[] = pages.flatMap(({ expiration, type, rows }) =>
    rows.map((row) => toBriefQuote(row, expiration, type, spot, days(expiration))),
  );
  const parityRows = (t: "call" | "put") =>
    pages.find((p) => p.expiration === parityExp && p.type === t)?.rows ?? [];
  const parity = parityImpliedSpot(parityRows("call"), parityRows("put"), spot, days(parityExp));
  const stamps = pages.flatMap((p) => p.rows.flatMap((r) => (r.quotedAt ? [r.quotedAt] : [])));
  const total = pages.reduce((n, p) => n + p.rows.length, 0);
  const ledger = ledgerFor(symbol, print?.date);
  const evidence = printEvidenceFor(symbol);
  const closes = (bars ?? []).map((b) => b.c);
  const realizedVol = realizedVolatility(closes);
  const atm = atmIv(chain, spot, priceable[0]);
  return {
    symbol,
    now,
    spot,
    sessionOpen,
    chain,
    expirations,
    ...(realizedVol !== undefined ? { realizedVol } : {}),
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
      spotPulse(
        {
          last: spot,
          ...(quote.lastAt ? { lastAt: quote.lastAt } : {}),
          ...(parity !== undefined ? { parity } : {}),
        },
        now,
        sessionOpen,
      ),
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

export async function serveBrief(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
  deps: BriefDeps = LIVE,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) {
    sendJson(res, 400, { error: "the brief wants ?symbol=<underlying>" });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!(client && requesterId)) {
    sendJson(res, 200, {
      reason: "unlinked",
      note: "The Brief reads live quotes through your own connected account, and your session isn't linked to one yet.",
    });
    return;
  }
  const stake = stakeFromQuery(params);
  const wantCalls = (stake.shares ?? 0) >= 100;
  const wantPuts = (stake.cash ?? 0) > 0;
  const key = `${requesterId}:${symbol}:${wantCalls}:${wantPuts}`;
  const cached = inflight.get(key);
  const fresh = cached && Date.now() - cached.at < COALESCE_MS && params.get("refresh") !== "1";
  const read: MarketRead = fresh
    ? cached
    : {
        at: Date.now(),
        inputs: readMarket(client, config, requesterId, symbol, wantCalls, wantPuts, deps),
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
    const brief = positionBrief({ ...market, stake });
    sendJson(res, 200, { brief, markdown: briefToMarkdown(brief) });
  } catch (error) {
    inflight.delete(key);
    sendJson(res, 200, {
      reason: "failed",
      note: `Couldn't build the Brief right now — ${String(error)}.`,
    });
  }
}
