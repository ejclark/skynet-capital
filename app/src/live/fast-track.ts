import type { FastTrackInput, Outcome } from "../../../src/domain/fast-track";
import { dayText } from "../../../src/options/position-guidance-rules";

/**
 * THE FIRST FAST TRACK'S DATA, AND WHERE ITS TICKET GOES (#7034 slice 2).
 *
 * One read (`GET /api/fast-track`) carries the fortnight's events with the house's stance and live
 * kill switches, and the member's own book. The walk itself is the engine's (`src/domain/fast-track.ts`
 * — `nextStep` picks the card, `choose` spends a tap), run here in the browser, so no card costs a
 * request or a model token.
 *
 * THE HAND-OFF. A finished ticket opens the trade form with the stop and the exit carried in the URL
 * (`?plan=<symbol>&stop=…&exit=…&note=…`). The trade form keeps the move type, the contract and
 * the size — the slice 1 default that holds the walk at 5 taps — and shows the carried plan above
 * the ticket, in the member's or the ledger's own words. It is a written plan, not an order rule:
 * nothing sells on it, and the trade form's review is still the gate.
 */

export const fastTrackKey = ["fast-track"] as const;

export async function fetchFastTrack(): Promise<FastTrackInput> {
  const res = await fetch("/api/fast-track", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET /api/fast-track → ${res.status}`);
  return (await res.json()) as FastTrackInput;
}

/** A plan's words in the URL are capped, so a pasted essay can't make the link unusable. */
export const PLAN_TEXT_MAX = 400;
const TICKER = /^[A-Z][A-Z0-9.]{0,9}$/;

/** The plan the trade form carries, read back from its search params. */
export interface CarriedPlan {
  readonly symbol: string;
  readonly stop: string;
  readonly exit: string;
  readonly note?: string;
}

/** Cut to the cap without splitting a surrogate pair: a lone half can't be URI-encoded, and the
 *  link that carries the plan would throw while rendering. */
export function capText(raw: string): string {
  const cut = raw.slice(0, PLAN_TEXT_MAX);
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

/** The trade form's search for a finished ticket: its symbol, and the plan beside it. */
export function ticketSearch(outcome: Extract<Outcome, { kind: "ticket" }>): {
  symbol: string;
  plan: string;
  stop: string;
  exit: string;
  note?: string;
} {
  const note = capText(outcome.notes.join(" · "));
  return {
    symbol: outcome.symbol,
    plan: outcome.symbol,
    stop: capText(outcome.stop.text),
    exit: capText(outcome.exit.text),
    ...(note ? { note } : {}),
  };
}

const text = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.trim() && raw.length <= PLAN_TEXT_MAX ? raw.trim() : undefined;

/** The trade form's `validateSearch` half: a plan only when its symbol, stop and exit all read. */
export function planSearch(
  search: Record<string, unknown>,
): Partial<Omit<CarriedPlan, "symbol"> & { plan: string }> {
  const plan = typeof search.plan === "string" ? search.plan.trim().toUpperCase() : "";
  const stop = text(search.stop);
  const exit = text(search.exit);
  if (!(TICKER.test(plan) && stop && exit)) return {};
  const note = text(search.note);
  return { plan, stop, exit, ...(note ? { note } : {}) };
}

/** The carried plan for the ticket's current symbol; a plan for another name shows nothing. */
export function carriedPlan(
  search: {
    readonly plan?: string;
    readonly stop?: string;
    readonly exit?: string;
    readonly note?: string;
  },
  symbol: string | undefined,
): CarriedPlan | undefined {
  const { plan, stop, exit, note } = search;
  if (!(plan && stop && exit && symbol === plan)) return undefined;
  return { symbol: plan, stop, exit, ...(note ? { note } : {}) };
}

/** "Nov 17 · date confirmed": an event's day, and whether it is known, in words (criterion 2). */
export function eventDateLine(date: string, dateWords: string): string {
  return `${dayText(date)} · ${dateWords}`;
}
