import type { IncomingMessage, ServerResponse } from "node:http";
import type { DeskIndex } from "../observatory/collections-view.js";
import {
  type NavContext,
  type NavView,
  renderAcademyBody,
} from "../observatory/render-dashboard.js";
import type { Session } from "./auth/session.js";
import { serveCollectionsRoute } from "./collections-routes.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { shellDocument } from "./page-shell.js";
import { serveResearchRoute } from "./research-routes.js";
import { handleTrade } from "./trade-routes.js";

/**
 * The Milestones page (`/learn`) — the one info view that knows WHO is looking: the session's
 * identity resolves exactly as `/trade`'s does, and the viewer's derived progression (earned
 * milestones, points, rank) rides into the render. No identity, or no progression service wired,
 * degrades to the browsable journey at zero — honestly, never a fabricated state.
 */
export async function serveLearnRoute(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
  navFor: (active: NavView) => NavContext,
): Promise<void> {
  const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const progress = id && config.progression ? await config.progression.view(id) : undefined;
  const body = renderAcademyBody({ nav: navFor("learn"), ...(progress ? { progress } : {}) });
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(shellDocument("Milestones — Skynet Capital", body));
}

/**
 * The read-only info views behind the gate — `/research`, `/collections`, the `/calendar` redirect
 * — grouped so the main dispatch stays within its complexity budget. Returns true when the request
 * was handled; dispatch order is unchanged from before the extraction.
 *
 * `desks` is a THUNK so the participant snapshot is only read on the one route that needs it
 * (Collections links each persona to the live desk running it); every other route pays nothing.
 * Without it Collections still renders — every persona simply shows as having no live desk, which
 * is the honest reading of "the server wired no participants".
 */
export function serveInfoRoute(
  res: ServerResponse,
  path: string,
  url: string,
  navFor: (active: NavView) => NavContext,
  desks?: () => DeskIndex,
): boolean {
  if (path === "/calendar") {
    // The event horizon folded into the Research shelf 2026-08-25 — an old bookmark still lands
    // somewhere real rather than 404ing. Its month param carries over unchanged.
    const month = new URL(url, "http://localhost").searchParams.get("month");
    res.writeHead(302, { location: month ? `/research?month=${month}` : "/research" });
    res.end();
    return true;
  }
  if (path === "/research" || path.startsWith("/research/")) {
    serveResearchRoute(res, path, url, navFor);
    return true;
  }
  if (path === "/collections" || path.startsWith("/collections/")) {
    return serveCollectionsRoute(res, path, navFor, desks?.() ?? new Map());
  }
  return false;
}

/**
 * `/trade` — GET is the ticket view, POST the order path. Identity comes from the session and
 * nowhere else: with no authenticator configured no id resolves, and `trade-routes.ts` refuses
 * rather than guessing which account a request belongs to.
 */
export async function serveTradeRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  navFor: (active: NavView) => NavContext,
): Promise<void> {
  const participants = config.hub.getState().participants;
  await handleTrade(req, res, url, {
    snapshotFor: (id) => participants.find((p) => p.id === id),
    requesterId: config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined,
    tradingEnabled: Boolean(config.tradingEnabled),
    ...(config.progression ? { progression: config.progression } : {}),
    ...(config.submitTrade ? { submitTrade: config.submitTrade } : {}),
    ...(config.submitOptionTrade ? { submitOptionTrade: config.submitOptionTrade } : {}),
    ...(config.optionsClientFor ? { optionsClientFor: config.optionsClientFor } : {}),
    ...(config.tradingClientFor ? { tradingClientFor: config.tradingClientFor } : {}),
    nav: navFor("trade"),
    document: shellDocument,
  });
}
