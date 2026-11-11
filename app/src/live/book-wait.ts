import { useQueries } from "@tanstack/react-query";
import type { BookWaitState } from "../../../src/domain/book-wait";
import { type BookDesk, type BookWaitDay, underlyingOf } from "./book-events";
import { addDays } from "./horizon-range";
import { postJson } from "./post";

/**
 * THE WAIT ON A BOOK, CLIENT SIDE (#4608 slice 2) — the member's own call to hold off on one
 * account, with the day the question reopens and why. The record, its rules and its owner gate are
 * slice 1's (`src/domain/book-wait.ts`, `src/server/book-wait-routes.ts`); this module reads it,
 * writes it, and offers the held names' next prints as reopen days (the brief's recommended
 * default: a print is the day a held name's question naturally reopens).
 *
 *   GET  /api/book-wait?participantId=…  → { wait: null | BookWaitState }
 *   POST /api/book-wait/set   { participantId, reopensOn, reason } → { ok, error? } (400: the sentence)
 *   POST /api/book-wait/clear { participantId }                    → { ok, error? }
 *
 * A wait answers to the account's owner alone; anyone else gets the route's 404, which reads here
 * as "no wait" — never another member's call.
 */

export type { BookWaitState };

export const bookWaitKey = (deskId: string) => ["book-wait", deskId] as const;

export async function fetchBookWait(deskId: string): Promise<BookWaitState | null> {
  const res = await fetch(`/api/book-wait?participantId=${encodeURIComponent(deskId)}`, {
    credentials: "same-origin",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`book-wait ${res.status}`);
  const body = (await res.json()) as { readonly wait: BookWaitState | null };
  return body.wait;
}

/** Each account's wait as a reopen day for the book's calendar — the accounts with none drop out.
 *  A wait that could not be read is left off rather than guessed. */
export function useBookWaitDays(deskIds: readonly string[]): BookWaitDay[] {
  const reads = useQueries({
    queries: deskIds.map((id) => ({ queryKey: bookWaitKey(id), queryFn: () => fetchBookWait(id) })),
  });
  return deskIds.flatMap((deskId, i) => {
    const state = reads[i]?.data;
    return state ? [{ deskId, reopensOn: state.wait.reopensOn, reason: state.wait.reason }] : [];
  });
}

export interface BookWaitWrite {
  readonly ok: boolean;
  readonly error?: string;
}

/** Record (or replace) the wait. A refusal throws with the sentence the form shows. */
export const setBookWait = (input: {
  readonly participantId: string;
  readonly reopensOn: string;
  readonly reason: string;
}): Promise<BookWaitWrite> => postJson("/api/book-wait/set", input);

export const clearBookWait = (participantId: string): Promise<BookWaitWrite> =>
  postJson("/api/book-wait/clear", { participantId });

/** The furthest a reopen day may sit — the server's `MAX_WAIT_DAYS`, said once for the picker. */
const MAX_DAYS = 366;

/** The days the picker allows: tomorrow through a year out, the server's own bounds. */
export const reopenBounds = (today: string): { readonly min: string; readonly max: string } => ({
  min: addDays(today, 1),
  max: addDays(today, MAX_DAYS),
});

export interface PrintChoice {
  readonly symbol: string;
  readonly at: string;
  readonly estimated: boolean;
}

/**
 * The held names' next earnings prints, as one-tap reopen days: each name once, inside the
 * picker's bounds, soonest first. An `unknown` print has no day and is never offered; an estimate
 * says so beside it.
 */
export function printChoices(desk: BookDesk["desk"] | undefined, today: string): PrintChoice[] {
  if (!desk) return [];
  const { min, max } = reopenBounds(today);
  const bySymbol = new Map<string, PrintChoice>();
  for (const position of desk.positions) {
    const print = position.nextPrint;
    if (!print || print.status === "unknown" || print.at < min || print.at > max) continue;
    const symbol = underlyingOf(position.symbol);
    if (!bySymbol.has(symbol))
      bySymbol.set(symbol, { symbol, at: print.at, estimated: print.status === "estimate" });
  }
  return [...bySymbol.values()].sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : a.symbol.localeCompare(b.symbol),
  );
}
