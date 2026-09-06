import { isOccSymbol, parseOccSymbol } from "../trading/option-symbols.js";
import { COURSES, type Milestone } from "./curriculum.js";
import { isSameMarketDay } from "./market-day.js";
import { TRADE_TYPES, type TradeType, type TradeTypeCode } from "./trade-types.js";

/**
 * MILESTONE DERIVATION — the pure function that turns two append-only ledgers into earned
 * milestones and the unlocked trade ladder. Same testable pattern as `observatory/reduce.ts`:
 * one place computes progression, the views are dumb; there is no accumulated progress state
 * to drift, because the answer is re-derived from the ledgers on every read.
 *
 * Proof is a FILL, never a submission and never a checkbox (Eric's ruling, 2026-08-25: progress
 * a user can claim with zero proof is worthless — we control the trading UI, so we detect it).
 * Equity fills classify from the fill alone (this desk never shorts, so buy = 101, sell = 102) —
 * which back-fills stock milestones from history for free. Option fills classify only through
 * the tag stamped at submit (`order-audit-log.ts`): the tag must say the order OPENED a play,
 * so a buy-to-close of a short put can never masquerade as a long put, and an untagged option
 * fill (a bot's, or pre-tag history) earns nothing — honest by construction.
 */

/** One collapsed fill line — structurally satisfied by `TradeActivityRecord`. */
export interface LadderFill {
  readonly orderId: string;
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly filledQuantity: number;
  readonly at: string;
}

/** One tagged submission — structurally satisfied by the extended `OrderAuditRecord`. */
export interface LadderTag {
  readonly orderId: string;
  readonly code?: TradeTypeCode;
  readonly intent?: "open" | "close";
}

/** A milestone earned by a real fill — the order id IS the evidence. */
export interface EarnedMilestone {
  readonly milestoneId: string;
  readonly code: TradeTypeCode;
  readonly orderId: string;
  readonly at: string;
}

/** The curriculum milestone a trade-type code earns (1:1 by the curriculum's alignment spec). */
export function milestoneForCode(code: TradeTypeCode): Milestone | undefined {
  for (const course of COURSES) {
    const hit = course.milestones.find((m) => m.tradeType === code);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Classify one fill to every ladder code it proves — usually one, but a same-day option OPEN
 * proves its own code AND 501 (#1671: zero-DTE is an attribute of the fill, read straight off the
 * OCC symbol's own embedded expiration against the fill's own market day — never a second tag,
 * never a client claim). An untagged fill, or a close, proves nothing.
 */
function codesForFill(
  fill: LadderFill,
  tagsByOrder: ReadonlyMap<string, LadderTag>,
): readonly TradeTypeCode[] {
  if (fill.filledQuantity <= 0) return [];
  if (!isOccSymbol(fill.symbol)) return [fill.side === "buy" ? "101" : "102"];
  const tag = tagsByOrder.get(fill.orderId);
  if (tag?.intent !== "open" || !tag.code) return [];
  const contract = parseOccSymbol(fill.symbol);
  return contract && isSameMarketDay(fill.at, contract.expiration) ? [tag.code, "501"] : [tag.code];
}

/**
 * Fold fills + tags into earned milestones — idempotent (same ledgers, same result), one entry
 * per code with the EARLIEST qualifying fill as evidence, returned in ladder order.
 */
export function deriveEarned(
  fills: readonly LadderFill[],
  tags: readonly LadderTag[],
): EarnedMilestone[] {
  const tagsByOrder = new Map(tags.map((t) => [t.orderId, t]));
  const byCode = new Map<TradeTypeCode, EarnedMilestone>();
  for (const fill of fills) {
    for (const code of codesForFill(fill, tagsByOrder)) {
      const milestone = milestoneForCode(code);
      if (!milestone) continue;
      const held = byCode.get(code);
      if (!held || fill.at < held.at) {
        byCode.set(code, { milestoneId: milestone.id, code, orderId: fill.orderId, at: fill.at });
      }
    }
  }
  return TRADE_TYPES.flatMap((t) => {
    const earned = byCode.get(t.code);
    return earned ? [earned] : [];
  });
}

/** The set of ladder codes an earned list proves. */
export function earnedCodes(earned: readonly EarnedMilestone[]): ReadonlySet<TradeTypeCode> {
  return new Set(earned.map((m) => m.code));
}

/**
 * Which ladder rungs are OPEN with training wheels on: the first rung always, each further rung
 * once the one before it is earned — plus anything already earned, because a trade you have
 * actually done is never locked away from you (matters for seeded history with gaps).
 */
export function unlockedCodes(earned: ReadonlySet<TradeTypeCode>): ReadonlySet<TradeTypeCode> {
  const open = new Set<TradeTypeCode>();
  for (let i = 0; i < TRADE_TYPES.length; i++) {
    const code = (TRADE_TYPES[i] as (typeof TRADE_TYPES)[number]).code;
    const prev = i === 0 ? undefined : (TRADE_TYPES[i - 1] as (typeof TRADE_TYPES)[number]).code;
    if (i === 0 || (prev && earned.has(prev)) || earned.has(code)) open.add(code);
  }
  return open;
}

/** The rung to chase next: the first unlocked-but-unearned code in ladder order. */
export function nextUp(
  unlocked: ReadonlySet<TradeTypeCode>,
  earned: ReadonlySet<TradeTypeCode>,
): TradeTypeCode | undefined {
  return TRADE_TYPES.find((t) => unlocked.has(t.code) && !earned.has(t.code))?.code;
}

/** The ladder neighbor `offset` rungs from `code` — the ONE place ladder adjacency is walked. */
export function ladderNeighbor(code: TradeTypeCode, offset: -1 | 1): TradeType | undefined {
  const i = TRADE_TYPES.findIndex((t) => t.code === code);
  return i >= 0 ? TRADE_TYPES[i + offset] : undefined;
}

/**
 * THE ONE NON-FILL GATE ON THE LADDER (#1119, the Claude Design canvas "Alpaca onboarding process
 * streamline"; lowered by Eric's 2026-09-03 ruling): with training wheels on and nothing said to
 * Moneypenny yet, every rung not already earned stays shut — "the desk opens once you've shown
 * up." Requiring a FILED issue was too high a bar to gate trading on (that stays its own, harder,
 * separately-tracked achievement — `community.ts`'s `first-feedback`); this gate's bar is just a
 * message. Wheels off is never gated (the seeding rule in `progression-service.ts` gives every
 * member with fill history wheels off), and a rung already earned by a fill is never locked away.
 * The evidence is the engagement track's `first-message` earn — a real
 * `companion-message-log.ts` entry, never a client claim. Exits stay exempt wherever this is
 * applied: restricting how someone leaves a position would be a safety bug, not a lesson.
 */
export const LADDER_GATE_MILESTONE = "first-message";

/**
 * A filed issue satisfies the gate too, even though it's no longer the gate's own milestone: the
 * rail's only door to filing is the chat itself, so anyone who filed already said something to
 * her first. Named directly rather than importing `community.ts` (the two tracks stay otherwise
 * undependent) — this is a one-way "at least as hard" acknowledgment, not a coupling. Matters for
 * a member who filed before this log existed: without it, someone who did MORE than the new bar
 * asks would be re-gated by a ledger that only started recording today.
 */
const LADDER_GATE_ALSO_SATISFIED_BY = "first-feedback";

export const LADDER_GATE_NOTE =
  "The ladder opens the moment you say hello to Moneypenny — trading starts with a conversation.";

export function ladderGated(wheels: boolean, satisfiedIds: ReadonlySet<string>): boolean {
  return (
    wheels &&
    !satisfiedIds.has(LADDER_GATE_MILESTONE) &&
    !satisfiedIds.has(LADDER_GATE_ALSO_SATISFIED_BY)
  );
}

/** With wheels on, a rung outside the unlocked set is locked; wheels off (or no view) locks nothing. */
export function lockedOnLadder(
  code: TradeTypeCode,
  view: { readonly wheels: boolean; readonly unlocked: ReadonlySet<TradeTypeCode> } | undefined,
): boolean {
  return Boolean(view?.wheels) && !view?.unlocked.has(code);
}
