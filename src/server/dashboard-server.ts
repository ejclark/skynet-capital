import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { EquitySample } from "../observatory/history-store.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  type LeaderMetric,
  type NavContext,
  type NavView,
  renderAcademyBody,
  renderBoardContent,
  renderCohortsBody,
  renderCompareBody,
  renderDashboardBody,
  renderIndividualBody,
  renderLeaderboardBody,
} from "../observatory/render-dashboard.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { Session } from "./auth/session.js";
import type { FeedbackInput, FeedbackKind, FeedbackResult } from "./feedback-service.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import type { AddParticipantInput, AddResult } from "./participant-service.js";
import { personaClasses } from "./persona-classes.js";
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
  /**
   * Self-service feedback handler. When provided, `GET /feedback` serves a form and `POST /feedback`
   * files a labelled GitHub issue on the submitter's behalf. Omit (no token) to keep the form but
   * have submissions report "not switched on yet."
   */
  readonly submitFeedback?: (input: FeedbackInput) => Promise<FeedbackResult>;
  /**
   * Reads a participant's recorded equity/realized history for the individual view's performance panel.
   * Omit to leave the panel showing the honest "still accruing" seam (e.g. offline with no store).
   */
  readonly readHistory?: (participantId: string) => Promise<readonly EquitySample[]>;
  /**
   * Reads a bot's autonomous decision audit trail for the individual view's decisions panel
   * (Phase 2.1). Omit to show the honest "not recorded yet" seam. Keyed by participant id, which for
   * a bot equals its persona id.
   */
  readonly readDecisions?: (participantId: string) => Promise<readonly DecisionRecord[]>;
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

  // Public self-service onboarding guide — the invite email links straight here.
  if (path === "/welcome") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(welcomeHtml());
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
    hasLeaderboard: true,
    hasBots: true,
    hasCompare: true,
  });

  if (path === "/events") {
    streamEvents(req, res, config.hub, navFor("board"));
    return;
  }
  if (path === "/leaderboard") {
    const state = config.hub.getState();
    const by = new URL(url, "http://localhost").searchParams.get("by");
    const metric: LeaderMetric = by === "pl" || by === "return" ? by : "equity";
    const body = renderLeaderboardBody(state, { nav: navFor("leaderboard"), metric });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument("Leaderboard — Skynet Capital", body));
    return;
  }
  if (path === "/bots-vs-humans") {
    const body = renderCohortsBody(config.hub.getState(), { nav: navFor("bots") });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument("Bots vs Humans — Skynet Capital", body));
    return;
  }
  if (path === "/compare") {
    const params = new URL(url, "http://localhost").searchParams;
    const body = renderCompareBody(config.hub.getState(), {
      nav: navFor("compare"),
      ...(params.get("a") ? { aId: params.get("a") as string } : {}),
      ...(params.get("b") ? { bId: params.get("b") as string } : {}),
    });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument("Compare — Skynet Capital", body));
    return;
  }
  if (path === "/add" && config.addParticipant) {
    await handleAdd(req, res, req.method ?? "GET", keyOf(url), config.addParticipant);
    return;
  }
  if (path === "/feedback") {
    await handleFeedback(req, res, req.method ?? "GET", session, config.submitFeedback);
    return;
  }
  if (path === "/learn") {
    const body = renderAcademyBody({ nav: navFor("learn") });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument("Learn — Skynet Capital", body));
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
    const history = config.readHistory ? await config.readHistory(id) : undefined;
    const decisions =
      config.readDecisions && snapshot.kind === "bot" ? await config.readDecisions(id) : undefined;
    const body = renderIndividualBody(snapshot, {
      nav: { ...nav, active: nav.currentId === id ? "you" : "board" },
      isSelf: nav.currentId === id,
      generatedAt: state.generatedAt,
      ...(history ? { history } : {}),
      ...(decisions ? { decisions } : {}),
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
  res.write(sseFrame(JSON.stringify(renderBoardContent(hub.getState(), { nav }))));
  const unsubscribe = hub.subscribe((state) => {
    res.write(sseFrame(JSON.stringify(renderBoardContent(state, { nav }))));
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

// Light per-submitter throttle — the codebase has no rate-limiting, and this route writes to the
// repo, so cap bursts (5 / 10 min) keyed by the signed-in email. In-memory is fine (single process).
const feedbackHits = new Map<string, number[]>();
function throttled(key: string, now = Date.now(), windowMs = 600_000, max = 5): boolean {
  const recent = (feedbackHits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    feedbackHits.set(key, recent);
    return true;
  }
  recent.push(now);
  feedbackHits.set(key, recent);
  return false;
}

async function handleFeedback(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  session: Session | undefined,
  submitFeedback?: (input: FeedbackInput) => Promise<FeedbackResult>,
): Promise<void> {
  if (method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(feedbackFormHtml(Boolean(submitFeedback)));
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("method not allowed");
    return;
  }
  if (!submitFeedback) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      feedbackResultHtml({
        ok: false,
        error:
          "Feedback isn't switched on yet — ask Eric to set the feedback token. Your note wasn't sent.",
      }),
    );
    return;
  }
  if (session && throttled(session.email)) {
    res.writeHead(429, { "content-type": "text/html; charset=utf-8" });
    res.end(
      feedbackResultHtml({
        ok: false,
        error: "You've sent a bunch just now — give it a few minutes and try again.",
      }),
    );
    return;
  }

  const form = new URLSearchParams(await readBody(req));
  const kindRaw = form.get("kind");
  const kind: FeedbackKind = kindRaw === "bug" || kindRaw === "idea" ? kindRaw : "feature";
  const result = await submitFeedback({
    kind,
    title: form.get("title") ?? "",
    details: form.get("details") ?? "",
    ...(form.get("area") ? { area: form.get("area") as string } : {}),
    ...(form.get("device") ? { device: form.get("device") as string } : {}),
    ...(session?.name ? { submitterName: session.name } : {}),
    ...(session?.email ? { submitterEmail: session.email } : {}),
  });
  res.writeHead(result.ok ? 200 : 502, { "content-type": "text/html; charset=utf-8" });
  res.end(feedbackResultHtml(result));
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

const PAGE_STYLE =
  "*{margin:0;padding:0;box-sizing:border-box}html{color-scheme:dark}body{margin:0}";

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
${renderDashboardBody(hub.getState(), { nav })}
<script>
  (function () {
    var key = new URLSearchParams(location.search).get("key");
    var url = "/events" + (key ? "?key=" + encodeURIComponent(key) : "");
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

/** Matrix design-system styles for the /add flow — the same tokens as the dashboard/login. */
const ADD_STYLE = `${PAGE_STYLE}
  :root{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
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
  textarea{ width:100%; padding:12px 13px; font:15px/1.5 var(--sans); color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; resize:vertical; transition:border-color .15s, box-shadow .15s; }
  textarea::placeholder{ color:color-mix(in srgb,var(--muted) 75%,transparent); }
  textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent); }
  input[name=apiKey],input[name=apiSecret]{ font-family:var(--mono); letter-spacing:.02em; }
  button{ margin-top:24px; padding:13px 18px; font-size:15px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; transition:filter .15s; }
  button:hover{ filter:brightness(1.08); }
  button:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .note{ margin-top:22px; font-size:12px; color:var(--muted); font-family:var(--mono); letter-spacing:.02em; }
  .res-icon{ font-size:34px; margin-bottom:6px; }
  a{ color:var(--accent); text-decoration:none; }
  a:hover{ text-decoration:underline; }
  .backrow{ margin-top:26px; font-size:14px; color:var(--muted); }
  .wrap.wide{ max-width:760px; }
  /* --- onboarding / welcome --- */
  .hero-eyebrow{ font-family:var(--mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase; color:var(--accent); margin-bottom:14px; }
  .hero-title{ font-size:34px; font-weight:800; letter-spacing:-.02em; line-height:1.1; margin-bottom:14px; }
  .hero-title b{ color:var(--accent); }
  .hero-lede{ color:var(--muted); font-size:16px; line-height:1.6; margin-bottom:30px; max-width:60ch; }
  .hero-lede b{ color:var(--text); }
  .feat-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; margin-bottom:36px; }
  .feat{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
  .feat-ic{ font-size:18px; margin-bottom:8px; }
  .feat-h{ font-size:14px; font-weight:700; margin-bottom:5px; }
  .feat-p{ font-size:13px; color:var(--muted); line-height:1.5; }
  .sec-label{ font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); margin:0 0 16px; }
  .steps{ display:flex; flex-direction:column; gap:12px; margin-bottom:32px; }
  .step{ display:flex; gap:16px; align-items:flex-start; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; }
  .step-n{ flex:0 0 auto; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-weight:700; font-size:14px; color:var(--bg); background:var(--accent); }
  .step-b h3{ font-size:15px; font-weight:700; margin-bottom:4px; }
  .step-b p{ font-size:13px; color:var(--muted); line-height:1.55; }
  .cta{ display:inline-flex; align-items:center; gap:10px; padding:14px 22px; font-size:15px; font-weight:700; color:var(--bg); background:var(--accent); border-radius:10px; text-decoration:none; transition:filter .15s; }
  .cta:hover{ filter:brightness(1.08); text-decoration:none; }
  .cta:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .fineprint{ margin-top:22px; font-size:12px; color:var(--muted); line-height:1.6; }
  /* --- /add progressive-reveal stepper --- */
  .setup{ margin:0 0 26px; display:flex; flex-direction:column; gap:8px; }
  .step-d{ background:var(--surface); border:1px solid var(--border); border-radius:11px; overflow:hidden; }
  .step-d[open]{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .step-d summary{ list-style:none; cursor:pointer; display:flex; align-items:center; gap:12px; padding:14px 16px; font-weight:600; font-size:14px; }
  .step-d summary::-webkit-details-marker{ display:none; }
  .step-d summary .step-n{ width:26px; height:26px; font-size:13px; }
  .step-d summary .chev{ margin-left:auto; color:var(--muted); transition:transform .18s; }
  .step-d[open] summary .chev{ transform:rotate(90deg); }
  .step-d .sd-body{ padding:2px 18px 18px 54px; font-size:13px; color:var(--muted); line-height:1.6; }
  .step-d .sd-body b{ color:var(--text); }
  .step-d .sd-body a{ font-weight:600; }
  /* --- /add persona class picker (character sheet) --- */
  .classpick{ margin:14px 0 4px; }
  .cp-label{ display:block; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; margin-bottom:10px; }
  .cp-label small{ text-transform:none; letter-spacing:0; font-weight:400; opacity:.8; }
  .cp-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
  .cp-card{ position:relative; display:block; margin:0; padding:14px 15px; background:var(--surface); border:1px solid var(--border); border-radius:11px; cursor:pointer; text-transform:none; letter-spacing:normal; transition:border-color .15s, background .15s; }
  .cp-card:hover{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .cp-card input{ position:absolute; opacity:0; width:0; height:0; }
  .cp-card:has(input:checked), .cp-card.sel{ border-color:var(--accent); background:color-mix(in srgb,var(--accent) 9%,var(--surface)); }
  .cp-card:focus-within{ outline:2px solid var(--accent); outline-offset:2px; }
  .cp-name{ display:block; font-size:14px; font-weight:700; color:var(--text); }
  .cp-id{ display:block; font-family:var(--mono); font-size:10px; letter-spacing:.08em; color:var(--accent); margin:2px 0 7px; }
  .cp-thesis{ display:block; font-size:12.5px; color:var(--muted); line-height:1.5; }
  .cp-legend{ display:block; font-size:11.5px; color:color-mix(in srgb,var(--muted) 85%,transparent); line-height:1.5; margin-top:7px; font-style:italic; }`;

function addShell(title: string, inner: string, wide = false): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${ADD_STYLE}</style>
</head>
<body><div class="wrap${wide ? " wide" : ""}">
<div class="brand">SKYNET<b>·</b>CAPITAL</div>
${inner}
</div></body>
</html>`;
}

/**
 * The self-service onboarding guide (public /welcome). Documents what Skynet Capital is and the
 * league format, then lays out the join path in numbered steps, so an invite can be a one-line
 * greeting plus this link. Fully self-serve to sign-in.
 */
function welcomeHtml(): string {
  return addShell(
    "Welcome — Skynet Capital",
    `<div class="hero-eyebrow">Invite-only · paper sandbox</div>
<h1 class="hero-title">A sandbox to learn options — with friends, family, and a few <b>machines</b>.</h1>
<p class="hero-lede">Skynet Capital is a friendly, <b>paper-money</b> trading league. Everyone trades a simulated
account, autonomous <b>bots</b> trade alongside the humans, and a live observatory shows how everyone's
doing. It's for learning the plays and having fun — <b>no real money, ever</b>. Everybody's welcome to win.</p>
<div class="feat-grid">
  <div class="feat"><div class="feat-ic">📈</div><div class="feat-h">Paper trading</div><div class="feat-p">Practice real options strategies with a simulated account. Zero risk — it's all on paper.</div></div>
  <div class="feat"><div class="feat-ic">🤖</div><div class="feat-h">Humans &amp; bots</div><div class="feat-p">Trade solo, co-op against the machines, or just watch the board. The bots each run a persona.</div></div>
  <div class="feat"><div class="feat-ic">🏆</div><div class="feat-h">Friendly league</div><div class="feat-p">A leaderboard for bragging rights among friends and family — everyone doing well is the point.</div></div>
</div>
<p class="sec-label">Join in three steps</p>
<div class="steps">
  <div class="step"><div class="step-n">1</div><div class="step-b"><h3>Sign in</h3><p>Use your Google account — the same email Eric added to the guest list. That's your seat at the table.</p></div></div>
  <div class="step"><div class="step-n">2</div><div class="step-b"><h3>Create a free Alpaca paper account</h3><p>Alpaca provides the simulated brokerage. It's free, takes a minute, and needs no funding — we'll walk you through it after you sign in.</p></div></div>
  <div class="step"><div class="step-n">3</div><div class="step-b"><h3>Connect it</h3><p>Paste your Alpaca <b>paper</b> API keys once. We read them only to show your balance and trades on the board — nothing is ever placed on your behalf.</p></div></div>
</div>
<a class="cta" href="/login">Get started → Sign in</a>
<p class="fineprint">New to options? Once you're in, the <a href="/learn">Learn</a> section starts you on the safest play and unlocks more as you're ready.<br>
Already set up? Head straight to the <a href="/login">observatory</a>. Not on the guest list yet? Ask Eric to add your email.<br>
Found a bug or spotted a side quest? <a href="/feedback">Share feedback</a> — we build this together.</p>`,
    true,
  );
}

const CLASSPICK_JS = `(function(){
  var kind=document.getElementById("kind"), pick=document.getElementById("classpick");
  if(!kind||!pick) return;
  var radios=pick.querySelectorAll('input[name=personaId]');
  function sync(){ var bot=kind.value==="bot"; pick.hidden=!bot;
    for(var i=0;i<radios.length;i++) radios[i].required=bot; }
  kind.addEventListener("change", sync); sync();
  // clicking anywhere on a card selects its radio (label already wraps it, but keep keyboard tidy)
  pick.addEventListener("click", function(e){ var card=e.target.closest(".cp-card"); if(!card) return;
    var r=card.querySelector('input[name=personaId]'); if(r){ r.checked=true; }
    var cards=pick.querySelectorAll(".cp-card"); for(var i=0;i<cards.length;i++) cards[i].classList.toggle("sel", cards[i]===card); });
})();`;

function addFormHtml(key: string): string {
  const action = `/add${key ? `?key=${encodeURIComponent(key)}` : ""}`;
  const classCards = personaClasses()
    .map(
      (c) =>
        `<label class="cp-card">
        <input type="radio" name="personaId" value="${escapeHtml(c.id)}">
        <span class="cp-name">${escapeHtml(c.name)}</span>
        <span class="cp-id">${escapeHtml(c.id)}</span>
        <span class="cp-thesis">${escapeHtml(c.thesis)}</span>
        ${c.legend ? `<span class="cp-legend">${escapeHtml(c.legend)}</span>` : ""}
      </label>`,
    )
    .join("\n      ");
  return addShell(
    "Add your account — Skynet Capital",
    `<h1>Connect your Alpaca account</h1>
<p class="lede">Your account trades on <b>Alpaca</b> paper money. Follow the steps to grab your keys,
then paste them below — we read them <b>only</b> to show your balance and trades. Nothing is ever placed on your behalf.</p>
<div class="setup">
  <details class="step-d" open>
    <summary><span class="step-n">1</span> Create a free Alpaca account <span class="chev">›</span></summary>
    <div class="sd-body">Go to <a href="https://alpaca.markets/" target="_blank" rel="noopener noreferrer">alpaca.markets</a> and sign up — it's free and needs no funding. <b>Paper trading is simulated money</b>, so there's nothing to deposit.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">2</span> Switch to Paper Trading <span class="chev">›</span></summary>
    <div class="sd-body">In the Alpaca dashboard, use the toggle near the top-left to switch from <b>Live</b> to <b>Paper</b>. This is important — we only ever use paper keys.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">3</span> Generate your paper API keys <span class="chev">›</span></summary>
    <div class="sd-body">On the paper dashboard's right side, find <b>API Keys</b> and click <b>Generate</b>. Copy the <b>Key ID</b> and <b>Secret Key</b> — the secret shows only once, so grab it now.</div>
  </details>
  <details class="step-d">
    <summary><span class="step-n">4</span> Paste them below <span class="chev">›</span></summary>
    <div class="sd-body">Drop the Key ID and Secret into the form and give yourself a display name. That's it — you'll land on the board.</div>
  </details>
</div>
<form method="post" action="${action}">
  <label>Display name<input name="displayName" required placeholder="e.g. Uncle Joe"></label>
  <label>Alpaca paper API key<input name="apiKey" required autocomplete="off" placeholder="PK…"></label>
  <label>Alpaca paper API secret<input name="apiSecret" required autocomplete="off" placeholder="••••••••"></label>
  <label>Account type
    <select name="kind" id="kind"><option value="human">Human — you trade it yourself</option><option value="bot">Bot — a persona trades it autonomously</option></select>
  </label>
  <div class="classpick" id="classpick" hidden>
    <span class="cp-label">Choose a class <small>— the persona your bot runs</small></span>
    <div class="cp-grid">
      ${classCards}
    </div>
  </div>
  <label>Time zone <small>(optional)</small><input name="timezone" placeholder="America/Chicago"></label>
  <button type="submit">Add my account</button>
</form>
<p class="note">Paper keys only · alpaca.markets → Paper Trading → API Keys</p>
<script>${CLASSPICK_JS}</script>`,
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

function feedbackFormHtml(enabled: boolean): string {
  const banner = enabled
    ? ""
    : `<p class="note" style="color:var(--neg)">Heads up — feedback isn't switched on yet, so this won't send until it's configured.</p>`;
  return addShell(
    "Feedback — Skynet Capital",
    `<h1>Share feedback</h1>
<p class="lede">Found a bug, want an improvement, or spotted a side quest? Tell us here — it goes straight to the team. <b>No GitHub account needed.</b></p>
${banner}
<form method="post" action="/feedback">
  <label>What kind?
    <select name="kind">
      <option value="bug">🐞 Bug — something's broken or wrong</option>
      <option value="feature" selected>✨ Feature — make something better</option>
      <option value="idea">🗺️ Side quest — an idea worth exploring</option>
    </select>
  </label>
  <label>Title<input name="title" required maxlength="120" placeholder="Short summary"></label>
  <label>Details<textarea name="details" rows="6" placeholder="What happened · what you'd like · the idea…"></textarea></label>
  <label>Where in the app? <small>(optional)</small><input name="area" placeholder="e.g. Leaderboard, the intro animation"></label>
  <label>Device &amp; browser <small>(optional, helps for bugs)</small><input name="device" placeholder="e.g. iPhone · Safari"></label>
  <button type="submit">Send it</button>
</form>
<p class="note">Screenshots help — once it's filed you can reply to the issue with an image.</p>`,
  );
}

function feedbackResultHtml(result: FeedbackResult): string {
  const inner = result.ok
    ? `<div class="res-icon">🎉</div><h1>Thanks — got it!</h1>
<p class="lede">Filed as <b>#${result.number}</b>. We'll take a look. Really appreciate you.</p>
<p class="backrow"><a href="/feedback">Send another</a> · <a href="/">← Back to the board</a></p>`
    : `<h1>Hmm, that didn't send</h1>
<p class="lede">${escapeHtml(result.error)}</p>
<p class="backrow"><a href="/feedback">Try again</a> · <a href="/">← Back to the board</a></p>`;
  return addShell("Feedback — Skynet Capital", inner);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
