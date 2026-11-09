import { LANE_READS_QUEUE } from "../../../src/domain/discovery-lane";
import { WHATS_COMING_UP } from "../../../src/domain/fast-track";
import type { EditionLine, EditionStory } from "./edition";
import { postJson } from "./post";

/**
 * THE LANDING PAGE'S ASKS (#7077 slice 2; docs/IA.md §5.9; docs/PATTERNS.md → *Your question
 * first*, *An ask beside each story*, *The instinct as a question*).
 *
 * Eric, #7018 round 1: "I like how the default is "whatever the customer wants to do", it's a subtle
 * nudge to let the user drive first, canned selections as fallbacks." So the page opens on the
 * member's own question, and at most two quick questions sit under it (criterion 2). Both go to the
 * chat, which already answers them with its tools: the calendar (`get_upcoming_events`, #7076) and
 * the member's book (`get_my_positions`). The first one opens its card walk in place instead
 * (#7034 slice 2, `shell/fast-track-walk.tsx`): the events, then one card per empty field of the
 * move, ending in the trade form with the stop and the exit filled in.
 *
 * Beside each story (criterion 5), two asks:
 *   - "Is this a chance to buy?" — the member's hunch as a question. The answer is THE RECORD, read
 *     from the story itself: its base rates (each with its sample size) and the house's call. It
 *     costs no model tokens and can never say more than the edition's checked lines say, and the
 *     page never calls it a buy (criterion 7).
 *   - "Ask your own" — asked inside the story's campaign (`POST /api/campaigns/ask`, #6952 slice
 *     2c), where it joins the research queue and the party sees it with the asker's display name
 *     ("Campaigns are communal", Eric 2026-11-07). The story lists what the party already asked
 *     about its names (`GET /api/campaigns/questions`, #6949 slice 6). A story with no names, or an
 *     edition with no campaign, sends the question to the chat instead, with the headline as its
 *     referent.
 */

/** The quick question that opens the fast track's card walk — the engine's own words. */
export const FAST_TRACK_QUESTION = WHATS_COMING_UP;

/** The fallbacks under the member's own question. At most two (criterion 2). */
export const QUICK_QUESTIONS = [FAST_TRACK_QUESTION, "How are my positions doing?"] as const;

/** A story's quick question: the member's instinct, answered by the record. */
export const INSTINCT_QUESTION = "Is this a chance to buy?";

/** Said under the record, whatever it holds: how often is not whether. */
export const RECORD_CODA =
  "The record says how often a move like this paid before, never whether this one will. Nothing here calls it a buy.";

/** Said when a story carries neither a base rate nor a house call. */
export const NO_RECORD =
  "No tested base rate or house call sits on this story yet, so the record can't answer that.";

/** The longest question a member may ask in a campaign (the server's `QUESTION_MAX`). */
export const QUESTION_MAX = 200;

/**
 * The record's answer to "Is this a chance to buy?": every line on the story that states a base
 * rate (it carries `n`, the loader's rule) or is the house's call, key facts first. Nothing is
 * composed here, so the answer can't claim more than the checked edition does.
 */
export function recordAnswer(story: EditionStory): readonly EditionLine[] {
  const fromFacts = story.facts
    .filter((f) => f.n !== undefined)
    .map(
      (f): EditionLine => ({
        text: [`${f.label}: ${f.value}`, f.note].filter(Boolean).join(" · "),
        mark: f.mark ?? "measured",
        source: "this story's key facts",
        ...(f.n === undefined ? {} : { n: f.n }),
      }),
    );
  const fromLines = story.more.filter((l) => l.n !== undefined || l.mark === "call");
  return [...fromFacts, ...fromLines];
}

/** Where a story's own question goes: its campaign when it can be asked there, else the chat. */
export type AskTarget =
  | { readonly kind: "campaign"; readonly campaign: string; readonly names: readonly string[] }
  | { readonly kind: "chat" };

export function askTarget(story: EditionStory, campaign: string | undefined): AskTarget {
  return campaign && story.symbols.length > 0
    ? { kind: "campaign", campaign, names: story.symbols }
    : { kind: "chat" };
}

/** A story's question for the chat, with the headline as its referent ("this" has one). */
export function chatQuestion(story: EditionStory, question: string): string {
  return `About "${story.headline}": ${question.trim()}`;
}

// ── What the party asked (GET /api/campaigns/questions) ─────────────────────────────────────────

/** A finding that answers a question, as the server lists it. */
export interface PartyFinding {
  readonly idea: string;
  readonly on: string;
  readonly source: string;
}

/** One question asked in the campaign, as every member who can read it sees it. */
export interface PartyQuestion {
  readonly kind: "sector" | "market" | "name";
  readonly subject: string;
  readonly question?: string;
  /** Display names, first asker first. Never an email. */
  readonly askedBy: readonly string[];
  readonly askedAt: string;
  readonly state: "found" | "waiting" | "on-the-shelf" | "no-finding-yet";
  readonly ahead?: number;
  readonly found: readonly PartyFinding[];
}

export async function fetchPartyQuestions(campaign: string): Promise<readonly PartyQuestion[]> {
  const res = await fetch(`/api/campaigns/questions?campaign=${encodeURIComponent(campaign)}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`questions ${res.status}`);
  const body = (await res.json()) as { readonly questions?: readonly PartyQuestion[] };
  // `{ ok: false }` (a campaign this member can't read) lists nothing, the same as no questions.
  return body.questions ?? [];
}

/** The questions about this story's names, newest first. */
export function storyQuestions(
  questions: readonly PartyQuestion[],
  story: EditionStory,
): readonly PartyQuestion[] {
  return questions
    .filter((q) => q.kind === "name" && story.symbols.includes(q.subject))
    .slice()
    .sort((a, b) => b.askedAt.localeCompare(a.askedAt));
}

/** "Ana", "Ana and Ben", "Ana and 2 others": who asked, by display name. */
export function askedByLine(names: readonly string[]): string {
  const [first, second] = names;
  if (!first) return "";
  if (names.length === 1) return first;
  if (names.length === 2) return `${first} and ${second}`;
  return `${first} and ${names.length - 1} others`;
}

/** Where a question stands, in words; never a guess at a finding that isn't there. */
export function questionState(q: PartyQuestion, laneReads: boolean = LANE_READS_QUEUE): string {
  if (q.state === "found") return q.found.length === 1 ? "Answered" : `${q.found.length} findings`;
  // No lane reads the queue yet, so "in line" would promise a turn nothing gives (#7034 slice 3b).
  if (q.state === "waiting" && !laneReads) return "Kept; research doesn't read the list yet";
  if (q.state === "waiting")
    return q.ahead ? `In line, ${q.ahead} ahead` : "Next in line for research";
  if (q.state === "on-the-shelf") return "Written up on the research shelf";
  return "No finding yet";
}

/**
 * WHO HOLDS IT (#7034 slice 4, criterion 9): one plain line naming the job of whoever has the
 * question, worded from the "research desk" station in docs/agents/seats.json (the market-event
 * calendar seat; org-chart.md → *The crew on the deck*). It says who and what, never when:
 * the wait stays `questionState`'s to state, so the line can't promise a turn the lane isn't
 * giving (LANE_READS_QUEUE). Build seats never show here (#6948: the game never explains how the app
 * gets built).
 */
export const HOLDER = "The research desk";

export function holderLine(q: PartyQuestion): string {
  if (q.state === "found") return `${HOLDER} answered this question about ${q.subject}.`;
  if (q.state === "on-the-shelf") return `${HOLDER} wrote up ${q.subject} on the research shelf.`;
  if (q.state === "no-finding-yet") return `${HOLDER} looked at ${q.subject} and has nothing yet.`;
  return `${HOLDER} holds this question about ${q.subject}.`;
}

// ── Asking in the campaign (POST /api/campaigns/ask) ────────────────────────────────────────────

export type AskReply =
  | { readonly ok: true; readonly status?: string; readonly tell?: string }
  | { readonly ok: false; readonly error: string };

export function askInCampaign(input: {
  readonly campaign: string;
  readonly subject: string;
  readonly question: string;
}): Promise<AskReply> {
  return postJson<AskReply>("/api/campaigns/ask", {
    kind: "name",
    subject: input.subject,
    campaign: input.campaign,
    question: input.question.trim().slice(0, QUESTION_MAX),
  });
}

/** The sentence a reply leaves under the form: the server's own words when it sent some. */
export function replyLine(reply: AskReply): string {
  if (!reply.ok) return reply.error;
  return reply.tell ?? "Asked. The party sees it under this story.";
}
