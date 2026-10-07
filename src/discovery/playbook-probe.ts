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
import { nextSession, sessionsBefore } from "../domain/market-calendar.js";
import type { Playbook } from "../playbooks/playbook.js";
import * as playbookRegistry from "../playbooks/registry.js";

/** A synthetic print, far enough out that the real checked-in calendar can never collide with it. */
const PRINT_DATE = "2026-09-30";
/** 10:00 ET — mid-session, before any same-day exit rule fires. */
const MID_SESSION = "T14:00:00Z";
/** 16:00 ET — past the close, the moment a print-day play must already be flat. */
const AFTER_THE_BELL = "T20:00:00Z";
/** How far back the window probe walks, in TRADING SESSIONS — the unit the house windows count in
 *  (#4776). Every house window is well inside 25 sessions; D-20 before the synthetic print is 09-01,
 *  29 calendar days back, so a calendar walk would have drawn S1's window wrong. */
const LOOKBACK_SESSIONS = 25;

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

/** The instant `sessions` trading sessions before the synthetic print, at `time`. */
const isoSessionsBefore = (sessions: number, time: string): string =>
  `${sessionsBefore(PRINT_DATE, sessions)}${time}`;

const calendarFor = (symbol: string, status: EarningsPrint["status"]): EarningsPrint[] => [
  { symbol, date: PRINT_DATE, status, source: "PROBE: synthetic date, discovery window probe" },
];

export interface WindowProbe {
  /** Sessions-before-the-print on which the play wants to be long, given a CONFIRMED date. */
  readonly longSessions: readonly number[];
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
  const longSessions: number[] = [];
  for (let sessions = LOOKBACK_SESSIONS; sessions >= 0; sessions--) {
    if (playbook.desiredState(isoSessionsBefore(sessions, MID_SESSION), confirmed) === "long") {
      longSessions.push(sessions);
    }
  }
  const opensAt = longSessions[0];
  return {
    longSessions,
    holdsThePrint:
      playbook.desiredState(isoSessionsBefore(0, AFTER_THE_BELL), confirmed) === "long" ||
      playbook.desiredState(`${nextSession(PRINT_DATE)}${MID_SESSION}`, confirmed) === "long",
    opensOnAnEstimate:
      opensAt !== undefined &&
      playbook.desiredState(
        isoSessionsBefore(opensAt, MID_SESSION),
        calendarFor(symbol, "estimate"),
      ) === "long",
  };
}

/**
 * "20 to 6 sessions before the print", or "…to the close of print day" when the play runs right up
 * to the release. Says "sessions" because the D-numbers are trading sessions, not calendar days
 * (#4776). A window with a hole in it is spelled out session by session rather than smoothed into a
 * range that lies.
 */
export function spanOf(probe: WindowProbe): string {
  const { longSessions } = probe;
  const opensAt = longSessions[0];
  const closesAt = longSessions[longSessions.length - 1];
  if (opensAt === undefined || closesAt === undefined) {
    return "no window at all";
  }
  if (!longSessions.every((day, i) => i === 0 || day === opensAt - i)) {
    return `on sessions ${longSessions.join(", ")} before the print`;
  }
  return closesAt === 0
    ? `${opensAt} sessions before the print to the close of print day`
    : `${opensAt} to ${closesAt} sessions before the print`;
}

/** The research doc a citation names, as its route on the existing research shelf. */
export function researchHref(citation: string): string | undefined {
  const slug = citation.match(/docs\/research\/([\w./-]+)\.md/)?.[1];
  return slug ? `/research/${slug}` : undefined;
}

/** The research doc a play cites, as its route on the existing research shelf. */
export function evidenceHref(playbook: Playbook): string | undefined {
  return researchHref(playbook.evidence);
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
  if (probe.longSessions.length > 0 && !probe.holdsThePrint) {
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
  if (probe.longSessions.length > 0 && !probe.opensOnAnEstimate) {
    traits.push({
      id: "confirmed-dates-only",
      label: "Confirmed dates only",
      claim: "Re-run with the same date as an estimate rather than confirmed: no position at all.",
    });
  }
  return traits;
}
