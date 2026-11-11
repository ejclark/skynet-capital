/**
 * WHAT THE HOUSE ALREADY KNOWS about one company, sector or market — the read behind Moneypenny's
 * `get_research_on` (the Moneypenny operator plan, ASSESS).
 *
 * The gap it closes: asked about a name the house has a research ledger on, a campaign following
 * it, and lessons recorded against it, Moneypenny said the house had nothing, because none of her
 * tools read any of it. This module gathers the four answers from what is already checked in or
 * already kept:
 *   1. the shelf — whether a research ledger covers the name (`shelfResearched`, names only); for
 *      a sector, which of its names have one (`symbolsInSector`, the rule `coverageBySector` uses);
 *      for a market, whether the fund it is played through has one (`market-catalog.ts`);
 *   2. the house campaigns that follow it — the same "holds" rule `coveringCampaign` uses (a
 *      sector's campaign, a market's campaign or a cast holding its fund, a cast that names the
 *      ticker);
 *   3. the lessons recorded (tested, killed, on watch), each with its date, re-check date and
 *      falsifier as the house wrote them, marked stale once the re-check date has passed;
 *   4. whether a question about it already waits on the research list (`discovery-queue.ts`).
 *
 * MEMBER DATA STAYS THE MEMBER'S OWN. The research list holds other members' keys and words; this
 * read returns only counts (asks ahead, members who asked), never a key, a name, a campaign scope or
 * the question text. The one member-specific field, `onYourBook`, reads only the asking member's
 * own held names, passed in by the caller.
 *
 * A SECTOR OR MARKET IS NEVER "NOTHING" BY OMISSION. No campaign set in a sector does not mean the
 * house has not researched it: the ledgers are per ticker, so a sector read carries its names that
 * have one, and a market read checks its fund. Without that, a sector with five ledgers read empty.
 * A sector is also covered by series, not names — the house-price and home-sales ledgers are Real
 * Estate's (`SECTOR_MACRO_SERIES`, the rule the coverage map reads) — so a sector read counts those
 * too, and takes every lesson naming one of its companies, whichever campaign recorded it (#7442:
 * Real Estate read empty beside 32 such ledgers; Industrials beside a CMI lesson filed under a
 * Utilities campaign).
 *
 * ANSWERED ASKS ARE OFF THE LIST. The daily lane answers an ask by writing a finding to the shelf and
 * never touches the volume file, so the live reader drops answered asks at read time
 * (`withoutAnswered`), the way every dashboard reader of the list does.
 *
 * HONEST ABOUT THE WAIT. While no lane reads the research list (`LANE_READS_QUEUE`), the wait line
 * says so rather than promising a place in line that nothing honors — the same rule `tellMember`
 * follows.
 *
 * Read-only, paper only, educational: nothing here writes, and a lesson is never a recommendation.
 */
import { LESSON_RECORDS, type Lesson, type LessonRecord } from "../domain/campaign-lessons.js";
import { CAMPAIGNS, type Campaign, castSymbols } from "../domain/campaigns.js";
import { withoutAnswered } from "../domain/discovery-pass.js";
import {
  type DiscoveryAsk,
  type DiscoveryKind,
  type DiscoveryQueue,
  LANE_READS_QUEUE,
} from "../domain/discovery-queue.js";
import { marketById } from "../domain/market-catalog.js";
import { macroPrefixesFor, symbolsInSector } from "../domain/sector-coverage.js";
import { heldNames } from "./upcoming-events.js";

/** The most house campaigns one read lists. */
export const CAMPAIGN_ROWS = 3;
/** The most lessons one read lists; the rest are counted in `more`. */
export const LESSON_ROWS = 6;
/** The most names with a ledger one sector read lists; the rest are counted in `more`. */
export const LEDGER_NAME_ROWS = 12;

/** Said on every read, so no rendering of it can drop what house research is and is not. */
export const HOUSE_RESEARCH_NOTE =
  "Written by the house and reviewed before it is published. It says what was checked and what would prove it wrong. It is never a recommendation.";

const WAIT_UNREAD = "The house's research does not read the list yet, so no wait can be promised.";

export interface ResearchSubject {
  readonly kind: DiscoveryKind;
  /** A GICS sector's label, a `market-catalog.ts` id, or an uppercase ticker. */
  readonly subject: string;
}

/** One lesson as the house wrote it. `stale` is set only once its re-check date has passed. */
export interface HouseLessonRow {
  readonly kind: Lesson["kind"];
  readonly idea: string;
  readonly on: string;
  readonly recheckOn?: string;
  readonly falsifier?: string;
  readonly source: string;
  readonly stale?: true;
}

export interface HouseResearch {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** Names only: whether a research ledger on the shelf covers the ticker — for a market, the
   *  ticker of the fund it is played through. */
  readonly shelf?: "has a research ledger" | "no ledger yet";
  /** Markets only: the US-listed fund the market is played through. */
  readonly fund?: string;
  /** Sectors only: the names in the sector that have a research ledger, sorted, and how many more. */
  readonly ledgersInSector?: { readonly names: readonly string[]; readonly more: number };
  /** Sectors only: the macro series filed under the sector (`SECTOR_MACRO_SERIES`) with a ledger on
   *  the shelf, in the table's order, each with how many ledgers it has. */
  readonly seriesInSector?: readonly { readonly series: string; readonly ledgers: number }[];
  readonly campaigns: readonly {
    readonly id: string;
    readonly title: string;
    readonly storyline: string;
  }[];
  readonly lessons: readonly HouseLessonRow[];
  /** Lessons that matched but are not listed. */
  readonly more: number;
  /** Counts only — never a member key, name, campaign scope or question text. */
  readonly onTheList: {
    readonly waiting: boolean;
    readonly ahead?: number;
    readonly askedBy?: number;
  };
  readonly wait: string;
  /** Names only: whether the asking member holds it (an option reads as its underlying). */
  readonly onYourBook?: boolean;
  readonly notCovered: readonly ["news", "lawsuits"];
  readonly note: string;
}

export interface HouseResearchDeps {
  readonly isResearched: (ticker: string) => boolean;
  /** The shelf's ledger ids (`researchedEventIds`), for a sector's macro series; none by default. */
  readonly ledgerIds?: Iterable<string>;
  readonly queue: DiscoveryQueue;
  /** The asking member's own position symbols. */
  readonly held: readonly string[];
  /** The market day (YYYY-MM-DD) a re-check date is compared against. */
  readonly today: string;
  readonly laneReads?: boolean;
  readonly campaigns?: readonly Campaign[];
  readonly lessons?: readonly LessonRecord[];
  /** The names the directory files under a sector (`symbolsInSector` by default). */
  readonly namesInSector?: (sector: string) => readonly string[];
}

/** Whether a campaign follows the subject — `coveringCampaign`'s rule, without the ask scope. A
 *  market is also followed by a campaign whose cast holds the fund it is played through. */
function follows(c: Campaign, { kind, subject }: ResearchSubject): boolean {
  if (kind === "sector") return c.sector === subject;
  if (kind === "market") {
    const fund = marketById(subject)?.fund;
    return c.market === subject || (fund !== undefined && castSymbols(c).includes(fund));
  }
  return castSymbols(c).includes(subject);
}

function shelfLine(has: boolean): NonNullable<HouseResearch["shelf"]> {
  return has ? "has a research ledger" : "no ledger yet";
}

/** A sector's macro series with a ledger on the shelf — matched by id prefix, as
 *  `eventInSector` and the coverage map match them — named without the trailing dash. */
function seriesIn(sector: string, ledgerIds: Iterable<string>): HouseResearch["seriesInSector"] {
  const ids = [...ledgerIds];
  return macroPrefixesFor(sector)
    .map((prefix) => ({
      series: prefix.replace(/-$/, ""),
      ledgers: ids.filter((id) => id.startsWith(prefix)).length,
    }))
    .filter((s) => s.ledgers > 0);
}

/** What the shelf says, by kind: a name's own ledger, a sector's names and series with one, a
 *  market's fund. */
function shelfPart(
  ask: ResearchSubject,
  deps: HouseResearchDeps,
): Pick<HouseResearch, "shelf" | "fund" | "ledgersInSector" | "seriesInSector"> {
  if (ask.kind === "name") return { shelf: shelfLine(deps.isResearched(ask.subject)) };
  if (ask.kind === "sector") {
    const names = (deps.namesInSector ?? symbolsInSector)(ask.subject).filter((n) =>
      deps.isResearched(n),
    );
    return {
      ledgersInSector: {
        names: names.slice(0, LEDGER_NAME_ROWS),
        more: Math.max(0, names.length - LEDGER_NAME_ROWS),
      },
      seriesInSector: seriesIn(ask.subject, deps.ledgerIds ?? []),
    };
  }
  const fund = marketById(ask.subject)?.fund;
  return fund ? { fund, shelf: shelfLine(deps.isResearched(fund)) } : {};
}

function lessonRow(l: Lesson, today: string): HouseLessonRow {
  return {
    kind: l.kind,
    idea: l.idea,
    on: l.on,
    ...(l.recheckOn ? { recheckOn: l.recheckOn } : {}),
    ...(l.falsifier ? { falsifier: l.falsifier } : {}),
    source: l.source,
    ...(l.recheckOn && l.recheckOn < today ? { stale: true as const } : {}),
  };
}

/** The lessons that bear on the subject: for a name, every lesson listing it; for a sector or a
 *  market, every lesson of the campaigns that follow it — and, for a sector, every lesson listing
 *  one of its companies, whichever campaign recorded it. Each lesson once, newest first. */
function matchingLessons(
  ask: ResearchSubject,
  followed: readonly Campaign[],
  records: readonly LessonRecord[],
  namesInSector: (sector: string) => readonly string[],
): Lesson[] {
  const ids = new Set(followed.map((c) => c.id));
  const names = new Set(ask.kind === "sector" ? namesInSector(ask.subject) : []);
  const bears = (r: LessonRecord, l: Lesson): boolean =>
    ask.kind === "name"
      ? l.symbols.includes(ask.subject)
      : ids.has(r.campaign) || (ask.kind === "sector" && l.symbols.some((s) => names.has(s)));
  const found = records.flatMap((r) => r.lessons.filter((l) => bears(r, l)));
  return [...found].sort((a, b) => (a.on < b.on ? 1 : a.on > b.on ? -1 : 0));
}

/** Where the subject stands on the research list — every ask about it, bare or inside a campaign,
 *  counted; `ahead` is the place of the earliest one. */
function listStanding(ask: ResearchSubject, queue: DiscoveryQueue): HouseResearch["onTheList"] {
  const at = queue.findIndex((a) => a.kind === ask.kind && a.subject === ask.subject);
  if (at < 0) return { waiting: false };
  const askers = new Set(
    queue.filter((a) => a.kind === ask.kind && a.subject === ask.subject).flatMap((a) => a.askers),
  );
  return { waiting: true, ahead: at, askedBy: askers.size };
}

function waitLine(onTheList: HouseResearch["onTheList"], laneReads: boolean): string {
  if (!laneReads) return WAIT_UNREAD;
  if (!onTheList.waiting) return "No question about it is waiting on the research list.";
  const ahead = onTheList.ahead ?? 0;
  return ahead === 0
    ? "It is next in line for the house's research."
    : `${ahead} ask${ahead === 1 ? " is" : "s are"} ahead of it on the research list.`;
}

/** What the house already holds on one company, sector or market. Pure: every source injected. */
export function houseResearchOn(ask: ResearchSubject, deps: HouseResearchDeps): HouseResearch {
  const followed = (deps.campaigns ?? CAMPAIGNS).filter((c) => follows(c, ask));
  const lessons = matchingLessons(
    ask,
    followed,
    deps.lessons ?? LESSON_RECORDS,
    deps.namesInSector ?? symbolsInSector,
  );
  const onTheList = listStanding(ask, deps.queue);
  const isName = ask.kind === "name";
  return {
    kind: ask.kind,
    subject: ask.subject,
    ...shelfPart(ask, deps),
    campaigns: followed
      .slice(0, CAMPAIGN_ROWS)
      .map((c) => ({ id: c.id, title: c.title, storyline: c.storyline })),
    lessons: lessons.slice(0, LESSON_ROWS).map((l) => lessonRow(l, deps.today)),
    more: Math.max(0, lessons.length - LESSON_ROWS),
    onTheList,
    wait: waitLine(onTheList, deps.laneReads ?? LANE_READS_QUEUE),
    ...(isName ? { onYourBook: heldNames(deps.held).includes(ask.subject) } : {}),
    notCovered: ["news", "lawsuits"],
    note: HOUSE_RESEARCH_NOTE,
  };
}

/** The companion's reader: one checked subject and the member's own held names in, the answer out. */
export type ReadResearchOn = (ask: ResearchSubject, held: readonly string[]) => HouseResearch;

/** Where a live reader gets each source, read fresh on every call. */
export interface HouseResearchSources {
  /** The shelf's ledger check (`shelfResearched`), read fresh on every call. */
  readonly shelf: () => (ticker: string) => boolean;
  /** The shelf's ledger ids (`researchedEventIds`), read fresh on every call — a sector's macro
   *  series. Unset, a sector read counts no series. */
  readonly ledgerIds?: () => Iterable<string>;
  readonly queue: () => DiscoveryQueue;
  /** Whether the shelf already answers an ask (`shelfAnswered`); an answered ask is dropped from
   *  the list before it is counted, so a question the house answered never reads as waiting. */
  readonly answered: (ask: DiscoveryAsk) => boolean;
  readonly today: () => string;
  readonly laneReads?: boolean;
  readonly campaigns?: readonly Campaign[];
  readonly lessons?: readonly LessonRecord[];
}

/** Bind the sources once at boot. A research list that cannot be read reads as empty, never a
 *  thrown tool: the rest of the answer still stands. */
export function createHouseResearchReader(sources: HouseResearchSources): ReadResearchOn {
  return (ask, held) => {
    let queue: DiscoveryQueue = [];
    try {
      queue = withoutAnswered(sources.queue(), sources.answered);
    } catch {
      queue = [];
    }
    return houseResearchOn(ask, {
      isResearched: sources.shelf(),
      ...(sources.ledgerIds ? { ledgerIds: sources.ledgerIds() } : {}),
      queue,
      held,
      today: sources.today(),
      ...(sources.laneReads === undefined ? {} : { laneReads: sources.laneReads }),
      ...(sources.campaigns ? { campaigns: sources.campaigns } : {}),
      ...(sources.lessons ? { lessons: sources.lessons } : {}),
    });
  };
}
