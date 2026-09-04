/**
 * The playbook PROBE — one producer for "what shape is this play, actually?".
 *
 * A playbook answers one question per cycle ("what should my book look like right now?"), so the
 * only honest way to describe it is to ASK it, day by day, around a synthetic print. Both readers
 * of that answer — the discovery shelves (`playbook-collections.ts`) and the Playbook Store's
 * catalog (`playbook-store.ts`, issue #885 — supersedes the old Trading Outpost's `play-cards.ts`,
 * retired) — share this module rather than each running their own walk, so a play can never be
 * described one way on a shelf and a different way on its card.
 *
 * The roster comes from whatever `src/playbooks/registry.ts` exports — a new exported play is
 * probed the moment it lands, with nothing here to update. (`src/playbooks/**` is envelope-
 * protected: this module only ever reads it.)
 */
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import type { Playbook } from "../playbooks/playbook.js";
import * as playbookRegistry from "../playbooks/registry.js";

/** A synthetic print, far enough out that the real checked-in calendar can never collide with it. */
const PRINT_DATE = "2026-09-30";
/** 10:00 ET — mid-session, before any same-day exit rule fires. */
const MID_SESSION = "T14:00:00Z";
/** 16:00 ET — past the close, the moment a print-day play must already be flat. */
const AFTER_THE_BELL = "T20:00:00Z";
/** How far back the window probe walks. Every house window is well inside a month. */
const LOOKBACK_DAYS = 25;

const isPlaybook = (value: unknown): value is Playbook =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  "symbol" in value &&
  typeof (value as Playbook).desiredState === "function";

/** Every play the registry exports, id-sorted so the shelves and the cards read stably. */
export function housePlaybooks(): Playbook[] {
  return Object.values(playbookRegistry)
    .filter(isPlaybook)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function isoDaysBefore(days: number, time: string): string {
  const ms = Date.parse(`${PRINT_DATE}T00:00:00Z`) - days * 86_400_000;
  return `${new Date(ms).toISOString().slice(0, 10)}${time}`;
}

const calendarFor = (symbol: string, status: EarningsPrint["status"]): EarningsPrint[] => [
  { symbol, date: PRINT_DATE, status, source: "PROBE: synthetic date, discovery window probe" },
];

export interface WindowProbe {
  /** Days-before-the-print on which the play wants to be long, given a CONFIRMED date. */
  readonly longDays: readonly number[];
  /** Still long after the close of day D, or the morning after. */
  readonly holdsThePrint: boolean;
  /** Opens the same window when the date is only an estimate. */
  readonly opensOnAnEstimate: boolean;
}

export function probeWindow(playbook: Playbook): WindowProbe {
  const confirmed = calendarFor(playbook.symbol, "confirmed");
  const longDays: number[] = [];
  for (let days = LOOKBACK_DAYS; days >= 0; days--) {
    if (playbook.desiredState(isoDaysBefore(days, MID_SESSION), confirmed) === "long") {
      longDays.push(days);
    }
  }
  const opensAt = longDays[0];
  return {
    longDays,
    holdsThePrint:
      playbook.desiredState(isoDaysBefore(0, AFTER_THE_BELL), confirmed) === "long" ||
      playbook.desiredState(isoDaysBefore(-1, MID_SESSION), confirmed) === "long",
    opensOnAnEstimate:
      opensAt !== undefined &&
      playbook.desiredState(
        isoDaysBefore(opensAt, MID_SESSION),
        calendarFor(playbook.symbol, "estimate"),
      ) === "long",
  };
}

/**
 * "D-20 to D-6", or "D-20 to the close of day D" when the play runs right up to the release. A
 * window with a hole in it is spelled out day by day rather than smoothed into a range that lies.
 */
export function spanOf(probe: WindowProbe): string {
  const { longDays } = probe;
  const opensAt = longDays[0];
  const closesAt = longDays[longDays.length - 1];
  if (opensAt === undefined || closesAt === undefined) {
    return "no window at all";
  }
  if (!longDays.every((day, i) => i === 0 || day === opensAt - i)) {
    return `on D-${longDays.join(", D-")}`;
  }
  return closesAt === 0 ? `D-${opensAt} to the close of day D` : `D-${opensAt} to D-${closesAt}`;
}

/** The research doc a play cites, as its route on the existing research shelf. */
export function evidenceHref(playbook: Playbook): string | undefined {
  const slug = playbook.evidence.match(/docs\/research\/([\w./-]+)\.md/)?.[1];
  return slug ? `/research/${slug}` : undefined;
}
