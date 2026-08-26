import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/render-dashboard.js";
import {
  type LeaderMetric,
  renderStandingsBody,
  renderStandingsContent,
  type StandingsOptions,
} from "../observatory/standings-view.js";
import { readSceneAsset, threeScenePage } from "../three/serve-scene.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import { PAGE_STYLE } from "./page-shell.js";
import { sseFrame } from "./sse.js";
import { welcomeHtml } from "./welcome-page.js";

/**
 * Public routes served before any auth gate — never touch session/password state.
 * Returns true when the request has been fully handled.
 */
export function servePublicRoute(path: string, res: ServerResponse, hub: ObservatoryHub): boolean {
  // Public cohort pulse: two aggregate equity totals (humans vs bots) and head counts.
  // Deliberately served before any auth gate so the logged-out login page can show the
  // live "Man vs. Machine" standing. Exposes only cohort sums — never individual accounts.
  if (path === "/pulse") {
    servePulse(res, hub);
    return true;
  }

  // Public self-service onboarding guide — the invite email links straight here.
  if (path === "/welcome") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(welcomeHtml());
    return true;
  }

  // Live Babylon.js 3D scene exploration (see src/three/) — public so it's easy to eyeball on deploy.
  if (path === "/tower") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(threeScenePage());
    return true;
  }

  // The scene's own assets: the esbuild bundle (our tree-shaken Babylon + kit) and the prefiltered
  // IBL environment. Both are served BY US rather than a CDN — a third-party CDN is unreachable from
  // the headless verification browser and would be an unpinned production dependency.
  if (path === "/three/scene.js" || path === "/three/environment.env") {
    const asset = readSceneAsset(path.slice("/three/".length));
    if (!asset) return false;
    res.writeHead(200, {
      "content-type": path.endsWith(".js")
        ? "application/javascript; charset=utf-8"
        : "application/octet-stream",
      "cache-control": "public, max-age=3600",
    });
    res.end(asset);
    return true;
  }

  return false;
}

/**
 * Aggregate the live board into the two cohort totals safe to expose publicly: total equity
 * and head count for humans vs. bots. Individual accounts (names, positions, per-account
 * equity) are intentionally omitted — those stay behind auth via `/events`.
 */
function servePulse(res: ServerResponse, hub: ObservatoryHub): void {
  const live = hub.getState().participants.filter((p) => !p.error);
  const sum = (kind: "human" | "bot"): number =>
    live.filter((p) => p.kind === kind).reduce((total, p) => total + p.equity, 0);
  const count = (kind: "human" | "bot"): number => live.filter((p) => p.kind === kind).length;
  const body = JSON.stringify({
    humans: count("human"),
    bots: count("bot"),
    humanEquity: sum("human"),
    botEquity: sum("bot"),
  });
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

/**
 * The SSE stream backing Standings' live refresh. `metric`/`compare` are read ONCE, from the
 * `/events` connection's own URL, at connect time — the inline script in `pageHtml` forwards the
 * page's full query string (not just `key`) so a viewer who picked `?by=return` or is mid-compare
 * (`?a=&b=`) keeps seeing the same state on every live push instead of being silently reset.
 */
export function streamEvents(
  req: IncomingMessage,
  res: ServerResponse,
  hub: ObservatoryHub,
  nav: NavContext,
  metric: LeaderMetric,
  compare: Pick<StandingsOptions, "aId" | "bId">,
): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  const opts = { nav, metric, ...compare };
  res.write(sseFrame(JSON.stringify(renderStandingsContent(hub.getState(), opts))));
  const unsubscribe = hub.subscribe((state) => {
    res.write(sseFrame(JSON.stringify(renderStandingsContent(state, opts))));
  });
  req.on("close", unsubscribe);
}

export function pageHtml(
  hub: ObservatoryHub,
  nav: NavContext,
  metric: LeaderMetric,
  compare: Pick<StandingsOptions, "aId" | "bId">,
): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital — Observatory (Live)</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
${renderStandingsBody(hub.getState(), { nav, metric, ...compare })}
<script>
  (function () {
    // Forward the whole query string (not just "key") so /events sees ?by=/?a=/?b= too — the
    // metric picker's selection and any in-progress compare survive a live push instead of
    // reverting on the next update.
    var url = "/events" + location.search;
    var source = new EventSource(url);
    source.onmessage = function (e) {
      var root = document.getElementById("root");
      if (root) root.innerHTML = JSON.parse(e.data);
    };
  })();
</script>
</body>
</html>`;
}
