import { randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AlpacaConnectProvider } from "./auth/alpaca-connect.js";
import type { FetchFn } from "./auth/providers.js";
import { cookie, parseCookies, type Session } from "./auth/session.js";
import { baseUrlFrom } from "./dashboard-auth-gate.js";
import type { AddRefusal } from "./onboarding-gates.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";
import type { AddConnectedInput, AddResult } from "./participant-service.js";
import { CONNECT_FAILED } from "./participant-service.js";

/**
 * CONNECT WITH ALPACA — a member links a free paper account through Alpaca's consent screen
 * instead of pasting a key pair (#8250). Two routes, both behind the auth gate:
 *
 *   POST /api/connect/alpaca          → `{ authorizeUrl }`. Takes the join form's display name and
 *                                       timezone, runs every network-free add check first, holds a
 *                                       pending record (state → name, timezone, session email) for
 *                                       10 minutes, and sets the state as an HttpOnly Lax cookie —
 *                                       the login start's exact posture (`authenticator.ts`).
 *   GET  /connect/alpaca/callback     → checks the state against the cookie AND the pending record,
 *                                       and the record's email against this session; only then
 *                                       exchanges the code and adds the account. Lands the member
 *                                       on the Onboarding chapter either way.
 *   GET  /api/connect/alpaca          → `{ enabled, result }`: whether Connect is on, and the last
 *                                       callback's outcome for THIS session (read once), so the
 *                                       chapter can say what happened without a query string the
 *                                       member could forge.
 *
 * Not `/auth/alpaca/callback`: `/auth/*` is the sign-in family (`authenticator.ts` matches only
 * google|github there), and this links an account to a member who is already signed in.
 *
 * The access token goes from the exchange straight into the service, which stores it encrypted.
 * It is never in a response body, a log line, a URL or a cookie.
 */

const PENDING_TTL_MS = 10 * 60 * 1000;
/** A ceiling, not a quota: far above a family's concurrent connects, low enough that a scripted
 *  flood of starts can't grow the map without bound. Oldest records go first. */
const PENDING_CAP = 256;
const STATE_COOKIE = "skynet_alpaca_state";
const CONNECT_BODY_CAP_BYTES = 1_024;
const CALLBACK_PATH = "/connect/alpaca/callback";
/** The Onboarding chapter — where every callback lands, success or not. */
export const ONBOARDING_LANDING = "/app/accounts?section=milestones&chapter=onboarding";

interface PendingConnect {
  readonly displayName: string;
  readonly timezone?: string;
  readonly email: string;
  readonly expiresAt: number;
}

/** What the chapter shows after a callback — the service's own refusal, or ok. Never the token. */
type ConnectOutcome =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | AddRefusal;

/** The add side the routes need — `ParticipantService`'s two connect methods. */
export interface ConnectService {
  refuseConnectStart(input: {
    readonly displayName: string;
    readonly timezone?: string;
  }): AddRefusal | undefined;
  addConnectedParticipant(input: AddConnectedInput): Promise<AddResult>;
}

/** In-memory state of in-flight connects and their outcomes, one per server process. */
export class ConnectState {
  private readonly pending = new Map<string, PendingConnect>();
  private readonly outcomes = new Map<string, { outcome: ConnectOutcome; expiresAt: number }>();
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  start(record: Omit<PendingConnect, "expiresAt">): string {
    this.prune();
    while (this.pending.size >= PENDING_CAP) {
      const oldest = this.pending.keys().next().value;
      if (oldest === undefined) break;
      this.pending.delete(oldest);
    }
    const state = randomBytes(16).toString("hex");
    this.pending.set(state, { ...record, expiresAt: this.now() + PENDING_TTL_MS });
    return state;
  }

  /** One use: the record is gone after this whether or not it was still fresh. */
  take(state: string): PendingConnect | undefined {
    const record = this.pending.get(state);
    this.pending.delete(state);
    return record && record.expiresAt > this.now() ? record : undefined;
  }

  record(email: string, outcome: ConnectOutcome): void {
    this.outcomes.set(email.toLowerCase(), { outcome, expiresAt: this.now() + PENDING_TTL_MS });
  }

  /** Read once: the chapter shows it, and a reload doesn't show it again. */
  takeOutcome(email: string): ConnectOutcome | undefined {
    const key = email.toLowerCase();
    const entry = this.outcomes.get(key);
    this.outcomes.delete(key);
    return entry && entry.expiresAt > this.now() ? entry.outcome : undefined;
  }

  private prune(): void {
    const now = this.now();
    for (const [state, record] of this.pending) {
      if (record.expiresAt <= now) this.pending.delete(state);
    }
    for (const [email, entry] of this.outcomes) {
      if (entry.expiresAt <= now) this.outcomes.delete(email);
    }
  }
}

/** Everything the routes need, wired once at boot (`alpaca-connect-wiring.ts`). */
export interface AlpacaConnect {
  readonly provider: Pick<AlpacaConnectProvider, "authorizeUrl" | "exchange">;
  readonly fetchFn: FetchFn;
  readonly service: ConnectService;
  readonly state: ConnectState;
}

/** The config slice the routes read. */
export interface AlpacaConnectRouteConfig {
  readonly alpacaConnect?: AlpacaConnect;
  readonly publicUrl?: string;
}

/** Handle the connect routes. Returns true when the request was answered. */
export async function serveAlpacaConnect(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: AlpacaConnectRouteConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/connect/alpaca" && path !== CALLBACK_PATH) return false;
  const connect = config.alpacaConnect;

  if (path === "/api/connect/alpaca" && (req.method ?? "GET") === "GET") {
    const result = connect && session ? connect.state.takeOutcome(session.email) : undefined;
    sendJson(res, 200, { enabled: Boolean(connect), result: result ?? null });
    return true;
  }
  if (!connect) {
    sendJson(res, 404, { error: "Connect with Alpaca isn't set up on this server." });
    return true;
  }
  // The owner is the session email, full stop — no session (no OAuth configured), no connect.
  if (!session) {
    sendJson(res, 403, { error: "Sign in first." });
    return true;
  }
  const base = config.publicUrl ?? baseUrlFrom(req);
  const redirectUri = `${base}${CALLBACK_PATH}`;
  if (path === "/api/connect/alpaca") {
    await startConnect(req, res, connect, session, redirectUri);
  } else {
    await finishConnect(req, res, connect, session, redirectUri);
  }
  return true;
}

async function startConnect(
  req: IncomingMessage,
  res: ServerResponse,
  connect: AlpacaConnect,
  session: Session,
  redirectUri: string,
): Promise<void> {
  const raw = await readJsonPost(req, res, CONNECT_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseConnectBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed connect body" });
    return;
  }
  const refusal = connect.service.refuseConnectStart(body);
  if (refusal) {
    sendJson(res, 200, refusal);
    return;
  }
  const state = connect.state.start({ ...body, email: session.email });
  res.setHeader(
    "set-cookie",
    cookie(STATE_COOKIE, state, {
      maxAgeMs: PENDING_TTL_MS,
      secure: redirectUri.startsWith("https"),
      httpOnly: true,
      sameSite: "Lax",
    }),
  );
  sendJson(res, 200, { ok: true, authorizeUrl: connect.provider.authorizeUrl(redirectUri, state) });
}

async function finishConnect(
  req: IncomingMessage,
  res: ServerResponse,
  connect: AlpacaConnect,
  session: Session,
  redirectUri: string,
): Promise<void> {
  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const state = params.get("state") ?? "";
  const cookieState = parseCookies(req.headers.cookie)[STATE_COOKIE] ?? "";
  const clear = cookie(STATE_COOKIE, "", {
    maxAgeMs: 0,
    secure: redirectUri.startsWith("https"),
    httpOnly: true,
    sameSite: "Lax",
  });
  // State must match the cookie (this browser started it), the pending record (this server
  // issued it, under 10 minutes ago, never used), and the record's email (this member started
  // it). Any miss is a 400 that adds nothing and never reaches the token endpoint.
  const record = sameState(state, cookieState) ? connect.state.take(state) : undefined;
  if (!record || record.email.toLowerCase() !== session.email.toLowerCase()) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8", "set-cookie": clear });
    res.end("This connect link is stale or isn't yours. Start again from Onboarding.");
    return;
  }
  const outcome = await exchangeAndAdd(connect, record, params.get("code"), redirectUri);
  connect.state.record(session.email, outcome);
  res.writeHead(302, { location: ONBOARDING_LANDING, "set-cookie": clear });
  res.end();
}

/** Alpaca sends `error` and no `code` when the member declines; both are a plain "try again". */
async function exchangeAndAdd(
  connect: AlpacaConnect,
  record: PendingConnect,
  code: string | null,
  redirectUri: string,
): Promise<ConnectOutcome> {
  if (!code) return { ok: false, error: CONNECT_FAILED };
  let accessToken: string;
  try {
    ({ accessToken } = await connect.provider.exchange(code, redirectUri, connect.fetchFn));
  } catch {
    return { ok: false, error: CONNECT_FAILED };
  }
  try {
    return await connect.service.addConnectedParticipant({
      displayName: record.displayName,
      ...(record.timezone ? { timezone: record.timezone } : {}),
      ownerEmail: record.email,
      accessToken,
    });
  } catch {
    return { ok: false, error: CONNECT_FAILED };
  }
}

function sameState(a: string, b: string): boolean {
  if (!(a && b) || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Strict shape gate — the join form's name and timezone, nothing else. */
function parseConnectBody(raw: string): { displayName: string; timezone?: string } | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const displayName = boundedString(body.displayName, 60);
  if (!displayName) return undefined;
  const timezone = body.timezone === undefined ? undefined : boundedString(body.timezone, 40);
  if (body.timezone !== undefined && timezone === undefined) return undefined;
  return { displayName, ...(timezone !== undefined ? { timezone } : {}) };
}
