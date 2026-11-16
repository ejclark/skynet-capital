import type { IncomingMessage, ServerResponse } from "node:http";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { type DailyHighReading, dailyHighReading } from "../domain/daily-high.js";
import { type Quest, rankQuests } from "../domain/quest.js";
import { DAY_MS } from "../domain/time.js";
import { accountStake } from "../options/account-stake.js";
import {
  CASH_SHARE_FLOOR,
  type ConditionsMarket,
  cashShare,
  conditionsQuests,
} from "../options/conditions-quests.js";
import { STUDIED_INDEXES } from "../options/drawdown-base-rates.js";
import { positionGuidance } from "../options/position-guidance.js";
import { positionQuests } from "../options/position-quests.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { type EventStance, eventQuests } from "./event-quests.js";
import { readEventStances } from "./event-stances.js";
import { type GuidanceDeps, guidanceMarketFor } from "./guidance-route.js";
import { requireGet, sendJson } from "./page-shell.js";
import { type ReadVix, readVix } from "./vix-feed.js";

/**
 * GET /api/quests[?participantId=…][&refresh=1] — a member's quests (#7028).
 *
 * Two sources so far, one ranked list. POSITIONS (slice 1): every call the member holds or has sold
 * is judged by position guidance (the same engine and market read the Guidance tab uses), and only
 * the verdicts that ask for an order come back (`src/options/position-quests.ts`). CONDITIONS
 * (slice 3): when a studied index sits 10%+ under its year high with VIX at 25+ and the account is
 * half cash or more, the cash-secured put and the shares come back with the drawdown study's base
 * rate (`src/options/conditions-quests.ts`). EVENTS (slice 4): a calendar event a house campaign
 * links to a symbol, whose written ledger carries a buy signal, offers the cash-secured put it
 * allows (`event-quests.ts`); it reads local files only and costs no market read.
 *
 * Privacy: a member's quests answer to that member alone — the target must be in the session's
 * owned set, or it does not exist for this caller (the alerts route's rule). The stake is read from
 * the account the server already holds, never from the request, and nothing about it is logged.
 *
 * Cost: an account holding no calls and under half cash costs no market read at all; a half-cash
 * account adds two daily-bar reads (SPY, QQQ) and the VIX file's 30-minute-shared read.
 * An account holding no calls costs no guidance read. Otherwise one guidance read per
 * underlying, through the member's own connected account, at most `MAX_SYMBOLS` of them (the
 * largest first), each shared with the Guidance tab through the 15-second coalesce.
 */

export const QUESTS_PATH = "/api/quests";

/** What the route reads beyond guidance's deps — injectable so specs run offline. */
export interface QuestsDeps extends GuidanceDeps {
  readonly vix?: ReadVix;
  /** The campaign-linked events with their ledgers, for a given UTC day. Defaults to the repo's own. */
  readonly eventStances?: (today: string) => readonly EventStance[];
}
/** A guidance read is ~30 broker calls; past this many names the rest are named, not read. */
const MAX_SYMBOLS = 6;
/** Calendar days of bars to ask for: 252 sessions plus weekends and holidays, with room. */
const INDEX_LOOKBACK_DAYS = 400;
/** A reading older than this many days is a feed that stopped, not a market that closed. */
const MAX_READING_AGE_DAYS = 5;

type QuestsAnswer =
  | { readonly kind: "missing" }
  | { readonly kind: "unlinked" }
  | {
      readonly kind: "ok";
      readonly asOf: Date;
      readonly quests: readonly Quest[];
      /** Underlyings whose positions were not judged this read: past the cap, or no market read. */
      readonly unread: readonly string[];
    };

/** The underlyings with a call on them, the most money first. */
function callUnderlyings(
  positions: readonly { readonly symbol: string; readonly marketValue: number }[],
): string[] {
  const money = new Map<string, number>();
  for (const p of positions) {
    const parts = parseOccSymbol(p.symbol);
    if (parts?.type !== "call") continue;
    money.set(parts.underlying, (money.get(parts.underlying) ?? 0) + Math.abs(p.marketValue));
  }
  return [...money].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([u]) => u);
}

interface SourceQuests {
  readonly quests: Quest[];
  readonly unread: string[];
}

/** One account's position quests. Pure apart from the broker reads it is handed. */
async function positionQuestsFor(
  id: string,
  desk: {
    readonly positions: readonly {
      symbol: string;
      marketValue: number;
      quantity: number;
      avgPrice: number;
    }[];
  },
  client: AlpacaOptionsClient,
  config: DashboardServerConfig,
  deps: GuidanceDeps | undefined,
  refresh: boolean,
): Promise<SourceQuests> {
  const underlyings = callUnderlyings(desk.positions);
  if (underlyings.length === 0) return { quests: [], unread: [] };
  const read = underlyings.slice(0, MAX_SYMBOLS);
  const calls = desk.positions.filter((p) => {
    const u = parseOccSymbol(p.symbol)?.underlying;
    return u !== undefined && read.includes(u);
  });
  const [quotes, markets] = await Promise.all([
    client.getContractSnapshots(calls.map((p) => p.symbol)).catch(() => new Map()),
    Promise.all(
      read.map((u) =>
        guidanceMarketFor(client, config, id, u, deps, refresh).catch(() => undefined),
      ),
    ),
  ]);
  const carried = config.exitPlans?.carried(id) ?? new Set<string>();
  const quests: Quest[] = [];
  const unread = underlyings.slice(MAX_SYMBOLS);
  read.forEach((symbol, i) => {
    const market = markets[i];
    if (!market || "reason" in market) {
      unread.push(symbol);
      return;
    }
    // One name the engine can't judge costs that name its quests, never the member the list.
    try {
      const stake = accountStake(desk.positions, symbol, quotes, carried);
      quests.push(...positionQuests(id, positionGuidance({ ...market, stake })));
    } catch {
      unread.push(symbol);
    }
  });
  return { quests, unread };
}

/**
 * The studied indexes' last completed close and the VIX close of the SAME session, or `undefined`
 * when either can't be had, the sessions disagree, or the feed is days stale — a conditions quest
 * never rests on a guessed or mismatched number. Completed sessions only: the read ends yesterday
 * (the daily-high feed's rule), so a partial session never stands in for a close; the cost is that
 * between the close and midnight UTC the VIX file runs a session ahead and this reads nothing.
 */
async function readConditions(
  client: AlpacaOptionsClient,
  asOf: Date,
  vix: ReadVix,
): Promise<ConditionsMarket | undefined> {
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const start = day(asOf.getTime() - INDEX_LOOKBACK_DAYS * DAY_MS);
  const end = day(asOf.getTime() - DAY_MS);
  const [latest, ...bars] = await Promise.all([
    vix().catch(() => undefined),
    ...STUDIED_INDEXES.map((symbol) =>
      client.getBars(symbol, start, end, 1000, "split").catch(() => undefined),
    ),
  ]);
  if (!latest) return undefined;
  const indexes = STUDIED_INDEXES.flatMap((symbol, i) => {
    const series = bars[i];
    const reading: DailyHighReading | undefined = series
      ? dailyHighReading(series.map((b) => ({ t: b.t, c: b.c })))
      : undefined;
    const fresh =
      reading !== undefined &&
      reading.session === latest.session &&
      asOf.getTime() - Date.parse(`${reading.session}T00:00:00Z`) <= MAX_READING_AGE_DAYS * DAY_MS;
    return reading && fresh ? [{ symbol, reading }] : [];
  });
  return indexes.length > 0 ? { session: latest.session, vix: latest.close, indexes } : undefined;
}

/** Market conditions move once a day: one read is shared for ten minutes, `refresh=1` bypasses it. */
const CONDITIONS_SHARE_MS = 10 * 60_000;
let sharedConditions: { at: number; read: Promise<ConditionsMarket | undefined> } | undefined;

/** One account's conditions quests — nothing, and no market read, unless it is half cash. */
async function conditionsQuestsFor(
  id: string,
  desk: { readonly cash: number; readonly equity: number },
  client: AlpacaOptionsClient,
  asOf: Date,
  vix: ReadVix,
  refresh: boolean,
): Promise<SourceQuests> {
  if (cashShare(desk) < CASH_SHARE_FLOOR) return { quests: [], unread: [] };
  const now = asOf.getTime();
  if (refresh || !sharedConditions || now - sharedConditions.at >= CONDITIONS_SHARE_MS) {
    sharedConditions = { at: now, read: readConditions(client, asOf, vix) };
  }
  const shared = sharedConditions;
  const market = await shared.read;
  if (!market) {
    // A failed read is not kept: the next request tries again.
    if (sharedConditions === shared) sharedConditions = undefined;
    return { quests: [], unread: ["conditions"] };
  }
  return { quests: conditionsQuests(id, market, desk), unread: [] };
}

/** One account's event quests — the ledgers are local files, so nothing here can go unread. */
function eventQuestsFor(
  id: string,
  desk: { readonly cash: number },
  asOf: Date,
  deps: QuestsDeps | undefined,
): Quest[] {
  if (!(desk.cash > 0)) return [];
  const today = asOf.toISOString().slice(0, 10);
  try {
    return eventQuests(id, (deps?.eventStances ?? readEventStances)(today), desk, today);
  } catch {
    // A ledger the reader cannot parse costs the member these quests, never the whole list.
    return [];
  }
}

/**
 * One account's quests from every source, ranked. `unread` names what was not judged this read: an
 * underlying past the cap or without a market read, or `conditions` when the index or VIX read failed.
 */
export async function questsFor(
  id: string,
  config: DashboardServerConfig,
  deps?: QuestsDeps,
  refresh = false,
): Promise<QuestsAnswer> {
  const desk = config.hub.getState().participants.find((p) => p.id === id);
  if (!desk) return { kind: "missing" };
  const client = config.optionsClientFor?.(id);
  if (!client) return { kind: "unlinked" };
  const asOf = config.now?.() ?? new Date();
  const [positions, conditions] = await Promise.all([
    positionQuestsFor(id, desk, client, config, deps, refresh),
    conditionsQuestsFor(id, desk, client, asOf, deps?.vix ?? readVix, refresh),
  ]);
  return {
    kind: "ok",
    asOf,
    quests: rankQuests([
      ...positions.quests,
      ...conditions.quests,
      ...eventQuestsFor(id, desk, asOf, deps),
    ]),
    unread: [...positions.unread, ...conditions.unread].sort(),
  };
}

/**
 * The account a quests read is for: `?participantId=` or the session's own, and only when the
 * session owns it — otherwise undefined, and the caller answers 404 (it does not exist for them).
 */
export function questsAccount(
  params: URLSearchParams,
  config: DashboardServerConfig,
  session: Session | undefined,
): string | undefined {
  const asked = params.get("participantId") ?? "";
  const id = asked || (config.auth ? (resolveCurrentId(session, config.resolveOwnerId) ?? "") : "");
  const owned = config.auth ? resolveOwnedIds(session, config) : [id];
  return id && owned.includes(id) ? id : undefined;
}

async function serveList(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
  deps?: QuestsDeps,
): Promise<void> {
  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const id = questsAccount(params, config, session);
  if (!id) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const answer = await questsFor(id, config, deps, params.get("refresh") === "1");
  if (answer.kind === "missing") {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  if (answer.kind === "unlinked") {
    sendJson(res, 200, { available: false, reason: "unlinked", quests: [] });
    return;
  }
  sendJson(res, 200, {
    available: true,
    asOf: answer.asOf.toISOString(),
    quests: answer.quests,
    unread: answer.unread,
  });
}

/** Handle `/api/quests`. Returns true when answered. */
export async function serveQuestsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  deps?: QuestsDeps,
): Promise<boolean> {
  if (path !== QUESTS_PATH) return false;
  if (requireGet(req, res)) await serveList(req, res, config, session, deps);
  return true;
}
