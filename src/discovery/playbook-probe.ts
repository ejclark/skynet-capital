/**
 * The playbook PROBE — one producer for "what shape is this play, actually?".
 *
 * A playbook answers one question per cycle ("what should my book look like right now?"), so the
 * only honest way to describe it is to ASK it, day by day, around a synthetic print. Both readers
 * of that answer is the R&D → Playbooks card (`playbook-store.ts`, #3623) — the window, the target
 * exposure and the proven traits all come from this one walk, so a card can never drift from what
 * the playbook does. (The retired Collections shelves read it too; see `docs/PATTERNS.md`.)
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
  "symbols" in value &&
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
  // desiredState() is uniform across a playbook's whole basket (playbook.ts's own doc), so probing
  // its first symbol characterizes the window for every symbol it trades.
  const symbol = playbook.symbols[0] ?? "";
  const confirmed = calendarFor(symbol, "confirmed");
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
        calendarFor(symbol, "estimate"),
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

/** A short, checkable claim about the play — derived by the probe, never hand-typed. */
export interface PlayTrait {
  readonly id: string;
  readonly label: string;
  /** What the probe actually observed, in words. The receipt behind the label. */
  readonly claim: string;
}

/** The traits a window probe proves. Moved here from the retired Plays cards (#3623) so the
 *  R&D → Playbooks card keeps them — "Flat before the release" and "Confirmed dates only" are also
 *  what the two playbook Collections shelves claimed, so this is their one surviving home. */
export function traitsOf(probe: WindowProbe): PlayTrait[] {
  const traits: PlayTrait[] = [];
  if (probe.longDays.length > 0 && !probe.holdsThePrint) {
    traits.push({
      id: "flat-before-the-release",
      label: "Flat before the release",
      claim: `Long ${spanOf(probe)}, and out of the market by the time the number is public.`,
    });
  }
  if (probe.holdsThePrint) {
    traits.push({
      id: "holds-the-print",
      label: "Holds the print",
      claim: "Still long when the number lands — the release itself is part of the bet.",
    });
  }
  if (probe.longDays.length > 0 && !probe.opensOnAnEstimate) {
    traits.push({
      id: "confirmed-dates-only",
      label: "Confirmed dates only",
      claim: "Re-run with the same date as an estimate rather than confirmed: no position at all.",
    });
  }
  return traits;
}
