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
import {
  type Anchor,
  anchorOf,
  CAMPAIGNS,
  type CampaignMode,
  castSymbols,
  SYMBOL_RE,
} from "../domain/campaigns.js";
import {
  type DiscoveryKind,
  type DiscoveryQueue,
  type QueueOutcome,
  queueAsk,
  tellMember,
} from "../domain/discovery-queue.js";
import { marketById } from "../domain/market-catalog.js";
import { GICS_SECTORS } from "../domain/sector-coverage.js";
import type { Session } from "./auth/session.js";
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
 * A MEMBER'S OWN CAMPAIGNS API (#6949 slice 3a) — the campaigns a member crafts, returned to their
 * author and nobody else. Keyed by `opaqueMemberId(session.email)` like the authored plays.
 *
 *   GET  /api/campaigns/mine         → { campaigns: MemberCampaignView[], choices }
 *   POST /api/campaigns/mine/save    → { ok: true, campaign } | { ok: false, refusals } | { ok: false, error }
 *   POST /api/campaigns/mine/delete  → { ok: true } | { ok: false, error }
 *   POST /api/campaigns/mine/share   → { ok: true, campaign } | { ok: false, error }   body { id, shared }
 *   GET  /api/campaigns/party        → { campaigns: PartyCampaignView[] }
 *   POST /api/campaigns/ask          → { ok: true, status, tell } | { ok: false, error }   body { kind, subject }
 *
 * A save is the form compiled by `campaignFromForm`, which runs `parseCampaign`, the parser the
 * house campaign files pass, so the record is the same record (criterion 7). A field outside the
 * catalogs or over its cap comes back as `refusals`, one sentence per field, and nothing is written.
 *
 * PRIVATE until shared (criterion 8). The author is the session, never a body field; `mine` and
 * `share` act on that key only, so another member can neither edit, delete, share nor unshare a
 * campaign that isn't theirs. `share` with `shared: true` lists the campaign on `/api/campaigns/party`
 * with the author's display name; `shared: false` takes it back and the next party read drops it.
 * The party read is a member read like the Activity feed: `!session` means the route doesn't exist,
 * so a request with no session never gets a shared campaign (slice 3b's falsifier). It returns the
 * shown fields only (title, storyline, anchor, cast, mode, author), never the author's form or
 * research ask.
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
 * Same auth invariant as the other member APIs: `!session` means the route doesn't exist
 * (`false`), before anything else runs.
 */

const CAMPAIGNS_BODY_CAP_BYTES = 4_096;
const CAMPAIGN_MAX_ID = 60;

export interface MemberCampaignView {
  readonly id: string;
  readonly title: string;
  readonly storyline: string;
  readonly anchor: Anchor;
  readonly cast: readonly string[];
  readonly mode: CampaignMode;
  /** Who can see it: "private" until the author shares it with the party. */
  readonly visibility: "private" | "party";
  /** Cast names the house had no research on at save; an ask, never a dispatch. */
  readonly researchAsk: readonly string[];
  /** The form this was saved from, so Edit opens on exactly it. */
  readonly form: CampaignForm;
  readonly updatedAt: string;
}

export function campaignViewOf(record: MemberCampaignRecord): MemberCampaignView {
  const form = formFromCampaign(record.campaign);
  return {
    id: record.campaign.id,
    title: record.campaign.title,
    storyline: record.campaign.storyline,
    anchor: anchorOf(record.campaign),
    cast: castSymbols(record.campaign),
    mode: form.mode,
    visibility: record.sharedAt ? "party" : "private",
    researchAsk: record.researchAsk,
    form,
    updatedAt: record.updatedAt,
  };
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
  const by = (session.name ?? "").trim() || "A member";
  if (store.setShared(memberKey, id, body.shared ? { by } : false) === "not-found") {
    sendJson(res, 200, { ok: false, error: "That campaign is gone, so it can't be shared." });
    return;
  }
  const record = store.list(memberKey).find((r) => r.campaign.id === id);
  sendJson(res, 200, { ok: true, ...(record ? { campaign: campaignViewOf(record) } : {}) });
}

function parseSaveBody(
  raw: string,
): { readonly form: CampaignForm; readonly replaceId?: string } | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const form = parseCampaignForm(body.form);
  if (!form) return undefined;
  if (body.replaceId === undefined) return { form };
  const replaceId = boundedString(body.replaceId, CAMPAIGN_MAX_ID);
  return replaceId ? { form, replaceId } : undefined;
}

/** Put each subject on the discovery queue and say, in the member's words, where it stands. */
function queueDiscoveries(
  config: DashboardServerConfig,
  memberKey: string,
  kind: DiscoveryKind,
  subjects: readonly string[],
): { readonly status: string; readonly tell: string } | undefined {
  const store = config.discoveryQueue;
  if (!store || subjects.length === 0) return undefined;
  const isResearched = config.campaignShelf ?? shelfResearched();
  const perPass = config.discoveryPerPass ?? discoveryPerPass();
  let queue: DiscoveryQueue = store.load();
  let last: QueueOutcome | undefined;
  // Report the one furthest back in line, so the "roughly when" is the longest the member waits.
  const place = (o: QueueOutcome): number => ("ahead" in o ? o.ahead : -1);
  for (const subject of subjects) {
    const outcome = queueAsk(queue, { kind, subject, by: memberKey }, CAMPAIGNS, isResearched);
    queue = outcome.queue;
    if (!last || place(outcome) >= place(last)) last = outcome;
  }
  store.write(queue);
  return last ? { status: last.status, tell: tellMember(last, perPass) } : undefined;
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
  memberKey: string,
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
  const told = queueDiscoveries(config, memberKey, named.kind, [named.subject]);
  sendJson(res, 200, { ok: true, ...told });
}

function save(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  memberKey: string,
): void {
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
  const saved = store.save(memberKey, made.campaign, ask, body.replaceId);
  if (!saved.ok) {
    sendJson(res, 200, { ok: false, refusals: [{ field: saved.field, reason: saved.reason }] });
    return;
  }
  const discovery = queueDiscoveries(config, memberKey, "name", ask);
  sendJson(res, 200, {
    ok: true,
    campaign: campaignViewOf(saved.record),
    ...(discovery ? { discovery } : {}),
  });
}

/** Handle `/api/campaigns/mine*` and `/api/campaigns/party`. Returns true when answered, false when the route doesn't apply. */
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
    path !== "/api/campaigns/party"
  ) {
    return false;
  }
  const memberKey = opaqueMemberId(session.email);
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
      campaigns: records.map(campaignViewOf),
      choices: CAMPAIGN_FORM_CHOICES,
    });
    return true;
  }
  const raw = await readJsonPost(req, res, CAMPAIGNS_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (path === "/api/campaigns/mine/save") {
    save(res, raw, config, memberKey);
    return true;
  }
  if (path === "/api/campaigns/ask") {
    askRoute(res, raw, config, memberKey);
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
