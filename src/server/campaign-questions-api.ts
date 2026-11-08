import type { IncomingMessage, ServerResponse } from "node:http";
import { lessonsAnswering } from "../domain/campaign-lessons.js";
import {
  type Asker,
  type QuestionView,
  questionsIn,
  recordQuestion,
} from "../domain/campaign-questions.js";
import { CAMPAIGNS, type Campaign, campaignById } from "../domain/campaigns.js";
import type { CoveringCandidate, QueueOutcome } from "../domain/discovery-queue.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { boundedString, requireGet, sendJson } from "./page-shell.js";

/**
 * WHAT THE PARTY ASKED, SERVED (#6949 slice 6, criteria 8, 10, 11) — the server half of
 * `domain/campaign-questions.ts`: which campaigns a member can read, the log write when a question
 * is asked in one, and the read that lists every question asked in a campaign.
 *
 *   GET /api/campaigns/questions?campaign=<id>  → { campaign, questions: QuestionView[] } | { ok: false, error }
 *
 * WHO CAN READ A CAMPAIGN. A house campaign, every campaign the party shares, and the member's own
 * drafts. A draft of someone else's gets the same answer as a campaign that doesn't exist, so a
 * route never confirms one. A question shows who asked it by display name, never an email or a
 * member key. Like every member API, the router returns `false` for a request with no session
 * before this file runs, so a signed-out request never reads a campaign's text (#2224's gate).
 */

/** The longest campaign id a request may name (a member id is a 60-character slug at most). */
export const CAMPAIGN_MAX_ID = 60;

/** A campaign the member can read: its scope (the id an ask inside it carries) and its record. */
export interface Readable {
  readonly scope: string;
  readonly campaign: Campaign;
}

/**
 * The campaign `id` names for this member, or undefined when they cannot read it. A house id wins;
 * a member campaign is `<author key>~<id>`, because member ids are unique per author only, and the
 * member's own wins over a party one with the same id.
 */
export function readableCampaign(
  config: DashboardServerConfig,
  memberKey: string,
  id: string,
): Readable | undefined {
  const house = campaignById(id);
  if (house) return { scope: id, campaign: house };
  const store = config.memberCampaigns;
  if (!store) return undefined;
  const own = store.list(memberKey).find((r) => r.campaign.id === id);
  if (own) return { scope: `${memberKey}~${id}`, campaign: own.campaign };
  const shared = store.listShared().find((s) => s.record.campaign.id === id);
  return shared
    ? { scope: `${shared.memberKey}~${id}`, campaign: shared.record.campaign }
    : undefined;
}

/**
 * The house campaigns, then every campaign the party shares: what can cover a subject. `askedIn` is
 * the campaign a question is asked in; a draft is in no list, so it is added here, which lets a
 * question about the draft's own cast stay in the draft (`coveringCampaign`'s `except`).
 */
export function coveringCandidates(
  config: DashboardServerConfig,
  askedIn?: Readable,
): readonly CoveringCandidate[] {
  const party = (config.memberCampaigns?.listShared() ?? []).map(
    (s): CoveringCandidate => ({
      ...s.record.campaign,
      scope: `${s.memberKey}~${s.record.campaign.id}`,
      party: true,
    }),
  );
  const all: CoveringCandidate[] = [...CAMPAIGNS, ...party];
  if (askedIn && !all.some((c) => (c.scope ?? c.id) === askedIn.scope))
    all.push({ ...askedIn.campaign, scope: askedIn.scope });
  return all;
}

/**
 * Log each question the queue took (queued or joined) that was asked inside a campaign; a bare ask
 * carries no campaign and is not logged. Best effort: the ask is already on the queue, so a log
 * write that fails is reported and never fails the ask.
 */
export function logAsked(
  config: DashboardServerConfig,
  outcomes: readonly QueueOutcome[],
  asker: Asker,
): void {
  const store = config.campaignQuestions;
  if (!store) return;
  try {
    const before = store.load();
    let log = before;
    for (const o of outcomes) {
      if (o.status !== "queued" && o.status !== "joined") continue;
      const ask = o.queue[o.ahead];
      if (ask) log = recordQuestion(log, ask, asker);
    }
    if (log !== before) store.write(log);
  } catch (err) {
    process.emitWarning(`[campaign-questions] write failed: ${String((err as Error).message)}`);
  }
}

/** Every question asked in a readable campaign, joined to the queue and to what research found. */
export function questionsFor(
  config: DashboardServerConfig,
  readable: Readable,
): readonly QuestionView[] {
  const log = config.campaignQuestions?.load() ?? [];
  const queue = config.discoveryQueue?.load() ?? [];
  const found = config.campaignFindings ?? lessonsAnswering;
  // A member's campaign has no lesson record yet (records are checked in per house campaign).
  const house = campaignById(readable.scope) !== undefined;
  return questionsIn(log, readable.scope, readable.campaign, queue, (askId) =>
    house ? found(readable.scope, askId) : [],
  );
}

/** The questions a member's own campaign was asked that point outside its cast: suggestions to its author. */
export function suggestionsFor(
  config: DashboardServerConfig,
  memberKey: string,
  campaign: Campaign,
): readonly QuestionView[] {
  if (!config.campaignQuestions) return [];
  return questionsFor(config, { scope: `${memberKey}~${campaign.id}`, campaign }).filter(
    (q) => q.suggestion,
  );
}

/** `GET /api/campaigns/questions?campaign=<id>`, for a signed-in member only (the caller's check). */
export function serveCampaignQuestions(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  memberKey: string,
): void {
  if (!requireGet(req, res)) return;
  const raw = new URL(req.url ?? "", "http://localhost").searchParams.get("campaign");
  const id = boundedString(raw ?? undefined, CAMPAIGN_MAX_ID);
  const readable = id ? readableCampaign(config, memberKey, id) : undefined;
  if (!(id && readable)) {
    sendJson(res, 200, { ok: false, error: "That campaign isn't one you can read." });
    return;
  }
  sendJson(res, 200, { campaign: id, questions: questionsFor(config, readable) });
}
