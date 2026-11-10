import type { QuestBaseRate, QuestMoveKind, QuestSource } from "./quest.js";

/**
 * A TAKEN QUEST, SCORED (#7028 slice 6). A quest is offered with a base rate (`quest.ts`); once a
 * member fires its move, the order's broker id is recorded beside the rate the quest carried at
 * that moment (`src/server/taken-quest-store.ts`). This module joins those records onto the
 * account's own round trips and says, per quest and per quest type, what happened against that
 * rate. The in-game feedback loop (#7029, AC 4: "outcome against base rate") reads the per-type
 * rows; nothing here ranks or reranks anything.
 *
 * Honesty, by shape (CLAUDE.md: "Never let a flourish imply something false about markets or P/L"):
 *  - A quest's outcome is the member's OWN closed trades for that order, never a model of them. An
 *    order with no fill on the ledger is `unseen`, not a loss; a position still open is `open`.
 *  - A rate is compared only once enough taken quests of a type have closed (`MIN_CLOSED`); before
 *    that the row says "too few", and an untested quest never counts toward a comparison at all.
 *  - The comparison is a band, not a point: actual paid against the count the carried rates
 *    expect, ± two standard deviations of that count. Inside the band is "in line".
 *  - A measured rate (`quest.ts`) came from a study holding a fixed time; a member closes when they
 *    close. `HOLD_NOTE` says so on every row that compares against one.
 *
 * PURE: no I/O, no clock. The ledger is duck-typed (the fields of `RoundTripLedger` it reads), so
 * the domain layer does not import the trading layer's matcher.
 */

/** One quest a member fired, as recorded when the order was accepted. */
export interface TakenQuest {
  readonly questId: string;
  readonly source: QuestSource;
  readonly moveKind: QuestMoveKind;
  readonly symbol: string;
  /** The contract the move acted on, for a move on an option already held. */
  readonly occ?: string;
  /** The broker's id for the order the quest drafted — the join key onto the ledger. */
  readonly orderId: string;
  /** ISO-8601, when the order was accepted. */
  readonly takenAt: string;
  /** The rate the quest carried when it was fired, never re-read later. */
  readonly baseRate: QuestBaseRate;
}

/** A move that opens a position: it resolves when the trades it opened close. The rest close one. */
const OPENS: ReadonlySet<QuestMoveKind> = new Set([
  "buy-shares",
  "sell-cash-secured-put",
  "buy-call",
  "sell-covered-call",
]);

/** The fields of a round-trip ledger this join reads (`src/trading/round-trips.ts`). */
export interface ScoredLedger {
  readonly trips: readonly {
    readonly orderId?: string;
    readonly entryOrderId?: string;
    readonly realized: number;
    readonly entryPrice: number;
    readonly quantity: number;
  }[];
  readonly open: readonly { readonly entryOrderId?: string }[];
}

export interface QuestScore {
  readonly taken: TakenQuest;
  /**
   * `closed`: every trade the order opened has closed (or, for a closing move, the close filled).
   * `open`: what the order opened is still held, wholly or in part. `unseen`: no fill for the order
   * is on the ledger yet — unfilled, cancelled, or older than the ledger's window.
   */
  readonly state: "closed" | "open" | "unseen";
  /** Realized dollars on the trades this order opened or closed, summed. Absent when unseen. */
  readonly realized?: number;
  /** Realized as a percent of the cost basis of those trades. */
  readonly returnPct?: number;
  /** True when a closed quest made money. Only a closed quest is judged. */
  readonly paid?: boolean;
}

/** Score one taken quest against the account's own round trips. */
export function scoreTakenQuest(taken: TakenQuest, ledger: ScoredLedger): QuestScore {
  const opens = OPENS.has(taken.moveKind);
  const trips = ledger.trips.filter((t) =>
    opens ? t.entryOrderId === taken.orderId : t.orderId === taken.orderId,
  );
  const stillOpen = opens && ledger.open.some((lot) => lot.entryOrderId === taken.orderId);
  if (trips.length === 0) return { taken, state: stillOpen ? "open" : "unseen" };
  const realized = trips.reduce((sum, t) => sum + t.realized, 0);
  const basis = trips.reduce((sum, t) => sum + t.entryPrice * t.quantity, 0);
  const returnPct = basis > 0 ? (realized / basis) * 100 : 0;
  if (stillOpen) return { taken, state: "open", realized, returnPct };
  return { taken, state: "closed", realized, returnPct, paid: realized > 0 };
}

/** Score every taken quest, newest first. */
export function scoreTakenQuests(taken: readonly TakenQuest[], ledger: ScoredLedger): QuestScore[] {
  return [...taken]
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt) || a.questId.localeCompare(b.questId))
    .map((t) => scoreTakenQuest(t, ledger));
}

/** Closed quests with a rate a type needs before its row compares against that rate. */
export const MIN_CLOSED = 10;

/** Said on every row compared against a measured rate: the study's hold is not the member's. */
export const HOLD_NOTE =
  "The study held each move for a fixed time; members close when they choose, so this compares like with nearly like, not like with like.";

export interface QuestTypeScore {
  readonly source: QuestSource;
  readonly moveKind: QuestMoveKind;
  readonly taken: number;
  readonly open: number;
  readonly closed: number;
  readonly unseen: number;
  readonly paid: number;
  /** Closed quests of this type that carried a tested or measured rate — the compared sample. */
  readonly rated: number;
  /** Of `rated`, how many paid, and how many the carried rates expected to (Σ rate). */
  readonly ratedPaid: number;
  readonly expectedPaid: number;
  /**
   * `untested`: no closed quest of this type carried a rate. `too-few`: fewer than `MIN_CLOSED`
   * did. Otherwise `above`, `below` or `in-line`: paid against expected, ± two standard deviations.
   */
  readonly verdict: "untested" | "too-few" | "above" | "below" | "in-line";
  /** `HOLD_NOTE` when any compared quest carried a measured rate. */
  readonly note?: string;
}

/** Per quest type (source × move): what was taken, what closed, and how that compares. */
export function questScoreboard(scores: readonly QuestScore[]): QuestTypeScore[] {
  const groups = new Map<string, { first: QuestScore; all: QuestScore[] }>();
  for (const s of scores) {
    const key = `${s.taken.source}:${s.taken.moveKind}`;
    const group = groups.get(key);
    if (group) group.all.push(s);
    else groups.set(key, { first: s, all: [s] });
  }
  return [...groups.values()]
    .map(({ first, all }) => typeScore(first.taken, all))
    .sort(
      (a, b) =>
        b.taken - a.taken ||
        a.source.localeCompare(b.source) ||
        a.moveKind.localeCompare(b.moveKind),
    );
}

function typeScore({ source, moveKind }: TakenQuest, group: readonly QuestScore[]): QuestTypeScore {
  const count = (state: QuestScore["state"]) => group.filter((s) => s.state === state).length;
  const closed = group.filter((s) => s.state === "closed");
  const rated = closed.filter((s) => s.taken.baseRate.kind !== "untested");
  const rate = (s: QuestScore): number =>
    s.taken.baseRate.kind === "untested" ? 0 : s.taken.baseRate.rate;
  const expectedPaid = rated.reduce((sum, s) => sum + rate(s), 0);
  const ratedPaid = rated.filter((s) => s.paid).length;
  const spread = 2 * Math.sqrt(rated.reduce((sum, s) => sum + rate(s) * (1 - rate(s)), 0));
  const verdict: QuestTypeScore["verdict"] =
    rated.length === 0
      ? "untested"
      : rated.length < MIN_CLOSED
        ? "too-few"
        : ratedPaid > expectedPaid + spread
          ? "above"
          : ratedPaid < expectedPaid - spread
            ? "below"
            : "in-line";
  const measured = rated.some((s) => s.taken.baseRate.kind === "measured");
  return {
    source,
    moveKind,
    taken: group.length,
    open: count("open"),
    closed: closed.length,
    unseen: count("unseen"),
    paid: closed.filter((s) => s.paid).length,
    rated: rated.length,
    ratedPaid,
    expectedPaid: Math.round(expectedPaid * 100) / 100,
    verdict,
    ...(measured ? { note: HOLD_NOTE } : {}),
  };
}
