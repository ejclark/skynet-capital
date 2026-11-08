/**
 * A QUEST (#7028): one paper move offered to one member, with its reason, the house's base rate for
 * it, its exits and the day it stops holding. The member fires it — nothing here places an order.
 *
 * Three sources feed the same record (the plan's table): a position worth changing (position
 * guidance's act-now verdicts, slice 1), the member's cash under today's market conditions (slice 3,
 * after slice 2's drawdown study), and a market event with a written stance (slice 4). One record,
 * so the landing page (#7077) ranks and draws all three the same way.
 *
 * Honesty rules the record carries by shape, not by copy review (CLAUDE.md: "Never let a flourish
 * imply something false about markets or P/L"):
 *  - `baseRate` is either a tested rate WITH its sample size and worst decile, or `untested` — there
 *    is no third "looks good" state. An untested quest ranks below every tested one.
 *  - `why` lines each name the rule that produced them, so a reason is auditable.
 *  - `houseCall` may be "stand aside": the house can offer a move and still say not to take it.
 */

export type QuestSource = "position" | "conditions" | "event";

/** The paper order the quest drafts. Every kind closes, opens or swaps a position the member owns. */
export type QuestMoveKind =
  | "sell-to-close"
  | "buy-to-close"
  | "roll"
  | "buy-shares"
  | "sell-cash-secured-put"
  | "buy-call"
  | "sell-covered-call";

export interface QuestMove {
  readonly kind: QuestMoveKind;
  /** The move named by its job: "Sell your 2 NVDA $150 calls (Dec 19)". Never a time judgment. */
  readonly label: string;
  readonly symbol: string;
  /** The contract this move acts on, when it is an option already held. */
  readonly occ?: string;
  readonly contracts?: number;
  /** A roll's second leg: the call to sell in its place, and the net per share (+ credit, − cost). */
  readonly rollTo?: { readonly strike: number; readonly expiration: string; readonly net: number };
  /** Where the member reviews and fires it — a draft, never a placed order. */
  readonly href: string;
}

export interface QuestReason {
  /** The rule that produced this line (a position guidance rule id, a study id, a stance file). */
  readonly rule: string;
  readonly text: string;
}

export type QuestBaseRate =
  | {
      readonly kind: "tested";
      /** Share of past cases where the move paid, 0..1. */
      readonly rate: number;
      readonly sample: number;
      /** The worst tenth's outcome, as a fraction (−0.25 = lost a quarter). */
      readonly worstDecile: number;
      /** The study that measured it — a path under docs/research/. */
      readonly source: string;
    }
  | {
      readonly kind: "untested";
      /** Said in words on the quest: why there is no number yet. */
      readonly note: string;
    };

export interface QuestExit {
  readonly kind: "take-profit" | "stop" | "time";
  readonly text: string;
}

export interface Quest {
  /** Stable across reads while the condition holds — the same quest keeps its id. */
  readonly id: string;
  readonly source: QuestSource;
  readonly move: QuestMove;
  /** At most three lines, most important first. */
  readonly why: readonly QuestReason[];
  readonly baseRate: QuestBaseRate;
  /** The exits pre-filled on the ticket. A move that closes a position carries none: it IS the exit. */
  readonly exits: readonly QuestExit[];
  /** The day (YYYY-MM-DD) after which the quest no longer holds, and why. A quest whose condition
   *  stops holding sooner is simply not derived on the next read. */
  readonly expires: { readonly date: string; readonly why: string };
  readonly houseCall: "take" | "stand-aside";
  readonly confidence: "high" | "medium" | "low";
  /** Market closed: a plan for the next open, never an instruction for now. */
  readonly atOpen: boolean;
}

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 } as const;

/**
 * Best first: a quest the house says to take before one it says to stand aside on; a tested quest
 * before an untested one (AC 5), the higher base rate first; then the higher confidence; then the
 * one that expires soonest, since it is the one that will not wait.
 */
export function rankQuests(quests: readonly Quest[]): Quest[] {
  const rate = (q: Quest): number => (q.baseRate.kind === "tested" ? q.baseRate.rate : -1);
  return [...quests].sort(
    (a, b) =>
      Number(a.houseCall === "stand-aside") - Number(b.houseCall === "stand-aside") ||
      rate(b) - rate(a) ||
      CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] ||
      a.expires.date.localeCompare(b.expires.date) ||
      a.id.localeCompare(b.id),
  );
}
