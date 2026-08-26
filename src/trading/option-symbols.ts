/**
 * OCC OPTION SYMBOLS — the broker's wire format for an option contract, and the one place we
 * build, parse, and humanize it. Alpaca (like every US broker) names a contract
 * `ROOT + YYMMDD + C|P + strike×1000 zero-padded to 8` — e.g. `MSFT260918P00420000` is the
 * MSFT $420 put expiring 2026-09-18. Positions and orders both speak this format, so the desk
 * must read it back honestly: a blotter row that shows the raw OCC string is technically true
 * and practically unreadable, which fails the "plain gloss on real terms" rule.
 */

export type OptionType = "call" | "put";

export interface OptionContractParts {
  readonly underlying: string;
  /** ISO date, e.g. "2026-09-18". */
  readonly expiration: string;
  readonly type: OptionType;
  /** Strike in dollars, e.g. 420 or 132.5. */
  readonly strike: number;
}

const OCC_PATTERN = /^([A-Z]{1,6})(\d{6})([CP])(\d{8})$/;

/**
 * The shape of a contract's PARTS, before they are assembled into a wire symbol — what a ticket
 * checks a member's typed input against.
 *
 * These live here, beside `OCC_PATTERN`, because "what an option contract's parts look like" is
 * one question with one answer. They were defined twice (`option-ticket.ts` and, briefly,
 * `draft-order.ts`), which is exactly the drift the duplication gate exists to catch: two copies
 * of a validation rule are two rules the moment either is edited.
 */
export const UNDERLYING_PATTERN = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
export const EXPIRATION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True when a broker symbol names an option contract rather than a share of stock. */
export function isOccSymbol(symbol: string): boolean {
  return OCC_PATTERN.test(symbol.trim().toUpperCase());
}

/** `("MSFT","2026-09-18","put",420)` → `MSFT260918P00420000`. Throws on unbuildable input. */
export function buildOccSymbol(parts: OptionContractParts): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts.expiration);
  if (!match) {
    throw new Error(`expiration must be YYYY-MM-DD, got "${parts.expiration}"`);
  }
  const thousandths = Math.round(parts.strike * 1000);
  if (!Number.isFinite(thousandths) || thousandths <= 0 || thousandths > 99_999_999) {
    throw new Error(`strike out of range: ${parts.strike}`);
  }
  const yymmdd = `${match[1]?.slice(2)}${match[2]}${match[3]}`;
  const cp = parts.type === "call" ? "C" : "P";
  return `${parts.underlying.trim().toUpperCase()}${yymmdd}${cp}${String(thousandths).padStart(8, "0")}`;
}

/** Parse an OCC symbol back into its parts; undefined when it isn't one. */
export function parseOccSymbol(symbol: string): OptionContractParts | undefined {
  const match = OCC_PATTERN.exec(symbol.trim().toUpperCase());
  if (!match) return undefined;
  const [, underlying, date, cp, strikeRaw] = match;
  return {
    underlying: underlying as string,
    expiration: `20${(date as string).slice(0, 2)}-${(date as string).slice(2, 4)}-${(date as string).slice(4, 6)}`,
    type: cp === "C" ? "call" : "put",
    strike: Number(strikeRaw) / 1000,
  };
}

/** `MSFT260918P00420000` → `MSFT $420 PUT · 18 SEP 26`. Non-options pass through unchanged. */
export function humanizeOptionSymbol(symbol: string): string {
  const parts = parseOccSymbol(symbol);
  if (!parts) return symbol;
  const [year, month, day] = parts.expiration.split("-");
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const monthName = months[Number(month) - 1] ?? month;
  const strike = Number.isInteger(parts.strike) ? String(parts.strike) : parts.strike.toFixed(2);
  return `${parts.underlying} $${strike} ${parts.type.toUpperCase()} · ${Number(day)} ${monthName} ${year?.slice(2)}`;
}
