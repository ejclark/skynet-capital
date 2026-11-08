import type { IncomingMessage, ServerResponse } from "node:http";
import {
  CAMPAIGN_FORM_CHOICES,
  type CampaignForm,
  campaignFromForm,
  formFromCampaign,
  memberCampaignId,
  parseCampaignForm,
  researchAskFor,
} from "../domain/campaign-form.js";
import { displayName, type QuestionView } from "../domain/campaign-questions.js";
import {
  type Anchor,
  anchorOf,
  CAMPAIGNS,
  type CampaignMode,
  castSymbols,
  SYMBOL_RE,
} from "../domain/campaigns.js";
import {
  type CoveringCandidate,
  cleanQuestion,
  type DiscoveryKind,
  type DiscoveryQueue,
  type QueueOutcome,
  queueAsk,
  tellMember,
} from "../domain/discovery-queue.js";
import { marketById } from "../domain/market-catalog.js";
import { GICS_SECTORS } from "../domain/sector-coverage.js";
import type { Session } from "./auth/session.js";
import {
  CAMPAIGN_MAX_ID,
  coveringCandidates,
  logAsked,
  type Readable,
  readableCampaign,
  serveCampaignQuestions,
  suggestionsFor,
} from "./campaign-questions-api.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { discoveryPerPass } from "./discovery-queue-store.js";
import { opaqueMemberId } from "./feedback-issue.js";
import {
  type MemberCampaignRecord,
  type SharedCampaign,
  shelfResearched,
} from "./member-campaign-store.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * A MEMBER'S OWN CAMPAIGNS API (#6949 slices 3a, 3b, 6) — the campaigns a member crafts. Keyed by
 * `opaqueMemberId(session.email)` like the authored plays.
 *
 *   GET  /api/campaigns/mine         → { campaigns: MemberCampaignView[], choices }
 *   POST /api/campaigns/mine/save    → { ok: true, campaign } | { ok: false, refusals } | { ok: false, error }   body { form, replaceId?, draft? }
 *   POST /api/campaigns/mine/delete  → { ok: true } | { ok: false, error }
 *   POST /api/campaigns/mine/share   → { ok: true, campaign } | { ok: false, error }   body { id, shared }
 *   GET  /api/campaigns/party        → { campaigns: PartyCampaignView[] }
 *   POST /api/campaigns/ask          → { ok: true, status, tell, campaign? } | { ok: false, error }   body { kind, subject, campaign?, question? }
 *   GET  /api/campaigns/questions    → see campaign-questions-api.ts
 *
 * A save is the form compiled by `campaignFromForm`, which runs `parseCampaign`, the parser the
 * house campaign files pass, so the record is the same record (criterion 7). A field outside the
 * catalogs or over its cap comes back as `refusals`, one sentence per field, and nothing is written.
 *
 * THE PARTY'S ONCE SAVED (criterion 8, amended 2026-11-07, Eric: "Campaigns are communal"). A new
 * campaign goes to `/api/campaigns/party` with the author's display name unless the save carries
 * `draft: true`; `share` with `shared: false` holds one back as a draft and `shared: true` sends it
 * back to the party. The author is the session, never a body field; `mine` and `share` act on that
 * key only, so another member can neither edit, delete, share nor hold back a campaign that isn't
 * theirs (criterion 11: the frame changes only by its author's act). The party read is a member
 * read like the Activity feed: `!session` means the route doesn't exist, so a request with no
 * session never gets a campaign's text. It returns the shown fields only (title, storyline,
 * anchor, cast, mode, author), never the author's form or research ask.
 *
 * WHAT THE PARTY ASKED (criteria 10–11). A question asked inside a campaign is logged with who
 * asked by display name, and `/api/campaigns/questions` lists every one, with what its research
 * found, to every member who can read the campaign. One naming a symbol outside the cast (or a
 * sector or market that isn't the anchor) comes back on the author's `mine` read as a suggestion,
 * and never edits the campaign. A bare ask about a subject a party campaign covers answers
 * `covered` with that campaign's id, so the member is pointed at it to ask in.
 *
 * RESEARCH (criterion 9). A save names the cast symbols the house has no ledger on as the
 * campaign's research ask. It starts nothing — no route here dispatches research — so a member's
 * campaign can never raise the work spigot's ceiling; a lane that reads asks takes them inside its
 * own per-run limit.
 *
 * A QUESTION STARTS DISCOVERY (#6952 slice 2b, criterion 7). Those uncovered names, and a direct
 * `ask` about a sector, market or name no house campaign covers, join the discovery queue
 * (`domain/discovery-queue.ts`) and the reply says it is queued and roughly when. The queue is
 * bounded and drained per pass inside the lane's ceiling, so asking can never raise it; the route
 * only appends to a short list and starts nothing.
 *
 * A QUESTION ASKED INSIDE A CAMPAIGN (#6952 slice 2c, criterion 9). `ask` may carry `campaign` (an
 * id the member can read: a house campaign, one of their own, or one the party shares) and
 * `question` (their words, capped at 200 characters). The ask is scoped to that campaign, so a
 * subject the campaign already covers still queues, and a second member's identical ask joins the
 * first. A campaign the member cannot read gets the same answer as one that doesn't exist, so the
 * route never confirms another member's private campaign. The words are kept on the volume only.
 *
 * Same auth invariant as the other member APIs: `!session` means the route doesn't exist
 * (`false`), before anything else runs.
 */

const CAMPAIGNS_BODY_CAP_BYTES = 4_096;

export interface MemberCampaignView {
  readonly id: string;
  readonly title: string;
  readonly storyline: string;
  readonly anchor: Anchor;
  readonly cast: readonly string[];
  readonly mode: CampaignMode;
  /** Who can see it: the party's once saved, unless the author holds it back as a draft. */
  readonly visibility: "draft" | "party";
  /** Cast names the house had no research on at save; an ask, never a dispatch. */
  readonly researchAsk: readonly string[];
  /** The form this was saved from, so Edit opens on exactly it. */
  readonly form: CampaignForm;
  readonly updatedAt: string;
  /** Questions asked in it that point outside its cast: the party's suggestions, never edits. */
  readonly suggestions: readonly QuestionView[];
}

export function campaignViewOf(
  record: MemberCampaignRecord,
  suggestions: readonly QuestionView[] = [],
): MemberCampaignView {
  const form = formFromCampaign(record.campaign);
  return {
    id: record.campaign.id,
    title: record.campaign.title,
    storyline: record.campaign.storyline,
    anchor: anchorOf(record.campaign),
    cast: castSymbols(record.campaign),
    mode: form.mode,
    visibility: record.sharedAt ? "party" : "draft",
    researchAsk: record.researchAsk,
    form,
    updatedAt: record.updatedAt,
    suggestions,
  };
}

/** One of the member's own campaigns as they read it, with the party's suggestions for it. */
function ownViewOf(
  config: DashboardServerConfig,
  memberKey: string,
  record: MemberCampaignRecord,
): MemberCampaignView {
  return campaignViewOf(record, suggestionsFor(config, memberKey, record.campaign));
}

/** A shared campaign as another member reads it: what the story shows, and whose it is. */
export interface PartyCampaignView {
  readonly id: string;
  readonly title: string;
  readonly storyline: string;
  readonly anchor: Anchor;
  readonly cast: readonly string[];
  readonly mode: CampaignMode;
  readonly author: string;
  /** True for the signed-in member's own, so the screen can offer Take back instead of nothing. */
  readonly mine: boolean;
  readonly sharedAt: string;
}

function partyViewOf(shared: SharedCampaign, memberKey: string): PartyCampaignView {
  const { record } = shared;
  return {
    id: record.campaign.id,
    title: record.campaign.title,
    storyline: record.campaign.storyline,
    anchor: anchorOf(record.campaign),
    cast: castSymbols(record.campaign),
    mode: formFromCampaign(record.campaign).mode,
    author: record.sharedBy,
    mine: shared.memberKey === memberKey,
    sharedAt: record.sharedAt,
  };
}

function share(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  session: Session,
  memberKey: string,
): void {
  const body = parseJsonRecord(raw);
  const id = boundedString(body?.id, CAMPAIGN_MAX_ID);
  if (!(id && typeof body?.shared === "boolean")) {
    sendJson(res, 400, { error: "malformed share body" });
    return;
  }
  const store = config.memberCampaigns;
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Campaigns aren't wired in this deployment." });
    return;
  }
  const by = displayName(session.name);
  if (store.setShared(memberKey, id, body.shared ? { by } : false) === "not-found") {
    sendJson(res, 200, { ok: false, error: "That campaign is gone, so it can't be shared." });
    return;
  }
  const record = store.list(memberKey).find((r) => r.campaign.id === id);
  sendJson(res, 200, {
    ok: true,
    ...(record ? { campaign: ownViewOf(config, memberKey, record) } : {}),
  });
}

function parseSaveBody(
  raw: string,
):
  | { readonly form: CampaignForm; readonly replaceId?: string; readonly draft?: boolean }
  | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const form = parseCampaignForm(body.form);
  if (!form) return undefined;
  if (body.draft !== undefined && typeof body.draft !== "boolean") return undefined;
  const draft = body.draft === undefined ? {} : { draft: body.draft };
  if (body.replaceId === undefined) return { form, ...draft };
  const replaceId = boundedString(body.replaceId, CAMPAIGN_MAX_ID);
  return replaceId ? { form, replaceId, ...draft } : undefined;
}

/** Put each subject on the discovery queue and say, in the member's words, where it stands. */
function queueDiscoveries(
  config: DashboardServerConfig,
  asker: { readonly key: string; readonly name: string },
  kind: DiscoveryKind,
  subjects: readonly string[],
  covering: readonly CoveringCandidate[],
  scope: { readonly campaign?: string; readonly question?: string } = {},
): { readonly status: string; readonly tell: string; readonly campaign?: string } | undefined {
  const memberKey = asker.key;
  const store = config.discoveryQueue;
  if (!store || subjects.length === 0) return undefined;
  const isResearched = config.campaignShelf ?? shelfResearched();
  const perPass = config.discoveryPerPass ?? discoveryPerPass();
  const before: DiscoveryQueue = store.load();
  let queue = before;
  let last: QueueOutcome | undefined;
  let refused = 0;
  const asked: QueueOutcome[] = [];
  // Report the one furthest back in line, so the "roughly when" is the longest the member waits.
  const place = (o: QueueOutcome): number => ("ahead" in o ? o.ahead : -1);
  for (const subject of subjects) {
    const outcome = queueAsk(
      queue,
      { kind, subject, by: memberKey, ...scope },
      covering,
      isResearched,
    );
    queue = outcome.queue;
    asked.push(outcome);
    if (outcome.status === "full" || outcome.status === "limit") refused++;
    if (!last || place(outcome) >= place(last)) last = outcome;
  }
  // Best effort: the campaign is already saved, so a queue write that fails must not fail the save.
  if (queue !== before) {
    try {
      store.write(queue);
    } catch (err) {
      process.emitWarning(`[discovery-queue] write failed: ${String((err as Error).message)}`);
      return undefined;
    }
  }
  // Only once the queue holds it: a question asked in a campaign joins that campaign's log.
  logAsked(config, asked, asker);
  if (!last) return undefined;
  // A name the queue turned away is said out loud, never hidden behind the ones it took.
  const note =
    refused > 0 && place(last) >= 0 ? ` ${refused} more couldn't be taken right now.` : "";
  return {
    status: last.status,
    tell: tellMember(last, perPass) + note,
    // A covered subject names the campaign to ask in.
    ...(last.status === "covered" ? { campaign: last.campaign } : {}),
  };
}

/** The subject a member's ask names, checked against the catalogs the app already holds. */
function askSubject(
  kind: unknown,
  raw: unknown,
): { kind: DiscoveryKind; subject: string } | undefined {
  const text = boundedString(raw, 60);
  if (!text) return undefined;
  if (kind === "sector") {
    const hit = GICS_SECTORS.find((s) => s.name.toLowerCase() === text.toLowerCase());
    return hit ? { kind, subject: hit.name } : undefined;
  }
  if (kind === "market") return marketById(text) ? { kind, subject: text } : undefined;
  if (kind === "name") {
    const symbol = text.toUpperCase();
    return SYMBOL_RE.test(symbol) ? { kind, subject: symbol } : undefined;
  }
  return undefined;
}

function askRoute(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  asker: { readonly key: string; readonly name: string },
): void {
  const body = parseJsonRecord(raw);
  const named = body ? askSubject(body.kind, body.subject) : undefined;
  if (!named) {
    sendJson(res, 400, { error: "malformed ask body" });
    return;
  }
  if (!config.discoveryQueue) {
    sendJson(res, 200, { ok: false, error: "Questions aren't wired in this deployment." });
    return;
  }
  let scope: { campaign?: string; question?: string } = {};
  let askedIn: Readable | undefined;
  if (body?.campaign !== undefined) {
    const id = boundedString(body.campaign, CAMPAIGN_MAX_ID);
    const readable = id ? readableCampaign(config, asker.key, id) : undefined;
    if (!readable) {
      sendJson(res, 200, { ok: false, error: "That campaign isn't one you can ask in." });
      return;
    }
    const question = cleanQuestion(body.question);
    scope = { campaign: readable.scope, ...(question ? { question } : {}) };
    askedIn = readable;
  }
  // A member's question can be covered by a party campaign too, which points them at it to ask in.
  const told = queueDiscoveries(
    config,
    asker,
    named.kind,
    [named.subject],
    coveringCandidates(config, askedIn),
    scope,
  );
  sendJson(res, 200, { ok: true, ...told });
}

function save(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  asker: { readonly key: string; readonly name: string },
): void {
  const memberKey = asker.key;
  const body = parseSaveBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed save body" });
    return;
  }
  const store = config.memberCampaigns;
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Campaigns aren't wired in this deployment." });
    return;
  }
  const made = campaignFromForm(body.form, memberCampaignId(body.form.title));
  if (!made.ok) {
    sendJson(res, 200, { ok: false, refusals: made.refusals });
    return;
  }
  const isResearched = config.campaignShelf ?? shelfResearched();
  const ask = researchAskFor(made.campaign, isResearched);
  // The party's by default (criterion 8): a new campaign is shared unless the author asks for a
  // draft; an edit keeps where it was unless the body says otherwise.
  const isNew = body.replaceId === undefined;
  const share =
    body.draft === true ? false : body.draft === false || isNew ? { by: asker.name } : undefined;
  const saved = store.save(memberKey, made.campaign, ask, {
    ...(body.replaceId === undefined ? {} : { replaceId: body.replaceId }),
    ...(share === undefined ? {} : { share }),
  });
  if (!saved.ok) {
    sendJson(res, 200, { ok: false, refusals: [{ field: saved.field, reason: saved.reason }] });
    return;
  }
  // A save's research ask is the house's to judge: only a house cast covers it, so the campaign
  // just saved (or another member's, whose names the house hasn't researched either) never does.
  const discovery = queueDiscoveries(config, asker, "name", ask, CAMPAIGNS);
  sendJson(res, 200, {
    ok: true,
    campaign: ownViewOf(config, memberKey, saved.record),
    ...(discovery ? { discovery } : {}),
  });
}

/** Handle `/api/campaigns/mine*`, `/party`, `/ask` and `/questions`. Returns true when answered, false when the route doesn't apply. */
export async function serveMemberCampaignsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (!session) return false;
  if (
    path !== "/api/campaigns/mine" &&
    path !== "/api/campaigns/mine/save" &&
    path !== "/api/campaigns/mine/delete" &&
    path !== "/api/campaigns/mine/share" &&
    path !== "/api/campaigns/ask" &&
    path !== "/api/campaigns/party" &&
    path !== "/api/campaigns/questions"
  ) {
    return false;
  }
  const memberKey = opaqueMemberId(session.email);
  const asker = { key: memberKey, name: displayName(session.name) };
  if (path === "/api/campaigns/questions") {
    serveCampaignQuestions(req, res, config, memberKey);
    return true;
  }
  if (path === "/api/campaigns/party") {
    if (!requireGet(req, res)) return true;
    const shared = config.memberCampaigns?.listShared() ?? [];
    sendJson(res, 200, { campaigns: shared.map((s) => partyViewOf(s, memberKey)) });
    return true;
  }
  if (path === "/api/campaigns/mine") {
    if (!requireGet(req, res)) return true;
    const records = config.memberCampaigns?.list(memberKey) ?? [];
    sendJson(res, 200, {
      campaigns: records.map((r) => ownViewOf(config, memberKey, r)),
      choices: CAMPAIGN_FORM_CHOICES,
    });
    return true;
  }
  const raw = await readJsonPost(req, res, CAMPAIGNS_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (path === "/api/campaigns/mine/save") {
    save(res, raw, config, asker);
    return true;
  }
  if (path === "/api/campaigns/ask") {
    askRoute(res, raw, config, asker);
    return true;
  }
  if (path === "/api/campaigns/mine/share") {
    share(res, raw, config, session, memberKey);
    return true;
  }
  const id = boundedString(parseJsonRecord(raw)?.id, CAMPAIGN_MAX_ID);
  if (!id) {
    sendJson(res, 400, { error: "malformed delete body" });
    return true;
  }
  if (!config.memberCampaigns) {
    sendJson(res, 200, { ok: false, error: "Campaigns aren't wired in this deployment." });
    return true;
  }
  config.memberCampaigns.delete(memberKey, id);
  sendJson(res, 200, { ok: true });
  return true;
}
