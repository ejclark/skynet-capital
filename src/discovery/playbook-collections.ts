/**
 * Playbook shelves, DERIVED — the same doctrine as the persona probes, applied to the other
 * catalog. A playbook answers one question per cycle ("what should my book look like right now?"),
 * so the honest way to describe its shape is to ASK it, day by day, around a synthetic print.
 *
 * The roster comes from whatever `src/playbooks/registry.ts` exports — a new exported play is
 * probed the moment it lands, with nothing here to update. (`src/playbooks/**` is envelope-
 * protected: this module only ever reads it.)
 */
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import type { Playbook } from "../playbooks/playbook.js";
import * as playbookRegistry from "../playbooks/registry.js";
import type { Collection, CollectionMember } from "./collection.js";

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

/** Every play the registry exports, id-sorted so the shelves read stably. */
function housePlaybooks(): Playbook[] {
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

interface WindowProbe {
  /** Days-before-the-print on which the play wants to be long, given a CONFIRMED date. */
  readonly longDays: readonly number[];
  /** Still long after the close of day D, or the morning after. */
  readonly holdsThePrint: boolean;
  /** Opens the same window when the date is only an estimate. */
  readonly opensOnAnEstimate: boolean;
}

function probeWindow(playbook: Playbook): WindowProbe {
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
function spanOf(probe: WindowProbe): string {
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
function evidenceHref(playbook: Playbook): string | undefined {
  const slug = playbook.evidence.match(/docs\/research\/([\w./-]+)\.md/)?.[1];
  return slug ? `/research/${slug}` : undefined;
}

function playbookMember(playbook: Playbook, evidence: string): CollectionMember {
  const href = evidenceHref(playbook);
  return {
    kind: "playbook",
    id: playbook.id,
    name: `${playbook.id} · ${playbook.symbol}`,
    thesis: playbook.thesis,
    evidence,
    ...(href ? { href } : {}),
  };
}

const AHEAD_OF_THE_PRINT = {
  id: "ahead-of-the-print",
  name: "Ahead of the Print",
  claim:
    "Walked day by day around a synthetic confirmed earnings date, the play wants to be long before the release and is out of the market by the time it lands.",
  blurb:
    "Dated windows, not opinions. Each of these plays opens on a confirmed print date, carries the run-up, and is flat before the number is public — the earnings gamble itself is never the trade.",
};

const CONFIRMED_DATES_ONLY = {
  id: "confirmed-dates-only",
  name: "Confirmed Dates Only",
  claim:
    "Re-run with the same date marked as an estimate rather than confirmed, the play refuses to open the window at all.",
  blurb:
    "The house date policy, visible in behaviour. An estimated print date may widen a safety window but may never key an entry — so these plays simply stay dark until a primary source confirms.",
};

/** Both playbook shelves, derived fresh from the registry's exported plays on each call. */
export function playbookCollections(): Collection[] {
  const probes = housePlaybooks().map((playbook) => ({ playbook, probe: probeWindow(playbook) }));
  return [
    {
      ...AHEAD_OF_THE_PRINT,
      members: probes
        .filter(({ probe }) => probe.longDays.length > 0 && !probe.holdsThePrint)
        .map(({ playbook, probe }) =>
          playbookMember(playbook, `Long ${spanOf(probe)}; flat before the release.`),
        ),
    },
    {
      ...CONFIRMED_DATES_ONLY,
      members: probes
        .filter(({ probe }) => probe.longDays.length > 0 && !probe.opensOnAnEstimate)
        .map(({ playbook, probe }) =>
          playbookMember(
            playbook,
            `Confirmed date: long ${spanOf(probe)}. Same date as an estimate: no position.`,
          ),
        ),
    },
  ];
}

/**
 * Registered plays no shelf claimed — rendered as an honest gap rather than dropped. A play that
 * held through a print, or one that opened on an estimate, would land here loudly.
 */
export function unshelvedPlaybooks(collections: readonly Collection[]): CollectionMember[] {
  const shelved = new Set(
    collections.flatMap((c) => c.members.filter((m) => m.kind === "playbook").map((m) => m.id)),
  );
  return housePlaybooks()
    .filter((playbook) => !shelved.has(playbook.id))
    .map((playbook) =>
      playbookMember(playbook, "No shelf probe recognised this play's window shape."),
    );
}
