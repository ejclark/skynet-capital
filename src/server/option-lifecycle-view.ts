import type {
  NormalizedLifecycleActivity,
  OptionLifecycleType,
} from "../trading/option-lifecycle.js";
import {
  humanizeOptionSymbol,
  type OptionContractParts,
  parseOccSymbol,
} from "../trading/option-symbols.js";

/**
 * WHAT HAPPENED TO A CONTRACT WITHOUT AN ORDER — the member-facing view of the four option
 * lifecycle events (#3407 slice 4, the last capability #4330 named).
 *
 * The normalization has existed since #468 (`../trading/option-lifecycle.ts`) and the paging sweep
 * since the backfill script; what has never existed is a screen. So a member whose written put was
 * assigned overnight watches the contract vanish from the book with nothing anywhere saying why,
 * and a contract that expired worthless looks identical to one that was closed for a profit.
 *
 * This module is the pure half: one normalized activity in, one row out, and NOTHING read from the
 * network. It is deliberately a sibling of `option-positions-view.ts` (a route's view beside its
 * route) rather than living in `src/trading/`, for the same reason that file does.
 *
 * ITS ONE REAL JOB IS HONESTY ABOUT P/L, and the rules are not this file's to invent — they are
 * `option-lifecycle.ts`'s, restated for a reader instead of for the FIFO matcher:
 *
 *  - **Expiry and assignment are priced** ($0, `synthetic`), so their rows say the desk counted
 *    them. For assignment that is true of the CONTRACT only — the shares that changed hands at the
 *    strike are a separate position with their own basis, and they arrive as their own `OPTRD`
 *    line, which this desk does not price. The row says so rather than letting a member read a
 *    complete number where there is half of one.
 *  - **Exercise and share settlement are not priced**, and each row carries the reason in words.
 *    Pricing an exercise at $0 would render a profitable trade as a total loss (the premium moved
 *    into stock, it did not evaporate); pricing a settlement would mean guessing which wire field
 *    carries its side, which nobody has confirmed against a live account (#837).
 *
 * The one thing it must never do is round an unpriced event up to zero and let the Orders pane
 * read as a complete ledger. An absent number reads as absent, with the reason beside it
 * (`CLAUDE.md` → domain accuracy & honesty; the plan's own EARS criterion on absent values).
 */

/** One lifecycle event as the Orders pane renders it. */
export interface LifecycleRow {
  readonly id: string;
  readonly type: OptionLifecycleType;
  /** The raw OCC symbol (or the bare ticker, on a share settlement). */
  readonly symbol: string;
  /** `NVDA $180 CALL · 17 OCT 26`, or the ticker unchanged when the symbol isn't a contract. */
  readonly display: string;
  /** The underlying, when the symbol decoded as a contract — the ticket's `?symbol=` target. */
  readonly underlying?: string;
  /** Contracts, or shares on a settlement row — `unit` says which. */
  readonly quantity: number;
  readonly unit: "contracts" | "shares";
  readonly at: string;
  /** Two or three words: what happened. */
  readonly headline: string;
  /** One sentence: what it means for the member's position. */
  readonly detail: string;
  /** Whether the desk's realized P/L counts this event — the row's glyph and weight. */
  readonly priced: boolean;
  /** The WHOLE P/L sentence, always present: what the realized number includes about this event,
   *  and — when it includes nothing, or only half — the reason, in the same breath. One field
   *  rather than a label the client stitches a reason onto, so no rendering can ever show a
   *  verdict without its reason. */
  readonly ledger: string;
  /** Per-share price, and only ever from an `OPTRD`: the other three types are not documented as
   *  carrying one, so nothing else can report one. */
  readonly price?: number;
}

/**
 * The whole answer `/api/trade/option-lifecycle` sends. THREE STATES, never two: an unlinked
 * session, a broker that did not answer, and an account with nothing to show are three different
 * facts, and folding the middle one into an empty list would tell a member "nothing happened to
 * your contracts" on the strength of a timeout. Declared here, beside the rows, so the client can
 * import the real type instead of mirroring it (`option-lifecycle-route.ts` serves it).
 */
export type OptionLifecycleResponse =
  | {
      readonly available: true;
      readonly asOf: string;
      readonly rows: readonly LifecycleRow[];
      /** True when the broker's newest page held more events than the row limit shows. */
      readonly more: boolean;
    }
  | {
      readonly available: false;
      readonly reason: "unlinked" | "unreachable";
      readonly rows: readonly [];
    };

const HEADLINE: Record<OptionLifecycleType, string> = {
  OPEXP: "Expired worthless",
  OPASN: "Assigned",
  OPEXC: "Exercised",
  OPTRD: "Shares settled",
};

/** The consequence, in the transaction voice — plain, no spectacle on either side of the trade
 *  (`CLAUDE.md`: losses render honestly, without punishing spectacle). */
const DETAIL: Record<OptionLifecycleType, string> = {
  OPEXP:
    "The contract reached expiry with no value left, so nothing was bought or sold — it simply ceased to exist at the close.",
  OPASN:
    "A contract you wrote was exercised against you, so the shares changed hands at the strike. The premium you were paid is yours in full.",
  OPEXC:
    "A contract you held was exercised, converting it into shares at the strike — its value moved into the stock rather than being paid out as premium.",
  OPTRD:
    "The share leg that settles an assignment or an exercise: the stock that changed hands at the strike.",
};

/** What the realized number says about this event — verdict and reason in one sentence, never a
 *  verdict a renderer could show on its own. */
const LEDGER: Record<OptionLifecycleType, string> = {
  OPEXP: "Counted in your realized P/L — a worthless contract closes at an unambiguous $0.",
  OPASN:
    "Counted in your realized P/L for the contract only — the shares that changed hands are a separate position with their own cost basis, and they arrive as their own settled-shares line.",
  OPEXC:
    "Not counted in your realized P/L: the contract's value moved into the shares, so pricing it at $0 would show a trade that may have been profitable as a total loss.",
  OPTRD:
    "Not counted in your realized P/L: this desk has not confirmed which field carries this trade's side on the broker's wire, so it is recorded rather than priced wrongly.",
};

/** The two types whose synthetic $0 close the FIFO matcher scores — `option-lifecycle.ts`'s
 *  `lifecycleClosingFill` is the authority, and this set is read FROM that rule, not beside it. */
const PRICED: ReadonlySet<OptionLifecycleType> = new Set<OptionLifecycleType>(["OPEXP", "OPASN"]);

/** One normalized activity as a row.
 *
 *  `unit` comes from the TYPE, never from whether the symbol happens to parse as a contract: the
 *  share settlement is the share leg by definition and the other three are about contracts by
 *  definition, so deriving it from the symbol would let one row say "Shares settled · 1 contract"
 *  the day Alpaca sends an `OPTRD` keyed on the OCC symbol (its wire shape is still unconfirmed —
 *  #837 — so that is a live possibility, not a hypothetical). The symbol decides only how the
 *  contract is SPELLED, and `humanizeOptionSymbol` already passes a bare ticker through unchanged. */
export function lifecycleRow(activity: NormalizedLifecycleActivity): LifecycleRow {
  const parts: OptionContractParts | undefined = parseOccSymbol(activity.symbol);
  return {
    id: activity.id,
    type: activity.type,
    symbol: activity.symbol,
    display: humanizeOptionSymbol(activity.symbol),
    ...(parts ? { underlying: parts.underlying } : {}),
    quantity: activity.quantity,
    unit: activity.type === "OPTRD" ? "shares" : "contracts",
    at: activity.at,
    headline: HEADLINE[activity.type],
    detail: DETAIL[activity.type],
    priced: PRICED.has(activity.type),
    ledger: LEDGER[activity.type],
    // Only an OPTRD is documented as carrying a price, so only an OPTRD may report one — a price
    // on any other type is the broker echoing a field we don't trust for it.
    ...(activity.type === "OPTRD" && activity.price !== undefined ? { price: activity.price } : {}),
  };
}

/**
 * Rows for one account, newest first, capped. The broker already answers `direction=desc`, but the
 * sort is re-applied here rather than trusted: a page that arrived in another order would otherwise
 * put last month's expiry above this morning's assignment, which is the one thing a member reads
 * this list for.
 */
export function lifecycleRows(
  activities: readonly NormalizedLifecycleActivity[],
  limit: number,
): readonly LifecycleRow[] {
  return [...activities]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, Math.max(0, limit))
    .map(lifecycleRow);
}
