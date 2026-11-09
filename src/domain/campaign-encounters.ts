/**
 * CAMPAIGN ENCOUNTERS — the explore and find-names questions a campaign's landscape and lesson
 * record generate (#6952 slice 3, criteria 2–4), and the door to build a strategy's (slice 4).
 *
 * The ask (Eric, 2026-11-06): "use a campaign to drive education through this process to discover
 * opportunities with specific stocks". Slice 1 wrote energy for AI's encounters by hand
 * (docs/research/energy-ai-encounters.md); this module writes them from the records, so any
 * campaign, house or member, gets them the day it exists.
 *
 * A MODE IS A SET OF ENCOUNTERS, NEVER A SCREEN (criterion 6). `encountersFor` returns what the
 * narrator posts in the campaign's mode: explore questions, find-names candidates, or build a
 * strategy's names, each handed to a form that already exists (campaign-strategy.ts). Play posts
 * live encounters from #6948, not from here, and says so.
 *
 * THE QUESTION COMES FIRST (criterion 2). An explore encounter is a question and its choices; the
 * house's answer is only reachable through `reveal`, which takes the member's pick. `pose` is the
 * encounter with the answer removed: what a screen shows before the member answers.
 *
 * EVERY CLAIM CARRIES ITS MARK (criterion 2). An answer is a list of `Claim`s, each with a mark, a
 * source and a date. The mark is campaigns.ts's three: measured, reported, or estimated. Criterion
 * 2 names two, and campaigns.ts explains the third: a date the calendar projected from a cadence is
 * neither, and calling it either would overstate it.
 *
 * OLD RESEARCH IS SAID TO BE OLD (criterion 3). Research older than `STALE_AFTER_DAYS` is labelled
 * with its age, and lands in `rechecks`: the list a discovery takes before anything resting on it is
 * shown as current. The house's verdict on a name, and why a stale one reads "check first" or still
 * stands aside, is campaign-verdicts.ts's, shared with build a strategy.
 *
 * STANDING ASIDE IS A REAL ANSWER (criterion 4). Every find-names candidate offers the same three
 * choices in the same shape: watch, enter at starter paper size, stand aside. No choice is marked
 * as the default or the recommendation. The house's verdict, and the lesson it rests on, are
 * revealed after the pick, like an explore answer: a lesson's words often carry its verdict ("nearest
 * to enterable"), so before the pick a check says only that a finding exists, and when.
 *
 * Pure: everything it reads is handed in. Paper only; educational. An encounter never places, sizes
 * or recommends an order: "enter at starter paper size" is the member's pick to be scored, and
 * orders come only from play mode's own ticket (#6948).
 */
import type { DateMark, Landscape, Move, Scheduled, Tested } from "./campaign-landscape.js";
import { scheduledShown, signed } from "./campaign-landscape-lines.js";
import { type DiscoveryBrief, proposable, type Withheld } from "./campaign-lessons.js";
import {
  type StrategyEncounter,
  type StrategyMember,
  strategyEncounters,
} from "./campaign-strategy.js";
import {
  type Claim,
  type HouseCall,
  houseCall,
  isFund,
  lessonClaim,
  lessonsNaming,
  type Stale,
  staleOf,
} from "./campaign-verdicts.js";
import { type Campaign, type CampaignMode, castSymbols, type Evidence } from "./campaigns.js";

export interface Choice {
  readonly id: string;
  readonly label: string;
}

export const EXPLORE_TOPICS = ["moved-most", "together", "date", "evidence", "tested"] as const;
export type ExploreTopic = (typeof EXPLORE_TOPICS)[number];

export interface ExploreEncounter {
  readonly kind: "explore";
  readonly id: string;
  readonly topic: ExploreTopic;
  readonly question: string;
  readonly choices: readonly Choice[];
  readonly answer: { readonly choice: string; readonly claims: readonly Claim[] };
  readonly stale?: Stale;
}

/** The same three choices on every candidate, in the same shape (criterion 4). */
export const NAME_CHOICES: readonly Choice[] = [
  { id: "watch", label: "Watch it" },
  { id: "enter", label: "Enter at starter paper size" },
  { id: "stand-aside", label: "Stand aside" },
];

export interface Check {
  /** What was checked: "The house's record", "Price", "Next report", an instrument's name. */
  readonly label: string;
  readonly text: string;
  /** Absent when the check found nothing to claim ("not run", "no closes read"). */
  readonly claim?: Claim;
}

export interface NameEncounter {
  readonly kind: "find-names";
  readonly id: string;
  readonly symbol: string;
  readonly role: string;
  readonly question: string;
  readonly choices: readonly Choice[];
  readonly checks: readonly Check[];
  readonly house: HouseCall & {
    /** Every lesson that names the symbol, as claims: part of the reveal, never the posed screen. */
    readonly record: readonly Claim[];
  };
}

export type Encounter = ExploreEncounter | NameEncounter | StrategyEncounter;

/** Something a discovery checks again before it is shown as current. */
export interface Recheck {
  readonly subject: string;
  readonly why: string;
}

/** One instrument result for one symbol, from a symbol-sweep run (the find-names checks). */
export interface SweepResult {
  readonly instrument: (typeof SWEEP_INSTRUMENTS)[number];
  readonly result: string;
  readonly on: string;
  readonly source: string;
}

/** The symbol-sweep instruments a find-names candidate is checked by (.claude/workflows/symbol-sweep.js). */
export const SWEEP_INSTRUMENTS = ["earnings-cycle", "intraday-edges"] as const;

export interface EncounterInputs {
  readonly landscape: Landscape;
  /** `startDiscovery(<campaign scope>, landscape.today)`: the lesson record, read first. */
  readonly brief: DiscoveryBrief;
  /** The mode to post for; the campaign's own mode (play when absent) by default. */
  readonly mode?: CampaignMode;
  /** Sweep results by symbol. A symbol with none says the instrument has not run, never "no edge". */
  readonly sweep?: Readonly<Record<string, readonly SweepResult[]>>;
  /** The member's picks, pairs and bots: what build a strategy's doors open on (campaign-strategy.ts). */
  readonly member?: StrategyMember;
}

export interface EncounterSet {
  readonly campaign: string;
  readonly mode: CampaignMode;
  readonly today: string;
  readonly encounters: readonly Encounter[];
  /** Names a live kill keeps out of find-names, with the kill (criterion 8). */
  readonly withheld: readonly Withheld[];
  readonly rechecks: readonly Recheck[];
  /** Why a mode posts nothing here, when it does not. */
  readonly note?: string;
}

// ── Explore ───────────────────────────────────────────────────────────────────────────────────

const moveClaim = (m: Move): Claim => ({
  text: `${m.symbol} ${signed(m.changePct)} (close ${m.from.date} to close ${m.to.date})`,
  mark: "measured",
  source: m.source,
  date: m.to.date,
});

/** Which of up to four names moved furthest. The choices are alphabetical, so order gives nothing away. */
function movedMost(l: Landscape, names: readonly Move[]): ExploreEncounter | undefined {
  const top = names[0];
  if (!top) return undefined;
  // A name tied with the top move (to the tenth the read rounds to) would be a second right answer.
  const far = Math.abs(top.changePct);
  const shown = [
    top,
    ...names
      .slice(1)
      .filter((m) => Math.abs(m.changePct) !== far)
      .slice(0, 3),
  ];
  if (shown.length < 2) return undefined;
  return {
    kind: "explore",
    id: `${l.campaign.id}:moved-most:${l.today}`,
    topic: "moved-most",
    question: `Over the last ${l.moved.sessions} sessions, which of these moved furthest, up or down?`,
    choices: [...shown]
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .map((m) => ({ id: m.symbol, label: m.symbol })),
    answer: { choice: top.symbol, claims: shown.map(moveClaim) },
  };
}

const TOGETHER: readonly Choice[] = [
  { id: "under-third", label: "Fewer than a third of them" },
  { id: "middle", label: "Between a third and two thirds" },
  { id: "over-two-thirds", label: "More than two thirds" },
];

/** How many of the names fell together: the lesson that a sector can trade as one bet. */
function together(l: Landscape, names: readonly Move[]): ExploreEncounter | undefined {
  if (names.length < 3) return undefined;
  const fell = names.filter((m) => m.changePct < 0).length;
  const share = fell / names.length;
  const choice = share < 1 / 3 ? "under-third" : share > 2 / 3 ? "over-two-thirds" : "middle";
  const last =
    names
      .map((m) => m.to.date)
      .sort()
      .at(-1) ?? l.today;
  return {
    kind: "explore",
    id: `${l.campaign.id}:together:${l.today}`,
    topic: "together",
    question: `Over the last ${l.moved.sessions} sessions, how many of the ${names.length} names in this campaign fell?`,
    choices: TOGETHER,
    answer: {
      choice,
      claims: [
        {
          text: `${fell} of ${names.length} fell; ${names.length - fell} rose or held.`,
          mark: "measured",
          source: names[0]?.source ?? "daily closes",
          date: last,
        },
      ],
    },
  };
}

const DATE_CHOICES: readonly Choice[] = [
  { id: "confirmed", label: "Confirmed by the source itself" },
  { id: "estimated", label: "Estimated from its usual timing" },
  { id: "reported", label: "Reported by press, not confirmed" },
];

/** The calendar's word for a date's certainty is a claim with its own mark. */
const DATE_MARK: Readonly<Record<DateMark, Evidence>> = {
  confirmed: "measured",
  estimated: "estimated",
  reported: "reported",
};

/**
 * The day a calendar source says it was last checked ("… checked 2026-08-15"), when it says one. A
 * date read from an old check is that old, whatever day the read runs (criterion 3).
 */
export function checkedOn(source: string): string | undefined {
  return source.match(/checked (\d{4}-\d{2}-\d{2})/)?.[1];
}

/** How sure the calendar is of the next date that matters: the cast's own prints first. */
function dateQuestion(l: Landscape): ExploreEncounter | undefined {
  const s: Scheduled | undefined = scheduledShown(l.scheduled, 1)[0];
  if (!s) return undefined;
  const words = DATE_CHOICES.find((c) => c.id === s.dateIs)?.label ?? s.dateIs;
  const checked = checkedOn(s.source) ?? l.today;
  const stale = staleOf(checked, l.today);
  return {
    kind: "explore",
    id: `${l.campaign.id}:date:${s.id}`,
    topic: "date",
    question: `"${s.title}" is on the calendar for ${s.date}. How sure is that date?`,
    choices: DATE_CHOICES,
    answer: {
      choice: s.dateIs,
      claims: [
        {
          text: `${s.date}: ${words.toLowerCase()}.`,
          mark: DATE_MARK[s.dateIs],
          source: s.source,
          date: checked,
        },
      ],
    },
    ...(stale ? { stale } : {}),
  };
}

const EVIDENCE_CHOICES: readonly Choice[] = [
  { id: "measured", label: "From the source itself: a filing or an official release" },
  { id: "reported", label: "Reported by press" },
];

/** What kind of evidence the newest headline is. */
function evidenceQuestion(l: Landscape): ExploreEncounter | undefined {
  const r = l.reported[0];
  if (!r) return undefined;
  const day = r.at.slice(0, 10);
  return {
    kind: "explore",
    id: `${l.campaign.id}:evidence:${day}:${r.url}`,
    topic: "evidence",
    question: `On ${day}, a headline: "${r.title}". What kind of evidence is it?`,
    choices: EVIDENCE_CHOICES,
    answer: {
      choice: r.evidence,
      claims: [
        {
          text:
            r.evidence === "measured"
              ? "It comes from the source itself."
              : "Press reported it; nothing here read the primary source.",
          mark: r.evidence,
          source: r.source,
          date: day,
        },
      ],
    },
  };
}

const TESTED_CHOICES: readonly Choice[] = [
  { id: "held", label: "Tested and scored: it held" },
  { id: "failed", label: "Tested and scored: it failed" },
  { id: "tested", label: "Tested, not scored yet" },
  { id: "untested", label: "Not tested yet" },
  { id: "untestable", label: "Nothing here can test it" },
];

function testedChoice(t: Tested): string {
  if (t.score?.outcome === "pass") return "held";
  if (t.score?.outcome === "fail") return "failed";
  if (t.tested) return "tested";
  return t.untestable === undefined ? "untested" : "untestable";
}

function testedClaim(t: Tested, today: string): Claim {
  const source = `${t.conviction}, claim ${t.claim}`;
  if (t.study)
    return {
      text: `${t.study.call} (${t.study.confidence} confidence).`,
      mark: "measured",
      source: `${source}: the claim study`,
      date: t.study.dataDate,
    };
  const s = t.score;
  const date = s?.scoredOn ?? today;
  if (t.statement === undefined)
    return {
      text: "No such claim is on record, so nothing has tested it.",
      mark: "measured",
      source,
      date: today,
    };
  if (t.tested)
    return { text: t.evidence ?? "The record cites its study.", mark: "reported", source, date };
  if (t.untestable !== undefined) return { text: t.untestable, mark: "reported", source, date };
  return { text: "Not tested yet: a forward test.", mark: "reported", source, date };
}

/** One open question of the campaign, answered by what the house's record says about its claim. */
function testedQuestion(l: Landscape, t: Tested): ExploreEncounter {
  const claim = testedClaim(t, l.today);
  const stale = t.study ? staleOf(t.study.dataDate, l.today) : undefined;
  return {
    kind: "explore",
    id: `${l.campaign.id}:tested:${t.conviction}:${t.claim}`,
    topic: "tested",
    question: `${t.question} What has the house done with it?`,
    choices: TESTED_CHOICES,
    answer: { choice: testedChoice(t), claims: [claim] },
    ...(stale ? { stale } : {}),
  };
}

function exploreEncounters(campaign: Campaign, l: Landscape): ExploreEncounter[] {
  const names = l.moved.moves.filter((m) => !isFund(campaign, m.symbol));
  return [
    movedMost(l, names),
    together(l, names),
    dateQuestion(l),
    evidenceQuestion(l),
    ...l.tested.map((t) => testedQuestion(l, t)),
  ].filter((e): e is ExploreEncounter => e !== undefined);
}

// ── Find names ────────────────────────────────────────────────────────────────────────────────

function checksFor(
  symbol: string,
  l: Landscape,
  brief: DiscoveryBrief,
  sweep: readonly SweepResult[],
): Check[] {
  // What a lesson says is its verdict, so before the pick the record check says only when and where.
  const checks: Check[] = lessonsNaming(symbol, brief).map((x) => ({
    label: "The house's record",
    text: `A finding from ${x.on} names it (${x.source}); what it says comes with the verdict.`,
  }));
  if (checks.length === 0)
    checks.push({ label: "The house's record", text: "No finding names it yet." });
  const move = l.moved.moves.find((m) => m.symbol === symbol);
  const moved = move ? moveClaim(move) : undefined;
  checks.push(
    moved
      ? { label: "Price", text: moved.text, claim: moved }
      : { label: "Price", text: "No closes read: nothing here says how it moved." },
  );
  const report = l.scheduled.find(
    (s) => s.kind === "earnings" && s.reasons.some((r) => r.via === "cast" && r.symbol === symbol),
  );
  checks.push(
    report
      ? {
          label: "Next report",
          text: `${report.date} (${report.title})`,
          claim: {
            text: `${report.date}: ${report.title}`,
            mark: DATE_MARK[report.dateIs],
            source: report.source,
            date: checkedOn(report.source) ?? l.today,
          },
        }
      : { label: "Next report", text: "None on the calendar in the window." },
  );
  for (const instrument of SWEEP_INSTRUMENTS) {
    const r = sweep.find((s) => s.instrument === instrument);
    checks.push(
      r
        ? {
            label: instrument,
            text: r.result,
            claim: { text: r.result, mark: "measured", source: r.source, date: r.on },
          }
        : { label: instrument, text: `Not run on ${symbol} for this campaign yet.` },
    );
  }
  return checks;
}

/** The names find-names asks about: the cast's stocks, then names on watch the cast lacks. */
function candidates(
  campaign: Campaign,
  brief: DiscoveryBrief,
): {
  readonly names: readonly { symbol: string; role: string }[];
  readonly withheld: readonly Withheld[];
} {
  const roleOf = new Map<string, string>();
  for (const r of campaign.cast)
    for (const s of r.symbols) if (!roleOf.has(s)) roleOf.set(s, r.role);
  const cast = castSymbols(campaign).filter((s) => !isFund(campaign, s));
  const extra = [...brief.due, ...brief.watching, ...brief.reopened, ...brief.closed]
    .flatMap((x) => x.symbols)
    .filter((s, i, all) => !(roleOf.has(s) || isFund(campaign, s)) && all.indexOf(s) === i);
  // A cast name stays a candidate even when killed: it is in the story, and standing aside is the
  // lesson. A name outside the cast that a live kill closes is withheld, never proposed (criterion 8).
  const { propose, withheld } = proposable(brief, extra);
  return {
    names: [
      ...cast.map((symbol) => ({ symbol, role: roleOf.get(symbol) ?? "" })),
      ...propose.map((symbol) => ({ symbol, role: "On the house's watch" })),
    ],
    withheld,
  };
}

function nameEncounters(
  campaign: Campaign,
  inputs: EncounterInputs,
): { readonly encounters: NameEncounter[]; readonly withheld: readonly Withheld[] } {
  const { landscape: l, brief } = inputs;
  const { names, withheld } = candidates(campaign, brief);
  const encounters = names.map(({ symbol, role }) => ({
    kind: "find-names" as const,
    id: `${campaign.id}:find-names:${symbol}`,
    symbol,
    role,
    question: `${symbol}${role ? `, ${role.toLowerCase()}` : ""}: watch it, enter at starter paper size, or stand aside?`,
    choices: NAME_CHOICES,
    checks: checksFor(symbol, l, brief, inputs.sweep?.[symbol] ?? []),
    house: {
      ...houseCall(symbol, brief, l.today),
      record: lessonsNaming(symbol, brief).map(lessonClaim),
    },
  }));
  return { encounters, withheld };
}

// ── The set, and the question-first contract ───────────────────────────────────────────────────

/** Rechecks belong to the research modes: build a strategy only hands names to forms. */
function recheckOf(e: Encounter): Recheck | undefined {
  if (e.kind === "build-strategy") return undefined;
  if (e.kind === "explore")
    return e.stale
      ? { subject: e.id, why: `rests on research from ${e.stale.since}, ${e.stale.days} days old` }
      : undefined;
  return e.house.verdict === "check-first"
    ? { subject: `name:${e.symbol}`, why: e.house.why }
    : undefined;
}

const NOTHING_YET: Partial<Record<CampaignMode, string>> = {
  play: "Play posts live encounters on market moves (#6948), not from here.",
};

/** What the narrator posts for this campaign in its mode, generated from its landscape and lessons. */
export function encountersFor(campaign: Campaign, inputs: EncounterInputs): EncounterSet {
  const mode = inputs.mode ?? campaign.mode ?? "play";
  const base = { campaign: campaign.id, mode, today: inputs.landscape.today };
  const built =
    mode === "explore"
      ? { encounters: exploreEncounters(campaign, inputs.landscape), withheld: [] }
      : mode === "find-names"
        ? nameEncounters(campaign, inputs)
        : mode === "build-strategy"
          ? { encounters: [...strategyEncounters(campaign, inputs)], withheld: [] }
          : undefined;
  if (!built)
    return { ...base, encounters: [], withheld: [], rechecks: [], note: NOTHING_YET[mode] };
  const rechecks = built.encounters.map(recheckOf).filter((r): r is Recheck => r !== undefined);
  return { ...base, encounters: built.encounters, withheld: built.withheld, rechecks };
}

/**
 * An encounter as a screen shows it before the member answers: no answer, no verdict. A
 * build-strategy encounter hides nothing: it is not a question the tape scores, and the house's word
 * belongs beside the doors the member is choosing between.
 */
export type Posed =
  | Omit<ExploreEncounter, "answer" | "stale">
  | Omit<NameEncounter, "house">
  | StrategyEncounter;

export function pose(e: Encounter): Posed {
  if (e.kind === "build-strategy") return e;
  if (e.kind === "explore") {
    const { answer: _a, stale: _s, ...posed } = e;
    return posed;
  }
  const { house: _h, ...posed } = e;
  return posed;
}

export interface Revealed {
  readonly picked: string;
  /**
   * For explore: the pick matched the house's answer. For a name: it matched the house's verdict.
   * Absent when the house holds no verdict yet (check first), and on a build-strategy pick, which
   * opens a form (campaign-strategy.ts → `handOff`) rather than answering a question.
   */
  readonly matched?: boolean;
  readonly encounter: Encounter;
}

/** The house's answer, only in exchange for a pick that is one of the encounter's own choices. */
export function reveal(e: Encounter, picked: string): Revealed {
  if (!e.choices.some((c) => c.id === picked))
    throw new Error(`campaign-encounters: "${picked}" is not a choice on ${e.id}`);
  if (e.kind === "build-strategy") return { picked, encounter: e };
  const house = e.kind === "explore" ? e.answer.choice : e.house.verdict;
  if (house === "check-first") return { picked, encounter: e };
  return { picked, matched: picked === house, encounter: e };
}
