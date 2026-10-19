import { type EarningsPrint, nextPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import type { PlaybookVerdictState } from "../domain/types.js";
import { type Playbook, readsLiveSignals } from "../playbooks/playbook.js";

/**
 * WHAT AN ARMED PLAYBOOK IS ACTUALLY WAITING FOR (#4450 slice 1, completing criterion 1: "an armed
 * one carries its next possible entry date where it has one").
 *
 * The roll call (`bot-heartbeat-view.ts`) shipped saying the same sentence about every armed
 * playbook — "Checked on every pass; it trades when its own condition holds." True, and not enough
 * to answer the question the roll call exists for. On the day this was written the house calendar
 * holds no confirmed NVDA print and only an ESTIMATED GOOG date, and a date-keyed playbook may open
 * a position on a confirmed date only (`earnings-calendar.ts` → date policy). So arming S1-NVDA and
 * G1-GOOG would have left the roll call reporting both as on and trading-when-their-condition-holds
 * while neither could open a window at all — the next "why are there still no trades?"
 *
 * THE HONESTY INVARIANTS.
 *  - `nextEntry` is found by ASKING the playbook — `desiredState`, one day at a time — never by
 *    re-deriving its window here. A second copy of S1's D-20..D-6 would drift from S1 itself, and
 *    this way an authored playbook's own window is read correctly for free.
 *  - Only a playbook BETWEEN windows gets a date. One already long or flat would scan to today, and
 *    "its window is open" above "next window: today" is a readout contradicting itself.
 *  - A cause is named only where the playbook declares what opens its window (`keyedOn`). "No
 *    confirmed print on the calendar" is the truth for a date-keyed playbook and a fabrication for
 *    anything else; a playbook whose window no date can predict is never told it has no day ahead
 *    of it, because nothing looked.
 */

/** What the roll call prints for one armed playbook. */
export interface PlaybookWindowRead {
  /** `YYYY-MM-DD` of the first day this playbook's own rule would open a position, when there is
   *  one inside the horizon. Null for a playbook whose window no date can predict, for one already
   *  inside or past its window, and for one with nothing inside the horizon. */
  readonly nextEntry: string | null;
  /** Why it is where it is, in one sentence a member can act on. */
  readonly reason: string;
  /** Set when its window would be open TODAY if these estimated print dates were confirmed: the
   *  window is due and only the company's date is missing (#4479 slice 2). The roll call shows such
   *  a playbook as waiting on a confirmed date, not waiting for its window. */
  readonly unconfirmed?: readonly UnconfirmedPrint[];
}

/** An estimated print date that is all that stands between a playbook and an open window. */
export interface UnconfirmedPrint {
  readonly symbol: string;
  /** `YYYY-MM-DD` of the estimate. */
  readonly date: string;
}

/** How far ahead `nextEntry` looks. A quarter covers the earnings cadence every date-keyed
 *  playbook is built on, so "nothing inside the horizon" is a finding rather than a short scan. */
export const NEXT_ENTRY_HORIZON_DAYS = 90;

/** Mid-session ET, as a UTC instant — the clock the forward scan asks each day's question at.
 *  G1-GOOG's print-day rule reads the ET wall clock (flat from 15:45), so a scan anchored at
 *  midnight would mis-read it; 18:30Z is early afternoon in either US offset. */
const SCAN_TIME_UTC = "T18:30:00Z";

function isoDayOffset(from: Date, days: number): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + days));
  return d.toISOString().slice(0, 10);
}

/** Whether a day-by-day scan can answer "when does this playbook next open?" at all. An
 *  event-keyed playbook's window turns on an outside signal, and a rule-chain playbook or a persona's
 *  own rules have no window to date, so asking any of them answers a question it does not have. */
function windowIsDatable(playbook: Playbook): boolean {
  return playbook.keyedOn !== "event" && !readsLiveSignals(playbook);
}

/** The first day inside the horizon on which this playbook's own rule says "long". `events` is
 *  empty: a date-keyed playbook ignores it, and an event-keyed one never reaches here. */
function nextEntryDate(
  playbook: Playbook,
  now: Date,
  calendar: readonly EarningsPrint[],
): string | null {
  for (let day = 0; day <= NEXT_ENTRY_HORIZON_DAYS; day++) {
    const date = isoDayOffset(now, day);
    if (playbook.desiredState(`${date}${SCAN_TIME_UTC}`, calendar, []) === "long") {
      return date;
    }
  }
  return null;
}

/** The first New York market day, from today on, on which the rule says "long" at the scan's
 *  clock — skipping a scan instant already behind `now`, so a day whose window has closed by now is
 *  never named as the day it would open. */
function laterEntryDate(
  playbook: Playbook,
  now: Date,
  calendar: readonly EarningsPrint[],
): string | null {
  const today = new Date(`${marketDayKey(now.toISOString())}T00:00:00Z`);
  for (let day = 0; day <= NEXT_ENTRY_HORIZON_DAYS; day++) {
    const date = isoDayOffset(today, day);
    const at = `${date}${SCAN_TIME_UTC}`;
    if (Date.parse(at) <= now.getTime()) continue;
    if (playbook.desiredState(at, calendar, []) === "long") return date;
  }
  return null;
}

/** A calendar diagnosis: the sentence, and the estimates holding an otherwise-open window. */
interface CalendarCause {
  readonly reason: string;
  readonly unconfirmed?: readonly UnconfirmedPrint[];
}

/**
 * Why a date-keyed playbook has no entry day ahead of it, read off the calendar it is keyed to. The
 * two causes read very differently: a symbol with no print date at all is waiting on research,
 * while an unconfirmed one is waiting on the company — and only a confirmed date opens a position.
 * Undiagnosable (a basket whose symbols disagree) returns undefined rather than naming one symbol's
 * cause for all of them.
 */
function calendarCause(
  playbook: Playbook,
  now: Date,
  calendar: readonly EarningsPrint[],
): CalendarCause | undefined {
  const asOf = now.toISOString();
  const prints = playbook.symbols.map((symbol) => ({
    symbol,
    print: nextPrint(symbol, asOf, calendar),
  }));
  if (prints.length === 0) return undefined;
  if (prints.every((p) => !p.print)) {
    const names = prints.map((p) => p.symbol).join(", ");
    return {
      reason: `On, but no print date is on the calendar for ${names}, so no window can open yet.`,
    };
  }
  // Every symbol must be dated AND unconfirmed for the estimate to be the whole cause: a basket
  // mixing an undated symbol with an estimated one would report a cause leaving the undated one
  // out, which is the half-truth the undiagnosable case exists to avoid.
  if (prints.every((p) => p.print && p.print.status !== "confirmed")) {
    const held = estimateHold(playbook, now, calendar);
    if (held) return held;
    const named = prints.map((p) => `${p.symbol} (${p.print?.date})`).join(", ");
    return {
      reason: `On, but the next print date for ${named} is an estimate — only a confirmed date opens a position.`,
    };
  }
  return undefined;
}

/**
 * What the estimate is actually costing (#4479 slice 2): ask the playbook again with its own
 * symbols' estimates read as confirmed. A window that would be open today is HELD by the estimate;
 * one that would open later is waiting for it, and gets the day. Nothing either way — the estimate
 * sits inside the dead zone, or past the horizon — and the plain estimate sentence stands.
 *
 * Asked, never counted: the issue's first sketch drew the line at "within 25 days of the print",
 * but S1-NVDA's D-20 is twenty TRADING SESSIONS (#4776), about four calendar weeks, so a day count
 * would call it "waiting" for the first days its window is due. A fixed number would also be a
 * fourth print-proximity horizon, which `PRINT_WINDOWS` exists to prevent.
 */
function estimateHold(
  playbook: Playbook,
  now: Date,
  calendar: readonly EarningsPrint[],
): CalendarCause | undefined {
  const mine = new Set(playbook.symbols);
  const asIfConfirmed = calendar.map((p) =>
    mine.has(p.symbol) && p.status === "estimate" ? { ...p, status: "confirmed" as const } : p,
  );
  // "Open now" is asked AT now, never at the scan's fixed clock: at 9:30 PM ET the UTC date is
  // already tomorrow, and a print-day rule that went flat at 15:45 ET is not open at 4 PM.
  const openNow = playbook.desiredState(now.toISOString(), asIfConfirmed, []) === "long";
  const wouldOpen = openNow
    ? marketDayKey(now.toISOString())
    : laterEntryDate(playbook, now, asIfConfirmed);
  if (!wouldOpen) return undefined;
  // The estimates the window would open on: each symbol's next print as of that moment.
  const asOf = openNow ? now.toISOString() : `${wouldOpen}${SCAN_TIME_UTC}`;
  const unconfirmed = playbook.symbols.flatMap((symbol): UnconfirmedPrint[] => {
    const print = nextPrint(symbol, asOf, calendar);
    return print && print.status !== "confirmed" ? [{ symbol, date: print.date }] : [];
  });
  if (unconfirmed.length === 0) return undefined;
  const named = unconfirmed.map((p) => `${p.symbol}'s ${p.date}`).join(", ");
  const one = unconfirmed.length === 1;
  const prints = one ? "print is still an estimate" : "prints are still estimates";
  if (openNow) {
    return {
      reason: `On, but ${named} ${prints} — its window would be open now if ${one ? "that date were" : "those dates were"} confirmed, and only a confirmed date opens a position.`,
      unconfirmed,
    };
  }
  return {
    reason: `On, but ${named} ${prints} — once ${one ? "it is" : "they are"} confirmed, its window would open ${wouldOpen}.`,
  };
}

/** Why an armed playbook between windows has nothing ahead of it. */
function waitingReason(
  playbook: Playbook,
  now: Date,
  calendar: readonly EarningsPrint[],
): CalendarCause {
  if (!windowIsDatable(playbook)) {
    return {
      reason: "On, watching for the signal its rule opens on — there is no date to wait for.",
    };
  }
  return (
    (playbook.keyedOn === "earnings" ? calendarCause(playbook, now, calendar) : undefined) ?? {
      reason: `On, with no day inside the next ${NEXT_ENTRY_HORIZON_DAYS} days on which its rule would open a position.`,
    }
  );
}

/**
 * One armed playbook's line: the date its window next opens, and what it is doing in plain words.
 * Pure — `now` and the calendar are both arguments.
 */
export function readPlaybookWindow(
  playbook: Playbook,
  state: PlaybookVerdictState,
  now: Date,
  calendar: readonly EarningsPrint[] = UPCOMING_PRINTS,
): PlaybookWindowRead {
  const names = playbook.symbols.join(", ");
  if (state === "tactical") {
    return {
      nextEntry: null,
      reason:
        "On, reading live price and sentiment every pass — there is no date window to wait for.",
    };
  }
  if (state === "observing") {
    return {
      nextEntry: null,
      reason: `On, observe-only — it records what it would buy and sell in ${names} and places nothing.`,
    };
  }
  if (state === "long") {
    return { nextEntry: null, reason: `On, and its window is open — it wants to hold ${names}.` };
  }
  if (state === "flat") {
    return {
      nextEntry: null,
      reason: `On, and its window has closed — it wants out of ${names}.`,
    };
  }
  const nextEntry = windowIsDatable(playbook) ? nextEntryDate(playbook, now, calendar) : null;
  if (nextEntry) return { nextEntry, reason: "On and waiting for its own window to open." };
  return { nextEntry, ...waitingReason(playbook, now, calendar) };
}
