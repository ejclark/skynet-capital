import type { IncomingMessage, ServerResponse } from "node:http";
import { regularSessionOpen } from "../domain/market-session.js";
import { botsRosterView } from "../observatory/bots-roster-view.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { MAX_FOLLOW_ID } from "./member-follow-store.js";
import { botStandingUnder } from "./ops-status-service.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * THE BOTS SCREEN'S API (#8254) — watch the house bots, see why each one skipped, follow one.
 *
 *   GET  /api/bots            → BotsRosterView (`src/observatory/bots-roster-view.ts`)
 *   POST /api/bots/follow     { id } → { ok: true } | 400 when `id` is not a bot account
 *   POST /api/bots/unfollow   { id } → { ok: true } | 400 when `id` is not a bot account
 *
 * The list composes reads the desk routes already make — each bot's own passes (`readDecisions`)
 * and the house mode, gate verdicts and Mission Control holds the `/controls` poll reports — with no
 * broker call and no model call. Following is a pin keyed by `opaqueMemberId`: it orders the list
 * and opens nothing — no ticket, no prefill, no order, no subscription (`member-follow-store.ts`).
 *
 * The list is a league read, served past the invite gate like `/api/desk/:id` (with no OAuth
 * configured, the local single-operator run, there is no session and so no follows). The follow
 * writes keep the member APIs' invariant: `!session` means the route doesn't exist (`false`).
 */

const FOLLOW_BODY_CAP_BYTES = 512;

function botIds(config: DashboardServerConfig): Set<string> {
  return new Set(
    config.hub
      .getState()
      .participants.filter((p) => p.kind === "bot")
      .map((p) => p.id),
  );
}

async function rosterPayload(
  config: DashboardServerConfig,
  memberKey: string | undefined,
): Promise<unknown> {
  const bots = config.hub.getState().participants.filter((p) => p.kind === "bot");
  const standing = config.readBotsStanding?.();
  const records = await Promise.all(
    bots.map((b) => config.readDecisions?.(b.id).catch(() => undefined)),
  );
  return botsRosterView({
    bots: bots.map((b, i) => ({
      id: b.id,
      displayName: b.displayName,
      ...(b.personaId ? { personaId: b.personaId } : {}),
      records: records[i],
      standing: standing
        ? botStandingUnder(
            standing.processMode,
            standing.verdicts?.find((v) => v.id === b.id),
            standing.suspendedReason(b.id),
            standing.opensHeldReason(b.id),
          )
        : null,
    })),
    houseMode: standing?.processMode,
    following: (memberKey && config.memberFollows?.list(memberKey)) || [],
    canFollow: Boolean(memberKey && config.memberFollows),
    // A bot's playbook names ride to a signed-in member (#8254); with no sign-in configured, the
    // single operator owns every bot.
    names: Boolean(memberKey) || !config.auth,
    now: new Date(),
    marketOpen: regularSessionOpen(),
  });
}

/** Handle `/api/bots*`. Returns true when answered, false when the route doesn't apply. */
export async function serveBotsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/api/bots") {
    if (!requireGet(req, res)) return true;
    res.setHeader("cache-control", "no-store");
    sendJson(res, 200, await rosterPayload(config, session && opaqueMemberId(session.email)));
    return true;
  }
  if (!session) return false;
  if (path !== "/api/bots/follow" && path !== "/api/bots/unfollow") return false;
  const memberKey = opaqueMemberId(session.email);
  const raw = await readJsonPost(req, res, FOLLOW_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  const id = boundedString(parseJsonRecord(raw)?.id, MAX_FOLLOW_ID);
  if (!(id && botIds(config).has(id))) {
    sendJson(res, 400, { error: "not a bot account" });
    return true;
  }
  const store = config.memberFollows;
  if (!store) {
    sendJson(res, 200, { ok: false, error: "Following isn't wired in this deployment." });
    return true;
  }
  if (path === "/api/bots/unfollow") {
    store.unfollow(memberKey, id);
    sendJson(res, 200, { ok: true });
    return true;
  }
  const done = store.follow(memberKey, id);
  sendJson(res, 200, done.ok ? { ok: true } : { ok: false, error: done.reason });
  return true;
}
