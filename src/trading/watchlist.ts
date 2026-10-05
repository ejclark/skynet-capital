import { UNDERLYING_PATTERN } from "./option-symbols.js";

/**
 * THE WATCHLIST'S RULES (#3407 P4, #4332's last capability) — the names a member chose to keep an
 * eye on, kept pure so the cap, the normalization and every refusal can be specced without a
 * filesystem or a socket.
 *
 * WHY A CAP, and why this number. The watchlist's whole point is that its rows MOVE: each one
 * rents a symbol from the member's single market-data socket, whose ceiling is Alpaca's 30 per
 * connection (`quote-stream-hub.ts`'s `SYMBOLS_PER_STREAM`). The committed symbol on the bench
 * beside it rents from the same 30, and so does anything else that joins later. A list allowed to
 * reach 30 would therefore go quietly non-live at its edges — the exact dishonesty this plan's
 * criteria forbid ("an absent value SHALL read as absent with a reason"). So the list stops at a
 * number that fits inside the socket with room to spare, and says so when it is full rather than
 * accepting a name it cannot stream.
 *
 * WHY INSERTION ORDER, and not alphabetical or by-mover. A watchlist is read by muscle memory —
 * the eye returns to where it left a name. Re-ranking rows by the day's move (which a broker's
 * "movers" view does) would reshuffle the list under a member's finger on every tick, which is a
 * different surface with a different job. The order here is the order the member built it in, and
 * it only changes when they change it.
 */

/** One watched name: the symbol, and when this member added it. */
export interface WatchedSymbol {
  readonly symbol: string;
  readonly at: string;
}

/**
 * The most names one list may hold. 30 is the socket's ceiling; the bench's own committed symbol
 * and whatever joins beside it rent from the same budget, so the list keeps a third of it free
 * rather than growing until rows stop moving.
 */
export const WATCHLIST_LIMIT = 20;

export const WATCHLIST_FULL = `Your watchlist holds ${WATCHLIST_LIMIT} names, the most that stay live on one connection — remove one to add another.`;
export const WATCHLIST_BAD_SYMBOL =
  "That doesn't read as a ticker — letters only, up to five (a class share like BRK.B is fine).";

/** A member's typed symbol as the list stores it, or `undefined` when it isn't a ticker at all. */
export function normalizeWatchSymbol(raw: string): string | undefined {
  const symbol = raw.trim().toUpperCase();
  return UNDERLYING_PATTERN.test(symbol) ? symbol : undefined;
}

/** What adding a symbol does to a list: the new list, or the reason it stays as it is. */
export type WatchlistChange =
  | { readonly ok: true; readonly list: readonly WatchedSymbol[]; readonly changed: boolean }
  | { readonly ok: false; readonly reason: string };

/**
 * Add one name. Already-watched is `ok` with `changed: false`, never an error — a second tap on
 * the same star is the member asking for the state they already have, and a refusal there would
 * read as a failure where nothing failed.
 */
export function addToWatchlist(
  list: readonly WatchedSymbol[],
  raw: string,
  at: string,
): WatchlistChange {
  const symbol = normalizeWatchSymbol(raw);
  if (!symbol) return { ok: false, reason: WATCHLIST_BAD_SYMBOL };
  if (list.some((row) => row.symbol === symbol)) return { ok: true, list, changed: false };
  if (list.length >= WATCHLIST_LIMIT) return { ok: false, reason: WATCHLIST_FULL };
  return { ok: true, list: [...list, { symbol, at }], changed: true };
}

/** Remove one name. A name that isn't there is `ok` with `changed: false`, for the same reason. */
export function removeFromWatchlist(list: readonly WatchedSymbol[], raw: string): WatchlistChange {
  const symbol = normalizeWatchSymbol(raw);
  if (!symbol) return { ok: false, reason: WATCHLIST_BAD_SYMBOL };
  const kept = list.filter((row) => row.symbol !== symbol);
  return { ok: true, list: kept, changed: kept.length !== list.length };
}

/**
 * Fold an append-only ledger of adds and removes into the list standing now — the shape the
 * durable store reads back. Last line per symbol wins, and the surviving rows keep the order of
 * the add that put them there, so re-adding a removed name sends it to the end (it is a new
 * decision) while an untouched name never moves.
 */
export function foldWatchlistLines(
  lines: readonly { readonly symbol: string; readonly at: string; readonly removed?: boolean }[],
): readonly WatchedSymbol[] {
  const standing = new Map<string, WatchedSymbol>();
  for (const line of lines) {
    if (line.removed) standing.delete(line.symbol);
    else {
      standing.delete(line.symbol);
      standing.set(line.symbol, { symbol: line.symbol, at: line.at });
    }
  }
  return [...standing.values()];
}
