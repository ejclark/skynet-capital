import type { IncomingMessage, ServerResponse } from "node:http";
import type { ShadowReport, ShadowReportEntry } from "../autonomous/authored-shadow-wire.js";
import { REFUSAL_LABEL } from "../observatory/decision-json-view.js";
import {
  type AuthoredPlayRecord,
  EVENT_FEED_REACHES_BOTS,
} from "../playbooks/authored-play-draft.js";
import {
  type AuthoredPlayForm,
  type FormRefusal,
  formFromSpec,
  parseAuthoredPlayForm,
  settingsLine,
  specFromForm,
} from "../playbooks/authored-play-form.js";
import { accountKind } from "./account-kind.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * THE AUTHORED PLAYS API (#5457 slice 1, #809 slice 3) — a member's own draft playbooks, never
 * another's. Keyed by `opaqueMemberId(session.email)` like the saved positions.
 *
 *   GET  /api/authored-plays         → { plays: AuthoredPlayView[] } for the signed-in member.
 *   POST /api/authored-plays/save    → { ok: true, play } | { ok: false, refusals } | { ok: false, error }
 *   POST /api/authored-plays/shadow  → { ok: true, play } | { ok: false, error }   (body: { id, on })
 *   POST /api/authored-plays/delete  → { ok }
 *
 * SHADOW (#5457 slice 2). `/shadow` puts one of the member's own drafts into its shadow test or takes it
 * out; the bots then decide the play each pass against the author's own bot and write only a ledger,
 * which comes back on each row as `shadow`. No route here subscribes a play, schedules it or hands it
 * to a roster — a play in its shadow test still never trades. Editing a play ends its test (a new
 * spec is a new test; the member starts another), and Discard ends it too.
 *
 * A save is the form run through `specFromForm` — the same function the browser runs, so the server
 * is the authority and the screen is only an early read of it. A value outside a strategy's limits
 * comes back as `refusals`, one sentence per field, and nothing is written. The account that will run
 * the play is one the SESSION owns and must be a bot (Season 1, #4610: a human may author, their bot
 * runs it); the credit line is the session's own name, never a body field. A saved play is a DRAFT:
 * no route here subscribes it, schedules it or hands it to a bot.
 *
 * Same auth invariant as `saved-positions-api-routes.ts`: `!session` means the route doesn't exist
 * (`false`), before anything else runs.
 */

const BODY_CAP_BYTES = 8_192;
const MAX_ID = 100;

/** What a row shows of a play in its shadow test. `report` is absent until the bots have reported on
 *  THIS test (a report for an earlier start of the same play is not it). */
interface ShadowView {
  readonly since: string;
  readonly report?: ShadowReportEntry;
  /** The newest guard refusal as a sentence, when the report carries one. */
  readonly refusalSentence?: string;
  /** An honest limit on what this test can show, when the play's trigger has one. */
  readonly caveat?: string;
}

export interface AuthoredPlayView {
  readonly id: string;
  readonly name: string;
  readonly status: AuthoredPlayRecord["status"];
  /** The bot that will run it, once a later step lets a bot take it. */
  readonly runsOn: string;
  readonly symbol: string;
  /** The settings on one line, "buy 20 days before the report, sell 5 before". */
  readonly settings: string;
  readonly thesis: string;
  /** The form this was saved from, so Edit opens on exactly it. */
  readonly form: AuthoredPlayForm;
  readonly updatedAt: string;
  /** Present while the play is in its shadow test. */
  readonly shadow?: ShadowView;
}

const EVENT_CAVEAT =
  "This play waits for news about the stock, and no news feed reaches the bots yet — so it can only record what it would do once one does.";

function shadowViewOf(record: AuthoredPlayRecord, report: ShadowReport | undefined): ShadowView {
  const since = record.shadowSince ?? record.updatedAt;
  const entry = report?.plays.find((p) => p.id === record.id && p.since === since);
  const refusal = entry?.lastRefusal;
  return {
    since,
    ...(entry ? { report: entry } : {}),
    ...(refusal
      ? {
          refusalSentence: `${refusal.day}: a ${refusal.side} of ${refusal.symbol} was refused — ${REFUSAL_LABEL[refusal.reason]}.`,
        }
      : {}),
    ...(record.spec.trigger.kind === "event-window" && !EVENT_FEED_REACHES_BOTS
      ? { caveat: EVENT_CAVEAT }
      : {}),
  };
}

export function viewOf(record: AuthoredPlayRecord, report?: ShadowReport): AuthoredPlayView {
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    runsOn: record.spec.authorAccountId,
    symbol: record.spec.symbols[0] ?? "",
    settings: settingsLine(record.spec),
    thesis: record.spec.thesis,
    form: formFromSpec(record.name, record.spec),
    updatedAt: record.updatedAt,
    ...(record.status === "shadow" ? { shadow: shadowViewOf(record, report) } : {}),
  };
}

/** The credit line: the member's own name from the session, cut to the model's limit. */
function creditFor(session: Session): string {
  const named = session.name?.trim() || session.email.split("@")[0] || "A member";
  return named.replace(/[\r\n]+/g, " ").slice(0, 40);
}

function runsOnRefusal(
  runsOn: string,
  config: DashboardServerConfig,
  session: Session,
): FormRefusal | undefined {
  if (!resolveOwnedIds(session, config).includes(runsOn)) {
    return { field: "runsOn", reason: "A playbook can only run on one of your own bots." };
  }
  const participants = config.hub?.getState().participants ?? [];
  return accountKind(runsOn, participants) === "human"
    ? {
        field: "runsOn",
        reason: "A human account can't run a playbook yet — pick one of your bots to run it.",
      }
    : undefined;
}

function parseSaveBody(
  raw: string,
): { readonly form: AuthoredPlayForm; readonly replaceId?: string } | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const form = parseAuthoredPlayForm(body.form);
  if (!form) return undefined;
  if (body.replaceId === undefined) return { form };
  const replaceId = boundedString(body.replaceId, MAX_ID);
  return replaceId ? { form, replaceId } : undefined;
}

function save(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  session: Session,
  memberKey: string,
): void {
  const store = config.authoredPlays;
  const body = parseSaveBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed save body" });
    return;
  }
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Playbook drafts aren't wired in this deployment." });
    return;
  }
  const { form, replaceId } = body;
  const notYours = runsOnRefusal(form.runsOn, config, session);
  const made = specFromForm(form, creditFor(session));
  const refusals = [...(notYours ? [notYours] : []), ...(made.ok ? [] : made.refusals)];
  if (refusals.length > 0 || !made.ok) {
    sendJson(res, 200, { ok: false, refusals });
    return;
  }
  const saved = store.save(memberKey, form.name.trim(), made.spec, replaceId);
  if (!saved.ok) {
    // A taken name is the name field's to fix.
    sendJson(res, 200, { ok: false, refusals: [{ field: "name", reason: saved.reason }] });
    return;
  }
  sendJson(res, 200, { ok: true, play: viewOf(saved.record) });
}

function setShadow(
  res: ServerResponse,
  raw: string,
  config: DashboardServerConfig,
  session: Session,
  memberKey: string,
): void {
  const body = parseJsonRecord(raw);
  const id = boundedString(body?.id, MAX_ID);
  if (!id || typeof body?.on !== "boolean") {
    sendJson(res, 400, { error: "malformed shadow body" });
    return;
  }
  const store = config.authoredPlays;
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Playbook drafts aren't wired in this deployment." });
    return;
  }
  const mine = store.list(memberKey).find((r) => r.id === id);
  // Starting a test re-asks who may run the play; stopping one needs no such check.
  const notYours =
    body.on && mine ? runsOnRefusal(mine.spec.authorAccountId, config, session) : undefined;
  if (notYours) {
    sendJson(res, 200, { ok: false, error: notYours.reason });
    return;
  }
  const done = store.setShadow(memberKey, id, body.on);
  if (!done.ok) {
    sendJson(res, 200, { ok: false, error: done.reason });
    return;
  }
  sendJson(res, 200, { ok: true, play: viewOf(done.record, config.readAuthoredShadow?.()) });
}

/** Handle `/api/authored-plays*`. Returns true when answered, false when the route doesn't apply. */
export async function serveAuthoredPlaysApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (!session) return false;
  if (
    path !== "/api/authored-plays" &&
    path !== "/api/authored-plays/save" &&
    path !== "/api/authored-plays/shadow" &&
    path !== "/api/authored-plays/delete"
  ) {
    return false;
  }
  const memberKey = opaqueMemberId(session.email);
  if (path === "/api/authored-plays") {
    if (!requireGet(req, res)) return true;
    const records = config.authoredPlays?.list(memberKey) ?? [];
    const report = config.readAuthoredShadow?.();
    sendJson(res, 200, { plays: records.map((record) => viewOf(record, report)) });
    return true;
  }
  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (path === "/api/authored-plays/save") {
    save(res, raw, config, session, memberKey);
    return true;
  }
  if (path === "/api/authored-plays/shadow") {
    setShadow(res, raw, config, session, memberKey);
    return true;
  }
  const id = boundedString(parseJsonRecord(raw)?.id, MAX_ID);
  if (!id) {
    sendJson(res, 400, { error: "malformed delete body" });
    return true;
  }
  config.authoredPlays?.delete(memberKey, id);
  sendJson(res, 200, { ok: true });
  return true;
}
