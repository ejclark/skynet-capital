import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { renderAnalysisBody } from "../observatory/analysis-view.js";
import { type DeskTab, parseDeskTab } from "../observatory/desk-tabs.js";
import type { EquitySample } from "../observatory/history-store.js";
import { renderHistoryBody } from "../observatory/history-view.js";
import { type MetricsViewOptions, renderMetricsBody } from "../observatory/metrics-view.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { type DeskNotice, renderPositionsBody } from "../observatory/positions-view.js";
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
import { botLandmarkProminence } from "../observatory/standings.js";
import { readSceneAsset, threeScenePage } from "../three/serve-scene.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { Session } from "./auth/session.js";
import type { FeedbackInput, FeedbackKind, FeedbackResult } from "./feedback-service.js";
import { handleInvite, type InviteDeps } from "./invite-form.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import { addShell, PAGE_STYLE, readBody } from "./page-shell.js";
import type {
  AddParticipantInput,
  AddResult,
  RotateCredentialsInput,
  RotateResult,
} from "./participant-service.js";
import { handleAdd, handleRotate } from "./self-service-forms.js";
import { sseFrame } from "./sse.js";
import { handleTrade } from "./trade-routes.js";
import type { SubmitDeskTrade } from "./trade-service.js";

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
   * Self-service credential rotation. When provided, `GET /rotate` serves a compact form and
   * `POST /rotate` swaps an EXISTING account's key/secret in place — the sanctioned path for
   * "I regenerated my Alpaca key," so it never has to be pasted into the wrong slot elsewhere.
   * Omit to disable (e.g. offline mode).
   */
  readonly rotateCredentials?: (input: RotateCredentialsInput) => Promise<RotateResult>;
  /**
   * `GET/POST /invite` — the owner's guest list. Omit to disable (offline mode, or no auth).
   * Owners are the env-configured identities; everyone they invite lands in the volume-backed
   * allowlist store and may sign in but not invite (see `invite-form.ts`).
   */
  readonly invite?: InviteDeps;
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
  /**
   * Member-initiated trading from the desk (`/trade`). **Off unless both this flag and
   * `submitTrade` are set** — building the mechanism is Claude's job, authorizing live order
   * placement from a browser session is Eric's (CLAUDE.md, the irreversible class). With it off,
   * the desk still renders its ticket, visibly disabled and honest about why.
   */
  readonly tradingEnabled?: boolean;
  /** The execution seam (`trade-service.ts`). Absent = no order path is wired at all. */
  readonly submitTrade?: SubmitDeskTrade;
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

  if (servePublicRoute(path, res, config.hub)) {
    return;
  }

  const gate = await gateRequest(req, res, path, url, config);
  if (gate.handled) {
    return;
  }

  await serveAuthorizedRoute(req, res, path, url, config, gate.session);
}

/**
 * Public routes served before any auth gate — never touch session/password state.
 * Returns true when the request has been fully handled.
 */
function servePublicRoute(path: string, res: ServerResponse, hub: ObservatoryHub): boolean {
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
 * The auth gate — either per-user OAuth (`config.auth`) or the legacy shared password. Exact
 * same order/behavior as before: OAuth's own routes (/login, /logout, provider callbacks) are
 * checked first, then the session/password check. Returns `{ handled: true }` once a response
 * has been written (redirect, 401, or an auth-route response); otherwise `{ handled: false,
 * session }` so the caller can proceed to the authorized routes with the resolved session.
 */
async function gateRequest(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
): Promise<{ handled: true } | { handled: false; session: Session | undefined }> {
  const auth = config.auth;

  if (auth) {
    const base = baseUrlFrom(req);
    const secure = base.startsWith("https");
    if (path === "/login") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(auth.loginPage());
      return { handled: true };
    }
    if (path === "/logout") {
      res.writeHead(302, { location: "/login", "set-cookie": auth.clearCookie(secure) });
      res.end();
      return { handled: true };
    }
    if (await auth.handleAuthRoute(req, res, path, base)) {
      return { handled: true };
    }
    if (!auth.sessionFrom(req)) {
      if (path === "/events") {
        res.writeHead(401, { "content-type": "text/plain" });
        res.end("unauthorized");
      } else {
        res.writeHead(302, { location: "/login" });
        res.end();
      }
      return { handled: true };
    }
    return { handled: false, session: auth.sessionFrom(req) };
  }

  if (!isAuthorized(url, config.password)) {
    res.writeHead(401, { "content-type": "text/plain" });
    res.end("unauthorized");
    return { handled: true };
  }
  return { handled: false, session: undefined };
}

/** Routes behind the auth gate — same set and order as before the split. */
async function serveAuthorizedRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const canAdd = Boolean(config.addParticipant);
  const authed = Boolean(config.auth);
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
    const metric: LeaderMetric =
      by === "pl" || by === "return" || by === "realized" ? by : "equity";
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
  if (await trySelfServiceRoute(req, res, path, url, config, session)) {
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
  if (path === "/trade") {
    await serveTradeRoute(req, res, config, session, navFor);
    return;
  }
  // Individual profile — /u/:id. Ids are already URL-safe; match by prefix (no path-param parser).
  if (path.startsWith("/u/")) {
    await serveIndividualProfile(res, path, url, config, navFor);
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
 * `POST /trade` — the desk's order path. Identity comes from the session and nowhere else: with no
 * authenticator configured no id resolves, and `trade-routes.ts` refuses rather than guessing which
 * account a request belongs to.
 */
async function serveTradeRoute(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
  navFor: (active: NavView) => NavContext,
): Promise<void> {
  const participants = config.hub.getState().participants;
  await handleTrade(req, res, {
    snapshotFor: (id) => participants.find((p) => p.id === id),
    requesterId: config.auth ? resolveCurrentId(session, participants) : undefined,
    tradingEnabled: Boolean(config.tradingEnabled),
    ...(config.submitTrade ? { submitTrade: config.submitTrade } : {}),
    nav: navFor("you"),
    document: shellDocument,
  });
}

/** `/add` (join the board) and `/rotate` (swap an existing account's key). True when handled. */
async function trySelfServiceRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/add" && config.addParticipant) {
    await handleAdd(req, res, req.method ?? "GET", keyOf(url), config.addParticipant);
    return true;
  }
  if (path === "/invite" && config.invite) {
    // Identity comes from the signed session and nowhere else — there is no id in the URL to
    // spoof, and handleInvite re-checks owner status itself rather than trusting this call site.
    await handleInvite(req, res, req.method ?? "GET", session?.email, config.invite);
    return true;
  }
  if (path === "/rotate" && config.rotateCredentials) {
    // Who the signed-in session resolves to, when OAuth is configured — the same identity link
    // "isSelf"/nav highlighting already uses. Passed through so rotateCredentials can refuse to
    // let one authed member silently redirect ANOTHER member's displayed account to credentials
    // the member supplies themselves (see docs/LESSONS.md, 2026-08-11: the whole point of this
    // route is fixing YOUR OWN regenerated key, not reassigning someone else's identity).
    const requesterId = config.auth
      ? resolveCurrentId(session, config.hub.getState().participants)
      : undefined;
    await handleRotate(
      req,
      res,
      req.method ?? "GET",
      keyOf(url),
      requesterId,
      config.rotateCredentials,
    );
    return true;
  }
  return false;
}

/** Notices are looked up by CODE, never echoed from the URL — a reflected message is an attack. */
const TRADE_NOTICES: Record<string, DeskNotice> = {
  submitted: {
    kind: "ok",
    message: "Order sent to the broker. It appears in Active and History as it fills.",
  },
  refused: {
    kind: "error",
    message: "That order didn't go through. Nothing was sent — review it and try again.",
  },
};

/** One desk tab → its renderer. Every tab takes the same options; only Metrics reads history. */
function renderDeskTab(
  tab: Exclude<DeskTab, "overview">,
  snapshot: ParticipantSnapshot,
  options: MetricsViewOptions,
): string {
  if (tab === "positions") return renderPositionsBody(snapshot, options);
  if (tab === "history") return renderHistoryBody(snapshot, options);
  if (tab === "analysis") return renderAnalysisBody(snapshot, options);
  return renderMetricsBody(snapshot, options);
}

/** `/u/:id` — an individual's desk. `?tab=` selects the view; anything unknown falls to overview. */
async function serveIndividualProfile(
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  navFor: (active: NavView) => NavContext,
): Promise<void> {
  const id = decodeURIComponent(path.slice(3));
  const state = config.hub.getState();
  const snapshot = state.participants.find((p) => p.id === id);
  if (!snapshot) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  const params = new URL(url, "http://localhost").searchParams;
  const nav = navFor("you");
  const isSelf = nav.currentId === id;
  const deskNav = { ...nav, active: (isSelf ? "you" : "board") as NavView };
  const tab = parseDeskTab(params.get("tab"));
  const notice = TRADE_NOTICES[params.get("n") ?? ""];
  const history = config.readHistory ? await config.readHistory(id) : undefined;

  if (tab !== "overview") {
    const body = renderDeskTab(tab, snapshot, {
      nav: deskNav,
      isSelf,
      generatedAt: state.generatedAt,
      tradingEnabled: Boolean(config.tradingEnabled && config.submitTrade),
      ...(notice && isSelf ? { notice } : {}),
      ...(history ? { history } : {}),
    });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(shellDocument(`${escapeHtml(snapshot.displayName)} — Skynet Capital`, body));
    return;
  }

  const decisions =
    config.readDecisions && snapshot.kind === "bot" ? await config.readDecisions(id) : undefined;
  // Landmark dial from the shared standings producer, so this view's Eye shows real rank too.
  const prominence = botLandmarkProminence(state.participants).get(id);
  const body = renderIndividualBody(snapshot, {
    nav: deskNav,
    isSelf,
    generatedAt: state.generatedAt,
    ...(history ? { history } : {}),
    ...(decisions ? { decisions } : {}),
    ...(prominence !== undefined ? { prominence } : {}),
  });
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(shellDocument(`${escapeHtml(snapshot.displayName)} — Skynet Capital`, body));
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
