import { type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import type { MarketContext, PlaybookMode, Portfolio, Quote } from "../domain/types.js";
import {
  applyGuardsWithVerdicts,
  GUARD_REFUSAL_REASONS,
  type RiskConfig,
} from "../engine/guards.js";
import { authoredRoster } from "../playbooks/authored-play.js";
import { parseAuthoredPlaySpec, type ShadowOrder } from "../playbooks/authored-play-draft.js";
import {
  isSameTest,
  noteSession,
  recordFill,
  recordRefusal,
  type ShadowRun,
  type ShadowTrade,
  startRun,
} from "../playbooks/authored-shadow.js";
import {
  isExitIntent,
  type PlaybookEvent,
  playbookIntents,
  playbookVerdicts,
} from "../playbooks/playbook.js";
import { isRecord } from "../storage/parse-guards.js";
import {
  RECENT_TRADES,
  SHADOW_REPORT_KIND,
  type ShadowReport,
  type ShadowReportEntry,
  type ShadowState,
  type ShadowWindow,
} from "./authored-shadow-wire.js";
import { markedEquity } from "./equity-watch.js";

/**
 * THE SHADOW TEST'S PER-PASS ORCHESTRATION (#5457 slice 2) — the stateful half, on the same pattern
 * as `cond-scout-runner.ts`: dependency-injected, with the durable store and every sink passed in.
 *
 * NOTHING HERE CAN REACH A BROKER. The runner holds no `BrokerPort`, imports no trader, no live cycle
 * and no adapter, and returns nothing the trader could read — a pass answers `void`. The member's
 * bot never sees the play: it is not on any roster (`runnableSpecs` hands out nothing), so the real
 * persona's decisions are byte-for-byte what they would be without it.
 *
 * "EXACTLY AS IF IT RAN". Each pass the play is compiled by the same `authoredRoster` and decided by
 * the same `playbookIntents` a subscribed play would face — the ownership rule, the sizing, the
 * flatten-on-close — then judged by the same `applyGuardsWithVerdicts` a real order faces, against a
 * book that is the author's own account's equity less what the test holds. (An order object exists
 * here only as the guards' input and the sizing step's output, exactly as COND-SCOUT builds one per
 * probe; it is turned into a ledger entry on the next line and goes nowhere else.) The market is the
 * pass's own `MarketContext`; the sizing base is the author's account equity as the last cycle read
 * it. `subscribedOnly` is off — nothing is subscribed, which is the point — so the guards that
 * judge a test are the ones that would judge the play once promoted, minus that one.
 *
 * Fills follow COND-SCOUT's rule (ask in, bid out, whole quote kept): `authored-shadow.ts`.
 */

/** A test runs the play at the middle of its three sizes; promotion lets the member pick (slice 3). */
export const SHADOW_MODE: PlaybookMode = "standard";

export interface AuthoredShadowStore {
  loadAll(): readonly ShadowRun[];
  save(run: ShadowRun): void;
  remove(id: string): void;
}

export interface AuthoredShadowDeps {
  /** The live risk config (position cap, S2/E1 discipline) — the same the bots' guards read. */
  readonly risk: RiskConfig;
  /** The kill switch / breakers. Halted = no new would-be buys; a would-be sell still records. */
  readonly blockedReason: () => string | null;
  /** The author's account as the last cycle read it; undefined = no live book for that bot yet. */
  readonly portfolioOf: (accountId: string) => Portfolio | undefined;
  readonly store?: AuthoredShadowStore;
  readonly calendar?: readonly EarningsPrint[];
  /** Outside events for an event-window play. The live roster passes none today
   *  (`tradingRoster`), so neither does a test — it is exactly as quiet as the play would be. */
  readonly events?: readonly PlaybookEvent[];
  readonly now?: () => number;
  readonly onFill?: (run: ShadowRun, trade: ShadowTrade) => void;
}

/** What a pass learned that is not worth persisting: it is re-derived on the next one. */
interface Seen {
  state: ShadowState;
  window: ShadowWindow;
  lastPassAt?: number;
}

const WINDOWS: readonly ShadowWindow[] = ["long", "flat", "no-window"];
const quoteOf = (q: Quote) => ({ bid: q.bid, ask: q.ask, last: q.last, asOf: q.asOf });

export class AuthoredShadowRunner {
  private readonly deps: AuthoredShadowDeps;
  private runs = new Map<string, ShadowRun>();
  private readonly seen = new Map<string, Seen>();

  constructor(deps: AuthoredShadowDeps) {
    this.deps = deps;
    for (const run of deps.store?.loadAll() ?? []) this.runs.set(run.id, run);
  }

  /**
   * Reconcile with the orders the app sent: a play that is no longer in its test is dropped with
   * its ledger; one whose test began again (or whose spec was edited) starts over; the rest carry on.
   */
  setOrders(orders: readonly ShadowOrder[]): void {
    const wanted = new Set(orders.map((o) => o.id));
    for (const id of [...this.runs.keys()]) {
      if (wanted.has(id)) continue;
      this.runs.delete(id);
      this.seen.delete(id);
      this.deps.store?.remove(id);
    }
    for (const order of orders) {
      const run = this.runs.get(order.id);
      if (run && isSameTest(run, order)) continue;
      const fresh = startRun(order);
      this.runs.set(order.id, fresh);
      this.seen.delete(order.id);
      this.deps.store?.save(fresh);
    }
  }

  /** The tickers the tests decide on — the price stream must carry them (`bots-stream.ts`). */
  symbols(): readonly string[] {
    return [...this.runs.values()].flatMap((run) => run.spec.symbols);
  }

  /** Plays currently in their test — read-only, for health lines and specs. */
  runIds(): readonly string[] {
    return [...this.runs.keys()];
  }

  run(id: string): ShadowRun | undefined {
    return this.runs.get(id);
  }

  /** One decision pass. Synchronous and void on purpose: there is nothing for a caller to act on. */
  runPass(context: MarketContext): void {
    for (const [id, run] of [...this.runs]) {
      const next = this.passOne(run, context);
      if (next === run) continue;
      this.runs.set(id, next);
      this.deps.store?.save(next);
    }
  }

  private passOne(run: ShadowRun, context: MarketContext): ShadowRun {
    const accountId = run.spec.authorAccountId;
    const seen: Seen = this.seen.get(run.id) ?? { state: "waiting", window: "unknown" };
    this.seen.set(run.id, seen);
    const play = authoredRoster([run.spec], accountId).plays[0];
    if (!play) {
      seen.state = "invalid";
      return run;
    }
    const portfolio = this.deps.portfolioOf(accountId);
    if (!portfolio) {
      seen.state = "waiting";
      return run;
    }
    seen.state = "watching";
    const at = (this.deps.now ?? Date.now)();
    seen.lastPassAt = at;
    const day = context.asOf.slice(0, 10);
    let next = noteSession(run, day);
    const book = shadowBook(next, markedEquity(portfolio, context));
    const enabled = [{ playbook: play, mode: SHADOW_MODE }];
    const calendar = this.deps.calendar ?? UPCOMING_PRINTS;
    const events = this.deps.events ?? [];
    const verdict = playbookVerdicts(enabled, context.asOf, calendar, events)[0]?.state;
    seen.window = WINDOWS.find((w) => w === verdict) ?? "unknown";
    const wanted = playbookIntents(enabled, context, book, calendar, events);
    const intents = this.deps.blockedReason() ? wanted.filter(isExitIntent) : wanted;
    const judged = applyGuardsWithVerdicts(intents, book, context, this.deps.risk);
    for (const { intent, reason } of judged.refused) {
      next = recordRefusal(next, { day, symbol: intent.symbol, side: intent.side, reason });
    }
    for (const intent of judged.approved) {
      const quote = context.quotes[intent.symbol];
      if (!quote) continue;
      const before = next;
      next = recordFill(next, {
        side: intent.side,
        symbol: intent.symbol,
        quantity: intent.quantity,
        quote: quoteOf(quote),
        at,
      });
      const trade = next === before ? undefined : next.trades.at(-1);
      if (trade) this.deps.onFill?.(next, trade);
    }
    return next;
  }

  /** Every play's status line and newest would-be trades, as the app draws them. */
  report(at: number): ShadowReport {
    const plays = [...this.runs.values()].map((run): ShadowReportEntry => {
      const seen = this.seen.get(run.id);
      const last = run.refusals.at(-1);
      const refusalReason = GUARD_REFUSAL_REASONS.find((r) => r === last?.reason);
      return {
        id: run.id,
        since: run.since,
        state: seen?.state ?? "waiting",
        window: seen?.window ?? "unknown",
        sessions: run.sessions.length,
        tradeCount: run.tradeCount,
        roundTrips: run.roundTrips,
        realized: run.realized,
        refused: run.refusals.length,
        ...(last && refusalReason
          ? {
              lastRefusal: {
                day: last.day,
                side: last.side,
                symbol: last.symbol,
                reason: refusalReason,
              },
            }
          : {}),
        ...(run.holding
          ? { holding: { quantity: run.holding.quantity, avgPrice: run.holding.avgPrice } }
          : {}),
        ...(seen?.lastPassAt !== undefined ? { lastPassAt: seen.lastPassAt } : {}),
        recent: run.trades
          .slice(-RECENT_TRADES)
          .reverse()
          .map((t) => ({
            at: t.at,
            side: t.side,
            symbol: t.symbol,
            quantity: t.quantity,
            price: t.price,
            bid: t.quote.bid,
            ask: t.quote.ask,
            ...(t.realized !== undefined ? { realized: t.realized } : {}),
          })),
      };
    });
    return { kind: SHADOW_REPORT_KIND, at, plays };
  }
}

/** The book the guards judge a test against: the author's equity, less what the test holds. */
function shadowBook(run: ShadowRun, equity: number): Portfolio {
  const held = run.holding;
  return {
    cash: equity - (held ? held.quantity * held.avgPrice : 0),
    positions: held
      ? [{ symbol: run.spec.symbols[0] ?? "", quantity: held.quantity, avgPrice: held.avgPrice }]
      : [],
  };
}

/** A stored run read back, or undefined for anything this build cannot trust. Total, never throws. */
export function reviveRun(raw: unknown): ShadowRun | undefined {
  if (!isRecord(raw)) return undefined;
  const spec = parseAuthoredPlaySpec(raw.spec);
  if (!(spec && typeof raw.id === "string" && typeof raw.since === "string")) return undefined;
  const base = startRun({ id: raw.id, since: raw.since, spec });
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const count = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  const holding = isRecord(raw.holding) ? raw.holding : undefined;
  return {
    ...base,
    sessions: list(raw.sessions).filter((d): d is string => typeof d === "string"),
    trades: list(raw.trades).filter(isRecord) as unknown as ShadowTrade[],
    tradeCount: count(raw.tradeCount, 0),
    realized: count(raw.realized, 0),
    roundTrips: count(raw.roundTrips, 0),
    refusals: list(raw.refusals).filter(isRecord) as unknown as ShadowRun["refusals"],
    ...(holding &&
    typeof holding.quantity === "number" &&
    typeof holding.avgPrice === "number" &&
    typeof holding.openedAt === "number"
      ? {
          holding: {
            quantity: holding.quantity,
            avgPrice: holding.avgPrice,
            openedAt: holding.openedAt,
          },
        }
      : {}),
  };
}
