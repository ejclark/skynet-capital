import type { ServerResponse } from "node:http";
import { browseCollections, unshelved } from "../discovery/collections.js";
import { allEvents } from "../domain/market-events.js";
import { collectionsJsonView } from "../observatory/collections-json-view.js";
import { learnJsonView } from "../observatory/learn-json-view.js";
import { researchShelfJson } from "../observatory/research-json-view.js";
import type { Session } from "./auth/session.js";
import { deskIndex } from "./collections-routes.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { eventCalls, listResearch, shelfSymbols } from "./research-service.js";
import { serveWireJson } from "./wire-routes.js";

/** The shell's content JSON family (#738 phases 5a–6c): the wire, the research shelf, the
 *  journey, and the discovery shelves — read-only twins of their server-rendered views, one
 *  producer each. Returns true when the request was answered. */
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
    return json(
      researchShelfJson(listResearch(), shelfSymbols(asOf), eventCalls(), allEvents(asOf)),
    );
  }
  if (path === "/api/learn") {
    // The viewer's own journey — same resolution as /learn's HTML route.
    const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
    const progress = id && config.progression ? await config.progression.view(id) : undefined;
    return json(learnJsonView(progress));
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
