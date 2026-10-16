import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { parseLeaderMetric } from "../observatory/standings-metric.js";
import type { StandingsOptions } from "../observatory/standings-view.js";
import { serveAdminApi } from "./admin-api-routes.js";
import { serveAlertDeliveryApi } from "./alert-delivery-route.js";
import { isAppShellPath, serveAppShell } from "./app-shell-routes.js";
import type { Session } from "./auth/session.js";
import {
  type BoardPatchChannel,
  createBoardChannel,
  driveBoardChannel,
  streamBoardPatches,
} from "./board-patch-routes.js";
import { serveClientErrorApi } from "./client-error-route.js";
import { serveCompanionApi } from "./companion-routes.js";
import { serveJsonApi } from "./content-api-routes.js";
import { serveControlsApi } from "./controls-api-routes.js";
import { serveCouncilApi } from "./council-api-routes.js";
import { serveCouncilRepliesApi } from "./council-replies-api-routes.js";
import { gateRequest } from "./dashboard-auth-gate.js";
import { servePublicRoute } from "./dashboard-board-routes.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { serveDeskAlertsApi } from "./desk-alerts-route.js";
import { serveDeskEventsApi } from "./desk-events-route.js";
import { serveDraftOrderApi } from "./draft-order-route.js";
import { serveFeedbackApi } from "./feedback-api-routes.js";
import { serveFeedbackRoute } from "./feedback-routes.js";
import { serveFilingCommentsApi } from "./filing-comments-api-routes.js";
import { serveJoinApi } from "./join-api-routes.js";
import { serveLearnApi } from "./learn-api-routes.js";
import { serveLegacyRedirect } from "./legacy-redirects.js";
import { serveOnboardingApi } from "./onboarding-api-routes.js";
import { serveOptionApi } from "./option-api-routes.js";
import { serveOptionLifecycleApi } from "./option-lifecycle-route.js";
import { serveOptionPositionsApi } from "./option-positions-route.js";
import { servePlaybooksApi } from "./playbooks-api-routes.js";
import { servePlaysApi } from "./plays-api-routes.js";
import { serveQuoteStream } from "./quote-stream-route.js";
import { isResearchDocPath, serveResearchDoc } from "./research-page-routes.js";
import { serveSavedPositionsApi } from "./saved-positions-api-routes.js";
import { serveSettingsApi } from "./settings-api-routes.js";
import { serveSubscriptionsApi } from "./subscriptions-api-routes.js";
import { serveTradeApi } from "./trade-api-routes.js";
import { serveTradeOrdersApi } from "./trade-orders-routes.js";
import { serveWatchlistApi } from "./watchlist-route.js";

export type { DashboardServerConfig };

/**
 * The live dashboard server. Serves the React shell's static assets and JSON APIs behind a
 * seq-numbered patch stream that describes only what changed on each hub tick — never a
 * re-rendered page body, which used to destroy every scrap of client state ~4 times a second (see
 * board-patch-routes.ts). Access is gated either by per-user OAuth login (`auth`) or the legacy
 * shared password (`password`).
 */
export function createDashboardServer(config: DashboardServerConfig): Server {
  // ONE channel per server, driven by ONE hub subscription: the board diff is computed once per
  // tick regardless of how many viewers are watching, and every viewer shares one seq run.
  const channel = createBoardChannel();
  driveBoardChannel(config.hub, channel, config.ceremonies);
  return createServer((req, res) => {
    void handle(req, res, config, channel).catch((error: unknown) => {
      // Last-resort net (mirrors insights-listener.ts): every route handler below is expected to
      // catch what it can reason about, but nothing here may ever escape to become an uncaught
      // exception on Node's unhandled-rejection path — which on this runtime terminates the
      // process. A crash here is a real production outage of the public dashboard, not a quietly
      // dropped request, so failing closed with a response is not optional. `process.emitWarning`,
      // not `console` — this is library code (the repo reserves console for scripts).
      process.emitWarning(`[dashboard-server] unhandled error: ${String(error)}`);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "internal error" }));
      } else {
        res.end();
      }
    });
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

/** The front door: every sign-in and every bare visit lands in the shell. */
function serveHomePage(
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): boolean {
  if (path !== "/" && path !== "/index.html") return false;
  // Sign-in still lands here first (OAuth's callback redirects to /), so the "joined" stamp stays
  // on this hop — idempotent, fails silently, never blocking the redirect it rides.
  if (session) config.invite?.store.markJoined(session.email, new Date().toISOString());
  // ?by= and the compare params carry over verbatim — the shell's Standings speaks them.
  res.writeHead(302, { location: `/app/${new URL(url, "http://localhost").search}` });
  res.end();
  return true;
}

/** The desk's Server-Sent Events channels — a desk's order lifecycle (#3407 P4 slice 1) and one
 *  symbol's pushed quote (#3407 P4, the quote stream). Grouped because neither is a write API and
 *  both are synchronous route claims, so `serveWriteApis` carries one branch for the pair. */
function serveStreamApis(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): boolean {
  if (serveDeskEventsApi(req, res, path, config, session)) return true;
  return serveQuoteStream(req, res, path, config, session);
}

/** The shell's write-API families, one dispatcher — trade (shares, options, the plays catalog),
 *  settings, learn, controls, join. */
async function serveWriteApis(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (await serveTradeApi(req, res, path, config, session)) return true;
  if (await serveTradeOrdersApi(req, res, path, config, session)) return true;
  if (serveStreamApis(req, res, path, config, session)) return true;
  if (await serveOptionPositionsApi(req, res, path, config, session)) return true;
  if (await serveOptionLifecycleApi(req, res, path, config, session)) return true;
  if (await serveDeskAlertsApi(req, res, path, config, session)) return true;
  if (await serveAlertDeliveryApi(req, res, path, config, session)) return true;
  if (await serveWatchlistApi(req, res, path, config, session)) return true;
  if (await serveOptionApi(req, res, path, config, session)) return true;
  if (await serveDraftOrderApi(req, res, path, config, session)) return true;
  if (await servePlaysApi(req, res, path, config, session)) return true;
  if (await serveSettingsApi(req, res, path, config, session)) return true;
  if (await serveSubscriptionsApi(req, res, path, config, session)) return true;
  if (await serveSavedPositionsApi(req, res, path, config, session)) return true;
  if (await serveLearnApi(req, res, path, config, session)) return true;
  if (await serveOnboardingApi(req, res, path, config, session)) return true;
  if (await servePlaybooksApi(req, res, path, config, session)) return true;
  if (await serveControlsApi(req, res, path, config, session)) return true;
  if (await serveCouncilApi(req, res, path, config.council, session)) return true;
  if (await serveCouncilRepliesApi(req, res, path, config.councilReplies, session)) return true;
  if (await serveFilingCommentsApi(req, res, path, config.filingComments, session)) return true;
  if (await serveFeedbackApi(req, res, path, config, session)) return true;
  if (await serveCompanionApi(req, res, path, config, session)) return true;
  if (await serveAdminApi(req, res, path, config, session)) return true;
  if (await serveClientErrorApi(req, res, path, session, config.logLine)) return true;
  return serveJoinApi(req, res, path, config, session);
}

/** Routes behind the auth gate. */
async function serveAuthorizedRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  channel: BoardPatchChannel,
): Promise<void> {
  if (path === "/events") {
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    streamBoardPatches(req, res, channel, metric, parseCompareParams(params));
    return;
  }
  if (await serveJsonApi(res, path, url, config, channel, session)) {
    return;
  }
  if (await serveWriteApis(req, res, path, config, session)) {
    return;
  }
  // The shell's own coach box posts to these two bare paths directly — load-bearing, not a
  // legacy-compat shim (`feedback-routes.ts`).
  if (path === "/feedback/coach" || path === "/feedback/preview") {
    await serveFeedbackRoute(req, res, path, session, config);
    return;
  }
  // The individual research document — server-rendered markdown, per research-service.ts's
  // module doc; `/research` itself (the shelf listing) stays the legacy redirect below.
  if (isResearchDocPath(path)) {
    serveResearchDoc(res, path);
    return;
  }
  // Legacy renames first: the map also carries the shell's OWN retired paths (`/app/wire` →
  // `/app/activity`), which must 302 before the SPA fallback would hand them index.html.
  if (serveLegacyRedirect(res, path, url, req.method ?? "GET")) {
    return;
  }
  // The React shell — static app/dist behind the same gate as the board.
  if (isAppShellPath(path)) {
    serveAppShell(res, path);
    return;
  }
  if (serveHomePage(res, path, url, config, session)) {
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}
