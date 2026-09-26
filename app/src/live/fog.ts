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
  /** The door's short name — `reason`'s opening words without the why. The VISIBLE line beside a
   *  fogged chip (dead end 8: a reason only in `title` is invisible on a phone; the crawl's probe
   *  reads the chip's own box for the reason's first words, so the two must open alike). */
  readonly door: string;
}

export function dayLensFog(plays: PlaysIndex | undefined): DayLensFog {
  if (!(plays && plays.wheels)) return { fogged: false, reason: "", door: "" };
  const rung = plays.plays.find(
    (p) => p.code === (DAY_LENS_RUNG as PlaysIndex["plays"][number]["code"]),
  );
  if (rung?.earned) return { fogged: false, reason: "", door: "" };
  return {
    fogged: true,
    door: `Held until rung ${DAY_LENS_RUNG} (zero-DTE)`,
    reason: rung
      ? `Held until rung ${DAY_LENS_RUNG} (zero-DTE) is earned — the same-day view pays out like a same-day trade.`
      : `Held until rung ${DAY_LENS_RUNG} (zero-DTE) — that rung is not built yet (#1671); wheels off sees through.`,
  };
}
