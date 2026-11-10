/**
 * WHAT THE HOUSE ALREADY KNOWS about one company, sector or market — the read behind Moneypenny's
 * `get_research_on` (the Moneypenny operator plan, ASSESS).
 *
 * The gap it closes: asked about a name the house has a research ledger on, a campaign following
 * it, and lessons recorded against it, Moneypenny said the house had nothing, because none of her
 * tools read any of it. This module gathers the four answers from what is already checked in or
 * already kept:
 *   1. the shelf — whether a research ledger covers the name (`shelfResearched`, names only);
 *   2. the house campaigns that follow it — the same "holds" rule `coveringCampaign` uses (a
 *      sector's campaign, a market's campaign, a cast that names the ticker);
 *   3. the lessons recorded (tested, killed, on watch), each with its date, re-check date and
 *      falsifier as the house wrote them, marked stale once the re-check date has passed;
 *   4. whether a question about it already waits on the research list (`discovery-queue.ts`).
 *
 * MEMBER DATA STAYS THE MEMBER'S OWN. The research list holds other members' keys and words; this
 * read returns only counts (asks ahead, members who asked), never a key, a name, a campaign scope or
 * the question text. The one member-specific field, `onYourBook`, reads only the asking member's
 * own held names, passed in by the caller.
 *
 * HONEST ABOUT THE WAIT. While no lane reads the research list (`LANE_READS_QUEUE`), the wait line
 * says so rather than promising a place in line that nothing honors — the same rule `tellMember`
 * follows.
 *
 * Read-only, paper only, educational: nothing here writes, and a lesson is never a recommendation.
 */
import { LESSON_RECORDS, type Lesson, type LessonRecord } from "../domain/campaign-lessons.js";
import { CAMPAIGNS, type Campaign, castSymbols } from "../domain/campaigns.js";
import {
  type DiscoveryKind,
  type DiscoveryQueue,
  LANE_READS_QUEUE,
} from "../domain/discovery-queue.js";
import { heldNames } from "./upcoming-events.js";

/** The most house campaigns one read lists. */
export const CAMPAIGN_ROWS = 3;
/** The most lessons one read lists; the rest are counted in `more`. */
export const LESSON_ROWS = 6;

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
  /** Names only: whether a research ledger on the shelf covers the ticker. */
  readonly shelf?: "has a research ledger" | "no ledger yet";
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
  readonly queue: DiscoveryQueue;
  /** The asking member's own position symbols. */
  readonly held: readonly string[];
  /** The market day (YYYY-MM-DD) a re-check date is compared against. */
  readonly today: string;
  readonly laneReads?: boolean;
  readonly campaigns?: readonly Campaign[];
  readonly lessons?: readonly LessonRecord[];
}

/** Whether a campaign follows the subject — `coveringCampaign`'s rule, without the ask scope. */
function follows(c: Campaign, { kind, subject }: ResearchSubject): boolean {
  if (kind === "sector") return c.sector === subject;
  if (kind === "market") return c.market === subject;
  return castSymbols(c).includes(subject);
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
 *  market, every lesson of the campaigns that follow it. Newest first. */
function matchingLessons(
  ask: ResearchSubject,
  followed: readonly Campaign[],
  records: readonly LessonRecord[],
): Lesson[] {
  const ids = new Set(followed.map((c) => c.id));
  const found =
    ask.kind === "name"
      ? records.flatMap((r) => r.lessons.filter((l) => l.symbols.includes(ask.subject)))
      : records.filter((r) => ids.has(r.campaign)).flatMap((r) => r.lessons);
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
  const lessons = matchingLessons(ask, followed, deps.lessons ?? LESSON_RECORDS);
  const onTheList = listStanding(ask, deps.queue);
  const isName = ask.kind === "name";
  return {
    kind: ask.kind,
    subject: ask.subject,
    ...(isName
      ? {
          shelf: deps.isResearched(ask.subject)
            ? ("has a research ledger" as const)
            : ("no ledger yet" as const),
        }
      : {}),
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
  /** The shelf's ledger check (`shelfResearched`), called only for a name. */
  readonly shelf: () => (ticker: string) => boolean;
  readonly queue: () => DiscoveryQueue;
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
      queue = sources.queue();
    } catch {
      queue = [];
    }
    return houseResearchOn(ask, {
      isResearched: ask.kind === "name" ? sources.shelf() : () => false,
      queue,
      held,
      today: sources.today(),
      ...(sources.laneReads === undefined ? {} : { laneReads: sources.laneReads }),
      ...(sources.campaigns ? { campaigns: sources.campaigns } : {}),
      ...(sources.lessons ? { lessons: sources.lessons } : {}),
    });
  };
}
