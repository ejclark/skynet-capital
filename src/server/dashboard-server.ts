import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  type NavContext,
  type NavView,
  renderDashboardBody,
  renderIndividualBody,
} from "../observatory/render-dashboard.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { Session } from "./auth/session.js";
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

  // Public cohort pulse: two aggregate equity totals (humans vs bots) and head counts.
  // Deliberately served before any auth gate so the logged-out login page can show the
  // live "Man vs. Machine" standing. Exposes only cohort sums — never individual accounts.
  if (path === "/pulse") {
    servePulse(res, config.hub);
    return;
  }

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
  const session = auth?.sessionFrom(req);
  const canAdd = Boolean(config.addParticipant);
  const authed = Boolean(auth);
  const navFor = (active: NavView): NavContext => ({
    active,
    currentId: resolveCurrentId(session, config.hub.getState().participants),
    canAdd,
    authed,
  });

  if (path === "/events") {
    streamEvents(req, res, config.hub, navFor("board"));
    return;
  }
  if (path === "/add" && config.addParticipant) {
    await handleAdd(req, res, req.method ?? "GET", keyOf(url), config.addParticipant);
    return;
  }
  // Individual profile — /u/:id. Ids are already URL-safe; match by prefix (no path-param parser).
  if (path.startsWith("/u/")) {
    const id = decodeURIComponent(path.slice(3));
    const state = config.hub.getState();
    const snapshot = state.participants.find((p) => p.id === id);
    if (!snapshot) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    const nav = navFor("you");
    const body = renderIndividualBody(snapshot, {
      nav: { ...nav, active: nav.currentId === id ? "you" : "board" },
      isSelf: nav.currentId === id,
      generatedAt: state.generatedAt,
    });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument(`${escapeHtml(snapshot.displayName)} — Skynet Capital`, body));
    return;
  }
  if (path === "/" || path === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(pageHtml(config.hub, navFor("board")));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}

/**
 * Best-effort resolve the signed-in viewer to a participant, for the "YOU" treatment. Sessions
 * carry email/name but participants have no email link yet (that arrives with the Alpaca-OAuth
 * work), so we match display name — exact on session name, then the email local-part. Returns
 * undefined when there's no confident match; the UI simply shows no self-marker.
 */
function resolveCurrentId(
  session: Session | undefined,
  participants: readonly ParticipantSnapshot[],
): string | undefined {
  if (!session) return undefined;
  const name = session.name?.toLowerCase().trim();
  const local = session.email.split("@")[0]?.toLowerCase().trim();
  const byName = name && participants.find((p) => p.displayName.toLowerCase().trim() === name);
  if (byName) return byName.id;
  const byLocal = local && participants.find((p) => p.displayName.toLowerCase().trim() === local);
  return byLocal ? byLocal.id : undefined;
}

/** Minimal HTML document shell for a server-rendered view (the body already carries its styles). */
function shellDocument(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${PAGE_STYLE}</style>
</head>
<body>${body}</body>
</html>`;
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

function streamEvents(
  req: IncomingMessage,
  res: ServerResponse,
  hub: ObservatoryHub,
  nav: NavContext,
): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
  res.write(sseFrame(JSON.stringify(renderDashboardBody(hub.getState(), { nav }))));
  const unsubscribe = hub.subscribe((state) => {
    res.write(sseFrame(JSON.stringify(renderDashboardBody(state, { nav }))));
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

function pageHtml(hub: ObservatoryHub, nav: NavContext): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skynet Capital — Observatory (Live)</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<div id="root">${renderDashboardBody(hub.getState(), { nav })}</div>
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

/** Matrix design-system styles for the /add flow — the same tokens as the dashboard/login. */
const ADD_STYLE = `${PAGE_STYLE}
  :root{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  @media (prefers-color-scheme:light){ :root{ --bg:#F7F9FB; --surface:#FFFFFF; --surface-2:#F0F4F8; --border:#DCE3EA; --text:#0B0F14; --muted:#5A6B7B; --accent:#0E9F8C; --pos:#1A7F37; --neg:#CF222E; } }
  body{ background:var(--bg); color:var(--text); font-family:var(--sans); min-height:100vh; padding:40px clamp(16px,5vw,20px); }
  .wrap{ max-width:520px; margin:0 auto; }
  .brand{ font-weight:700; font-size:15px; letter-spacing:.14em; margin-bottom:26px; }
  .brand b{ color:var(--accent); }
  h1{ font-size:24px; font-weight:700; margin-bottom:10px; letter-spacing:-.01em; }
  .lede{ color:var(--muted); font-size:14px; line-height:1.55; margin-bottom:26px; }
  .lede b{ color:var(--text); }
  form{ display:flex; flex-direction:column; gap:2px; }
  label{ display:block; margin:14px 0 6px; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  label small{ text-transform:none; letter-spacing:0; color:var(--muted); font-weight:400; opacity:.8; }
  input,select{ width:100%; padding:12px 13px; font-size:15px; font-family:var(--sans); color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; transition:border-color .15s, box-shadow .15s; }
  input::placeholder{ color:color-mix(in srgb,var(--muted) 75%,transparent); }
  input:focus,select:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent); }
  input[name=apiKey],input[name=apiSecret]{ font-family:var(--mono); letter-spacing:.02em; }
  button{ margin-top:24px; padding:13px 18px; font-size:15px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; transition:filter .15s; }
  button:hover{ filter:brightness(1.08); }
  button:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .note{ margin-top:22px; font-size:12px; color:var(--muted); font-family:var(--mono); letter-spacing:.02em; }
  .res-icon{ font-size:34px; margin-bottom:6px; }
  a{ color:var(--accent); text-decoration:none; }
  a:hover{ text-decoration:underline; }
  .backrow{ margin-top:26px; font-size:14px; color:var(--muted); }`;

function addShell(title: string, inner: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${ADD_STYLE}</style>
</head>
<body><div class="wrap">
<div class="brand">SKYNET<b>·</b>CAPITAL</div>
${inner}
</div></body>
</html>`;
}

function addFormHtml(key: string): string {
  const action = `/add${key ? `?key=${encodeURIComponent(key)}` : ""}`;
  return addShell(
    "Add your account — Skynet Capital",
    `<h1>Add your Alpaca account</h1>
<p class="lede">Paste your Alpaca <b>paper</b> API key so your account shows up on the board.
It's read only — to display your balance and trades. Nothing is ever placed on your behalf.</p>
<form method="post" action="${action}">
  <label>Display name<input name="displayName" required placeholder="e.g. Uncle Joe"></label>
  <label>Alpaca paper API key<input name="apiKey" required autocomplete="off" placeholder="PK…"></label>
  <label>Alpaca paper API secret<input name="apiSecret" required autocomplete="off" placeholder="••••••••"></label>
  <label>Account type
    <select name="kind"><option value="human">Human</option><option value="bot">Bot</option></select>
  </label>
  <label>Persona id <small>(only for bots)</small><input name="personaId" placeholder="e.g. day-trader"></label>
  <label>Time zone <small>(optional)</small><input name="timezone" placeholder="America/Chicago"></label>
  <button type="submit">Add my account</button>
</form>
<p class="note">Paper keys only · alpaca.markets → Paper Trading → API Keys</p>`,
  );
}

function addResultHtml(result: AddResult, key: string): string {
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const inner = result.ok
    ? `<div class="res-icon">🎉</div><h1>You're on the board</h1>
<p class="lede"><b>${escapeHtml(result.displayName)}</b> is now live on the observatory.</p>
<p class="backrow"><a href="/${suffix}">← Back to the board</a></p>`
    : `<h1>Couldn't add that account</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/${suffix}">← Back to the board</a> · <a href="/add${suffix}">Try again</a></p>`;
  return addShell("Skynet Capital", inner);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
