import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "./desk";

/**
 * THE FACT BADGE (#5070; round 2 of #5037, Eric's 3a77c6db): one mark per position that says a
 * verb and a fact, never a verdict ("Needs a decision" / "At risk" projected too much). Two axes:
 *  - **Review** — a fact puts the position off its plan: shares below breakeven, an option bought
 *    and now worth less than it cost, a sold option near or past its strike (#4952: a short option
 *    is judged on assignment risk first), or one costing more to close than it brought in;
 *  - **Consider** — on plan with a target met: the decision engine's own lock-in bars
 *    (`src/observatory/decisions-view.ts`: 50% on an option, 25% on shares), so the badge and the
 *    Map lens's cards never disagree about what "worth taking" means;
 *  - **On plan** — anything else, and the line shows the position's next date.
 * The marks are a filter and a sort too (`is:review` …, `sort:look`, in `desk.ts`'s grammar).
 * Pure: the stock's price for a sold option comes in from the option book the blotter reads.
 */

export type MarkKind = "review" | "consider" | "onplan";

export interface PositionMark {
  readonly kind: MarkKind;
  /** The fact, in words: "below breakeven", "$2.60 above strike", "earnings Nov 18". Empty when
   *  an On plan position has nothing dated ahead of it. */
  readonly fact: string;
  /** The fact as a screen reader should say it, when the eye reads it shorter. */
  readonly said?: string;
  /** The price that brings a set-aside mark back early: a sold option's strike, in its stock. */
  readonly watch?: MarkWatch;
}

export interface MarkWatch {
  readonly symbol: string;
  readonly price: number;
  readonly side: "below" | "above";
}

/** Glyph plus word: the shape carries the mark, never the hue alone. */
export const MARK_GLYPH: Readonly<Record<MarkKind, string>> = {
  review: "◆",
  consider: "▲",
  onplan: "○",
};
export const MARK_WORD: Readonly<Record<MarkKind, string>> = {
  review: "Review",
  consider: "Consider",
  onplan: "On plan",
};
/** Each mark's filter token, in the order the Mark line lists them. */
export const MARK_TOKEN: Readonly<Record<MarkKind, string>> = {
  review: "is:review",
  consider: "is:consider",
  onplan: "is:onplan",
};
export const MARK_KINDS: readonly MarkKind[] = ["review", "consider", "onplan"];

/** The decision engine's LOCK IN PROFIT bars (`decisions-view.ts`), in percent of cost. */
const CONSIDER_OPTION_PCT = 50;
const CONSIDER_SHARE_PCT = 25;
/** A sold option this close to its strike, as a share of the strike, is worth a look. */
const NEAR_STRIKE = 0.05;

/** "+3.63%", "−116%", "-8.32%" → a number; "—" (no basis) → undefined. */
function percent(text: string): number | undefined {
  const n = Number.parseFloat(text.replace("−", "-").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

const dollars = (n: number) => `$${n.toFixed(2)}`;

/** "Nov 18" for a `YYYY-MM-DD`. */
const day = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** "Earnings Nov 3" → "earnings Nov 3": the fact rides after "On plan ·". */
const lead = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);

/** On plan's fact: the next date that is the position's own. */
function nextDate(p: DeskPosition): Pick<PositionMark, "fact" | "said"> {
  const occ = parseOccSymbol(p.symbol);
  if (occ) {
    const own = p.nextEvent?.scope === "stock" && p.nextEvent.beforeExpiry;
    return {
      fact: own && p.nextEvent ? lead(p.nextEvent.label) : `expires ${day(occ.expiration)}`,
    };
  }
  const print = p.nextPrint;
  if (print && print.status !== "unknown") {
    return print.status === "estimate"
      ? { fact: `earnings est. ${day(print.at)}`, said: `earnings estimated for ${day(print.at)}` }
      : { fact: `earnings ${day(print.at)}` };
  }
  if (p.nextEvent?.scope === "stock") return { fact: lead(p.nextEvent.label) };
  return { fact: "" };
}

/** A sold option: how close the stock is to the strike first, then the premium. */
function soldMark(p: DeskPosition, ret: number | undefined, spot?: number): PositionMark | null {
  const occ = parseOccSymbol(p.symbol);
  if (!occ) return null;
  const put = occ.type === "put";
  if (spot !== undefined) {
    // Positive while the stock is on the side that keeps the premium.
    const clear = put ? spot - occ.strike : occ.strike - spot;
    const side = (above: boolean) =>
      `${dollars(Math.abs(spot - occ.strike))} ${above ? "above" : "below"} strike`;
    if (clear < 0) return { kind: "review", fact: side(!put) };
    if (clear <= occ.strike * NEAR_STRIKE)
      return {
        kind: "review",
        fact: side(put),
        watch: { symbol: occ.underlying, price: occ.strike, side: put ? "below" : "above" },
      };
  }
  if (ret !== undefined && ret >= CONSIDER_OPTION_PCT)
    return { kind: "consider", fact: `${Math.round(ret)}% of premium kept` };
  if (p.totalPlRaw < 0 && ret !== undefined)
    return { kind: "review", fact: `${Math.round(Math.abs(ret))}% of premium lost` };
  return null;
}

export function markOf(p: DeskPosition, spot?: number): PositionMark {
  const ret = percent(p.returnPct);
  const short = Number(p.quantity.replace(/[^0-9.-]/g, "")) < 0;
  if (p.isOption && short) {
    const sold = soldMark(p, ret, spot);
    if (sold) return sold;
  } else {
    const bar = p.isOption ? CONSIDER_OPTION_PCT : CONSIDER_SHARE_PCT;
    if (ret !== undefined && ret >= bar)
      return { kind: "consider", fact: `up ${Math.round(ret)}%` };
    if (p.totalPlRaw < 0) {
      if (p.isOption) return { kind: "review", fact: `down ${Math.round(Math.abs(ret ?? 0))}%` };
      return { kind: "review", fact: short ? "above breakeven" : "below breakeven" };
    }
  }
  return { kind: "onplan", ...nextDate(p) };
}
