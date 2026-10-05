import type { IncomingMessage, ServerResponse } from "node:http";
import {
  type AlertDeliveryPrefs,
  DELIVERY_CHANNELS,
  DELIVERY_OFF,
  deliveryMessage,
  parseChannel,
  parsePriority,
} from "../alerts/alert-delivery.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";

/**
 * ALERT DELIVERY, THE MEMBER'S OWN SWITCH (#3407 P4 slice 3 — the last capability in this plan).
 *
 *   GET  /api/trade/alerts/delivery?participantId=…  → `{ available, reason?, channel,
 *                                                        minPriority, destination?, from? }`
 *   POST /api/trade/alerts/delivery { participantId, channel, minPriority }
 *                                                   → `{ ok, … }` plus the confirmation's outcome
 *
 * THE DESTINATION IS NEVER IN THE REQUEST. It is read off the signed-in session, server side, and
 * nowhere else — so the one thing this feature cannot be made to do is mail a third party. A member
 * whose provider gave us a login instead of an address reads as `available: false` with that said
 * in words, rather than a control that silently never delivers.
 *
 * Turning delivery ON sends one confirmation message immediately and reports what the transport
 * said. That is the honest proof the credential and the address both work: without it, a member's
 * first delivered alert would also be the first test of the whole path, at the exact moment they
 * most need it to work.
 *
 * Absent a transport the route still ANSWERS, with `available: false` and the reason — the plan's
 * done line: "WHERE no delivery credential is configured THE SYSTEM SHALL say so in words on the
 * alerts surface rather than silently dropping it."
 */

export const ALERT_DELIVERY_PATH = "/api/trade/alerts/delivery";
const BODY_CAP_BYTES = 2_048;
/** An address this app will send to — the member's own, as their provider gave it to us. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function owned(id: string, config: DashboardServerConfig, session: Session | undefined): boolean {
  const ids = config.auth ? resolveOwnedIds(session, config) : [id];
  return id !== "" && ids.includes(id);
}

/** The member's own address, or undefined when their sign-in never carried one. */
function destinationFor(session: Session | undefined): string | undefined {
  const email = session?.email;
  return email && EMAIL.test(email) ? email : undefined;
}

/** Why delivery cannot happen for this caller, or undefined when it can. */
function unavailableReason(
  config: DashboardServerConfig,
  session: Session | undefined,
): string | undefined {
  if (!config.alertDeliveryStore) {
    return "This deployment keeps no delivery settings, so alerts stay on this page.";
  }
  if (!config.alertDelivery) {
    return "Alert delivery isn't configured on this deployment yet — alerts stay on this page.";
  }
  if (!destinationFor(session)) {
    return "Your sign-in didn't give us an email address, so there's nowhere to send alerts.";
  }
  return undefined;
}

async function serveRead(
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
  const prefs = (await config.alertDeliveryStore?.load(id))?.prefs ?? DELIVERY_OFF;
  const reason = unavailableReason(config, session);
  sendJson(res, 200, {
    available: reason === undefined,
    ...(reason ? { reason } : {}),
    channels: DELIVERY_CHANNELS,
    channel: prefs.channel,
    minPriority: prefs.minPriority,
    ...(prefs.destination ? { destination: prefs.destination } : {}),
    ...(config.alertDelivery ? { from: config.alertDelivery.from } : {}),
  });
}

/** The confirmation one opt-in earns: proof the key and the address both work, in the transport's
 *  own words. A refusal leaves the member opted in — the setting is theirs, the failure is ours. */
async function confirm(
  config: DashboardServerConfig,
  prefs: AlertDeliveryPrefs,
): Promise<readonly string[]> {
  if (prefs.channel === "off" || !prefs.destination || !config.alertDelivery) return [];
  const at = (config.now?.() ?? new Date()).getTime();
  const receipt = await config.alertDelivery.send(
    deliveryMessage(
      {
        id: `delivery-confirmation@${at}`,
        at,
        source: "delivery",
        priority: "info",
        title: "Alert delivery is on for this account",
        body: "This is the only message you'll get that isn't about your own positions or orders.",
      },
      prefs.destination,
    ),
  );
  return receipt.ok ? [] : [`Saved, but the test message didn't go through — ${receipt.reason}`];
}

async function serveWrite(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  const participantId = body?.participantId;
  const channel = parseChannel(body?.channel);
  const minPriority = parsePriority(body?.minPriority);
  if (typeof participantId !== "string" || !channel || !minPriority) {
    sendJson(res, 400, { error: "malformed delivery body" });
    return;
  }
  if (!owned(participantId, config, session)) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["You can only change delivery on your own account."],
    });
    return;
  }
  const store = config.alertDeliveryStore;
  if (!store) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["This deployment keeps no delivery settings, so alerts stay on this page."],
    });
    return;
  }
  const destination = destinationFor(session);
  if (channel !== "off" && !(destination && config.alertDelivery)) {
    sendJson(res, 200, {
      ok: false,
      refusals: [unavailableReason(config, session) ?? "Delivery isn't available on this account."],
    });
    return;
  }
  const prefs: AlertDeliveryPrefs = {
    channel,
    minPriority,
    ...(channel !== "off" && destination ? { destination } : {}),
  };
  await store.savePrefs(participantId, prefs);
  const refusals = await confirm(config, prefs);
  sendJson(res, 200, {
    ok: refusals.length === 0,
    channel: prefs.channel,
    minPriority: prefs.minPriority,
    ...(prefs.destination ? { destination: prefs.destination } : {}),
    ...(refusals.length > 0 ? { refusals } : {}),
  });
}

/** Handle `/api/trade/alerts/delivery`. Returns true when answered. */
export async function serveAlertDeliveryApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== ALERT_DELIVERY_PATH) return false;
  if ((req.method ?? "GET") === "GET") {
    if (requireGet(req, res)) await serveRead(req, res, config, session);
    return true;
  }
  await serveWrite(req, res, config, session);
  return true;
}
