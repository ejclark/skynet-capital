import type { ServerResponse } from "node:http";
import { readSceneAsset, threeScenePage } from "../three/serve-scene.js";
import type { ObservatoryHub } from "./observatory-hub.js";
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
