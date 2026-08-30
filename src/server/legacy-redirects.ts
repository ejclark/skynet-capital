import type { ServerResponse } from "node:http";

/**
 * NO DEAD EXITS — every legacy URL 302s into `/app/*`, so a bookmark, an old
 * link, or a stray anchor can never strand a member outside the shell (Eric's live review,
 * 2026-08-28: reachable legacy pieces read as an unfinished port). The pre-redesign HTML pages
 * this map used to twin against are gone entirely — this map is now the
 * permanent bookmark-protection layer, not a bridge to a parallel app.
 *
 * Rules that bound the map:
 *  - GET only. There is no legacy write handler left to fall through to on a POST.
 *  - `/feedback/coach` and `/feedback/preview` are shared JSON endpoints the shell's own coach
 *    box posts to directly — never redirected. `/research/<slug>` documents are server-rendered
 *    by design.
 *  - Queries carry over where the twin speaks them (`?by=` on the board, `?q=` filters ride the
 *    path unchanged); the desk's `?tab=` maps to the shell's routes instead.
 */

/** The legacy desk's tabs, mapped: performance's twin is Pulse; settings moved to /app/settings
 *  (Mission Control, #475 → 8c); overview/active both land on the shell desk. */
function deskTarget(path: string, url: string): string {
  const id = path.slice("/u/".length);
  if (id === "") return "/app/settings";
  const tab = new URL(url, "http://localhost").searchParams.get("tab");
  if (tab === "settings") return "/app/settings";
  if (tab === "performance") return `/app/u/${id}/pulse`;
  return `/app/u/${id}`;
}

/** The straight renames — one shell page, same meaning, query preserved. */
const TWINS: ReadonlyMap<string, string> = new Map([
  ["/add", "/app/join"],
  ["/feedback", "/app/feedback"],
  // The owner pages' cards live on app Settings (9e).
  ["/invite", "/app/settings"],
  ["/claim", "/app/settings"],
  ["/ops-status", "/app/settings"],
  ["/learn", "/app/learn"],
  // The ticket (10b): the shell speaks ?play= and ?desk=; other legacy params drop harmlessly
  // in the shell route's validateSearch.
  ["/trade", "/app/trade"],
  ["/wire", "/app/wire"],
  ["/research", "/app/research"],
  ["/collections", "/app/collections"],
  // The account pages' shell home is Settings — profile, removal, rotation all live there now.
  ["/account", "/app/settings"],
  ["/rotate", "/app/settings"],
  // The retired Mission Control bookmark — the fleet switchboard lives on app Settings for every
  // viewer now, so there's no "whose desk" to resolve first.
  ["/controls", "/app/settings"],
  // The bare portfolio index listed the session's own accounts — Settings is that list now.
  ["/u", "/app/settings"],
]);

/**
 * Redirect a legacy URL to its shell twin. Returns true when the response was written. Non-GET
 * requests never redirect — nothing serves a legacy POST anymore, so one falls through to a 404.
 */
export function serveLegacyRedirect(
  res: ServerResponse,
  path: string,
  url: string,
  method: string,
): boolean {
  if (method !== "GET" && method !== "HEAD") return false;
  const search = new URL(url, "http://localhost").search;

  // The pre-shell board names fold into the front door exactly as before.
  if (path === "/leaderboard") {
    const by = new URL(url, "http://localhost").searchParams.get("by");
    res.writeHead(302, { location: by ? `/?by=${by}` : "/" });
  } else if (path === "/bots-vs-humans") {
    res.writeHead(302, { location: "/" });
  } else if (path === "/compare") {
    res.writeHead(302, { location: `/${search}` });
  } else if (TWINS.has(path)) {
    res.writeHead(302, { location: `${TWINS.get(path)}${search}` });
  } else if (path.startsWith("/collections/")) {
    res.writeHead(302, { location: `/app${path}${search}` });
  } else if (path.startsWith("/u/")) {
    res.writeHead(302, { location: deskTarget(path, url) });
  } else {
    return false;
  }
  res.end();
  return true;
}
