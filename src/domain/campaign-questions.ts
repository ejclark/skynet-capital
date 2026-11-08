/**
 * WHAT THE PARTY ASKED IN A CAMPAIGN — every question asked inside a campaign, who asked it and what
 * its research found, for every member who can read that campaign (#6949 slice 6, criteria 10–11).
 *
 * The ask (Eric, 2026-11-07): "When i ask for research in a campaign, it should be available for
 * other users. They should be able to ask questions and propagate additional research which is
 * available to the campagin author plus other users... Campaigns are communal."
 *
 * WHY A LOG AND NOT THE QUEUE. The discovery queue (`discovery-queue.ts`) is a work list: the
 * research lane takes from its front, and a taken ask leaves it. A question asked in a campaign is
 * the campaign's conversation, and it has to outlive the work, so this log keeps it: the subject,
 * the first asker's words, and every asker by display name (never an email; the route resolves it
 * from the session). Whether it is still waiting comes from the queue, and what it found comes from
 * the lesson record (`campaign-lessons.ts`, a finding's `answers` holds the ask's id), both read at
 * the moment a member looks, so neither is copied here.
 *
 * A QUESTION THAT POINTS OUTSIDE THE CAST IS A SUGGESTION (criterion 11). A name the cast does not
 * hold, or a sector or market that is not the campaign's anchor, is shown to everyone as asked and
 * reaches the author as a suggestion. It never changes the campaign: the frame (title, storyline,
 * cast) changes only by its author's act, and a suggestion is judged against the cast as it is when
 * read, so the author adding the name is what settles it.
 *
 * Bounds, on member text and never a game rule: `MAX_PER_CAMPAIGN` questions per campaign (the
 * oldest leaves first), `MAX_ASKERS` askers per question, `MAX_DISPLAY_NAME` characters per name.
 *
 * Paper only; educational. A question never places an order and never sizes one.
 */

import type { Lesson } from "./campaign-lessons.js";
import { type Campaign, castSymbols } from "./campaigns.js";
import {
  askId,
  type DiscoveryAsk,
  type DiscoveryKind,
  type DiscoveryQueue,
  MAX_ASKERS,
} from "./discovery-queue.js";

/** The most questions one campaign keeps; the oldest leaves first. A bound on member text. */
export const MAX_PER_CAMPAIGN = 200;
/** The longest display name kept beside a question (the same bound a shared campaign's author has). */
export const MAX_DISPLAY_NAME = 60;
/** The name shown when the session has none, or has one that looks like an email address. */
export const NEUTRAL_NAME = "A member";

export interface Asker {
  /** The opaque member key (`opaqueMemberId`), never shown: it only stops one member counting twice. */
  readonly key: string;
  /** What everyone sees. */
  readonly name: string;
}

export interface CampaignQuestion {
  /** The discovery ask's id (`askId`), so the queue and the lesson record join on it. */
  readonly id: string;
  /** The campaign scope: a house id, or `<author key>~<id>` for a member's campaign. */
  readonly campaign: string;
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** The first asker's words, already through `cleanQuestion`. */
  readonly question?: string;
  readonly askedAt: string;
  readonly askers: readonly Asker[];
}

export type QuestionLog = readonly CampaignQuestion[];

/**
 * The name a member is shown by: their session name, trimmed and capped, or `NEUTRAL_NAME` when it
 * is empty or carries an `@` (a provider that hands back an address as the name would otherwise put
 * an email in front of the party).
 */
export function displayName(raw: string | undefined): string {
  const name = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_DISPLAY_NAME);
  return name.length > 0 && !name.includes("@") ? name : NEUTRAL_NAME;
}

/** Record one question asked in a campaign: a new entry, or one more asker on the same question. */
export function recordQuestion(
  log: QuestionLog,
  ask: DiscoveryAsk,
  asker: Asker,
  at: Date = new Date(),
): QuestionLog {
  if (!ask.campaign) return log;
  const at0 = log.findIndex((q) => q.id === ask.id);
  if (at0 >= 0) {
    const prior = log[at0] as CampaignQuestion;
    if (prior.askers.some((a) => a.key === asker.key)) return log;
    const askers = [...prior.askers, asker].slice(0, MAX_ASKERS);
    // The first asker's words stay, the queue's own rule; a joiner's only fill a gap.
    const question = prior.question ?? ask.question;
    return log.map((q, i) =>
      i === at0 ? { ...prior, askers, ...(question ? { question } : {}) } : q,
    );
  }
  const entry: CampaignQuestion = {
    id: ask.id,
    campaign: ask.campaign,
    kind: ask.kind,
    subject: ask.subject,
    ...(ask.question ? { question: ask.question } : {}),
    askedAt: at.toISOString(),
    askers: [asker],
  };
  const mine = log.filter((q) => q.campaign === ask.campaign);
  // Over the bound, this campaign's oldest question leaves; no other campaign's is touched.
  const drop = mine.length >= MAX_PER_CAMPAIGN ? mine[0] : undefined;
  return [...log.filter((q) => q !== drop), entry];
}

/** Whether a question points outside the campaign's cast or anchor, so it reaches the author as a suggestion. */
export function isSuggestion(
  question: Pick<CampaignQuestion, "kind" | "subject">,
  campaign: Campaign,
): boolean {
  if (question.kind === "name") return !castSymbols(campaign).includes(question.subject);
  if (question.kind === "sector") return campaign.sector !== question.subject;
  return campaign.market !== question.subject;
}

/** One finding as a member reads it beside the question it answers. */
export interface FindingView {
  readonly kind: Lesson["kind"];
  readonly idea: string;
  readonly on: string;
  readonly recheckOn?: string;
  readonly falsifier?: string;
  readonly source: string;
}

/** One question as every member who can read the campaign sees it. */
export interface QuestionView {
  readonly kind: DiscoveryKind;
  readonly subject: string;
  readonly question?: string;
  /** Display names, first asker first. Never an email, never a member key. */
  readonly askedBy: readonly string[];
  readonly askedAt: string;
  /**
   * `found` once a finding answers it; `waiting` while it is still in the queue (`ahead` asks before
   * it); `no-finding-yet` when neither holds, which is said plainly rather than guessed at.
   */
  readonly state: "found" | "waiting" | "no-finding-yet";
  readonly ahead?: number;
  readonly found: readonly FindingView[];
  /** It points outside the cast or anchor: the author sees it as a suggestion, never as an edit. */
  readonly suggestion: boolean;
}

function findingOf(lesson: Lesson): FindingView {
  return {
    kind: lesson.kind,
    idea: lesson.idea,
    on: lesson.on,
    ...(lesson.recheckOn ? { recheckOn: lesson.recheckOn } : {}),
    ...(lesson.falsifier ? { falsifier: lesson.falsifier } : {}),
    source: lesson.source,
  };
}

/**
 * Every question asked in one campaign, newest first, joined to where it stands in the queue and
 * what the lesson record found for it. `findings` is `lessonsAnswering` bound to the campaign's
 * lesson record (a member campaign has none yet, so it answers `[]`).
 */
export function questionsIn(
  log: QuestionLog,
  scope: string,
  campaign: Campaign,
  queue: DiscoveryQueue,
  findings: (askId: string) => readonly Lesson[],
): readonly QuestionView[] {
  return log
    .filter((q) => q.campaign === scope)
    .map((q): QuestionView => {
      const found = findings(q.id).map(findingOf);
      const ahead = queue.findIndex((a) => a.id === askId(q.kind, q.subject, q.campaign));
      const state = found.length > 0 ? "found" : ahead >= 0 ? "waiting" : "no-finding-yet";
      return {
        kind: q.kind,
        subject: q.subject,
        ...(q.question ? { question: q.question } : {}),
        askedBy: q.askers.map((a) => a.name),
        askedAt: q.askedAt,
        state,
        ...(state === "waiting" ? { ahead } : {}),
        found,
        suggestion: isSuggestion(q, campaign),
      };
    })
    .sort((a, b) => b.askedAt.localeCompare(a.askedAt));
}
