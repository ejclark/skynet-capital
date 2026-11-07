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
import { type Anchor, anchorOf, type CampaignMode, castSymbols } from "../domain/campaigns.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { type MemberCampaignRecord, shelfResearched } from "./member-campaign-store.js";
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
 *
 * A save is the form compiled by `campaignFromForm`, which runs `parseCampaign`, the parser the
 * house campaign files pass, so the record is the same record (criterion 7). A field outside the
 * catalogs or over its cap comes back as `refusals`, one sentence per field, and nothing is written.
 *
 * PRIVATE (criterion 8). The author is the session, never a body field; every read is by that key.
 * Inviting the party is slice 3b; until then each view says `visibility: "private"`.
 *
 * RESEARCH (criterion 9). A save names the cast symbols the house has no ledger on as the
 * campaign's research ask. It starts nothing — no route here dispatches research — so a member's
 * campaign can never raise the work spigot's ceiling; a lane that reads asks takes them inside its
 * own per-run limit.
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
  /** Who can see it. Only "private" until slice 3b lets the author invite the party. */
  readonly visibility: "private";
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
    visibility: "private",
    researchAsk: record.researchAsk,
    form,
    updatedAt: record.updatedAt,
  };
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
  sendJson(res, 200, { ok: true, campaign: campaignViewOf(saved.record) });
}

/** Handle `/api/campaigns/mine*`. Returns true when answered, false when the route doesn't apply. */
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
    path !== "/api/campaigns/mine/delete"
  ) {
    return false;
  }
  const memberKey = opaqueMemberId(session.email);
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
