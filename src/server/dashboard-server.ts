import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { deskActivityView, deskView } from "../observatory/desk-json-view.js";
import {
  type NavContext,
  type NavView,
  renderPortfolioIndexBody,
} from "../observatory/render-dashboard.js";
import { standingsBoardView, standingsCompareView } from "../observatory/standings-board-view.js";
import { parseLeaderMetric } from "../observatory/standings-metric.js";
import type { StandingsOptions } from "../observatory/standings-view.js";
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
import { gateRequest, isOwnerOf } from "./dashboard-auth-gate.js";
import { pageHtml, servePublicRoute } from "./dashboard-board-routes.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import { serveIndividualProfile } from "./dashboard-profile-routes.js";
import { trySelfServiceRoute } from "./dashboard-self-service-routes.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { serveInfoRoute, serveLearnRoute, serveTradeRoute } from "./dashboard-view-routes.js";
import { serveFeedbackRoute } from "./feedback-routes.js";
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

/** JSON twin of `/board/frame` for the React shell (#738 phase 0): the same board, as data. The
 *  client renders this once, then applies `/events` ops verbatim from `seq` — on a gap it comes
 *  back here instead of patching around a hole. Same formatted values, same keys, same auth gate. */
function serveBoardJson(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  channel: BoardPatchChannel,
): void {
  const params = new URL(url, "http://localhost").searchParams;
  const metric = parseLeaderMetric(params.get("by"));
  const state = config.hub.getState();
  // Exactly the page's compare resolution: an id must exist, match, and carry no error —
  // missing/unknown/errored falls through to no compare, never a crash.
  const find = (id: string | null) =>
    id ? state.participants.find((p) => p.id === id && !p.error) : undefined;
  const a = find(params.get("a"));
  const b = find(params.get("b"));
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(
    JSON.stringify({
      seq: channel.head,
      generatedAt: state.generatedAt,
      metric,
      view: standingsBoardView(state, metric),
      ...(a && b ? { compare: standingsCompareView(a, b) } : {}),
    }),
  );
}

/** The 2026-08-25 fold's legacy bookmarks — each old standalone view 302s into Standings so an
 *  old link still lands somewhere real rather than 404ing. `/leaderboard`'s metric param maps onto
 *  Standings' identically-shaped `?by=`; `/compare`'s `?a=&b=` carries over unchanged. */
function serveFoldedRedirect(res: ServerResponse, path: string, url: string): boolean {
  if (path === "/leaderboard") {
    const by = new URL(url, "http://localhost").searchParams.get("by");
    res.writeHead(302, { location: by ? `/?by=${by}` : "/" });
  } else if (path === "/bots-vs-humans") {
    res.writeHead(302, { location: "/" });
  } else if (path === "/compare") {
    res.writeHead(302, { location: `/${new URL(url, "http://localhost").search}` });
  } else {
    return false;
  }
  res.end();
  return true;
}

/** The desk as data (#738 phases 2c–2d) — same gate, same formatters as /u/:id's own views.
 *  `/api/desk/:id` is the blotter; `/api/desk/:id/activity` is the fill timeline. */
async function serveDeskJson(
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
): Promise<void> {
  const rest = decodeURIComponent(path.slice("/api/desk/".length));
  const wantsActivity = rest.endsWith("/activity");
  const id = wantsActivity ? rest.slice(0, -"/activity".length) : rest;
  const state = config.hub.getState();
  const found = state.participants.find((p) => p.id === id);
  if (!found) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "no such desk" }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  if (wantsActivity) {
    // No ledger wired (offline runs without SKYNET_ACTIVITY_DIR) says so — never an empty lie.
    const records = await config.readTradeActivity?.(id);
    res.end(
      JSON.stringify(
        records
          ? { available: true, activity: deskActivityView(records) }
          : { available: false, activity: [] },
      ),
    );
    return;
  }
  res.end(JSON.stringify({ generatedAt: state.generatedAt, desk: deskView(found) }));
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
  if (path === "/api/board") {
    serveBoardJson(res, url, config, channel);
    return;
  }
  if (path.startsWith("/api/desk/")) {
    await serveDeskJson(res, path, config);
    return;
  }
  if (await serveTradeApi(req, res, path, config, session)) {
    return;
  }
  // The React shell (#738 phase 1) — static app/dist behind the same gate as the board.
  if (isAppShellPath(path)) {
    serveAppShell(res, path);
    return;
  }
  if (serveFoldedRedirect(res, path, url)) {
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
