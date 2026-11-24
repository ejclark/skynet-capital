import type { EdgarFilings } from "../adapters/edgar-filings.js";
import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
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
import type { IvHistoryPort } from "../research/iv-record.js";
import { printEvidenceFor } from "../research/print-evidence.js";
import type { SpotCheckPort } from "../research/spot-checks.js";
import { outlookLedger, symbolOutlook } from "../research/symbol-outlook.js";
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

/**
 * THE GUIDANCE MARKET READ, ON ITS CALLER'S OWN CLIENTS (#3798 slice 1, #4321).
 *
 * Every market input position guidance reads — quote, chain, bars, session clock, EDGAR 8-Ks, IV
 * history — fetched live and pulse-checked against its source's own timestamps, handed back as the
 * engine's inputs minus the stake. It takes its clients as inputs, never a server config or a
 * member id, so the member route (`guidance-route.ts`, through the account the session links) and a
 * bot (through its own paper account's keys) build the same `GuidanceMarket` from the same code.
 *
 * Nothing here caches: the 15-second coalesce keyed by requester stays with the member route
 * (`guidanceMarketFor`), because "who asked" is a member-route fact. A bot that wants coalescing
 * brings its own.
 *
 * Cost posture (Eric, 2026-09-25: "cost efficient", never cheap): quotes are fetched only for the
 * expiries the guidance may actually price (≥ 7 DTE and before the earnings window) and for both
 * sides; every listed expiry is still shown on the strip.
 */

const MAX_EXPIRATIONS = 12;
const BARS_LOOKBACK_DAYS = 45;

/** The clients one market read runs on. Optional ones degrade honestly, never into a 500. */
export interface GuidanceMarketClients {
  /** Quotes, expirations, chains and bars — the one client a read cannot do without. */
  readonly options: AlpacaOptionsClient;
  /** The broker's market clock. Absent: the session is judged from the wall clock instead. */
  readonly trading?: AlpacaTradingClient;
  /** EDGAR 8-Ks: the filings pulse, and whether an estimated print already happened. */
  readonly edgar: Pick<EdgarFilings, "eightKs">;
  /** The IV clock's history. Absent: no IV rank, and richness falls back to implied ÷ realized. */
  readonly ivHistory?: Pick<IvHistoryPort, "list">;
  /** One spot cross-check line per read. Absent: not counted. */
  readonly spotChecks?: Pick<SpotCheckPort, "save">;
  readonly now: () => string;
}

/** A read that found nothing honest to advise on, said in words. */
export interface GuidanceMarketMiss {
  readonly reason: string;
  readonly note: string;
}

/** One chain page, or none: a failed page prices nothing rather than failing the read. */
export async function chainFor(
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
export async function readGuidanceMarket(
  clients: GuidanceMarketClients,
  symbol: string,
  refresh = false,
): Promise<GuidanceMarket | GuidanceMarketMiss> {
  const { options: client, trading } = clients;
  const now = clients.now();
  const today = etDateOf(now);
  const barsFrom = new Date(Date.parse(now) - BARS_LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const [quote, expirations, bars, open, filings, ivSamples] = await Promise.all([
    client.getUnderlyingQuote(symbol),
    client.getExpirations(symbol, today, MAX_EXPIRATIONS).catch(() => [] as string[]),
    client.getBars(symbol, barsFrom, today),
    trading ? marketOpen(trading) : Promise.resolve(undefined),
    clients.edgar.eightKs(symbol, { fresh: refresh }),
    // The IV clock's history (local disk): a failed read degrades to "no rank yet", never a 500.
    clients.ivHistory?.list(symbol).catch(() => []) ?? Promise.resolve([]),
  ]);
  // After the filings are in: an earnings 8-K inside the window means the print already happened
  // (`reportedIn`), so it no longer blocks an expiry — the next print on file becomes the active one.
  const active = activePrint(UPCOMING_PRINTS, symbol, today, filings?.filings);
  const print = active?.print;
  const earnings = active?.window;
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
  // One summary per symbol (#4807): its nearest ledger — a print's or any other event's — feeds the
  // levers below, and the summary itself rides along for the recap card.
  const outlook = symbolOutlook(symbol, now);
  const ledger = outlookLedger(outlook);
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
  // Counted, never gating: a failed write must not cost the caller its read.
  void clients.spotChecks
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
    outlook,
    ...(ledger
      ? {
          ledger: {
            buySignal: ledger.read.buySignal,
            buyConfidence: ledger.read.buySignal ? (ledger.read.confidence ?? "low") : "none",
            stance: ledger.read.stance ?? "no call on record",
            ...(ledger.read.provesWrong
              ? {
                  provesWrong: {
                    quote: ledger.read.provesWrong,
                    ...(ledger.read.assessed ? { asOf: ledger.read.assessed } : {}),
                  },
                }
              : {}),
            source: ledger.source,
          },
        }
      : {}),
    pulse: [
      spotPulse(observed, now, sessionOpen),
      chainPulse(stamps, total, now, sessionOpen),
      researchPulse(
        ledger
          ? {
              ...ledger.read,
              source: ledger.source,
              ...(outlook.basis?.callFrom === "ledger" ? { callUntil: outlook.until } : {}),
            }
          : undefined,
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
