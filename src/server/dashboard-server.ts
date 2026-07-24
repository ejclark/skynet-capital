import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import { renderDashboardBody } from "../observatory/render-dashboard.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import { sseFrame } from "./sse.js";

export interface DashboardServerConfig {
  readonly hub: ObservatoryHub;
  /** When set, every request must carry ?key=<password>. Leave unset only for localhost. */
  readonly password?: string;
}

/**
 * The live dashboard server. Serves the observatory page and an SSE stream that pushes a
 * freshly-rendered page body every time the hub's state changes — so a browser updates the
 * instant a fill or price tick lands, no polling. Rendering reuses the same pure renderer
 * as the static export, so the live and exported views are identical.
 */
export function createDashboardServer(config: DashboardServerConfig): Server {
  return createServer((req, res) => {
    const url = req.url ?? "/";
    if (!isAuthorized(url, config.password)) {
      res.writeHead(401, { "content-type": "text/plain" });
      res.end("unauthorized");
      return;
    }

    const path = url.split("?")[0];
    if (path === "/events") {
      streamEvents(req, res, config.hub);
      return;
    }
    if (path === "/" || path === "/index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(pageHtml(config.hub));
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
}

function isAuthorized(url: string, password?: string): boolean {
  if (!password) {
    return true;
  }
  return new URL(url, "http://localhost").searchParams.get("key") === password;
}

function streamEvents(req: IncomingMessage, res: ServerResponse, hub: ObservatoryHub): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  res.write(sseFrame(JSON.stringify(renderDashboardBody(hub.getState()))));
  const unsubscribe = hub.subscribe((state) => {
    res.write(sseFrame(JSON.stringify(renderDashboardBody(state))));
  });
  req.on("close", unsubscribe);
}

function pageHtml(hub: ObservatoryHub): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital — Observatory (Live)</title>
<style>*{margin:0;padding:0}body{margin:0}</style>
</head>
<body>
<div id="root">${renderDashboardBody(hub.getState())}</div>
<script>
  (function () {
    var key = new URLSearchParams(location.search).get("key");
    var url = "/events" + (key ? "?key=" + encodeURIComponent(key) : "");
    var source = new EventSource(url);
    source.onmessage = function (e) {
      document.getElementById("root").innerHTML = JSON.parse(e.data);
    };
  })();
</script>
</body>
</html>`;
}
