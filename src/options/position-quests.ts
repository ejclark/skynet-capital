import type { Quest, QuestExit } from "../domain/quest.js";
import { buildOccSymbol, occStrikeLabel } from "../trading/option-symbols.js";
import { BUY_BACK_AT_KEPT } from "./position-guidance-manage.js";
import { dayText, pct } from "./position-guidance-rules.js";
import type {
  Confidence,
  GuidanceReason,
  LongCallCall,
  ManageCall,
  PositionGuidance,
} from "./position-guidance-types.js";

/**
 * QUESTS FROM YOUR POSITIONS (#7028 slice 1): position guidance's act-now verdicts, as quests.
 * Guidance already judges every option the member holds with cited, deterministic rules and no model
 * tokens; this keeps only the verdicts that ask for an order and drops the rest:
 *
 *   Calls you hold  — TAKE PROFIT, TIME STOP → sell to close.         HOLD, NO ANSWER → nothing.
 *   Calls you've sold — BUY BACK → buy to close; ROLL → roll.         KEEP, NO ANSWER → nothing.
 *                       LET IT GO → nothing: it asks for no order (the shares are called away).
 *
 * A quest's condition expiring needs no timer: guidance is re-read on every request, so a verdict
 * that stops firing (the bid falls back under 2×, a roll stops paying a credit) is simply not
 * derived next time. `expires` names the latest day the quest could still hold.
 *
 * Base rate: no study under docs/research/ tests these exit rules yet (the long-call fences study
 * tests entries, not the 2× take-profit or the 45-day stop), so every position quest says
 * "untested" in words, which ranks it below any tested quest (AC 5). PURE: no I/O, no clock.
 */

const UNTESTED = {
  kind: "untested",
  note: "No study has measured how often this exit rule pays yet — it is the house's rule, not a tested rate.",
} as const;

/** "your 2 NVDA $150 calls (Dec 19)" — the contract as the member reads it. */
function contractText(symbol: string, strike: number, expiration: string, n: number): string {
  return `your ${n === 1 ? "" : `${n} `}${symbol} ${occStrikeLabel(strike)} call${n === 1 ? "" : "s"} (${dayText(expiration)})`;
}

/** Trade's Option positions card, opened on this contract for review — the member fires it there. */
function manageHref(deskId: string, symbol: string, occ: string): string {
  return `/app/trade?desk=${encodeURIComponent(deskId)}&symbol=${symbol}&section=orders&manage=${occ}`;
}

const graded = (c: Confidence): Quest["confidence"] | undefined => (c === "none" ? undefined : c);

const reasons = (rs: readonly GuidanceReason[]): Quest["why"] =>
  rs.slice(0, 3).map((r) => ({ rule: r.rule, text: r.text }));

function heldCallQuest(deskId: string, symbol: string, c: LongCallCall): Quest | undefined {
  if (c.call !== "TAKE PROFIT" && c.call !== "TIME STOP") return undefined;
  const confidence = graded(c.confidence);
  if (!confidence) return undefined;
  const occ = buildOccSymbol({
    underlying: symbol,
    expiration: c.expiration,
    type: "call",
    strike: c.strike,
  });
  const profit = c.call === "TAKE PROFIT";
  return {
    id: `position:${occ}:${profit ? "take-profit" : "time-stop"}`,
    source: "position",
    move: {
      kind: "sell-to-close",
      label: `${profit ? "Take profit" : "Time stop"}: sell ${contractText(symbol, c.strike, c.expiration, c.contracts)}`,
      symbol,
      occ,
      contracts: c.contracts,
      href: manageHref(deskId, symbol, occ),
    },
    why: reasons(c.reasons),
    baseRate: UNTESTED,
    exits: [],
    // Take profit holds until the time stop takes over; a time stop holds until the call expires.
    expires:
      profit && c.until
        ? { date: c.until.date, why: c.until.why }
        : { date: c.expiration, why: "the call expires" },
    houseCall: "take",
    confidence,
    atOpen: c.atOpen,
  };
}

function soldCallQuest(deskId: string, symbol: string, c: ManageCall): Quest | undefined {
  if (c.call !== "BUY BACK" && c.call !== "ROLL") return undefined;
  const confidence = graded(c.confidence);
  if (!confidence) return undefined;
  const contract = contractText(symbol, c.strike, c.expiration, c.contracts);
  const rollTo = c.call === "ROLL" ? c.rollTo : undefined;
  const exits: QuestExit[] = rollTo
    ? [
        {
          kind: "take-profit",
          text: `Buy the new call back once you've kept ${pct(BUY_BACK_AT_KEPT)} of what it pays — the guidance's buy-back rule.`,
        },
        {
          kind: "time",
          text: `It expires ${dayText(rollTo.expiration)}; the guidance re-reads it before then.`,
        },
      ]
    : [];
  return {
    id: `position:${c.occ}:${rollTo ? "roll" : "buy-back"}`,
    source: "position",
    move: {
      kind: rollTo ? "roll" : "buy-to-close",
      label: rollTo
        ? `Roll ${contract} to the ${occStrikeLabel(rollTo.strike)} call (${dayText(rollTo.expiration)})`
        : `Buy back ${contract}`,
      symbol,
      occ: c.occ,
      contracts: c.contracts,
      ...(rollTo ? { rollTo } : {}),
      href: manageHref(deskId, symbol, c.occ),
    },
    why: reasons(c.reasons),
    baseRate: UNTESTED,
    exits,
    expires: c.until
      ? { date: c.until.date, why: c.until.why }
      : { date: c.expiration, why: "the call expires" },
    houseCall: "take",
    confidence,
    atOpen: c.atOpen,
  };
}

/** Every act-now verdict in one guidance read, as quests on `deskId`. Hold verdicts yield none. */
export function positionQuests(deskId: string, guidance: PositionGuidance): Quest[] {
  const { symbol } = guidance;
  return [
    ...guidance.longCalls.map((c) => heldCallQuest(deskId, symbol, c)),
    ...guidance.manage.map((c) => soldCallQuest(deskId, symbol, c)),
  ].filter((q): q is Quest => q !== undefined);
}
