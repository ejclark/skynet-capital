import type { ServerResponse } from "node:http";

/**
 * NO DEAD EXITS (#738 phase 9a) — every legacy URL with a shell twin 302s into `/app/*`, so a
 * bookmark, an old link, or a stray anchor can never strand a member in the pre-redesign HTML
 * (Eric's live review, 2026-08-28: reachable legacy pieces read as an unfinished port).
 *
 * Three rules bound the map:
 *  - GET only. The legacy POST handlers (account forms, the trade ticket, the desk settings tab)
 *    keep answering so nothing breaks mid-flight — they just have no UI reaching them anymore.
 *  - Only routes with a REAL shell twin redirect. `/trade` stays: the options ticket exists only
 *    on the HTML page until the shell gate learns options plays. `/invite`,
 *    `/claim`, `/ops-status` stay until their phase-9 ports land (`/add` and `/feedback`
 *    joined the twins in 9c/9d; `/feedback/coach` and `/feedback/preview` are shared JSON
 *    endpoints, not pages, and keep serving). `/research/<slug>` documents
 *    are server-rendered by design, and `/classic` is the deliberate escape hatch.
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
  ["/learn", "/app/learn"],
  ["/wire", "/app/wire"],
  ["/research", "/app/research"],
  ["/collections", "/app/collections"],
  // The account pages' shell home is Settings — profile, removal, rotation all live there now.
  ["/account", "/app/settings"],
  ["/rotate", "/app/settings"],
  // The bare portfolio index listed the session's own accounts — Settings is that list now.
  ["/u", "/app/settings"],
]);

/**
 * Redirect a legacy URL to its shell twin. Returns true when the response was written. Non-GET
 * requests never redirect — the old write handlers stay reachable for anything still posting.
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
