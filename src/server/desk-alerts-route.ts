import type { IncomingMessage, ServerResponse } from "node:http";
import { type Alert, alertFingerprint, sortAlerts } from "../alerts/alert.js";
import { orderAlerts } from "../alerts/order-watch.js";
import { positionAlerts } from "../alerts/position-watch.js";
import { forVisibility } from "../observatory/activity-event.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { loadOptionPositions } from "./option-positions-route.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";

/**
 * THE DESK'S ALERTS (#3407 P4 slice 1) — the first member-facing consumer of the #586 substrate.
 *
 *   GET  /api/trade/alerts?participantId=…   → `{ available, asOf, alerts, dismissable }`: the
 *                                             position-watch alerts standing right now, loudest
 *                                             first, minus what this member has dismissed.
 *   POST /api/trade/alerts/dismiss { participantId, fingerprint }
 *                                           → `{ ok:true }` once recorded, else a refusal.
 *
 * Two pure producers, re-derived per read: `position-watch.ts` over the same option-positions
 * view the card shows, and `order-watch.ts` over the account's own activity ledger (slice 2 —
 * fills, cancels, rejections, replaces as rows instead of vanished toasts). No second feed, no
 * state to drift: a
 * dismissal is the ONE durable fact, keyed by `alertFingerprint` (source · priority · symbol ·
 * dedupeKey) so a re-derived alert with a fresh id stays dismissed and an escalated one re-shows.
 * Identity is the session's, exactly as the positions route checks it. Without a dismissals
 * port the list still answers and says dismissals are off — never a silent no-op.
 */

export const DESK_ALERTS_PATH = "/api/trade/alerts";
export const DESK_ALERTS_DISMISS_PATH = "/api/trade/alerts/dismiss";
const DISMISS_BODY_CAP_BYTES = 2_048;
/** The tiers an owner may read of their own ledger — the desk stream's rule, kept here. */
const OWNER_TIERS = forVisibility(["public", "owner-only"]);

/** The wire shape of one alert — the substrate's own fields, nothing added. */
export type DeskAlert = Alert & { readonly fingerprint: string };

function owned(id: string, config: DashboardServerConfig, session: Session | undefined): boolean {
  const ids = config.auth ? resolveOwnedIds(session, config) : [id];
  return id !== "" && ids.includes(id);
}

async function serveList(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const id = new URL(req.url ?? "/", "http://localhost").searchParams.get("participantId") ?? "";
  if (!owned(id, config, session)) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const positions = await loadOptionPositions(id, config);
  if (positions.kind === "missing") {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  // Two producers, one list: the positions' standing conditions and the orders' recent
  // lifecycle (#3407 P4 slice 2). An account with neither source wired says so in words.
  const log = config.activityLog;
  if (positions.kind === "unlinked" && !log) {
    sendJson(res, 200, { available: false, reason: "unlinked", alerts: [], dismissable: false });
    return;
  }
  const now = config.now?.() ?? new Date();
  const rows = positions.kind === "ok" ? positions.view.rows : [];
  const events = log ? (await log.list(id)).filter(OWNER_TIERS) : [];
  const dismissed = new Set(await config.alertDismissals?.loadDismissed(id));
  const alerts: DeskAlert[] = sortAlerts([
    ...positionAlerts(rows, now.getTime()),
    ...orderAlerts(events, now.getTime()),
  ])
    .map((alert) => ({ ...alert, fingerprint: alertFingerprint(alert) }))
    .filter((alert) => !dismissed.has(alert.fingerprint));
  sendJson(res, 200, {
    available: true,
    asOf: now.toISOString(),
    alerts,
    dismissable: config.alertDismissals !== undefined,
  });
}

async function serveDismiss(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, DISMISS_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  const participantId = body?.participantId;
  const fingerprint = body?.fingerprint;
  if (
    typeof participantId !== "string" ||
    participantId.length === 0 ||
    participantId.length > 100 ||
    typeof fingerprint !== "string" ||
    fingerprint.length === 0 ||
    fingerprint.length > 400
  ) {
    sendJson(res, 400, { error: "malformed dismiss body" });
    return;
  }
  if (!owned(participantId, config, session)) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["You can only dismiss alerts on your own account."],
    });
    return;
  }
  if (!config.alertDismissals) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["Dismissals aren't stored on this deployment, so the alert stays."],
    });
    return;
  }
  await config.alertDismissals.dismiss(participantId, fingerprint);
  sendJson(res, 200, { ok: true });
}

/** Handle `/api/trade/alerts` and `/api/trade/alerts/dismiss`. Returns true when answered. */
export async function serveDeskAlertsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === DESK_ALERTS_PATH) {
    if (requireGet(req, res)) await serveList(req, res, config, session);
    return true;
  }
  if (path === DESK_ALERTS_DISMISS_PATH) {
    await serveDismiss(req, res, config, session);
    return true;
  }
  return false;
}
