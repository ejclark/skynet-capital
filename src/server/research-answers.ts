/**
 * WHAT CAME BACK FROM THE MEMBER'S OWN RESEARCH QUESTIONS — the read behind Moneypenny's
 * `get_my_research_questions` tool (#7286, named next slice 2: "research answers come back to the
 * chat").
 *
 * WHY. A member can put a question on the research list (`POST /api/campaigns/ask`, and from the
 * chat once #7286 slice 1's card lands), and since #7211 a daily lane researches it. But nothing in
 * the chat could say what happened next, so "did my question about X get answered?" had no honest
 * answer. This joins the three records that already hold it, read fresh on every call:
 *   - the research list on the volume (`discovery-queue.ts`): a question still waiting, and where
 *     it stands in line;
 *   - the campaign question log (`campaign-questions.ts`): a question asked inside a campaign,
 *     which outlives the list once the lane takes it;
 *   - the findings: a write-up on the research shelf (`docs/research/discovery/<slug>.md`, whose
 *     existence is what marks an ask answered, `discovery-answered.ts`) and, in a house campaign,
 *     the lessons whose `answers` names the ask.
 *
 * ONLY THE REQUESTER'S OWN QUESTIONS. The list and the log key askers by an opaque member id,
 * never an email. A question is returned only when that id is among its askers, and what comes
 * back about other people is a count: the question's wording is returned only when this member
 * was the first to ask it (the record keeps the first asker's words, so a joiner would otherwise
 * read someone else's sentence), and a member campaign is named only as "your campaign" or "a
 * party campaign", never by its author's key. No key or no match returns an empty list.
 *
 * ONE GAP, SAID OUT LOUD. A question asked outside any campaign lives only on the list, and the
 * list drops an answered ask the next time anyone asks something (`withoutAnswered` on write). After
 * that nothing records that this member asked it, so it falls out of this read; its write-up is
 * still on the shelf. The tool's `note` says so rather than implying the question was lost.
 *
 * Read-only: no store here is written. Paper only; educational. A finding is never a reason to buy
 * or sell, and nothing here places, sizes or cancels an order.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lesson } from "../domain/campaign-lessons.js";
import { lessonsAnswering } from "../domain/campaign-lessons.js";
import { type FindingView, findingOf, type QuestionLog } from "../domain/campaign-questions.js";
import { campaignById } from "../domain/campaigns.js";
import { shelfFileFor, withoutAnswered } from "../domain/discovery-pass.js";
import {
  type DiscoveryAsk,
  type DiscoveryKind,
  type DiscoveryQueue,
  LANE_READS_QUEUE,
  passesUntil,
} from "../domain/discovery-queue.js";
import { createCampaignQuestionsStore } from "./campaign-questions-store.js";
import { shelfAnswered } from "./discovery-answered.js";
import { createDiscoveryQueueStore, discoveryPerPass } from "./discovery-queue-store.js";

/** The most questions one read returns, newest first; `more` counts the rest. */
export const MAX_RETURNED = 8;
/** The longest opening line quoted from a write-up. */
export const OPENING_MAX = 280;
/**
 * When the daily research pass starts, in UTC — the cron in `.github/workflows/moneypenny-discovery.yml`
 * ("23 13 * * *"). The workflow file is Eric's (envelope.json), so this copy is pinned to it by
 * `tests/server/research-answers.spec.ts`: a schedule change there turns that spec red.
 */
export const DAILY_PASS_UTC = "13:23";

type Askish = Pick<DiscoveryAsk, "kind" | "subject" | "campaign">;

/** One of the member's own questions and where it stands. */
export interface MyResearchQuestion {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** The member's own words; absent when they joined someone else's question or gave none. */
  readonly question?: string;
  readonly askedAt: string;
  /** Where it was asked: a house campaign's title, "your campaign", or "a party campaign". */
  readonly askedIn?: string;
  /**
   * `answered`: a write-up or a lesson answers it. `waiting`: still on the list. `no-finding-yet`:
   * it left the list and no finding is on the shelf yet (a write-up may still be in review).
   */
  readonly state: "answered" | "waiting" | "no-finding-yet";
  /** Waiting only: asks ahead of it on the list, and about how many daily passes until it is taken. */
  readonly ahead?: number;
  readonly passes?: number;
  /** How many other members asked the same thing. A count, never who. */
  readonly othersAsking: number;
  /** The write-up's path on the research shelf, when one exists. */
  readonly writeUp?: string;
  /** The write-up's first line of text (its first call), quoted as written. */
  readonly opening?: string;
  /** House campaign lessons that answer it, quoted as recorded (the campaign questions' own shape). */
  readonly findings: readonly FindingView[];
}

export interface MyResearchQuestions {
  readonly questions: readonly MyResearchQuestion[];
  /** Questions beyond `MAX_RETURNED`, not shown. */
  readonly more: number;
  /** One sentence on when research reads the list. */
  readonly wait: string;
  readonly note: string;
}

/** What the read joins; every source is read at call time, so a new ask shows on the next turn. */
export interface ResearchAnswersSources {
  /** The research list as stored on the volume, answered asks included. */
  readonly queue: () => DiscoveryQueue;
  /** Questions asked inside a campaign. */
  readonly log: () => QuestionLog;
  /** Whether the research shelf holds a write-up for the ask. */
  readonly answered: (ask: Askish) => boolean;
  /** The first line of text in the ask's write-up, or undefined. */
  readonly opening: (ask: Askish) => string | undefined;
  /** House campaign lessons whose `answers` is the ask's id. */
  readonly findings: (campaign: string, askId: string) => readonly Lesson[];
  /** Asks the lane takes per daily pass. */
  readonly perPass: () => number;
  /** Whether a lane reads the list at all (`LANE_READS_QUEUE`). */
  readonly laneReads?: boolean;
}

/** Bound to the member by the caller; `undefined` (no resolvable member) reads nothing. */
export type ReadMyResearchQuestions = (memberKey: string | undefined) => MyResearchQuestions;

const NOTE =
  "Only questions you asked. A question asked outside a campaign drops off once it is answered and the list next changes; its write-up stays on the research shelf. A finding is the house's research, never a reason to buy or sell.";

/** When research reads the list, in one sentence: a time only when a lane actually reads it. */
export function waitSentence(laneReads: boolean = LANE_READS_QUEUE): string {
  return laneReads
    ? `The house's research pass runs once a day at about ${DAILY_PASS_UTC} UTC. A finding shows once its write-up is reviewed and merged, so it can land later than the pass.`
    : "The house's research doesn't read this list yet, so there is no wait to promise.";
}

/** Where a question was asked, without ever naming another member's key. */
function askedInLabel(scope: string | undefined, memberKey: string): string | undefined {
  if (!scope) return undefined;
  const house = campaignById(scope);
  if (house) return house.title;
  return scope.startsWith(`${memberKey}~`) ? "your campaign" : "a party campaign";
}

interface Mine {
  readonly id: string;
  readonly kind: DiscoveryKind;
  readonly subject: string;
  readonly campaign?: string;
  readonly askedAt: string;
  readonly question?: string;
  readonly othersAsking: number;
}

/** The member's own asks, from the list and the log, one per ask id (the list's entry first). */
function ownAsks(queue: DiscoveryQueue, log: QuestionLog, memberKey: string): readonly Mine[] {
  const byId = new Map<string, Mine>();
  for (const a of queue) {
    if (!a.askers.includes(memberKey)) continue;
    byId.set(a.id, {
      id: a.id,
      kind: a.kind,
      subject: a.subject,
      ...(a.campaign ? { campaign: a.campaign } : {}),
      askedAt: a.askedAt,
      ...(a.askers[0] === memberKey && a.question ? { question: a.question } : {}),
      othersAsking: a.askers.length - 1,
    });
  }
  for (const q of log) {
    if (byId.has(q.id) || !q.askers.some((a) => a.key === memberKey)) continue;
    byId.set(q.id, {
      id: q.id,
      kind: q.kind,
      subject: q.subject,
      campaign: q.campaign,
      askedAt: q.askedAt,
      ...(q.askers[0]?.key === memberKey && q.question ? { question: q.question } : {}),
      othersAsking: q.askers.length - 1,
    });
  }
  return [...byId.values()];
}

/** What every question in one read is judged against. */
interface Judge {
  readonly sources: ResearchAnswersSources;
  readonly memberKey: string;
  /** The list without answered asks: what "ahead" counts. */
  readonly waiting: DiscoveryQueue;
  readonly perPass: number;
  readonly laneReads: boolean;
}

/** Where one of the member's asks stands, and how long the wait is when it waits. */
function standing(
  m: Mine,
  j: Judge,
  answered: boolean,
): Pick<MyResearchQuestion, "state" | "ahead" | "passes"> {
  if (answered) return { state: "answered" };
  const ahead = j.waiting.findIndex((a) => a.id === m.id);
  if (ahead < 0) return { state: "no-finding-yet" };
  // No lane reading the list means no pass to count: the place in line, never a time.
  return j.laneReads
    ? { state: "waiting", ahead, passes: passesUntil(ahead, j.perPass) }
    : { state: "waiting", ahead };
}

function viewOf(m: Mine, j: Judge): MyResearchQuestion {
  const house = m.campaign && campaignById(m.campaign) ? m.campaign : undefined;
  const findings = house ? j.sources.findings(house, m.id).map(findingOf) : [];
  const onShelf = j.sources.answered(m);
  const opening = onShelf ? j.sources.opening(m) : undefined;
  const askedIn = askedInLabel(m.campaign, j.memberKey);
  return {
    kind: m.kind,
    subject: m.subject,
    ...(m.question ? { question: m.question } : {}),
    askedAt: m.askedAt,
    ...(askedIn ? { askedIn } : {}),
    ...standing(m, j, findings.length > 0 || onShelf),
    othersAsking: m.othersAsking,
    ...(onShelf ? { writeUp: shelfFileFor(m) } : {}),
    ...(opening ? { opening } : {}),
    findings,
  };
}

/**
 * The member's own research questions, newest first, each joined to the list and to what research
 * found. A key that matches nothing, or no key, answers an empty list.
 */
export function myResearchQuestions(
  sources: ResearchAnswersSources,
  memberKey: string | undefined,
): MyResearchQuestions {
  const laneReads = sources.laneReads ?? LANE_READS_QUEUE;
  const frame = { wait: waitSentence(laneReads), note: NOTE };
  if (!memberKey) return { questions: [], more: 0, ...frame };
  const raw = sources.queue();
  const judge: Judge = {
    sources,
    memberKey,
    waiting: withoutAnswered(raw, sources.answered),
    perPass: sources.perPass(),
    laneReads,
  };
  const views = ownAsks(raw, sources.log(), memberKey).map((m) => viewOf(m, judge));
  views.sort((a, b) => b.askedAt.localeCompare(a.askedAt));
  return {
    questions: views.slice(0, MAX_RETURNED),
    more: Math.max(0, views.length - MAX_RETURNED),
    ...frame,
  };
}

/**
 * The first line of text in a write-up: past any front matter and headings, a list marker and
 * bold markers stripped, capped at `OPENING_MAX`. The lane writes the call first
 * (`.github/prompts/discovery-research.md`), so this is normally the first call.
 */
export function openingLine(markdown: string): string | undefined {
  let inFront = false;
  const lines = markdown.split(/\r?\n/);
  for (const [i, raw] of lines.entries()) {
    const line = raw.trim();
    if (i === 0 && line === "---") {
      inFront = true;
      continue;
    }
    if (inFront) {
      if (line === "---") inFront = false;
      continue;
    }
    if (line === "" || line.startsWith("#") || line.startsWith("<!--")) continue;
    const text = line
      .replace(/^([-*+]|\d+\.)\s+/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (text) return text.length > OPENING_MAX ? `${text.slice(0, OPENING_MAX - 1)}…` : text;
  }
  return undefined;
}

/** Read a write-up's opening line off the shelf under `root`; any read failure answers undefined. */
export function shelfOpening(root: string = process.cwd()): (ask: Askish) => string | undefined {
  return (ask) => {
    const file = join(root, shelfFileFor(ask));
    try {
      return existsSync(file) ? openingLine(readFileSync(file, "utf8")) : undefined;
    } catch {
      return undefined;
    }
  };
}

/**
 * The deployed reader: read-only handles on the research list and the question log (the access
 * wiring holds the writing ones, `dashboard-access.ts`; each store reads its file fresh per load),
 * the shelf and the checked-in lesson records.
 */
export function createResearchAnswersReader(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): ReadMyResearchQuestions {
  const queue = createDiscoveryQueueStore(env, onReadError);
  const log = createCampaignQuestionsStore(env, onReadError);
  return (memberKey) =>
    myResearchQuestions(
      {
        queue: () => queue.load(),
        log: () => log.load(),
        answered: shelfAnswered(),
        opening: shelfOpening(),
        findings: lessonsAnswering,
        perPass: () => discoveryPerPass(),
      },
      memberKey,
    );
}

/**
 * The chat's handle: bound at boot to a desk id, resolved to its owner's opaque member id the same
 * way the companion's other per-member logs are (`dashboard-companion.ts`, `logKeyFor`). The desk
 * is the session's own, resolved server-side (`companion-routes.ts`), never a model-supplied id.
 */
export type ReadDeskResearchQuestions = (participantId: string) => MyResearchQuestions;

/** The dispatcher's answer, in `CompanionToolResult`'s shape (kept structural, so this file and
 *  `companion-tools.ts` don't import each other). Takes no model input at all. */
export function researchQuestionsResult(
  read: ReadDeskResearchQuestions | undefined,
  participantId: string | undefined,
):
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string } {
  if (!participantId) return { ok: false, error: "no linked desk" };
  if (!read) return { ok: false, error: "research questions aren't available on this deployment" };
  return { ok: true, result: read(participantId) };
}
