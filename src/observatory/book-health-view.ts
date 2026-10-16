import type { CheckWeekRows } from "../autonomous/decision-db-week.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { marketDayKey } from "../domain/market-day.js";
import { bookNeeds, type CoverNeeds, freeCash, opensRisk } from "../domain/option-book.js";
import { computeEquity, positionValue } from "../domain/portfolio.js";
import type {
  OrderIntent,
  PlaybookMode,
  PlaybookSubscription,
  Portfolio,
  Position,
  Quote,
} from "../domain/types.js";
import { committedToPlaybook, openLedger } from "../engine/guard-batch.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import { registeredPlaybooks } from "../playbooks/registry.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { OpenLot } from "../trading/round-trips.js";
import {
  detectConcentrated,
  detectIdle,
  detectImbalanced,
  detectStuck,
  openedOn,
  positionsOf,
  sessionsHeld,
} from "./book-health-detectors.js";
import { detectLooping } from "./book-health-looping.js";

/**
 * BOOK HEALTH (#5493 slice 1) — the portfolio read as one system: where it is out of balance,
 * stuck, or looping, with the playbook behind each finding as the detail. Eric, 2026-10-16: "look
 * at a portfolio view as a wholistic system with the ability to detect problem areas, imbalances,
 * stuck or ever green process". The book is the page (docs/IA.md §5.1); a finding is a
 * needs-a-decision entity keyed on account × playbook, and opens the bot's loop (§5.2).
 *
 * DATA BEFORE PIXELS. This slice is the metrics and the five detectors as data — no UI. The same
 * readings will feed #5483's signal and gate thresholds, so one reading feeds both; a finding never
 * trades by itself.
 *
 * PURE: no I/O and no clock — `asOf` is passed in. Committed capital and collateral are never
 * re-derived here: a play's committed dollars are the guards' own `committedToPlaybook`, and cash
 * set aside for sold puts is `option-book.ts`'s `bookNeeds`, so the health view and the sizing
 * guard can never disagree about what a play has on.
 *
 * WHAT IS NOT DERIVABLE IS SAID SO. An age, an allocation or a committed figure the inputs cannot
 * support is `undefined`, never 0: "held 0 sessions" and "no open date on hand" are different
 * claims, and only one of them is ever true.
 *
 * WHO SEES WHAT (#885: "we do not show what playbooks others are using"). `ownerView: false`
 * drops the per-play rows and every finding's `playbookId`, and words each finding without naming
 * a playbook or its strategy. The desk route goes further and gives a non-owner the counts only.
 */

/** Every line the detectors judge against, in one place. Shares are fractions (0.6 = 60%). */
export interface BookHealthThresholds {
  /** LOOPING: cycles a play must have proposed in its last session, all refused for one reason. */
  readonly loopingCycles: number;
  /** LOOPING: sessions a play must have read "no window", or "open" with no entry, on every check. */
  readonly loopingSessions: number;
  /** IDLE: uncommitted cash above this share of equity. Signal only. */
  readonly idleCashShare: number;
  /** CONCENTRATED: one underlying above this share of equity is a signal… */
  readonly concentratedSignal: number;
  /** …and above this one, a gate. */
  readonly concentratedGate: number;
  /** STUCK: an intraday play's position on this many sessions held is a signal… */
  readonly stuckSignalSessions: number;
  /** …and on this many, a gate. A play-supplied expected hold keeps the same gap past its hold. */
  readonly stuckGateSessions: number;
  /** IMBALANCED: an enabled play's committed share of its allocation above this… */
  readonly imbalancedHigh: number;
  /** …or below this. A placeholder until #5483 gives each play a target and a band. */
  readonly imbalancedLow: number;
}

export const BOOK_HEALTH_THRESHOLDS: BookHealthThresholds = {
  loopingCycles: 6,
  loopingSessions: 5,
  idleCashShare: 0.6,
  concentratedSignal: 0.25,
  concentratedGate: 0.4,
  stuckSignalSessions: 3,
  stuckGateSessions: 5,
  imbalancedHigh: 0.9,
  imbalancedLow: 0.1,
};

export type HealthDetector = "looping" | "idle" | "concentrated" | "stuck" | "imbalanced";
export type HealthLevel = "signal" | "gate";
/** What a looping play keeps hitting: one guard's refusal, an open window it never enters, or a
 *  window that never opens. */
export type LoopKind = GuardRefusalReason | "open-no-entry" | "no-window";

export interface HealthFinding {
  readonly detector: HealthDetector;
  readonly level: HealthLevel;
  /** The play behind it — the owner's copy only. */
  readonly playbookId?: string;
  /** The position or underlying it is about, when it is about one. */
  readonly symbol?: string;
  /** The measured number, in the threshold's unit: a share of equity or allocation (0–1), a
   *  count of cycles, or a count of sessions. */
  readonly reading: number;
  /** The line the reading crossed to reach this level. */
  readonly threshold: number;
  /** LOOPING only: what it keeps hitting. */
  readonly loop?: LoopKind;
  /** One plain sentence a member reads. */
  readonly words: string;
}

/** What a play declares about how long it means to hold. No house playbook declares either yet
 *  (the intraday swing play is #5489); a play with neither produces no STUCK finding at all. */
export interface PlayHold {
  readonly intraday?: boolean;
  readonly expectedHoldSessions?: number;
}

/** One subscription's numbers. */
export interface PlayHealth {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly enabled: boolean;
  /** The budget the owner set; undefined = uncapped. */
  readonly allocation?: number;
  /** Dollars on the book against it (`committedToPlaybook`); undefined when its basket is unknown
   *  (a Store play this process has no definition for). */
  readonly committed?: number;
  /** Allocation not committed, floored at 0; undefined when either side is. */
  readonly idle?: number;
  readonly openPositions: number;
  /** Sessions the oldest open position has been held. Undefined when nothing is open or when any
   *  open position's opening fills are not on hand — an unknown lot could be the oldest. */
  readonly oldestOpenSessions?: number;
  /** The newest entry on hand: a placed opening order in the passes read, or the opening fill of
   *  a lot it still holds. Undefined when neither shows one — never a claim it never entered. */
  readonly lastEntryAt?: string;
  /** Its intents the guards refused in the last session on hand, by reason. */
  readonly refusalsLastSession: Partial<Record<GuardRefusalReason, number>>;
}

export interface HealthCounts {
  readonly signal: number;
  readonly gate: number;
  readonly byDetector: Partial<Record<HealthDetector, number>>;
}

export interface BookHealthInput {
  readonly asOf: string;
  readonly portfolio: Portfolio;
  readonly subscriptions: readonly PlaybookSubscription[];
  /** Decision passes, newest first (`DecisionDb.listByPersona`). Absent for a human account. */
  readonly records?: readonly DecisionRecord[];
  /** The week of grouped verdicts and placed trades (`readCheckWeek`) — the multi-session horizon
   *  the LOOPING verdict reads need, which a page of passes (minutes) cannot reach. */
  readonly week?: { readonly rows: CheckWeekRows; readonly bucketMs: number };
  /** The fill ledger's open lots — the only source of an open date. */
  readonly openLots?: readonly OpenLot[];
  /** Live quotes; a holding without one is marked by the broker's own value, then cost. */
  readonly quotes?: Readonly<Record<string, Quote>>;
  /** Each playbook's tickers. Defaults to the house registry's. */
  readonly baskets?: ReadonlyMap<string, readonly string[]>;
  readonly holds?: ReadonlyMap<string, PlayHold>;
  readonly ownerView: boolean;
  readonly thresholds?: Partial<BookHealthThresholds>;
}

export interface BookHealthView {
  readonly asOf: string;
  readonly equity: number;
  /** Cash not set aside to secure a sold put (`freeCash`). */
  readonly uncommittedCash: number;
  /** `uncommittedCash / equity`; null when equity is not positive. */
  readonly idleShare: number | null;
  /** The market day of the newest pass on hand — what "last session" means here. */
  readonly lastSession?: string;
  readonly passesOnHand: number;
  /** Per subscription — the owner's copy only. */
  readonly plays?: readonly PlayHealth[];
  /** Gate before signal. */
  readonly findings: readonly HealthFinding[];
  readonly counts: HealthCounts;
}

/** What every detector reads: the book once, valued once. */
export interface BookReading {
  readonly portfolio: Portfolio;
  readonly book: CoverNeeds;
  readonly equity: number;
  readonly uncommittedCash: number;
  readonly quotes: Readonly<Record<string, Quote>>;
  readonly asOf: string;
  readonly thresholds: BookHealthThresholds;
  readonly ownerView: boolean;
}

/** One mark per held share symbol, as the quote shape `committedToPlaybook` reads its ask from:
 *  the live last, else the broker's value, else cost (`positionValue`'s own order). */
function shareMarks(portfolio: Portfolio, input: BookHealthInput): Record<string, Quote> {
  const marks: Record<string, Quote> = {};
  for (const position of portfolio.positions) {
    if (position.quantity === 0 || parseOccSymbol(position.symbol)) continue;
    const mark = positionValue(position, input.quotes?.[position.symbol]?.last) / position.quantity;
    const { symbol } = position;
    marks[symbol] = { symbol, bid: mark, ask: mark, last: mark, asOf: input.asOf };
  }
  return marks;
}

function refusalsIn(
  records: readonly DecisionRecord[],
  playbookId: string,
): Partial<Record<GuardRefusalReason, number>> {
  const counts: Partial<Record<GuardRefusalReason, number>> = {};
  for (const record of records) {
    for (const refusal of record.refusals ?? []) {
      if (refusal.intent.playbookId !== playbookId) continue;
      counts[refusal.reason] = (counts[refusal.reason] ?? 0) + 1;
    }
  }
  return counts;
}

function lastEntry(
  playbookId: string,
  records: readonly DecisionRecord[],
  lots: readonly OpenLot[] | undefined,
): string | undefined {
  const placed = records.find((r) =>
    r.outcomes.some(
      (o) => o.action === "placed" && o.intent.playbookId === playbookId && opensRisk(o.intent),
    ),
  );
  const times = (lots ?? []).filter((lot) => lot.playbookId === playbookId).map((lot) => lot.at);
  if (placed) times.push(new Date(placed.at).toISOString());
  return times.sort().at(-1);
}

function playHealth(
  sub: PlaybookSubscription,
  input: BookHealthInput,
  reading: BookReading,
  context: {
    readonly baskets: ReadonlyMap<string, readonly string[]>;
    readonly session: readonly DecisionRecord[];
    readonly marks: Record<string, Quote>;
    readonly ageOf: (position: Position) => number | undefined;
  },
): PlayHealth {
  const basket = context.baskets.get(sub.playbookId);
  const intent: OrderIntent = {
    symbol: basket?.[0] ?? "",
    side: "buy",
    quantity: 0,
    type: "market",
    reason: "book health reading",
    playbookId: sub.playbookId,
  };
  const committed = basket
    ? committedToPlaybook(
        intent,
        reading.portfolio,
        { asOf: input.asOf, quotes: context.marks },
        context.baskets,
        { ledger: openLedger([], reading.book, reading.portfolio), book: reading.book },
      )
    : undefined;
  const allocation = sub.capitalAllocated;
  const open = positionsOf(sub.playbookId, basket ?? [], reading.portfolio, input.openLots);
  const ages = open.map(context.ageOf);
  const known = ages.length > 0 && ages.every((age) => age !== undefined);
  const entry = lastEntry(sub.playbookId, input.records ?? [], input.openLots);
  return {
    playbookId: sub.playbookId,
    mode: sub.mode,
    enabled: sub.enabled,
    ...(allocation !== undefined ? { allocation } : {}),
    ...(committed !== undefined ? { committed } : {}),
    ...(allocation !== undefined && committed !== undefined
      ? { idle: Math.max(0, allocation - committed) }
      : {}),
    openPositions: open.length,
    ...(known ? { oldestOpenSessions: Math.max(...(ages as number[])) } : {}),
    ...(entry ? { lastEntryAt: entry } : {}),
    refusalsLastSession: refusalsIn(context.session, sub.playbookId),
  };
}

/** The finding counts by level and detector — all a non-owner is served. */
export function bookHealthCounts(findings: readonly HealthFinding[]): HealthCounts {
  const byDetector: Partial<Record<HealthDetector, number>> = {};
  for (const f of findings) byDetector[f.detector] = (byDetector[f.detector] ?? 0) + 1;
  return {
    signal: findings.filter((f) => f.level === "signal").length,
    gate: findings.filter((f) => f.level === "gate").length,
    byDetector,
  };
}

function houseBaskets(): ReadonlyMap<string, readonly string[]> {
  return new Map(registeredPlaybooks().map((playbook) => [playbook.id, playbook.symbols]));
}

export function bookHealthView(input: BookHealthInput): BookHealthView {
  const { portfolio, asOf, ownerView } = input;
  const thresholds = { ...BOOK_HEALTH_THRESHOLDS, ...input.thresholds };
  const book = bookNeeds(portfolio);
  const quotes = input.quotes ?? {};
  const equity = computeEquity(portfolio, quotes);
  const uncommittedCash = freeCash(portfolio, book);
  const reading: BookReading = {
    portfolio,
    book,
    equity,
    uncommittedCash,
    quotes,
    asOf,
    thresholds,
    ownerView,
  };
  const records = input.records ?? [];
  const newest = records[0];
  const lastSession = newest ? marketDayKey(new Date(newest.at).toISOString()) : undefined;
  const session = records.filter((r) => marketDayKey(new Date(r.at).toISOString()) === lastSession);
  const baskets = input.baskets ?? houseBaskets();
  const ageOf = (position: Position): number | undefined => {
    const at = openedOn(position, input.openLots);
    return at === undefined ? undefined : sessionsHeld(at, asOf);
  };
  const marks = shareMarks(portfolio, input);
  const plays = input.subscriptions.map((sub) =>
    playHealth(sub, input, reading, { baskets, session, marks, ageOf }),
  );
  const positionsFor = (id: string): Position[] =>
    positionsOf(id, baskets.get(id) ?? [], portfolio, input.openLots);
  const { week, subscriptions } = input;
  const findings = [
    ...detectLooping({ session, records, week, subscriptions }, reading),
    ...detectIdle(reading),
    ...detectConcentrated(reading),
    ...detectStuck(plays, input.holds, positionsFor, ageOf, reading),
    ...detectImbalanced(plays, records, reading),
  ];
  const ordered = [
    ...findings.filter((f) => f.level === "gate"),
    ...findings.filter((f) => f.level === "signal"),
  ].map((f) => (ownerView ? f : withoutPlaybook(f)));
  return {
    asOf,
    equity,
    uncommittedCash,
    idleShare: equity > 0 ? uncommittedCash / equity : null,
    ...(lastSession ? { lastSession } : {}),
    passesOnHand: records.length,
    ...(ownerView ? { plays } : {}),
    findings: ordered,
    counts: bookHealthCounts(ordered),
  };
}

function withoutPlaybook(finding: HealthFinding): HealthFinding {
  const { playbookId: _withheld, ...rest } = finding;
  return rest;
}
