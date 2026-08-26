import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { EquitySample } from "../observatory/history-store.js";
import {
  type NavContext,
  type NavView,
  renderPortfolioIndexBody,
} from "../observatory/render-dashboard.js";
import { parseLeaderMetric, type StandingsOptions } from "../observatory/standings-view.js";
import type { AccountAdmin } from "./account-forms.js";
import type { Authenticator } from "./auth/authenticator.js";
import type { Session } from "./auth/session.js";
import type { ClaimDeps } from "./claim-form.js";
import type { ControlsDeps } from "./controls-form.js";
import { gateRequest, isOwnerOf } from "./dashboard-auth-gate.js";
import { pageHtml, servePublicRoute, streamEvents } from "./dashboard-board-routes.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import { serveIndividualProfile } from "./dashboard-profile-routes.js";
import { trySelfServiceRoute } from "./dashboard-self-service-routes.js";
import { serveInfoRoute, serveLearnRoute, serveTradeRoute } from "./dashboard-view-routes.js";
import { type FeedbackRouteDeps, serveFeedbackRoute } from "./feedback-routes.js";
import type { InviteDeps } from "./invite-form.js";
import type { ObservatoryHub } from "./observatory-hub.js";
import type { SubmitOptionTrade } from "./option-trade-service.js";
import type {
  AddParticipantInput,
  AddResult,
  RotateCredentialsInput,
  RotateResult,
} from "./participant-service.js";
import type { ProgressionService } from "./progression-service.js";
import type { SubmitDeskTrade } from "./trade-service.js";
import { serveWireRoute, type WireRouteDeps } from "./wire-routes.js";

/**
 * `FeedbackRouteDeps` and `WireRouteDeps` (each surface's own dependency list) are inherited
 * rather than repeated here — this config object IS what `serveFeedbackRoute`/`serveWireRoute`
 * receive as their deps, so duplicating those fields would drift the definitions apart with no
 * way to catch it.
 */
export interface DashboardServerConfig extends FeedbackRouteDeps, WireRouteDeps {
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
  /** Re-reads this account from the broker before its desk renders, so the screen shows what Alpaca
   *  holds rather than only what the fill stream delivered (#591). Rate-limited and failure-swallowing
   *  in `createBrokerSync`; omit (offline/tests) and the desk renders live memory as before. */
  readonly refreshParticipant?: (participantId: string) => Promise<void>;
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
  if (await trySelfServiceRoute(req, res, path, url, config, session, navFor("add"))) {
    return;
  }
  if (path === "/feedback" || path === "/feedback/coach" || path === "/feedback/preview") {
    await serveFeedbackRoute(req, res, path, session, config, navFor("feedback"));
    return;
  }
  if (path === "/wire") {
    await serveWireRoute(res, config, Boolean(config.submitFeedback), navFor);
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
