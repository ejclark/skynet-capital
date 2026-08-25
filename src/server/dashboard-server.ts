import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import {
  parseActivityType,
  parseActivityWindow,
  type TradeActivityRecord,
} from "../observatory/activity-store.js";
import { type DeskNotice, type DeskTab, deskHref, parseDeskTab } from "../observatory/desk-tabs.js";
import type { EquitySample } from "../observatory/history-store.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  type PerformanceViewOptions,
  renderPerformanceBody,
} from "../observatory/performance-view.js";
import { renderPositionsBody } from "../observatory/positions-view.js";
import {
  type NavContext,
  type NavView,
  renderAcademyBody,
  renderIndividualBody,
  renderPortfolioIndexBody,
} from "../observatory/render-dashboard.js";
import { botLandmarkProminence } from "../observatory/standings.js";
import {
  type LeaderMetric,
  parseLeaderMetric,
  renderStandingsBody,
  renderStandingsContent,
  type StandingsOptions,
} from "../observatory/standings-view.js";
import { readSceneAsset, threeScenePage } from "../three/serve-scene.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type AccountAdmin, handleAccountRoute } from "./account-forms.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { Session } from "./auth/session.js";
import { type ClaimDeps, handleClaim } from "./claim-form.js";
import { type ControlsDeps, handleDeskSettings } from "./controls-form.js";
import { type FeedbackRouteDeps, serveFeedbackRoute } from "./feedback-routes.js";
import { handleInvite, type InviteDeps } from "./invite-form.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import type { SubmitOptionTrade } from "./option-trade-service.js";
import { PAGE_STYLE, shellDocument } from "./page-shell.js";
import type {
  AddParticipantInput,
  AddResult,
  RotateCredentialsInput,
  RotateResult,
} from "./participant-service.js";
import type { ProgressionService } from "./progression-service.js";
import { serveResearchRoute } from "./research-routes.js";
import { handleAdd, handleRotate } from "./self-service-forms.js";
import { sseFrame } from "./sse.js";
import { handleTrade } from "./trade-routes.js";
import type { SubmitDeskTrade } from "./trade-service.js";
import { welcomeHtml } from "./welcome-page.js";

/**
 * `FeedbackRouteDeps` (the /feedback surface's own dependency list) is inherited rather than
 * repeated here — this config object IS what `serveFeedbackRoute` receives as its deps, so
 * duplicating those fields would drift the two definitions apart with no way to catch it.
 */
export interface DashboardServerConfig extends FeedbackRouteDeps {
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
   * Day-2 account management (`/account`): profile edits and removal. Omit to disable
   * (offline mode, or no store secret). Authorization rules live in account-service.ts.
   */
  readonly accountAdmin?: AccountAdmin;
  /**
   * `GET/POST /invite` — the owner's guest list. Omit to disable (offline mode, or no auth).
   * Owners are the env-configured identities; everyone they invite lands in the volume-backed
   * allowlist store and may sign in but not invite (see `invite-form.ts`).
   */
  readonly invite?: InviteDeps;
  /**
   * `GET/POST /claim` — the owner's account-link table (#546): attach an account that is already
   * on the board, but carries no owner, to a member's sign-in. Omit to disable (offline mode, or
   * no auth). Owner-gated inside the handler itself, exactly like `/invite`.
   */
  readonly claim?: ClaimDeps;
  /**
   * `GET/POST /u/:id?tab=settings` — Mission Control, the owner's switchboard for the autonomous
   * fleet, served as an account's Settings tab (#475). Omit to disable (offline mode, or no auth).
   * Owner-gated inside the handler itself. The old `/controls` URL redirects here.
   */
  readonly controls?: ControlsDeps;
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
   * Reads a participant's durable trade-activity ledger (`activity-store.ts`) for the history and
   * analysis tabs. Omit to leave those views bounded by the broker's recent-order window — they
   * stay honest about it via the backfill caveat.
   */
  readonly readTradeActivity?: (participantId: string) => Promise<readonly TradeActivityRecord[]>;
  /**
   * Per-participant progression derived from the fill + audit ledgers — drives the Milestones
   * page and (with training wheels on) the desk's trade-type gate. Omit and `/learn` renders
   * a browsable journey at zero while the desk behaves as wheels-off.
   */
  readonly progression?: ProgressionService;
  /**
   * Member-initiated trading from the desk (`/trade`). On whenever OAuth is configured (Eric's
   * ruling, 2026-08-21, #466: no separate switch) — with it off, the desk still renders its
   * ticket, visibly disabled and honest about why.
   */
  readonly tradingEnabled?: boolean;
  /** The execution seam (`trade-service.ts`). Absent = no order path is wired at all. */
  readonly submitTrade?: SubmitDeskTrade;
  /** The options execution seam (`option-trade-service.ts`), behind the same switch. */
  readonly submitOptionTrade?: SubmitOptionTrade;
  /** Options data (chains/spot) via a participant's own credentials, for the /trade ticket. */
  readonly optionsClientFor?: (participantId: string) => AlpacaOptionsClient | undefined;
  /**
   * Resolve the signed-in session's email to the participant it owns (`Participant.ownerEmail`)
   * — the ONLY link a session may trade or self-manage through (#466). Reads the roster + store
   * directly; `ParticipantSnapshot` deliberately omits `ownerEmail` so it's never handed to a
   * browser. Omit when OAuth isn't configured.
   */
  readonly resolveOwnerId?: (email: string) => string | undefined;
  /**
   * Every participant id the session's email owns — the Portfolio index (`/u`) lists these.
   * Same ownership link as `resolveOwnerId`, plural; omit to fall back to that single id.
   */
  readonly resolveOwnerIds?: (email: string) => readonly string[];
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

/** True when the signed-in session's email is an owner on the given owner-gated dep, if wired. */
function isOwnerOf(
  dep: { isOwner: (email: string) => boolean } | undefined,
  session: Session | undefined,
): boolean {
  return Boolean(dep && session && dep.isOwner(session.email.toLowerCase()));
}

/** `?a=`/`?b=` for Standings' folded-in compare — shared by `/events` and `/` so neither route
 *  re-derives the same conditional spread inline. */
function parseCompareParams(params: URLSearchParams): Pick<StandingsOptions, "aId" | "bId"> {
  return {
    ...(params.get("a") ? { aId: params.get("a") as string } : {}),
    ...(params.get("b") ? { bId: params.get("b") as string } : {}),
  };
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
  const canControl = isOwnerOf(config.controls, session);
  const canInvite = isOwnerOf(config.invite, session);
  const navFor = (active: NavView): NavContext => ({
    active,
    currentId: resolveCurrentId(session, config.resolveOwnerId),
    canAdd,
    authed,
    ...(canControl ? { canControl } : {}),
    ...(canInvite ? { canInvite } : {}),
  });

  if (path === "/events") {
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    streamEvents(req, res, config.hub, navFor("board"), metric, parseCompareParams(params));
    return;
  }
  if (path === "/leaderboard") {
    // Leaderboard folded into Standings (/) 2026-08-25 — an old bookmark still lands somewhere
    // real rather than 404ing. Its own metric param maps onto Standings' identically-shaped one.
    const by = new URL(url, "http://localhost").searchParams.get("by");
    res.writeHead(302, { location: by ? `/?by=${by}` : "/" });
    res.end();
    return;
  }
  if (path === "/bots-vs-humans") {
    // Bots vs Humans folded into Standings (/) 2026-08-25 — same reasoning as /leaderboard above.
    res.writeHead(302, { location: "/" });
    res.end();
    return;
  }
  if (path === "/compare") {
    // Compare folded into Standings (/) as ?a=&b= 2026-08-25 — same params, same shapes, so the
    // query string carries over unchanged rather than 404ing an old bookmark.
    const qs = new URL(url, "http://localhost").search;
    res.writeHead(302, { location: `/${qs}` });
    res.end();
    return;
  }
  if (await trySelfServiceRoute(req, res, path, url, config, session)) {
    return;
  }
  if (path === "/feedback" || path === "/feedback/coach" || path === "/feedback/preview") {
    await serveFeedbackRoute(req, res, path, session, config, navFor("feedback"));
    return;
  }
  if (path === "/learn") {
    await serveLearnRoute(res, config, session, navFor);
    return;
  }
  if (serveInfoRoute(res, path, url, navFor)) {
    return;
  }
  if (path === "/trade") {
    await serveTradeRoute(req, res, url, config, session, navFor);
    return;
  }
  // Portfolio index — /u bare: every account the session's email owns, one level above the desks.
  if (path === "/u") {
    const ownedIds = resolveOwnedIds(session, config);
    const state = config.hub.getState();
    const accounts = state.participants.filter((p) => ownedIds.includes(p.id));
    const body = renderPortfolioIndexBody(accounts, {
      nav: navFor("you"),
      generatedAt: state.generatedAt,
    });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
    return;
  }
  // Individual profile — /u/:id. Ids are already URL-safe; match by prefix (no path-param parser).
  if (path.startsWith("/u/")) {
    await serveIndividualProfile(req, res, path, url, config, navFor, session);
    return;
  }
  if (path === "/" || path === "/index.html") {
    // The board is where every sign-in lands (OAuth's callback redirects here), so it's the
    // cheapest reliable place to stamp "joined" for the /invite observability view — idempotent
    // and fails silently, never blocking the render it rides along with.
    if (session) config.invite?.store.markJoined(session.email, new Date().toISOString());
    const params = new URL(url, "http://localhost").searchParams;
    const metric = parseLeaderMetric(params.get("by"));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(pageHtml(config.hub, navFor("board"), metric, parseCompareParams(params)));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}

/**
 * The Milestones page (`/learn`) — the one info view that knows WHO is looking: the session's
 * identity resolves exactly as `/trade`'s does, and the viewer's derived progression (earned
 * milestones, points, rank) rides into the render. No identity, or no progression service wired,
 * degrades to the browsable journey at zero — honestly, never a fabricated state.
 */
async function serveLearnRoute(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
  navFor: (active: NavView) => NavContext,
): Promise<void> {
  const id = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const progress = id && config.progression ? await config.progression.view(id) : undefined;
  const body = renderAcademyBody({ nav: navFor("learn"), ...(progress ? { progress } : {}) });
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(shellDocument("Milestones — Skynet Capital", body));
}

/**
 * The read-only info views behind the gate — `/research`, the `/calendar` redirect — grouped so
 * the main dispatch stays within its complexity budget. Returns true when the request was handled;
 * dispatch order is unchanged from before the extraction.
 */
function serveInfoRoute(
  res: ServerResponse,
  path: string,
  url: string,
  navFor: (active: NavView) => NavContext,
): boolean {
  if (path === "/calendar") {
    // The event horizon folded into the Research shelf 2026-08-25 — an old bookmark still lands
    // somewhere real rather than 404ing. Its month param carries over unchanged.
    const month = new URL(url, "http://localhost").searchParams.get("month");
    res.writeHead(302, { location: month ? `/research?month=${month}` : "/research" });
    res.end();
    return true;
  }
  if (path === "/research" || path.startsWith("/research/")) {
    serveResearchRoute(res, path, url, navFor);
    return true;
  }
  return false;
}

/**
 * `/trade` — GET is the ticket view, POST the order path. Identity comes from the session and
 * nowhere else: with no authenticator configured no id resolves, and `trade-routes.ts` refuses
 * rather than guessing which account a request belongs to.
 */
async function serveTradeRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  navFor: (active: NavView) => NavContext,
): Promise<void> {
  const participants = config.hub.getState().participants;
  await handleTrade(req, res, url, {
    snapshotFor: (id) => participants.find((p) => p.id === id),
    requesterId: config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined,
    tradingEnabled: Boolean(config.tradingEnabled),
    ...(config.progression ? { progression: config.progression } : {}),
    ...(config.submitTrade ? { submitTrade: config.submitTrade } : {}),
    ...(config.submitOptionTrade ? { submitOptionTrade: config.submitOptionTrade } : {}),
    ...(config.optionsClientFor ? { optionsClientFor: config.optionsClientFor } : {}),
    nav: navFor("trade"),
    document: shellDocument,
  });
}

/**
 * Mission Control moved onto the account desk (#475), so the old `/controls` URL survives only as a
 * redirect — bookmarks and the pre-relocation drawer link keep working. The Settings tab is
 * owner-gated on arrival regardless of WHICH desk it's reached through (`handleDeskSettings`
 * re-checks independently of this call site), so landing a non-owner here is safe and leaks
 * nothing: they simply get that desk's overview. Prefers the viewer's OWN linked desk when one
 * exists, but Mission Control controls the whole fleet, not that one account — an owner with no
 * linked desk (2026-08-25: a real, expected state, not an edge case) still needs a door in, so
 * this falls back to any bot's desk rather than bouncing to the board with no way to reach the
 * switchboard at all.
 */
function redirectToDeskSettings(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): void {
  const ownId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const id = ownId ?? config.controls?.bots()[0]?.id;
  res.writeHead(302, { location: id ? deskHref(id, "settings") : "/" });
  res.end();
}

/**
 * The owner-only admin pages — `/invite` (who may sign in) and `/claim` (which account each
 * sign-in owns). Grouped because they share one property: identity comes from the signed session
 * and nowhere else — there is no id in the URL to spoof — and each handler re-checks owner status
 * itself rather than trusting this call site. True when handled.
 */
async function tryOwnerPage(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/invite" && config.invite) {
    await handleInvite(req, res, req.method ?? "GET", session?.email, config.invite);
    return true;
  }
  if (path === "/claim" && config.claim) {
    await handleClaim(req, res, req.method ?? "GET", session?.email, config.claim);
    return true;
  }
  return false;
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
    // The owner link: whoever's signed in is who this account belongs to, full stop — never a
    // field the form could fill in on someone else's behalf (Eric's ruling, 2026-08-21, #466).
    await handleAdd(
      req,
      res,
      req.method ?? "GET",
      keyOf(url),
      session?.email,
      config.addParticipant,
    );
    return true;
  }
  if (path === "/controls" && config.controls) {
    redirectToDeskSettings(res, config, session);
    return true;
  }
  if (await tryOwnerPage(req, res, path, config, session)) {
    return true;
  }
  if ((path === "/account" || path === "/account/remove") && config.accountAdmin) {
    // Same identity resolution /rotate and /trade use; account-service enforces the rules.
    await handleAccountRoute(req, res, path, req.method ?? "GET", {
      admin: config.accountAdmin,
      requesterId: config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined,
      session,
      authConfigured: Boolean(config.auth),
      key: keyOf(url),
    });
    return true;
  }
  if (path === "/rotate" && config.rotateCredentials) {
    await handleRotate(
      req,
      res,
      req.method ?? "GET",
      keyOf(url),
      idOf(url),
      rotateRequester(config, session),
      config.rotateCredentials,
    );
    return true;
  }
  return false;
}

/**
 * The identity /rotate hands the service: who the signed-in session resolves to (the same link
 * "isSelf"/nav highlighting uses), so rotateCredentials can refuse to let one authed member
 * silently redirect ANOTHER member's displayed account to credentials the member supplies
 * themselves (docs/LESSONS.md, 2026-08-11: this route fixes YOUR OWN regenerated key, not
 * someone else's identity). The session EMAIL rides along for env-roster targets, which are
 * owner-gated in the service; both fields are absent exactly when OAuth isn't configured.
 */
function rotateRequester(
  config: DashboardServerConfig,
  session: Session | undefined,
): { id?: string; email?: string } {
  if (!config.auth) return {};
  const id = resolveCurrentId(session, config.resolveOwnerId);
  return {
    ...(id !== undefined ? { id } : {}),
    ...(session ? { email: session.email } : {}),
  };
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

/** One desk tab → its renderer. Every tab takes the same options; only Performance reads history. */
function renderDeskTab(
  tab: Exclude<DeskTab, "overview" | "settings">,
  snapshot: ParticipantSnapshot,
  options: PerformanceViewOptions,
): string {
  if (tab === "positions") return renderPositionsBody(snapshot, options);
  return renderPerformanceBody(snapshot, options);
}

/**
 * Assemble one non-overview desk tab: gather the reads that tab needs — the durable trade ledger
 * and the decision audit for Performance's folded order ledger "why" — and render. Split from
 * `serveIndividualProfile` to keep that route inside its complexity budget.
 */
async function deskTabBody(
  tab: Exclude<DeskTab, "overview" | "settings">,
  snapshot: ParticipantSnapshot,
  config: DashboardServerConfig,
  params: URLSearchParams,
  base: PerformanceViewOptions,
): Promise<string> {
  const tradeActivity =
    config.readTradeActivity && tab === "performance"
      ? await config.readTradeActivity(snapshot.id)
      : undefined;
  const decisions =
    config.readDecisions && tab === "performance" && snapshot.kind === "bot"
      ? await config.readDecisions(snapshot.id)
      : undefined;
  return renderDeskTab(tab, snapshot, {
    ...base,
    tradingEnabled: Boolean(config.tradingEnabled && config.submitTrade),
    activityWindow: parseActivityWindow(params.get("window")),
    activityType: parseActivityType(params.get("type")),
    ...(tradeActivity ? { tradeActivity } : {}),
    ...(decisions ? { decisions } : {}),
  });
}

/** `/u/:id` — an individual's desk. `?tab=` selects the view; anything unknown falls to overview. */
async function serveIndividualProfile(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  navFor: (active: NavView) => NavContext,
  session: Session | undefined,
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
  // Owner-only tabs downgrade to the overview inside `parseDeskTab`, so a member asking for
  // `?tab=settings` is answered exactly like a typo — there is no owner-shaped tell to probe for.
  const tab = parseDeskTab(params.get("tab"), Boolean(nav.canControl));
  const notice = TRADE_NOTICES[params.get("n") ?? ""];

  if (tab === "settings" && config.controls) {
    // Mission Control (#475). `handleDeskSettings` re-checks owner status itself rather than
    // trusting this call site, and owns the POST path — the same layering /invite uses.
    await handleDeskSettings(req, res, req.method ?? "GET", session?.email, config.controls, {
      snapshot,
      options: { nav: deskNav, isSelf, generatedAt: state.generatedAt },
    });
    return;
  }

  const history = config.readHistory ? await config.readHistory(id) : undefined;

  if (tab !== "overview" && tab !== "settings") {
    const body = await deskTabBody(tab, snapshot, config, params, {
      nav: deskNav,
      isSelf,
      generatedAt: state.generatedAt,
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
 * Resolve the signed-in viewer to the participant they own (#466) — undefined when no
 * `resolveOwnerId` is wired, or the session's email owns no account (an account with no owner
 * link resolves to nobody until an owner attaches one from `/claim`).
 */
function resolveCurrentId(
  session: Session | undefined,
  resolveOwnerId: ((email: string) => string | undefined) | undefined,
): string | undefined {
  if (!(session && resolveOwnerId)) return undefined;
  return resolveOwnerId(session.email);
}

/** All ids the session owns — plural hook first, else the single `resolveOwnerId` as a list. */
function resolveOwnedIds(
  session: Session | undefined,
  config: DashboardServerConfig,
): readonly string[] {
  if (!session) return [];
  if (config.resolveOwnerIds) return config.resolveOwnerIds(session.email);
  const single = resolveCurrentId(session, config.resolveOwnerId);
  return single ? [single] : [];
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

/** `/rotate?id=…` — the id a link that already names the account carries in, so nobody types it. */
function idOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("id") ?? "";
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
function streamEvents(
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

function pageHtml(
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
