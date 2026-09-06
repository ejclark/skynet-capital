/**
 * THE DAY-LENS FOG (#1704 slice 4; docs/FOG-OF-WAR.md). The research shelf's day lens is the
 * same-day view that pays out like a zero-DTE trade, so it is held behind rung 501 — the zero-DTE
 * rung #1671 proposes. Until that rung is built, the fog says so in words rather than implying
 * progress is possible ("a rung nobody can fill yet stays locked, honestly"). Experience sees
 * through it: a member with the wheels off is not fogged. Unknown (no plays payload) reads as
 * open — the day lens is not safety information, and failing closed on a fetch error would fog
 * the wrong people for the wrong reason.
 */
import type { PlaysIndex } from "./options";

export const DAY_LENS_RUNG = "501";

export interface DayLensFog {
  readonly fogged: boolean;
  /** The door's label — what is behind it and what opens it. Empty when not fogged. */
  readonly reason: string;
}

export function dayLensFog(plays: PlaysIndex | undefined): DayLensFog {
  if (!(plays && plays.wheels)) return { fogged: false, reason: "" };
  const rung = plays.plays.find(
    (p) => p.code === (DAY_LENS_RUNG as PlaysIndex["plays"][number]["code"]),
  );
  if (rung?.earned) return { fogged: false, reason: "" };
  return {
    fogged: true,
    reason: rung
      ? `Held until rung ${DAY_LENS_RUNG} (zero-DTE) is earned — the same-day view pays out like a same-day trade.`
      : `Held until rung ${DAY_LENS_RUNG} (zero-DTE) — that rung is not built yet (#1671); wheels off sees through.`,
  };
}
