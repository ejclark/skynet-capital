import type { TradeFill } from "./round-trips.js";

/**
 * OPTION LIFECYCLE EVENTS — the four activity types Alpaca reports outside the normal order-fill
 * flow (#468 criterion 6, confirmed zero hits repo-wide before this file): `OPEXP` (a contract
 * expired worthless), `OPASN` (a written contract was assigned), `OPEXC` (a held contract was
 * exercised), `OPTRD` (the paired underlying-share trade that settles an assignment or exercise).
 *
 * None of these arrive as order fills — nothing filled, so `option-ticket.ts`'s review screen
 * never sees them and the desk's fill-based history has nothing to show. This module is the pure
 * normalization layer: parse Alpaca's raw activity payload defensively (never assume a field the
 * wire format doesn't document), say in plain language what happened, and — for the one case that
 * can be closed honestly — hand back a `TradeFill` that closes the leg without a real fill.
 *
 * Kept in `src/trading/` (no I/O, no observatory/view types) per this module's own layering: the
 * observatory-side conversion into a journaled `TradeActivityRecord` lives in
 * `../observatory/option-lifecycle-activity.ts`, exactly the split `desk-data.ts` documents for
 * the rest of this boundary ("fills in, trips out — the seam that lets the FIFO matcher be tested
 * on fixtures with no broker shape anywhere near it").
 *
 * Why only OPEXP (and OPASN) get a synthetic close, and OPEXC/OPTRD never do:
 *  - OPEXP: a contract expiring worthless is an unambiguous $0 close. For a long option (301/302,
 *    opened by a buy) that's the whole story — a real, honest total loss of the premium paid. For
 *    a WRITTEN contract (201/202, opened by a sell) it's the mirror image — a real, honest full
 *    gain of the premium collected. `matchRoundTrips` tries the long lot first and, failing that,
 *    the short one (#838), so one $0 "sell" fill scores either correctly without this module
 *    needing to know which side it closed.
 *  - OPASN: assignment closes the OPTION LEG the same way OPEXP does — no cash changes hands for
 *    the contract itself (the strike-price share trade is the separate `OPTRD` activity below,
 *    still deliberately out of this module's scope). Only ever happens to a WRITTEN contract
 *    (201/202), so this always lands on `round-trips.ts`'s short-lot path (#838).
 *  - OPEXC: exercise converts a LONG option into stock at the strike — the option's value
 *    transfers into the new stock position, it does not vanish. Reporting a $0 close would show a
 *    profitable exercise as a full loss, which is a false-negative framing this desk refuses to
 *    render (CLAUDE.md: "never let a flourish distort honesty"). So this stays informational only.
 *  - OPTRD: a real trade with a real price, but this module cannot yet confirm which field carries
 *    its side from Alpaca's own docs (network access was unavailable while building this). Rather
 *    than guess and risk a wrong number in the equity round-trip ledger, it stays informational —
 *    see the PR that introduced this file for the explicit call to verify against a live account.
 */

export type OptionLifecycleType = "OPEXP" | "OPASN" | "OPEXC" | "OPTRD";

const LIFECYCLE_TYPES: ReadonlySet<string> = new Set<OptionLifecycleType>([
  "OPEXP",
  "OPASN",
  "OPEXC",
  "OPTRD",
]);

/** One normalized lifecycle activity — every field validated, nothing assumed. */
export interface NormalizedLifecycleActivity {
  readonly id: string;
  readonly type: OptionLifecycleType;
  /** The OCC option symbol (OPEXP/OPASN/OPEXC) or the underlying ticker (OPTRD). */
  readonly symbol: string;
  readonly quantity: number;
  readonly at: string;
  /** Only present, and only trusted, on OPTRD — the other three types are not documented as
   *  carrying a per-share price. */
  readonly price?: number;
  readonly side?: "buy" | "sell";
}

/** The raw shape this module reads from (a structural subset of `AlpacaAccountActivity`, kept
 *  local so this file has zero dependency on the alpaca client module). */
export interface RawLifecycleActivity {
  readonly id?: unknown;
  readonly activity_type?: unknown;
  readonly date?: unknown;
  readonly transaction_time?: unknown;
  readonly symbol?: unknown;
  readonly qty?: unknown;
  readonly price?: unknown;
  readonly side?: unknown;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function positiveQuantity(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** A non-negative, finite price — $0 is a legitimate premium-adjacent value, so only sign+finite gate it. */
function nonNegativePrice(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function isoTimestamp(value: unknown): string | undefined {
  const raw = str(value);
  if (!raw) return undefined;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
}

/**
 * Parse one raw account-activity row into a lifecycle event, or `null` when it isn't one of the
 * four option lifecycle types or is missing a field this module needs to act on honestly. Never
 * throws — a malformed or unrecognized row is silently excluded, exactly like an unpriced fill is
 * excluded from `matchRoundTrips` rather than treated as a fabricated zero.
 */
export function parseLifecycleActivity(
  raw: RawLifecycleActivity,
): NormalizedLifecycleActivity | null {
  const id = str(raw.id);
  const type = str(raw.activity_type);
  const symbol = str(raw.symbol);
  const quantity = positiveQuantity(raw.qty);
  const at = isoTimestamp(raw.date) ?? isoTimestamp(raw.transaction_time);
  if (!(id && type && LIFECYCLE_TYPES.has(type) && symbol) || quantity === undefined || !at) {
    return null;
  }
  const price = nonNegativePrice(raw.price);
  const side = raw.side === "buy" || raw.side === "sell" ? raw.side : undefined;
  return {
    id,
    type: type as OptionLifecycleType,
    symbol,
    quantity,
    at,
    ...(price !== undefined ? { price } : {}),
    ...(side ? { side } : {}),
  };
}

/** Plain-language explanation of what happened — the raw ledger's `status` column IS this text
 *  (#468 criterion 6: "the desk shall explain what happened in plain language"), so no separate
 *  rendering path is needed to satisfy it. */
export const LIFECYCLE_STATUS: Record<OptionLifecycleType, string> = {
  OPEXP: "expired worthless",
  OPASN: "assigned",
  OPEXC: "exercised",
  OPTRD: "option settlement",
};

/**
 * A synthetic $0 closing fill for the two cases that can be closed honestly (see the module doc):
 * `OPEXP` and `OPASN`, against whichever lot `matchRoundTrips` actually finds open — long or
 * short (#838). Both mark `synthetic` so a lifecycle event with nothing open to match (neither
 * kind of lot) never inflates `unmatchedSellQuantity`. `OPEXC`/`OPTRD` return `undefined`: never a
 * fabricated number for a value transfer or an unconfirmed trade.
 */
export function lifecycleClosingFill(activity: NormalizedLifecycleActivity): TradeFill | undefined {
  if (activity.type !== "OPEXP" && activity.type !== "OPASN") return undefined;
  return {
    symbol: activity.symbol,
    side: "sell",
    quantity: activity.quantity,
    price: 0,
    at: activity.at,
    synthetic: true,
  };
}
