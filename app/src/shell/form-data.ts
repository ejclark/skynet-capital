import type { DeskActivityEvent } from "../live/desk";

/**
 * The Form strip's reading of the activity feed (#3689 slice 3b): the account's most recent
 * closing fills as wins and losses, the current win run, and the best run in what's loaded. A
 * close is any fill the round-trip matcher gave a realized P/L (`realizedTone`); opening fills
 * carry none and are skipped. A flat close breaks a streak without counting as a loss.
 *
 * "Best" is measured over the loaded page only (the activity endpoint's newest page), never
 * claimed as all-time; the strip says "in your last N closes".
 */

export type FormResult = "win" | "loss" | "flat";

export interface FormClose {
  readonly orderId: string;
  readonly display: string;
  readonly pl: string;
  readonly returnPct?: string;
  readonly result: FormResult;
  /** "9/22", in the viewer's zone. */
  readonly day: string;
}

export interface FormReading {
  /** Oldest → newest, so the strip reads left to right like a timeline. */
  readonly closes: readonly FormClose[];
  /** Consecutive wins ending at the newest close. */
  readonly streak: number;
  /** Longest win run anywhere in the loaded closes. */
  readonly best: number;
  /** Closes the reading looked at (≥ `closes.length` when capped). */
  readonly seen: number;
}

const toResult = (tone: string | undefined): FormResult =>
  tone === "pos" ? "win" : tone === "neg" ? "loss" : "flat";

function monthDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}/${d.getDate()}`;
}

export function readForm(events: readonly DeskActivityEvent[], show = 10): FormReading {
  // The feed is newest-first; keep only closing fills.
  const newestFirst = events.filter((e) => e.realizedTone !== undefined && e.realizedPl);
  let streak = 0;
  for (const e of newestFirst) {
    if (toResult(e.realizedTone) !== "win") break;
    streak += 1;
  }
  let best = 0;
  let run = 0;
  for (const e of newestFirst) {
    run = toResult(e.realizedTone) === "win" ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const closes = newestFirst
    .slice(0, show)
    .reverse()
    .map(
      (e): FormClose => ({
        orderId: e.orderId,
        display: e.display,
        pl: e.realizedPl ?? "",
        ...(e.returnPct ? { returnPct: e.returnPct } : {}),
        result: toResult(e.realizedTone),
        day: monthDay(e.at),
      }),
    );
  return { closes, streak, best, seen: newestFirst.length };
}

/** "4 wins in a row", "1 win in a row", or "" with no run going. */
export function streakLabel(streak: number): string {
  if (streak === 0) return "";
  return streak === 1 ? "1 win in a row" : `${streak} wins in a row`;
}
