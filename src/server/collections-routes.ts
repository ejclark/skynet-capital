import type { ServerResponse } from "node:http";
import { browseCollections, findCollection, unshelved } from "../discovery/collections.js";
import {
  type DeskIndex,
  type DeskLink,
  renderCollectionBody,
  renderCollectionsIndexBody,
} from "../observatory/collections-view.js";
import type { NavContext, NavView } from "../observatory/dashboard-shell.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { shellDocument } from "./page-shell.js";

/**
 * `/collections` — narrative discovery over the two house catalogs (issue #588). Read-only: no
 * order originates here, and no persona detail is re-rendered — every member row links out to the
 * desk already running that persona, or to the research doc a play already cites.
 *
 * Shelf ids resolve by membership in the derived set, never by path-joining anything, so an unknown
 * or hostile id just 404s.
 */
export function serveCollectionsRoute(
  res: ServerResponse,
  path: string,
  navFor: (active: NavView) => NavContext,
  desks: DeskIndex,
): boolean {
  const asOfIso = new Date().toISOString();
  const nav: NavContext = navFor("collections");
  const html = (title: string, body: string): void => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument(title, body));
  };
  const collections = browseCollections();
  if (path === "/collections") {
    html(
      "Collections — Skynet Capital",
      renderCollectionsIndexBody({
        nav,
        asOfIso,
        collections,
        unshelved: unshelved(collections),
        desks,
      }),
    );
    return true;
  }
  const id = decodeURIComponent(path.slice("/collections/".length));
  const collection = findCollection(id, collections);
  if (collection) {
    html(
      `${collection.name} — Skynet Capital`,
      renderCollectionBody({ nav, asOfIso, collection, desks }),
    );
    return true;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
  return true;
}

/**
 * personaId → the live desk running it. First registered bot per persona wins; a persona nobody is
 * running is simply absent from the index, which the view renders as an explicit absence rather
 * than a link to nowhere.
 */
export function deskIndex(participants: readonly ParticipantSnapshot[]): DeskIndex {
  const index = new Map<string, DeskLink>();
  for (const participant of participants) {
    const personaId = participant.personaId;
    if (participant.kind === "bot" && personaId && !index.has(personaId)) {
      index.set(personaId, {
        participantId: participant.id,
        displayName: participant.displayName,
      });
    }
  }
  return index;
}
