import { etDateOf } from "../options/position-guidance-rules.js";
import { type SymbolOutlook, symbolOutlook } from "../research/symbol-outlook.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";

/**
 * GET /api/research/outlook?symbol=CRWV,NVDA — the symbol summaries, light (#4807 slice 4).
 *
 * The Guidance tab gets its summary inside the per-member market read (`guidance-route.ts`), which
 * is ~30 broker calls and wants a linked account — far too heavy for a position row, an R&D symbol
 * or a playbook ticker row. This is the same `symbolOutlook()` and nothing else: calendar, ledgers
 * and facts files off disk, no broker, no member data, so a row's recap and the Guidance tab's
 * cannot disagree. Same gate as the rest of `/api/research*` — authed members only.
 *
 * Bounded: at most `MAX_SYMBOLS` per call, each validated as an underlying, so the query string
 * cannot ask for the whole directory. A bad name is dropped, not an error — one typo should not
 * blank a list; an empty answer says so.
 */
export const MAX_OUTLOOK_SYMBOLS = 12;

/** One day's summaries never change within that ET day: key by day + symbol. */
const memo = new Map<string, SymbolOutlook>();

export function outlooksFor(
  raw: string,
  now: string,
): { readonly outlooks: Readonly<Record<string, SymbolOutlook>> } {
  const names = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()))]
    .filter((s) => UNDERLYING_PATTERN.test(s))
    .slice(0, MAX_OUTLOOK_SYMBOLS);
  const day = etDateOf(now);
  const outlooks: Record<string, SymbolOutlook> = {};
  for (const sym of names) {
    const key = `${day}:${sym}`;
    let o = memo.get(key);
    if (!o) {
      o = symbolOutlook(sym, now);
      if (memo.size > 200) memo.clear();
      memo.set(key, o);
    }
    outlooks[sym] = o;
  }
  return { outlooks };
}
