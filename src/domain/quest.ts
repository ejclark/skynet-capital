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
 *  - `baseRate` is a tested rate WITH its sample size and worst decile, a MEASURED one (the numbers
 *    from a study too small to claim an edge, said so in words), or `untested` — there is no "looks
 *    good" state. A measured or untested quest ranks below every tested one.
 *  - `why` lines each name the rule that produced them, so a reason is auditable.
 *  - `houseCall` may be "stand aside": the house can offer a move and still say not to take it. A
 *    move whose study is too small to say either way is "no-edge": shown with its numbers, claimed
 *    as nothing.
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
      /**
       * A study measured the move but could not separate it from chance (fewer episodes than its
       * declared power needs, #7028 slice 2). The numbers are shown with their sample, and the
       * quest says its edge is untested in words — it claims no edge and ranks below tested ones.
       */
      readonly kind: "measured";
      /** Share of past entries where the move paid, 0..1. */
      readonly rate: number;
      /** Past entries measured, and the independent sell-offs (episodes) they fall in. */
      readonly sample: number;
      readonly episodes: number;
      /** Episodes the study's declared power needed before it would claim an edge. */
      readonly episodesNeeded: number;
      /** The average outcome per entry, as a fraction of the capital the move ties up. */
      readonly mean: number;
      /** The worst tenth's outcome (fraction; −0.25 = lost a quarter) and the single worst. */
      readonly worstDecile: number;
      readonly worstSingle: number;
      readonly source: string;
      /** Said in words on the quest: that the edge is untested, and why. */
      readonly note: string;
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
  readonly houseCall: "take" | "stand-aside" | "no-edge";
  readonly confidence: "high" | "medium" | "low";
  /** Market closed: a plan for the next open, never an instruction for now. */
  readonly atOpen: boolean;
}

/**
 * A ticket link that names the quest it drafts (#7028 slice 6): the Trade form keeps `?quest=` and
 * sends it with the order, so an accepted order can be recorded as this quest taken
 * (`src/server/quest-taken.ts`). Every quest href already carries a query string.
 */
export function withQuest(href: string, id: string): string {
  return `${href}&quest=${encodeURIComponent(id)}`;
}

/** Ids are short, plain and built by this repo (`<source>:…:<move>`); anything else is not one. */
export function isQuestId(value: unknown): value is string {
  return (
    typeof value === "string" && /^(position|conditions|event):[A-Za-z0-9._:-]{1,160}$/.test(value)
  );
}

const CONFIDENCE_ORDER = { high: 0, medium: 1, low: 2 } as const;

/**
 * Best first: a quest the house says to stand aside on goes last; a tested quest before a measured
 * or untested one (AC 5), the house's call to take before one with no edge shown, the higher rate
 * first; then the higher confidence; then the one that expires soonest, since it is the one that
 * will not wait.
 */
export function rankQuests(quests: readonly Quest[]): Quest[] {
  const rate = (q: Quest): number => (q.baseRate.kind === "untested" ? -1 : q.baseRate.rate);
  const tested = (q: Quest): number => Number(q.baseRate.kind !== "tested");
  return [...quests].sort(
    (a, b) =>
      Number(a.houseCall === "stand-aside") - Number(b.houseCall === "stand-aside") ||
      tested(a) - tested(b) ||
      Number(a.houseCall === "no-edge") - Number(b.houseCall === "no-edge") ||
      rate(b) - rate(a) ||
      CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence] ||
      a.expires.date.localeCompare(b.expires.date) ||
      a.id.localeCompare(b.id),
  );
}
