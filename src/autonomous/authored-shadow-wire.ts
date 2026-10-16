import { GUARD_REFUSAL_REASONS, type GuardRefusalReason } from "../engine/guards.js";
import {
  type AuthoredPlaysState,
  parseAuthoredPlaySpec,
  type ShadowOrder,
  shadowOrders,
} from "../playbooks/authored-play-draft.js";
import { isRecord } from "../storage/parse-guards.js";

/**
 * THE SHADOW-TEST WIRE (#5457 slice 2) — two small payloads between the app, which keeps the member's
 * drafts, and the bots, which hold the market and run the shadow passes.
 *
 *  - ORDERS, app → bots, folded into every `GET /controls` response as an additive
 *    `authoredShadow` field (the `subscriptions-wire.ts` shape: a pull, no new route or credential,
 *    no `fly*.toml` change). The set is whole every time, so a play the member took out of its
 *    test simply stops appearing and the bots drop its ledger. An app that predates the field
 *    omits it, and the bots read that as "not reported" and change nothing.
 *  - REPORT, bots → app, `POST /authored-shadow` over the same private bridge COND-SCOUT's snapshot
 *    uses (`cond-scout-wire.ts`): each play's status line and its newest would-be trades, sent whole
 *    on every poll so a dropped send is healed by the next. The app keeps only the latest, in
 *    memory.
 *
 * Neither payload carries a credential, an account's holdings or an order. Both fail closed, as the
 * other bridge wires do: every field is checked, counts and strings are bounded, numbers are
 * finite, and anything off parses to `undefined` (the listener answers 400; the bots keep what they
 * had) rather than to a partial set.
 */

export const SHADOW_ORDERS_KIND = "authored-shadow-orders.v1";
export const SHADOW_REPORT_KIND = "authored-shadow.v1";
export const MAX_SHADOW_PLAYS = 64;
/** How many would-be trades a row can show — "the last few", never a tape. */
export const RECENT_TRADES = 5;
const MAX_TEXT = 100;

export interface ShadowOrders {
  readonly kind: typeof SHADOW_ORDERS_KIND;
  /** Epoch ms the app read its store. */
  readonly at: number;
  readonly plays: readonly ShadowOrder[];
}

export function buildShadowOrders(state: AuthoredPlaysState, at: number): ShadowOrders {
  return { kind: SHADOW_ORDERS_KIND, at, plays: shadowOrders(state) };
}

const text = (v: unknown, max = MAX_TEXT): string | undefined =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function parseOrder(raw: unknown): ShadowOrder | undefined {
  if (!isRecord(raw)) return undefined;
  const id = text(raw.id);
  const since = text(raw.since);
  const spec = parseAuthoredPlaySpec(raw.spec);
  return id && since && spec ? { id, since, spec } : undefined;
}

/** Bots side: the orders in a poll body, or `undefined` for anything short of a clean, whole set. */
export function parseShadowOrders(value: unknown): ShadowOrders | undefined {
  if (!isRecord(value) || value.kind !== SHADOW_ORDERS_KIND) return undefined;
  const at = num(value.at);
  if (at === undefined || !Array.isArray(value.plays) || value.plays.length > MAX_SHADOW_PLAYS) {
    return undefined;
  }
  const plays: ShadowOrder[] = [];
  for (const raw of value.plays) {
    const order = parseOrder(raw);
    if (!order) return undefined;
    plays.push(order);
  }
  return { kind: SHADOW_ORDERS_KIND, at, plays };
}

/** What the play's window said on the latest pass — `unknown` before one has run. */
export type ShadowWindow = "long" | "flat" | "no-window" | "unknown";
const WINDOWS: readonly ShadowWindow[] = ["long", "flat", "no-window", "unknown"];

/**
 * `watching`: a pass has run against the author's own bot. `waiting`: that bot has no live book yet
 * (not trading, or just restarted). `invalid`: the play no longer clears the model's bounds in this
 * build, so it cannot run.
 */
export type ShadowState = "watching" | "waiting" | "invalid";
const STATES: readonly ShadowState[] = ["watching", "waiting", "invalid"];

/** One would-be fill, as a row shows it. */
export interface ShadowTradeView {
  readonly at: number;
  readonly side: "buy" | "sell";
  readonly symbol: string;
  readonly quantity: number;
  readonly price: number;
  readonly bid: number;
  readonly ask: number;
  readonly realized?: number;
}

/** The newest guard refusal, as the reason code the guards use — the app puts it in words. */
interface ShadowRefusalView {
  readonly day: string;
  readonly side: "buy" | "sell";
  readonly symbol: string;
  readonly reason: GuardRefusalReason;
}

export interface ShadowReportEntry {
  readonly id: string;
  readonly since: string;
  readonly state: ShadowState;
  readonly window: ShadowWindow;
  /** Session days a pass has run. */
  readonly sessions: number;
  /** Every would-be fill ever recorded, however many `recent` keeps. */
  readonly tradeCount: number;
  /** Would-be round trips closed (sells), and what they won or lost in dollars. */
  readonly roundTrips: number;
  readonly realized: number;
  /** Guard refusals, counted once per day and reason. */
  readonly refused: number;
  readonly lastRefusal?: ShadowRefusalView;
  readonly holding?: { readonly quantity: number; readonly avgPrice: number };
  readonly lastPassAt?: number;
  /** Newest first. */
  readonly recent: readonly ShadowTradeView[];
}

export interface ShadowReport {
  readonly kind: typeof SHADOW_REPORT_KIND;
  readonly at: number;
  readonly plays: readonly ShadowReportEntry[];
}

function parseTradeView(raw: unknown): ShadowTradeView | undefined {
  if (!isRecord(raw)) return undefined;
  const [at, quantity, price, bid, ask] = [
    num(raw.at),
    num(raw.quantity),
    num(raw.price),
    num(raw.bid),
    num(raw.ask),
  ];
  const symbol = text(raw.symbol, 20);
  const side = raw.side === "buy" || raw.side === "sell" ? raw.side : undefined;
  const realized = num(raw.realized);
  if (
    at === undefined ||
    quantity === undefined ||
    price === undefined ||
    bid === undefined ||
    ask === undefined ||
    !(symbol && side) ||
    (raw.realized !== undefined && realized === undefined)
  ) {
    return undefined;
  }
  return {
    at,
    side,
    symbol,
    quantity,
    price,
    bid,
    ask,
    ...(realized !== undefined ? { realized } : {}),
  };
}

function parseRefusal(raw: unknown): ShadowRefusalView | null | undefined {
  if (raw === undefined) return null;
  if (!isRecord(raw)) return undefined;
  const day = text(raw.day, 10);
  const symbol = text(raw.symbol, 20);
  const side = raw.side === "buy" || raw.side === "sell" ? raw.side : undefined;
  const reason = GUARD_REFUSAL_REASONS.find((r) => r === raw.reason);
  return day && symbol && side && reason ? { day, side, symbol, reason } : undefined;
}

function parseHolding(raw: unknown): ShadowReportEntry["holding"] | null | undefined {
  if (raw === undefined) return null;
  if (!isRecord(raw)) return undefined;
  const [quantity, avgPrice] = [num(raw.quantity), num(raw.avgPrice)];
  return quantity === undefined || avgPrice === undefined ? undefined : { quantity, avgPrice };
}

function parseEntry(raw: unknown): ShadowReportEntry | undefined {
  if (!isRecord(raw)) return undefined;
  const id = text(raw.id);
  const since = text(raw.since);
  const state = STATES.find((s) => s === raw.state);
  const window = WINDOWS.find((w) => w === raw.window);
  const counts = [
    num(raw.sessions),
    num(raw.tradeCount),
    num(raw.roundTrips),
    num(raw.realized),
    num(raw.refused),
  ] as const;
  const holding = parseHolding(raw.holding);
  const lastRefusal = parseRefusal(raw.lastRefusal);
  if (!(id && since && state && window) || holding === undefined || lastRefusal === undefined) {
    return undefined;
  }
  if (counts.some((n) => n === undefined)) return undefined;
  if (!Array.isArray(raw.recent) || raw.recent.length > RECENT_TRADES) return undefined;
  const recent: ShadowTradeView[] = [];
  for (const item of raw.recent) {
    const trade = parseTradeView(item);
    if (!trade) return undefined;
    recent.push(trade);
  }
  const lastPassAt = num(raw.lastPassAt);
  const [sessions, tradeCount, roundTrips, realized, refused] = counts as readonly number[] as [
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    id,
    since,
    state,
    window,
    sessions,
    tradeCount,
    roundTrips,
    realized,
    refused,
    ...(lastRefusal ? { lastRefusal } : {}),
    ...(holding ? { holding } : {}),
    ...(lastPassAt !== undefined ? { lastPassAt } : {}),
    recent,
  };
}

/** App side: the bots' report, or `undefined` for anything short of a clean one. */
export function parseShadowReport(value: unknown): ShadowReport | undefined {
  if (!isRecord(value) || value.kind !== SHADOW_REPORT_KIND) return undefined;
  const at = num(value.at);
  if (at === undefined || !Array.isArray(value.plays) || value.plays.length > MAX_SHADOW_PLAYS) {
    return undefined;
  }
  const plays: ShadowReportEntry[] = [];
  for (const raw of value.plays) {
    const entry = parseEntry(raw);
    if (!entry) return undefined;
    plays.push(entry);
  }
  return { kind: SHADOW_REPORT_KIND, at, plays };
}
