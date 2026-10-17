import { isCalendarDay } from "../subscriptions/subscription-state.js";

/**
 * WHAT A CLAIM CARRIES ONCE THE SYSTEM HAS LOOKED AT IT (#5482 slice 3, criterion 2). A conviction
 * claim is one of three things after its pass, and the type makes the three exclusive:
 *
 *   studied     a research instrument measures what the claim asserts; it ran ONCE on a stated data
 *               date and its verdict (call · confidence · why · the dated falsifier) is attached.
 *   offer       no instrument measures it, but the claim can be scored on a day: the system offers to
 *               register a forward test. REGISTERING is the event lanes' job (they own
 *               `docs/research/forward-tests/<event-id>.md`); this marker writes none of their ledgers.
 *   untestable  neither: labelled so, at size zero.
 *
 * A verdict never sizes a trade. A conviction only narrows a playbook (criterion 3) and the
 * playbook picks its own size and timing, so a studied claim carries no `size` at all; an offer and
 * an untestable claim are pinned to `size: 0` so no later reader can mistake an unmeasured claim for
 * a weighted one. Paper only, educational.
 */

/** The instruments a claim can map to. Each is a script under `scripts/research/`. */
export type ClaimInstrument = "premium-fit" | "cycle-phase" | "earnings-cycle";
export const CLAIM_INSTRUMENTS: readonly ClaimInstrument[] = [
  "premium-fit",
  "cycle-phase",
  "earnings-cycle",
];

/** How the study bears on the claim: it backs it, splits, or cuts against it. Not a size. */
export type StudyReading = "supports" | "mixed" | "against";
export const STUDY_READINGS: readonly StudyReading[] = ["supports", "mixed", "against"];

/** The instruments grade themselves `low` or `medium` only; a dozen episodes never earn `high`. */
export type StudyConfidence = "low" | "medium" | "high";
export const STUDY_CONFIDENCES: readonly StudyConfidence[] = ["low", "medium", "high"];

/** The call sheet's row (docs/process/EVENT-RESEARCH.md): call · confidence · why · falsifier. */
export interface ClaimVerdict {
  readonly reading: StudyReading;
  /** One line: what the data says to do about the claim. Never a size or an order. */
  readonly call: string;
  readonly confidence: StudyConfidence;
  readonly why: string;
  /** The claim's own dated falsifier, carried onto the verdict so the tape can adjudicate it. */
  readonly falsifier: string;
  /** `YYYY-MM-DD`: when the claim is scored, if the record set one. */
  readonly scoreBy?: string;
  /** The figures the call rests on, so a reader can check it against the instrument. */
  readonly numbers: Readonly<Record<string, number | string>>;
}

export interface StudiedClaim {
  readonly disposition: "studied";
  readonly instrument: ClaimInstrument;
  /** What the instrument measures, in the words a member would use. */
  readonly measures: string;
  readonly symbol: string;
  /** `YYYY-MM-DD`: the last session the study could see. A study is not re-run for the same day. */
  readonly dataDate: string;
  /** The data's own timestamp when it has one (a chain quote), so a mid-session read says so. */
  readonly dataAsOf?: string;
  readonly verdict: ClaimVerdict;
}

export interface ForwardTestOffer {
  readonly disposition: "offer";
  readonly size: 0;
  readonly reason: string;
  /** What the event lane would register: the claim, its falsifier, the day it is scored. */
  readonly forwardTest: {
    readonly hypothesis: string;
    readonly falsifier: string;
    readonly scoreBy: string;
  };
}

export interface UntestableClaim {
  readonly disposition: "untestable";
  readonly size: 0;
  readonly reason: string;
}

export type ClaimStudy = StudiedClaim | ForwardTestOffer | UntestableClaim;

const DAY_IN_TEXT = /\d{4}-\d{2}-\d{2}/g;
/** Empty, or missing: entries are read from a JSON file, so a field may not be there at all. */
const blank = (value: string | undefined): boolean => !value || value.trim().length === 0;
const namesADay = (text: string): boolean => (text.match(DAY_IN_TEXT) ?? []).some(isCalendarDay);

function verdictProblems(v: ClaimVerdict): string[] {
  const problems: string[] = [];
  if (!STUDY_READINGS.includes(v.reading)) problems.push("reading is not supports/mixed/against");
  if (!STUDY_CONFIDENCES.includes(v.confidence)) problems.push("confidence is not graded");
  if (blank(v.call)) problems.push("call is empty");
  if (blank(v.why)) problems.push("why is empty");
  if (blank(v.falsifier)) problems.push("falsifier is empty");
  else if (v.scoreBy === undefined && !namesADay(v.falsifier)) {
    problems.push("the falsifier is not dated (name a day, or set scoreBy)");
  }
  if (v.scoreBy !== undefined && !isCalendarDay(v.scoreBy)) {
    problems.push("scoreBy is not a calendar day");
  }
  return problems;
}

/**
 * Every rule an attached study breaks, in words; empty means it may be served. The contract is the
 * research call sheet's: a studied claim names its instrument, symbol and data date and carries a
 * graded, dated verdict; an offer and an untestable claim are pinned to size zero.
 */
export function studyProblems(study: ClaimStudy): readonly string[] {
  switch (study.disposition) {
    case "untestable":
      return [
        ...sizeProblems(study, "an untestable claim"),
        ...(blank(study.reason) ? ["an untestable claim says why"] : []),
      ];
    case "offer":
      return offerProblems(study);
    case "studied":
      return study.verdict ? studiedProblems(study) : ["a studied claim carries a verdict"];
    default:
      return ["disposition is not studied/offer/untestable"];
  }
}

const sizeProblems = (study: { size?: unknown }, what: string): string[] =>
  study.size === 0 ? [] : [`${what} carries size zero`];

function offerProblems(study: ForwardTestOffer): string[] {
  const problems = sizeProblems(study, "an offered claim");
  if (blank(study.reason)) problems.push("an offer says why no study ran");
  const f = study.forwardTest;
  if (!f || blank(f.hypothesis)) problems.push("the forward test has no hypothesis");
  if (!(f && isCalendarDay(f.scoreBy))) problems.push("the forward test needs a score-by day");
  if (!f || blank(f.falsifier)) problems.push("the forward test has no falsifier");
  return problems;
}

function studiedProblems(study: StudiedClaim): string[] {
  const problems: string[] = [];
  if (!CLAIM_INSTRUMENTS.includes(study.instrument)) problems.push("instrument is unknown");
  if (blank(study.symbol)) problems.push("symbol is empty");
  if (!isCalendarDay(study.dataDate)) problems.push("dataDate is not a calendar day");
  if ("size" in study) problems.push("a verdict never sizes a trade");
  problems.push(...verdictProblems(study.verdict));
  return problems;
}
