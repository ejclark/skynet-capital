import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  type NavContext,
  type NavView,
  renderPortfolioIndexBody,
} from "../observatory/render-dashboard.js";
import { parseLeaderMetric } from "../observatory/standings-metric.js";
import type { StandingsOptions } from "../observatory/standings-view.js";
import { serveAdminApi } from "./admin-api-routes.js";
import { isAppShellPath, serveAppShell } from "./app-shell-routes.js";
import type { Session } from "./auth/session.js";
import {
  type BoardPatchChannel,
  createBoardChannel,
  driveBoardChannel,
  serveBoardFrame,
  streamBoardPatches,
} from "./board-patch-routes.js";
import { deskIndex } from "./collections-routes.js";
import { serveJsonApi } from "./content-api-routes.js";
import { serveControlsApi } from "./controls-api-routes.js";
import { gateRequest, isOwnerOf } from "./dashboard-auth-gate.js";
import { pageHtml, servePublicRoute } from "./dashboard-board-routes.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import { serveIndividualProfile } from "./dashboard-profile-routes.js";
import { trySelfServiceRoute } from "./dashboard-self-service-routes.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { serveInfoRoute, serveLearnRoute, serveTradeRoute } from "./dashboard-view-routes.js";
import { serveFeedbackApi } from "./feedback-api-routes.js";
import { serveFeedbackRoute } from "./feedback-routes.js";
import { serveJoinApi } from "./join-api-routes.js";
import { serveLearnApi } from "./learn-api-routes.js";
import { serveLegacyRedirect, withClassicBanner } from "./legacy-redirects.js";
import { serveSettingsApi } from "./settings-api-routes.js";
import { serveTradeApi } from "./trade-api-routes.js";
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

/** The 2026-08-25 fold's legacy bookmarks — each old standalone view 302s into Standings so an
 *  old link still lands somewhere real rather than 404ing. `/leaderboard`'s metric param maps onto
 *  Standings' identically-shaped `?by=`; `/compare`'s `?a=&b=` carries over unchanged. */
/** The front door and its escape hatch (#738 phase 7a): `/` stamps joined and 302s into the
 *  shell; `/classic` keeps the pre-redesign board reachable. Returns true when handled. */
function serveHomePages(
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  navFor: (active: NavView) => NavContext,
): boolean {
  if (path === "/" || path === "/index.html") {
    // The front door is the SHELL (#738 phase 7a — the redesign becomes what members see).
    // Sign-in still lands here first (OAuth's callback redirects to /), so the "joined" stamp
    // stays on this hop — idempotent, fails silently, never blocking the redirect it rides.
    if (session) config.invite?.store.markJoined(session.email, new Date().toISOString());
    // ?by= and the compare params carry over verbatim — the shell's Standings speaks them.
    res.writeHead(302, { location: `/app/${new URL(url, "http://localhost").search}` });
    res.end();
    return true;
  }
  // The pre-redesign board keeps a home — an escape hatch, not a hidden fork.
  if (path === "/classic") {
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      withClassicBanner(pageHtml(config.hub, navFor("board"), metric, parseCompareParams(params))),
    );
    return true;
  }
  return false;
}

/** The shell's write-API families, one dispatcher — trade, settings, learn, controls, join. */
async function serveWriteApis(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (await serveTradeApi(req, res, path, config, session)) return true;
  if (await serveSettingsApi(req, res, path, config, session)) return true;
  if (await serveLearnApi(req, res, path, config, session)) return true;
  if (await serveControlsApi(req, res, path, config, session)) return true;
  if (await serveFeedbackApi(req, res, path, config, session)) return true;
  if (await serveAdminApi(req, res, path, config, session)) return true;
  return serveJoinApi(req, res, path, config, session);
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
  const canOpsStatus = isOwnerOf(config.opsStatus, session);
  const navFor = (active: NavView): NavContext => ({
    active,
    currentId: resolveCurrentId(session, config.resolveOwnerId),
    canAdd,
    authed,
    ...(canControl ? { canControl } : {}),
    ...(canInvite ? { canInvite } : {}),
    ...(canClaim ? { canClaim } : {}),
    ...(canOpsStatus ? { canOpsStatus } : {}),
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
  if (await serveJsonApi(res, path, url, config, channel, session)) {
    return;
  }
  if (await serveWriteApis(req, res, path, config, session)) {
    return;
  }
  // The React shell (#738 phase 1) — static app/dist behind the same gate as the board.
  if (isAppShellPath(path)) {
    serveAppShell(res, path);
    return;
  }
  if (serveLegacyRedirect(res, path, url, req.method ?? "GET")) {
    return;
  }
  // THE QUARANTINE DOOR (#738 phase 9f-1, Eric's go 2026-08-29): every legacy page stays
  // reachable at /classic/<path> while the shell proves out — placed AFTER the redirect layer
  // (a prefixed path can't bounce back into /app), before the legacy handlers, which serve
  // unchanged (the auth gate already ran; owner pages re-check their own). A fallback door,
  // not a parallel app; the delete PR retires this line.
  const pagePath = path.startsWith("/classic/") ? path.slice("/classic".length) : path;
  if (await trySelfServiceRoute(req, res, pagePath, url, config, session, navFor("add"))) {
    return;
  }
  if (
    pagePath === "/feedback" ||
    pagePath === "/feedback/coach" ||
    pagePath === "/feedback/preview"
  ) {
    await serveFeedbackRoute(req, res, pagePath, session, config, navFor("feedback"));
    return;
  }
  if (pagePath === "/wire") {
    await serveWireRoute(res, config, Boolean(config.submitFeedback), navFor);
    return;
  }
  if (pagePath === "/learn") {
    await serveLearnRoute(res, config, session, navFor);
    return;
  }
  if (
    serveInfoRoute(res, pagePath, url, navFor, () => deskIndex(config.hub.getState().participants))
  ) {
    return;
  }
  if (pagePath === "/trade") {
    await serveTradeRoute(req, res, url, config, session, navFor);
    return;
  }
  // Portfolio index — /u bare: every account the session's email owns, one level above the desks.
  if (pagePath === "/u") {
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
  if (pagePath.startsWith("/u/")) {
    await serveIndividualProfile(req, res, pagePath, url, config, navFor, session);
    return;
  }
  if (serveHomePages(res, pagePath, url, config, session, navFor)) {
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}
