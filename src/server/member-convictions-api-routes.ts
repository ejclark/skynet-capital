import type { IncomingMessage, ServerResponse } from "node:http";
import { marketDayKey } from "../domain/market-day.js";
import {
  convictionCard,
  type DraftOutcome,
  draftConviction,
} from "../playbooks/conviction-draft.js";
import {
  type ConvictionDraftInput,
  MAX_CONVICTION_ID,
  parseConvictionDraft,
} from "../playbooks/conviction-parse.js";
import type { SteerBounds } from "../playbooks/conviction-steering.js";
import { CONVICTIONS, playbookBounds } from "../playbooks/conviction-store.js";
import { findPair, pairName, type StrategyId } from "../playbooks/pair-table.js";
import type { Session } from "./auth/session.js";
import {
  canRepoint,
  handOverPlan,
  type NamedPair,
  pointedPairs,
  refusedNow,
  repoint,
  type TakeOver,
  takeOverable,
  takesOver,
} from "./conviction-hand-over.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { creditFor } from "./feedback-attribution.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { GONE, type MemberConvictionRecord } from "./member-conviction-store.js";
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
 *   GET  /api/convictions/mine       → { label, note, convictions: MemberConvictionView[], steerable }
 *   POST /api/convictions/draft      → { ok: true, conviction, card, note } | { ok: false, problems }
 *   POST /api/convictions/save       → the same, and the record is kept  (body: { draft, replaceId? })
 *   POST /api/convictions/delete     → { ok: true }                       (body: { id })
 *   POST /api/convictions/hand-over  → { ok: true, steering, note } | { ok: false, problems }  (body: { id })
 *   POST /api/convictions/take-back  → { ok: true, note }                 (body: { id })
 *
 * `/draft` writes nothing: it is the "show me what this changes" step both doors take before a
 * member confirms — the conviction form (slice 6b) and Moneypenny's chat (criterion 9: "SHALL apply
 * it only on the member's confirmation"). `/save` is the confirmation, and runs the very same
 * judgement, so the server is the authority and a preview is only an early read of it.
 *
 * A saved view is a DRAFT and steers nothing (`member-conviction-store.ts`) until its owner hands
 * it to their bots (slice 6c, `conviction-hand-over.ts`); an edit makes it a draft again, and the
 * answer says so (`tookBack`). What a row says it steers is read from the subscriptions that point
 * at it (`steering`), never assumed from the status. Every answer is labelled SIM, and like every
 * `/api/*` route it sits behind the invite gate (criterion 8).
 *
 * `steerable` (slice 6b) is what the form offers: the ◆ pairs a bot this member owns subscribes to,
 * each with its playbook's bounds, so the screen can say how much room a setting has before a
 * preview is asked for. It is a hint only; `/draft` and `/save` judge the same rule again.
 *
 * Same auth invariant as `authored-plays-api-routes.ts`: `!session` means the route doesn't exist
 * (`false`), before anything else runs.
 */

const MEMBER_CONVICTIONS_BODY_CAP_BYTES = 16_384;

/** Said with every draft: what a saved view does until its owner hands it over. */
export const DRAFT_NOTE =
  "A draft: only you see it, and it steers nothing until you hand it to your bots.";

/** Said once a view is handed over: what it does now, who sees it, and the way back. */
export const STEERING_NOTE =
  "Your bots run each pair it steers inside these settings from their next check-in, and the playbook still picks when to open and close. Members can see a view that steers. Take it back any time.";

/** Said when an edit replaced a view that was steering. */
export const TOOK_BACK_NOTE =
  "Saved as a draft, so your bots no longer steer by it. Hand it over again when it reads right.";

/** Why a delete or an edit waits: the pointers at the old view could not be dropped safely. */
export const SUBSCRIPTIONS_UNREADABLE =
  "Your bots' playbook settings couldn't be read in full just now, so nothing was changed. Try again shortly.";

/** Said on `/mine`: both states at once, for a screen that lists drafts and steering views. */
export const MINE_NOTE =
  "A draft steers nothing and only you see it. A view you hand to your bots narrows the pairs it steers on them until you take it back.";

const PATHS = new Set([
  "/api/convictions/mine",
  "/api/convictions/draft",
  "/api/convictions/save",
  "/api/convictions/delete",
  "/api/convictions/hand-over",
  "/api/convictions/take-back",
]);

export interface MemberConvictionView extends MemberConvictionRecord {
  readonly card: ReturnType<typeof convictionCard>;
  /** A steering view: the pairs its owner's bots point at it right now. */
  readonly steering?: readonly NamedPair[];
  /** A steering view the store's rules refuse today (a playbook's bounds moved): why, in words. The
   *  bots do not steer by it, and its pairs run as they did before it was handed over. */
  readonly refused?: readonly string[];
  /** A draft: the pairs handing it over would take over from another view. */
  readonly takesOver?: readonly TakeOver[];
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
export function steerablePairs(
  config: DashboardServerConfig,
  session: Session,
): SteerablePairView[] {
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
  return input ? judgeDraft(input, config, session, replaceId) : undefined;
}

/** Judge a parsed draft for this member — the one judgement `/draft`, `/save` and Moneypenny's chat
 *  (`companion-convictions-port.ts`) share. */
export function judgeDraft(
  input: ConvictionDraftInput,
  config: DashboardServerConfig,
  session: Session,
  replaceId?: string,
): DraftOutcome {
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
  const raw = await readJsonPost(req, res, MEMBER_CONVICTIONS_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  if (path === "/api/convictions/delete") {
    const id = boundedString(body?.id, MAX_CONVICTION_ID);
    if (!id) {
      sendJson(res, 400, { error: "malformed delete body" });
      return;
    }
    if (!canRepoint(config.subscriptions)) {
      sendJson(res, 200, { ok: false, error: SUBSCRIPTIONS_UNREADABLE });
      return;
    }
    const memberKey = opaqueMemberId(session.email);
    const title = titleBefore(config, memberKey, id);
    const done = config.memberConvictions?.delete(memberKey, id);
    if (done?.ok) repointAfter(config, session, id, title);
    sendJson(res, 200, done && !done.ok ? { ok: false, error: done.reason } : { ok: true });
    return;
  }
  const replaceId =
    body?.replaceId === undefined ? undefined : boundedString(body.replaceId, MAX_CONVICTION_ID);
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
  if (replaceId && !canRepoint(config.subscriptions)) {
    sendJson(res, 200, { ok: false, label: "SIM", problems: [SUBSCRIPTIONS_UNREADABLE] });
    return;
  }
  const now = config.now?.() ?? new Date();
  const memberKey = opaqueMemberId(session.email);
  const title = replaceId ? titleBefore(config, memberKey, replaceId) : undefined;
  const saved = store.save(memberKey, outcome.conviction, now, replaceId);
  if (!saved.ok) {
    sendJson(res, 200, { ok: false, label: "SIM", problems: [saved.reason] });
    return;
  }
  if (replaceId) repointAfter(config, session, replaceId, title);
  sendJson(res, 200, {
    ...outcome,
    label: "SIM",
    saved: true,
    tookBack: saved.tookBack,
    note: saved.tookBack ? TOOK_BACK_NOTE : DRAFT_NOTE,
  });
}

/** A member's view's title, read before a write that may remove it, so its log line keeps it. */
function titleBefore(
  config: DashboardServerConfig,
  memberKey: string,
  id: string,
): string | undefined {
  const record = config.memberConvictions?.list(memberKey).find((r) => r.conviction.id === id);
  return record?.conviction.title;
}

/** The pointer rule, now, after a write that can change which views are held; `gone` is an id the
 *  write may have removed, `goneTitle` its title before. Unwired stores point nothing; the next poll
 *  applies the same rule. Every pointer it moves on this member's bots is a change log line of
 *  theirs (`conviction-pointer-changes.ts`). */
function repointAfter(
  config: DashboardServerConfig,
  session: Session,
  gone?: string,
  goneTitle?: string,
): void {
  const { subscriptions, memberConvictions } = config;
  if (subscriptions && memberConvictions) {
    repoint(subscriptions, memberConvictions, config.now?.() ?? new Date(), gone, {
      log: config.controls?.changes,
      editor: session.email,
      owned: resolveOwnedIds(session, config),
      ...(goneTitle ? { goneTitle } : {}),
      ...(config.logLine ? { onError: config.logLine } : {}),
    });
  }
}

/** Hand a view to the member's bots, or take it back. */
async function handOverOrTakeBack(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session,
): Promise<void> {
  const raw = await readJsonPost(req, res, MEMBER_CONVICTIONS_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const id = boundedString(parseJsonRecord(raw)?.id, MAX_CONVICTION_ID);
  if (!id) {
    sendJson(res, 400, { error: "malformed conviction id" });
    return;
  }
  const { memberConvictions: store, subscriptions } = config;
  if (!(store && subscriptions)) {
    sendJson(res, 200, { ok: false, error: "Convictions aren't wired in this deployment." });
    return;
  }
  const memberKey = opaqueMemberId(session.email);
  const now = config.now?.() ?? new Date();
  if (path === "/api/convictions/take-back") {
    const back = store.takeBack(memberKey, id, now);
    if (back.ok) repointAfter(config, session);
    sendJson(
      res,
      200,
      back.ok
        ? { ok: true, label: "SIM", note: DRAFT_NOTE }
        : { ok: false, problems: [back.reason] },
    );
    return;
  }
  const record = store.list(memberKey).find((r) => r.conviction.id === id);
  if (!record) {
    sendJson(res, 200, { ok: false, label: "SIM", problems: [GONE] });
    return;
  }
  const owned = resolveOwnedIds(session, config);
  const plan = handOverPlan(record.conviction, owned, subscriptions.load(), store.handedOver());
  const done = plan.ok ? store.handOver(memberKey, id, plan.accounts, now) : undefined;
  if (!(plan.ok && done?.ok)) {
    const problems = plan.ok ? [done && !done.ok ? done.reason : GONE] : plan.problems;
    sendJson(res, 200, { ok: false, label: "SIM", problems });
    return;
  }
  repointAfter(config, session);
  const steering = pointedPairs(id, owned, subscriptions.load());
  sendJson(res, 200, { ok: true, label: "SIM", steering, note: STEERING_NOTE });
}

/** `/mine`: this member's views, each with what it steers now (or would take over), and the pairs
 *  the form offers. */
function mine(config: DashboardServerConfig, session: Session) {
  const records = config.memberConvictions?.list(opaqueMemberId(session.email)) ?? [];
  const owned = resolveOwnedIds(session, config);
  const state = config.subscriptions?.load() ?? {};
  const convictions: MemberConvictionView[] = records.map((record) => {
    const card = convictionCard(record.conviction);
    if (record.status === "steering") {
      const steering = pointedPairs(record.conviction.id, owned, state);
      const refused = refusedNow(record.conviction);
      return { ...record, card, steering, ...(refused.length > 0 ? { refused } : {}) };
    }
    const over = takesOver(record.conviction, owned, state, takeOverable(config.memberConvictions));
    return { ...record, card, ...(over.length > 0 ? { takesOver: over } : {}) };
  });
  const steerable = steerablePairs(config, session);
  return { label: "SIM", note: MINE_NOTE, convictions, steerable };
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
    sendJson(res, 200, mine(config, session));
    return true;
  }
  if (path === "/api/convictions/hand-over" || path === "/api/convictions/take-back") {
    await handOverOrTakeBack(req, res, path, config, session);
    return true;
  }
  await draftOrSave(req, res, path, config, session);
  return true;
}
