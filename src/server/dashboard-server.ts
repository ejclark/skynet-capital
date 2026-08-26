import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  type NavContext,
  type NavView,
  renderPortfolioIndexBody,
} from "../observatory/render-dashboard.js";
import { parseLeaderMetric } from "../observatory/standings-metric.js";
import type { StandingsOptions } from "../observatory/standings-view.js";
import type { Session } from "./auth/session.js";
import {
  type BoardPatchChannel,
  createBoardChannel,
  driveBoardChannel,
  serveBoardFrame,
  streamBoardPatches,
} from "./board-patch-routes.js";
import { deskIndex } from "./collections-routes.js";
import { gateRequest, isOwnerOf } from "./dashboard-auth-gate.js";
import { pageHtml, servePublicRoute } from "./dashboard-board-routes.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import { serveIndividualProfile } from "./dashboard-profile-routes.js";
import { trySelfServiceRoute } from "./dashboard-self-service-routes.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { serveInfoRoute, serveLearnRoute, serveTradeRoute } from "./dashboard-view-routes.js";
import { serveFeedbackRoute } from "./feedback-routes.js";
import { serveWireRoute } from "./wire-routes.js";

export type { DashboardServerConfig };

/**
 * The live dashboard server. Serves the observatory page and a seq-numbered patch stream that
 * describes only what changed on each hub tick — never a re-rendered page body, which used to
 * destroy every scrap of client state ~4 times a second (see board-patch-routes.ts). Access is
 * gated either by per-user OAuth login (`auth`) or the legacy shared password (`password`). When an
 * `addParticipant` handler is wired, it also serves a `/add` form that registers a new
 * account.
 */
export function createDashboardServer(config: DashboardServerConfig): Server {
  // ONE channel per server, driven by ONE hub subscription: the board diff is computed once per
  // tick regardless of how many viewers are watching, and every viewer shares one seq run.
  const channel = createBoardChannel();
  driveBoardChannel(config.hub, channel, config.ceremonies);
  return createServer((req, res) => {
    void handle(req, res, config, channel);
  });
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  channel: BoardPatchChannel,
): Promise<void> {
  const url = req.url ?? "/";
  const path = url.split("?")[0] ?? "/";

  if (servePublicRoute(path, res, config.hub)) {
    return;
  }

  const gate = await gateRequest(req, res, path, url, config);
  if (gate.handled) {
    return;
  }

  await serveAuthorizedRoute(req, res, path, url, config, gate.session, channel);
}

/** `?a=`/`?b=` for Standings' folded-in compare — shared by `/events` and `/` so neither route
 *  re-derives the same conditional spread inline. */
function parseCompareParams(params: URLSearchParams): Pick<StandingsOptions, "aId" | "bId"> {
  return {
    ...(params.get("a") ? { aId: params.get("a") as string } : {}),
    ...(params.get("b") ? { bId: params.get("b") as string } : {}),
  };
}

/** Routes behind the auth gate — same set and order as before the split. */
async function serveAuthorizedRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  channel: BoardPatchChannel,
): Promise<void> {
  const canAdd = Boolean(config.addParticipant);
  const authed = Boolean(config.auth);
  const canControl = isOwnerOf(config.controls, session);
  const canInvite = isOwnerOf(config.invite, session);
  const canClaim = isOwnerOf(config.claim, session);
  const navFor = (active: NavView): NavContext => ({
    active,
    currentId: resolveCurrentId(session, config.resolveOwnerId),
    canAdd,
    authed,
    ...(canControl ? { canControl } : {}),
    ...(canInvite ? { canInvite } : {}),
    ...(canClaim ? { canClaim } : {}),
  });

  if (path === "/events") {
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    streamBoardPatches(req, res, channel, metric, parseCompareParams(params));
    return;
  }
  // The patch channel's honest fallback: the same Standings content, whole, for the changes a patch
  // cannot express (a row appearing, the cohort lead flipping, a seq gap after a reconnect).
  if (path === "/board/frame") {
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    serveBoardFrame(res, config.hub, navFor("board"), metric, parseCompareParams(params));
    return;
  }
  if (path === "/leaderboard") {
    // Leaderboard folded into Standings (/) 2026-08-25 — an old bookmark still lands somewhere
    // real rather than 404ing. Its own metric param maps onto Standings' identically-shaped one.
    const by = new URL(url, "http://localhost").searchParams.get("by");
    res.writeHead(302, { location: by ? `/?by=${by}` : "/" });
    res.end();
    return;
  }
  if (path === "/bots-vs-humans") {
    // Bots vs Humans folded into Standings (/) 2026-08-25 — same reasoning as /leaderboard above.
    res.writeHead(302, { location: "/" });
    res.end();
    return;
  }
  if (path === "/compare") {
    // Compare folded into Standings (/) as ?a=&b= 2026-08-25 — same params, same shapes, so the
    // query string carries over unchanged rather than 404ing an old bookmark.
    const qs = new URL(url, "http://localhost").search;
    res.writeHead(302, { location: `/${qs}` });
    res.end();
    return;
  }
  if (await trySelfServiceRoute(req, res, path, url, config, session, navFor("add"))) {
    return;
  }
  if (path === "/feedback" || path === "/feedback/coach" || path === "/feedback/preview") {
    await serveFeedbackRoute(req, res, path, session, config, navFor("feedback"));
    return;
  }
  if (path === "/wire") {
    await serveWireRoute(res, config, Boolean(config.submitFeedback), navFor);
    return;
  }
  if (path === "/learn") {
    await serveLearnRoute(res, config, session, navFor);
    return;
  }
  if (serveInfoRoute(res, path, url, navFor, () => deskIndex(config.hub.getState().participants))) {
    return;
  }
  if (path === "/trade") {
    await serveTradeRoute(req, res, url, config, session, navFor);
    return;
  }
  // Portfolio index — /u bare: every account the session's email owns, one level above the desks.
  if (path === "/u") {
    const ownedIds = resolveOwnedIds(session, config);
    const state = config.hub.getState();
    const accounts = state.participants.filter((p) => ownedIds.includes(p.id));
    const body = renderPortfolioIndexBody(accounts, {
      nav: navFor("you"),
      generatedAt: state.generatedAt,
    });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
    return;
  }
  // Individual profile — /u/:id. Ids are already URL-safe; match by prefix (no path-param parser).
  if (path.startsWith("/u/")) {
    await serveIndividualProfile(req, res, path, url, config, navFor, session);
    return;
  }
  if (path === "/" || path === "/index.html") {
    // The board is where every sign-in lands (OAuth's callback redirects here), so it's the
    // cheapest reliable place to stamp "joined" for the /invite observability view — idempotent
    // and fails silently, never blocking the render it rides along with.
    if (session) config.invite?.store.markJoined(session.email, new Date().toISOString());
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(pageHtml(config.hub, navFor("board"), metric, parseCompareParams(params)));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}
