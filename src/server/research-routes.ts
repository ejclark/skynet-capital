import type { ServerResponse } from "node:http";
import type { NavContext, NavView } from "../observatory/dashboard-shell.js";
import {
  renderResearchDocBody,
  renderResearchShelfBody,
  renderSymbolResearchBody,
} from "../observatory/research-view.js";
import { shellDocument } from "./page-shell.js";
import { findResearchDoc, listResearch, shelfSymbols, symbolResearch } from "./research-service.js";

/**
 * `/research` — the living research surface (docs/plans/research-lab.md slice 1, sharpened
 * 2026-08-17: symbol-first pages + calendar↔research links). Three shapes: the shelf,
 * `/research/symbol/:SYMBOL` symbol pages, and `/research/<slug>` rendered docs. Runs behind the same
 * gate as every other observatory view (dashboard-server dispatches it post-auth); slugs resolve
 * by shelf membership (research-service.ts), so an unknown or hostile path just 404s.
 */
export function serveResearchRoute(
  res: ServerResponse,
  path: string,
  navFor: (active: NavView) => NavContext,
): void {
  const asOfIso = new Date().toISOString();
  const nav = navFor("research");
  const html = (title: string, body: string): void => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument(title, body));
  };
  if (path === "/research") {
    const body = renderResearchShelfBody({
      nav,
      asOfIso,
      shelf: listResearch(),
      symbols: shelfSymbols(asOfIso),
    });
    html("Research — Skynet Capital", body);
    return;
  }
  if (path.startsWith("/research/symbol/")) {
    const data = symbolResearch(
      decodeURIComponent(path.slice("/research/symbol/".length)),
      asOfIso,
    );
    if (data) {
      html(
        `${data.symbol} research — Skynet Capital`,
        renderSymbolResearchBody({ nav, asOfIso, data }),
      );
      return;
    }
  } else {
    const doc = findResearchDoc(decodeURIComponent(path.slice("/research/".length)));
    if (doc) {
      html(`${doc.title} — Skynet Capital`, renderResearchDocBody({ nav, asOfIso, doc }));
      return;
    }
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}
