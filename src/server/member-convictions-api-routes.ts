import type { IncomingMessage, ServerResponse } from "node:http";
import { marketDayKey } from "../domain/market-day.js";
import {
  convictionCard,
  type DraftOutcome,
  draftConviction,
} from "../playbooks/conviction-draft.js";
import { parseConvictionDraft } from "../playbooks/conviction-parse.js";
import type { SteerBounds } from "../playbooks/conviction-steering.js";
import { CONVICTIONS, playbookBounds } from "../playbooks/conviction-store.js";
import { findPair, pairName, type StrategyId } from "../playbooks/pair-table.js";
import type { Session } from "./auth/session.js";
import { creditFor } from "./authored-plays-api-routes.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import type { MemberConvictionRecord } from "./member-conviction-store.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * A MEMBER'S OWN CONVICTIONS (#5482 slice 6a) — stating a view, seeing it back as the settings it
 * would change, and keeping it as a draft. A member's own, never another's: keyed by
 * `opaqueMemberId(session.email)`, the owner is the session's name, never a body field.
 *
 *   GET  /api/convictions/mine    → { label, note, convictions: MemberConvictionView[], steerable }
 *   POST /api/convictions/draft   → { ok: true, conviction, card, note } | { ok: false, problems }
 *   POST /api/convictions/save    → the same, and the record is kept     (body: { draft, replaceId? })
 *   POST /api/convictions/delete  → { ok: true }                          (body: { id })
 *
 * `/draft` writes nothing: it is the "show me what this changes" step both doors take before a
 * member confirms — the conviction form (slice 6b) and Moneypenny's chat (criterion 9: "SHALL apply
 * it only on the member's confirmation"). `/save` is the confirmation, and runs the very same
 * judgement, so the server is the authority and a preview is only an early read of it.
 *
 * A saved view is a DRAFT and steers nothing (`member-conviction-store.ts`): every answer says so
 * in `note`, so no screen can show a member's view as steering a bot before one does. Every answer
 * is labelled SIM, and like every `/api/*` route it sits behind the invite gate (criterion 8).
 *
 * `steerable` (slice 6b) is what the form offers: the ◆ pairs a bot this member owns subscribes to,
 * each with its playbook's bounds, so the screen can say how much room a setting has before a
 * preview is asked for. It is a hint only; `/draft` and `/save` judge the same rule again.
 *
 * Same auth invariant as `authored-plays-api-routes.ts`: `!session` means the route doesn't exist
 * (`false`), before anything else runs.
 */

const BODY_CAP_BYTES = 16_384;
const MAX_ID = 64;

/** Said with every member view until the slice that hands members' views to the bots ships. */
export const DRAFT_NOTE =
  "A draft: only you see it, and it steers nothing yet. The bots don't read members' views until the step that hands them over ships.";

const PATHS = new Set([
  "/api/convictions/mine",
  "/api/convictions/draft",
  "/api/convictions/save",
  "/api/convictions/delete",
]);

export interface MemberConvictionView extends MemberConvictionRecord {
  readonly card: ReturnType<typeof convictionCard>;
}

/** Every pair a bot this session owns subscribes to, on or paused. */
function subscribedPairs(config: DashboardServerConfig, session: Session): ReadonlySet<string> {
  const held = config.subscriptions?.load() ?? {};
  return new Set(
    resolveOwnedIds(session, config).flatMap((id) => (held[id] ?? []).map((s) => s.playbookId)),
  );
}

/** A pair a member's view may steer, named as members know it, with the room its playbook allows. */
export interface SteerablePairView {
  readonly pair: string;
  /** "the wheel on CRWV". */
  readonly name: string;
  readonly strategy: StrategyId;
  readonly bounds: SteerBounds;
}

/** The ◆ pairs this session's bots subscribe to whose playbook a conviction can narrow, by id. */
function steerablePairs(config: DashboardServerConfig, session: Session): SteerablePairView[] {
  return [...subscribedPairs(config, session)].sort().flatMap((id) => {
    const pair = findPair(id);
    const bounds = playbookBounds(id);
    return pair?.evidence.status === "conviction" && bounds
      ? [{ pair: id, name: pairName(pair), strategy: pair.strategy, bounds }]
      : [];
  });
}

/** Judge a draft body for this member. `replaceId` frees that one id of theirs for the edit. */
function judge(
  body: Record<string, unknown>,
  config: DashboardServerConfig,
  session: Session,
  replaceId: string | undefined,
): DraftOutcome | undefined {
  const input = parseConvictionDraft(body.draft);
  if (!input) return undefined;
  const store = config.memberConvictions;
  const memberKey = opaqueMemberId(session.email);
  const mine = store?.list(memberKey).some((r) => r.conviction.id === replaceId) ?? false;
  const takenIds = new Set([...CONVICTIONS.all().map((c) => c.id), ...(store?.ids() ?? [])]);
  if (replaceId && mine) takenIds.delete(replaceId);
  const now = config.now?.() ?? new Date();
  return draftConviction(input, {
    owner: creditFor(session),
    statedOn: marketDayKey(now.toISOString()),
    takenIds,
    subscribed: subscribedPairs(config, session),
  });
}

async function draftOrSave(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session,
): Promise<void> {
  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  if (path === "/api/convictions/delete") {
    const id = boundedString(body?.id, MAX_ID);
    if (!id) {
      sendJson(res, 400, { error: "malformed delete body" });
      return;
    }
    const done = config.memberConvictions?.delete(opaqueMemberId(session.email), id);
    sendJson(res, 200, done && !done.ok ? { ok: false, error: done.reason } : { ok: true });
    return;
  }
  const replaceId =
    body?.replaceId === undefined ? undefined : boundedString(body.replaceId, MAX_ID);
  const outcome =
    body && (body.replaceId === undefined || replaceId)
      ? judge(body, config, session, replaceId)
      : undefined;
  if (!outcome) {
    sendJson(res, 400, { error: "malformed conviction body" });
    return;
  }
  if (!outcome.ok) {
    sendJson(res, 200, { ok: false, label: "SIM", problems: outcome.problems });
    return;
  }
  if (path === "/api/convictions/draft") {
    sendJson(res, 200, { ...outcome, label: "SIM", saved: false, note: DRAFT_NOTE });
    return;
  }
  const store = config.memberConvictions;
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Convictions aren't wired in this deployment." });
    return;
  }
  const now = config.now?.() ?? new Date();
  const saved = store.save(opaqueMemberId(session.email), outcome.conviction, now, replaceId);
  if (!saved.ok) {
    sendJson(res, 200, { ok: false, label: "SIM", problems: [saved.reason] });
    return;
  }
  sendJson(res, 200, { ...outcome, label: "SIM", saved: true, note: DRAFT_NOTE });
}

/** Handle `/api/convictions/*`. Returns true when answered, false when the route doesn't apply. */
export async function serveMemberConvictionsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (!(session && PATHS.has(path))) return false;
  if (path === "/api/convictions/mine") {
    if (!requireGet(req, res)) return true;
    const records = config.memberConvictions?.list(opaqueMemberId(session.email)) ?? [];
    const convictions: MemberConvictionView[] = records.map((record) => ({
      ...record,
      card: convictionCard(record.conviction),
    }));
    const steerable = steerablePairs(config, session);
    sendJson(res, 200, { label: "SIM", note: DRAFT_NOTE, convictions, steerable });
    return true;
  }
  await draftOrSave(req, res, path, config, session);
  return true;
}
