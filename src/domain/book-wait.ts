import { daysBetween } from "./market-calendar.js";

/**
 * A WAIT ON THE WHOLE BOOK, WITH THE DAY IT REOPENS (#4608; `docs/members/eric.md` j4 s2). Position
 * guidance already makes "Wait" a first-class call on one position; this carries the same call on a
 * whole account: the member decided to hold off, wrote down why, and named the day the question
 * opens again. The owner's hypothesis (eric.md §4) is the reason the date is mandatory: "a 'wait'
 * call satisfies him only when it names the date it reopens; an open-ended wait reads as the app
 * having no opinion."
 *
 * What a wait is NOT: an order, an expiry control or a filter. It places and cancels nothing, the
 * chain still owns expiration (#3407/#3523), and it never hides a position flagged at risk — the
 * surfaces put it beside the decision pager, never over it. It is a reminder the member set.
 *
 * Days are `YYYY-MM-DD` in market time (`market-day.ts`), the same keys the book's calendar marks.
 * Pure: no clock, no I/O — the caller passes today.
 */

export interface BookWait {
  /** The market day the question opens again — always after the day the wait was set. */
  readonly reopensOn: string;
  /** The member's own line: why they are waiting. */
  readonly reason: string;
  /** ISO-8601: when the member set it. */
  readonly setAt: string;
}

/** What a reader is told about a recorded wait on a given day. */
export type BookWaitState =
  | { readonly state: "standing"; readonly wait: BookWait; readonly daysLeft: number }
  | { readonly state: "reopened"; readonly wait: BookWait };

/** One line, the length of a short sentence: enough to remember why, never an essay. */
export const MAX_WAIT_REASON = 140;
/** The furthest a reopen day may sit: a year. A wait past that is not a decision about this book. */
export const MAX_WAIT_DAYS = 366;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day in `YYYY-MM-DD` — "2026-02-31" is not one. */
export function isDayKey(raw: unknown): raw is string {
  if (typeof raw !== "string" || !DAY_KEY.test(raw)) return false;
  const at = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(at.getTime()) && at.toISOString().slice(0, 10) === raw;
}

/** The reason, trimmed and on one line, or undefined when it is empty or too long. */
export function cleanWaitReason(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const line = raw.replace(/\s+/g, " ").trim();
  return line.length > 0 && line.length <= MAX_WAIT_REASON ? line : undefined;
}

export type WaitInputError =
  | "no-reopen-day"
  | "reopen-day-not-ahead"
  | "reopen-day-too-far"
  | "no-reason";

/** Why a wait cannot be recorded, in the member's words — one line each, for the form to show. */
export const WAIT_INPUT_ERRORS: Readonly<Record<WaitInputError, string>> = {
  "no-reopen-day": "Pick the day the question opens again — a wait needs a date.",
  "reopen-day-not-ahead": "The day it reopens has to be after today.",
  "reopen-day-too-far": "Pick a day within the next year.",
  "no-reason": `Say why you're waiting, in one line of up to ${MAX_WAIT_REASON} characters.`,
};

/**
 * A wait the member asked for, checked: a real reopen day strictly after `today` and no more than
 * `MAX_WAIT_DAYS` ahead, and a one-line reason. There is no wait without a reopen day.
 */
export function bookWaitFrom(
  input: { readonly reopensOn: unknown; readonly reason: unknown },
  today: string,
  setAt: string,
):
  | { readonly ok: true; readonly wait: BookWait }
  | { readonly ok: false; readonly error: WaitInputError } {
  if (!isDayKey(input.reopensOn)) return { ok: false, error: "no-reopen-day" };
  const ahead = daysBetween(today, input.reopensOn);
  if (ahead < 1) return { ok: false, error: "reopen-day-not-ahead" };
  if (ahead > MAX_WAIT_DAYS) return { ok: false, error: "reopen-day-too-far" };
  const reason = cleanWaitReason(input.reason);
  if (!reason) return { ok: false, error: "no-reason" };
  return { ok: true, wait: { reopensOn: input.reopensOn, reason, setAt } };
}

/**
 * Standing until the reopen day; from that day on, the wait is retired and the question is open
 * again. The record stays until the member sets a new wait or clears it, so the app can say the
 * question reopened instead of silently dropping the call they made.
 */
export function bookWaitState(wait: BookWait, today: string): BookWaitState {
  const daysLeft = daysBetween(today, wait.reopensOn);
  return daysLeft > 0 ? { state: "standing", wait, daysLeft } : { state: "reopened", wait };
}
