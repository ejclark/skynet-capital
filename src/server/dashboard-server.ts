import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import { renderDashboardBody } from "../observatory/render-dashboard.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import type { AddParticipantInput, AddResult } from "./participant-service.js";
import { sseFrame } from "./sse.js";

export interface DashboardServerConfig {
  readonly hub: ObservatoryHub;
  /**
   * Legacy shared-password gate. Used only when `auth` is not configured (localhost/offline).
   * When set, every request must carry ?key=<password>.
   */
  readonly password?: string;
  /**
   * Per-user OAuth login. When present it supersedes `password`: unauthenticated requests are
   * redirected to `/login`, and identity comes from a signed session cookie (no ?key= in URLs).
   */
  readonly auth?: Authenticator;
  /**
   * Self-service onboarding handler. When provided, `GET /add` serves a form and `POST /add`
   * registers a new account. Omit to disable the feature (e.g. offline mode).
   */
  readonly addParticipant?: (input: AddParticipantInput) => Promise<AddResult>;
}

/**
 * The live dashboard server. Serves the observatory page and an SSE stream that pushes a
 * freshly-rendered page body every time the hub's state changes. Access is gated either by
 * per-user OAuth login (`auth`) or the legacy shared password (`password`). When an
 * `addParticipant` handler is wired, it also serves a `/add` form that registers a new
 * account live.
 */
export function createDashboardServer(config: DashboardServerConfig): Server {
  return createServer((req, res) => {
    void handle(req, res, config);
  });
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
): Promise<void> {
  const url = req.url ?? "/";
  const path = url.split("?")[0] ?? "/";
  const auth = config.auth;

  if (auth) {
    const base = baseUrlFrom(req);
    const secure = base.startsWith("https");
    if (path === "/login") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(auth.loginPage());
      return;
    }
    if (path === "/logout") {
      res.writeHead(302, { location: "/login", "set-cookie": auth.clearCookie(secure) });
      res.end();
      return;
    }
    if (await auth.handleAuthRoute(req, res, path, base)) {
      return;
    }
    if (!auth.sessionFrom(req)) {
      if (path === "/events") {
        res.writeHead(401, { "content-type": "text/plain" });
        res.end("unauthorized");
      } else {
        res.writeHead(302, { location: "/login" });
        res.end();
      }
      return;
    }
  } else if (!isAuthorized(url, config.password)) {
    res.writeHead(401, { "content-type": "text/plain" });
    res.end("unauthorized");
    return;
  }

  // --- authorized routes ---
  if (path === "/events") {
    streamEvents(req, res, config.hub);
    return;
  }
  if (path === "/add" && config.addParticipant) {
    await handleAdd(req, res, req.method ?? "GET", keyOf(url), config.addParticipant);
    return;
  }
  if (path === "/" || path === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(pageHtml(config.hub, keyOf(url), Boolean(config.addParticipant), Boolean(auth)));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}

/** External origin of the request (honors Fly's x-forwarded-proto). */
function baseUrlFrom(req: IncomingMessage): string {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "http";
  const host = req.headers.host ?? "localhost";
  return `${proto}://${host}`;
}

function isAuthorized(url: string, password?: string): boolean {
  if (!password) {
    return true;
  }
  return keyOf(url) === password;
}

function keyOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("key") ?? "";
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

async function handleAdd(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  key: string,
  addParticipant: (input: AddParticipantInput) => Promise<AddResult>,
): Promise<void> {
  if (method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(addFormHtml(key));
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }

  const form = new URLSearchParams(await readBody(req));
  const result = await addParticipant({
    displayName: form.get("displayName") ?? "",
    apiKey: form.get("apiKey") ?? "",
    apiSecret: form.get("apiSecret") ?? "",
    kind: form.get("kind") === "bot" ? "bot" : "human",
    ...(form.get("personaId") ? { personaId: form.get("personaId") as string } : {}),
    ...(form.get("timezone") ? { timezone: form.get("timezone") as string } : {}),
  });
  res.writeHead(result.ok ? 200 : 400, { "content-type": "text/html; charset=utf-8" });
  res.end(addResultHtml(result, key));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const PAGE_STYLE = "*{margin:0;padding:0;box-sizing:border-box}body{margin:0}";

function pageHtml(hub: ObservatoryHub, key: string, canAdd: boolean, authed: boolean): string {
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const links: string[] = [];
  if (canAdd) {
    links.push(`<a href="/add${suffix}">+ Add your account</a>`);
  }
  if (authed) {
    links.push(`<a href="/logout">Sign out</a>`);
  }
  const bar = links.length
    ? `<div style="padding:12px 16px;font:14px system-ui;display:flex;gap:16px">${links.join("")}</div>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital — Observatory (Live)</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
${bar}
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

function addFormHtml(key: string): string {
  const action = `/add${key ? `?key=${encodeURIComponent(key)}` : ""}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Add your account — Skynet Capital</title>
<style>${PAGE_STYLE}
  body{font:16px/1.5 system-ui;max-width:560px;margin:0 auto;padding:32px 20px}
  h1{font-size:22px;margin-bottom:8px} p{color:#555;margin-bottom:20px}
  label{display:block;margin:14px 0 4px;font-weight:600}
  input,select{width:100%;padding:10px;font-size:15px;border:1px solid #ccc;border-radius:6px}
  small{color:#777;font-weight:400} button{margin-top:22px;padding:12px 18px;font-size:16px;
  border:0;border-radius:6px;background:#111;color:#fff;cursor:pointer}
  .note{margin-top:24px;font-size:13px;color:#777}
</style>
</head>
<body>
<h1>Add your Alpaca account</h1>
<p>Paste your Alpaca <strong>paper</strong> API key so your account shows up on the board.
It's read to display your balance and trades — nothing is placed on your behalf.</p>
<form method="post" action="${action}">
  <label>Display name<input name="displayName" required placeholder="e.g. Uncle Joe"></label>
  <label>Alpaca paper API key<input name="apiKey" required autocomplete="off"></label>
  <label>Alpaca paper API secret<input name="apiSecret" required autocomplete="off"></label>
  <label>Account type
    <select name="kind"><option value="human">Human</option><option value="bot">Bot</option></select>
  </label>
  <label>Persona id <small>(only for bots)</small><input name="personaId" placeholder="e.g. day-trader"></label>
  <label>Time zone <small>(optional)</small><input name="timezone" placeholder="America/Chicago"></label>
  <button type="submit">Add my account</button>
</form>
<p class="note">Paper keys only. Get yours at alpaca.markets → Paper Trading → API Keys.</p>
</body>
</html>`;
}

function addResultHtml(result: AddResult, key: string): string {
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const body = result.ok
    ? `<h1>You're on the board 🎉</h1><p><strong>${escapeHtml(result.displayName)}</strong> is now live on the dashboard.</p>`
    : `<h1>Couldn't add that account</h1><p>${escapeHtml(result.error)}</p>`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital</title>
<style>${PAGE_STYLE} body{font:16px/1.5 system-ui;max-width:560px;margin:0 auto;padding:32px 20px}
h1{font-size:22px;margin-bottom:10px} a{color:#06c}</style></head>
<body>
${body}
<p style="margin-top:20px"><a href="/${suffix}">← Back to the dashboard</a>${
    result.ok ? "" : ` · <a href="/add${suffix}">Try again</a>`
  }</p>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
