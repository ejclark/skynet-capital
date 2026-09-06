import type { ServerResponse } from "node:http";
import { browseCollections, unshelved } from "../discovery/collections.js";
import { outpostCatalog } from "../discovery/play-cards.js";
import { marketClosures } from "../domain/market-calendar.js";
import { everyEvent } from "../domain/market-events.js";
import { collectionsJsonView } from "../observatory/collections-json-view.js";
import { learnJsonView } from "../observatory/learn-json-view.js";
import { researchShelfJson } from "../observatory/research-json-view.js";
import { standingsBoardView, standingsCompareView } from "../observatory/standings-board-view.js";
import { parseLeaderMetric } from "../observatory/standings-metric.js";
import type { Session } from "./auth/session.js";
import type { BoardPatchChannel } from "./board-patch-routes.js";
import { deskIndex } from "./collections-routes.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { serveDeskJson } from "./desk-json-routes.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { ledgerDigests } from "./research-horizon-calls.js";
import { eventCalls, listResearch, shelfSymbols } from "./research-service.js";
import { serveWireJson } from "./wire-routes.js";

/** The shell's content JSON family: the wire, the research shelf, the
 *  journey, the discovery shelves, and fleet ops status — read-only twins of their server-rendered
 *  views, one producer each. Returns true when the request was answered. */
export async function serveContentApi(
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  const json = (body: unknown): true => {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify(body));
    return true;
  };
  if (path === "/api/wire") {
    await serveWireJson(res, config, Boolean(config.submitFeedback));
    return true;
  }
  if (path === "/api/research") {
    const asOf = new Date().toISOString();
    // The shelf's calendar keeps history (everyEvent) — a closed-out call is a receipt worth
    // stepping back to — and carries the exchange closures across that whole span, so the rail
    // can colour a closed weekday and count a week's sessions without a broker credential.
    const events = everyEvent();
    const first = events[0]?.date ?? asOf.slice(0, 10);
    const last = events[events.length - 1]?.date ?? first;
    return json(
      researchShelfJson(
        listResearch(),
        shelfSymbols(asOf),
        eventCalls(),
        events,
        ledgerDigests(),
        marketClosures(first < asOf.slice(0, 10) ? first : asOf.slice(0, 10), last),
      ),
    );
  }
  if (path === "/api/learn") {
    // The viewer's own journey — same resolution as /learn's HTML route.
    const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
    const progress =
      id && config.progression
        ? await config.progression.view(id, session ? opaqueMemberId(session.email) : undefined)
        : undefined;
    return json(learnJsonView(progress));
  }
  if (path === "/api/outpost") {
    // The Outpost's card catalog — derived from the registry on every call, so a
    // new exported play is browsable the moment it lands with nothing here to update.
    return json(outpostCatalog());
  }
  if (path === "/api/ops-status") {
    // GROUP-VISIBLE (#1296, Eric: fleet health "should be public for the group"). Every request
    // that reaches here is already through the auth gate (`dashboard-auth-gate.ts`), which is
    // exactly the boundary CLAUDE.md draws: authed members see the shared universe, pre-auth sees
    // nothing. The payload is four prose signals plus links into the public repo's Actions — no
    // credential, no account data — so there is no owner check left to run. `available:false` is
    // the honest answer where the panel isn't wired at all (password mode, no OAuth).
    return json(
      config.opsStatus
        ? { available: true, status: await config.opsStatus.status() }
        : { available: false },
    );
  }
  if (path === "/api/collections") {
    const collections = browseCollections();
    return json(
      collectionsJsonView(
        collections,
        unshelved(collections),
        deskIndex(config.hub.getState().participants),
      ),
    );
  }
  return false;
}

/** JSON twin of `/board/frame` for the React shell: the same board, as data. The
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

/** The shell's read-only JSON family, aggregated — content, board, desk. Moved here from
 *  dashboard-server.ts when the quarantine door (9f-1) pressed that file's line cap. */
export async function serveJsonApi(
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  channel: BoardPatchChannel,
  session: Session | undefined,
): Promise<boolean> {
  if (await serveContentApi(res, path, config, session)) {
    return true;
  }
  if (path === "/api/board") {
    serveBoardJson(res, url, config, channel);
    return true;
  }
  if (path.startsWith("/api/desk/")) {
    await serveDeskJson(res, path, config);
    return true;
  }
  return false;
}
