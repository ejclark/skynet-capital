import type { IncomingMessage, ServerResponse } from "node:http";
import { DELEGATION_LOCKED_NOTE, delegationLocked } from "../domain/playbook-delegation.js";
import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import { playbookStoreView } from "../observatory/playbook-store-json-view.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";

/**
 * THE PLAYBOOK STORE API (issue #885) — an account's own subscriptions, never another's.
 *
 *   GET  /api/playbook-store?id=<accountId>   → the catalog, merged with that account's own
 *                                                subscriptions IF the session owns it — otherwise
 *                                                the bare catalog (no cross-account visibility).
 *   POST /api/playbook-store/subscribe        → SubscriptionStore.subscribe (create or replace).
 *   POST /api/playbook-store/unsubscribe      → SubscriptionStore.unsubscribe.
 *   POST /api/playbook-store/set-enabled      → SubscriptionStore.setEnabled.
 *
 * Same posture as settings-api-routes.ts: bodies must be application/json, strict shape gate
 * (400, never coerce), size-capped, identity from the session and nowhere else — ownership is
 * `resolveOwnedIds(session, config).includes(id)`, exactly like the bot-control write.
 *
 * THE DELEGATION FOG (#1707): subscribe — and only subscribe — is held until the VIEWER'S own
 * ladder has earned rung 102 (`domain/playbook-delegation.ts`). It is the member's ladder, never
 * the subscribed account's: capital is delegated by a person, and a bot account has no ladder to
 * consult. The autonomous runner writes through `SubscriptionStore` directly rather than over
 * HTTP, so nothing here can gate a bot's own trading. Unsubscribe and set-enabled are untouched —
 * restricting how someone leaves or pauses a position would be a safety bug, not a lesson.
 */

const BODY_CAP_BYTES = 4_096;

interface SubscribeBody {
  readonly id: string;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly capitalAllocated: number;
  /** Symbol-targeting filter (#885) — optional, absent/empty means unrestricted. */
  readonly symbols?: readonly string[];
}

const MAX_SYMBOLS = 20;

/** An array of up to `MAX_SYMBOLS` non-empty tickers, uppercased; anything else (not an array, an
 *  empty array, a non-string entry, an over-long one) drops the whole filter to "unrestricted"
 *  rather than rejecting the request — the safe default (see `subscription-state.ts`'s parser). */
function parseSymbols(raw: unknown): readonly string[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_SYMBOLS) return undefined;
  const symbols = raw
    .map((s) => boundedString(s, 12))
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toUpperCase());
  return symbols.length === raw.length ? symbols : undefined;
}

interface PlaybookRefBody {
  readonly id: string;
  readonly playbookId: string;
}

interface SetEnabledBody extends PlaybookRefBody {
  readonly enabled: boolean;
}

function parseSubscribeBody(raw: string): SubscribeBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const playbookId = boundedString(body.playbookId, 60);
  const mode =
    typeof body.mode === "string" && PLAYBOOK_MODES.includes(body.mode as PlaybookMode)
      ? (body.mode as PlaybookMode)
      : undefined;
  const capitalAllocated =
    typeof body.capitalAllocated === "number" &&
    Number.isFinite(body.capitalAllocated) &&
    body.capitalAllocated >= 0
      ? body.capitalAllocated
      : undefined;
  const symbols = parseSymbols(body.symbols);
  return id && playbookId && mode && capitalAllocated !== undefined
    ? { id, playbookId, mode, capitalAllocated, ...(symbols ? { symbols } : {}) }
    : undefined;
}

function parsePlaybookRefBody(raw: string): PlaybookRefBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const id = boundedString(body.id, 100);
  const playbookId = boundedString(body.playbookId, 60);
  return id && playbookId ? { id, playbookId } : undefined;
}

function parseSetEnabledBody(raw: string): SetEnabledBody | undefined {
  const ref = parsePlaybookRefBody(raw);
  if (!ref) return undefined;
  const body = parseJsonRecord(raw);
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;
  return enabled === undefined ? undefined : { ...ref, enabled };
}

/**
 * The viewer's OWN delegation gate. Keyed on the signed-in member's ladder (`resolveCurrentId`),
 * not on the account being subscribed — see this file's header. No auth, no progression service,
 * or no linked desk all read as wheels-off: absence never invents a restriction
 * (`plays-api-routes.ts` resolves it the same way).
 */
async function viewerDelegationLocked(
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  if (!(requesterId && config.progression)) return false;
  const progression = await config.progression.view(
    requesterId,
    session ? opaqueMemberId(session.email) : undefined,
  );
  return delegationLocked(progression);
}

async function serveStoreIndex(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  if (!requireGet(req, res)) return;
  const id = new URL(req.url ?? "", "http://localhost").searchParams.get("id");
  const owns = Boolean(id) && config.auth && resolveOwnedIds(session, config).includes(id ?? "");
  const subscriptions = owns && id ? config.subscriptions?.load()[id] : undefined;
  sendJson(
    res,
    200,
    playbookStoreView(subscriptions, await viewerDelegationLocked(config, session)),
  );
}

/**
 * The one write the delegation fog gates. Its own function because the gate is an `await` inside
 * what was already the busiest branch of the router — extracted so the router stays readable and
 * under the complexity budget, with no change to the order of its refusals.
 */
async function handleSubscribe(
  res: ServerResponse,
  raw: string,
  store: NonNullable<DashboardServerConfig["subscriptions"]>,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const body = parseSubscribeBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed subscribe body" });
    return;
  }
  if (!ownedIds.includes(body.id)) {
    sendJson(res, 200, { ok: false, error: "You can only subscribe your own account." });
    return;
  }
  // The fog, enforced where it counts: the disabled control is rendering, this is the gate.
  if (await viewerDelegationLocked(config, session)) {
    sendJson(res, 200, { ok: false, error: DELEGATION_LOCKED_NOTE });
    return;
  }
  store.subscribe(body.id, {
    playbookId: body.playbookId,
    mode: body.mode,
    capitalAllocated: body.capitalAllocated,
    enabled: true,
    ...(body.symbols ? { symbols: body.symbols } : {}),
  });
  sendJson(res, 200, { ok: true });
}

/** Handle `/api/playbook-store*`. Returns true when the request was answered. */
export async function serveSubscriptionsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/api/playbook-store") {
    await serveStoreIndex(req, res, config, session);
    return true;
  }
  if (
    path !== "/api/playbook-store/subscribe" &&
    path !== "/api/playbook-store/unsubscribe" &&
    path !== "/api/playbook-store/set-enabled"
  ) {
    return false;
  }

  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return true;
  if (!config.subscriptions) {
    sendJson(res, 200, { ok: false, error: "The Playbook Store isn't wired in this deployment." });
    return true;
  }
  const store = config.subscriptions;
  const ownedIds = config.auth ? resolveOwnedIds(session, config) : [];

  if (path === "/api/playbook-store/subscribe") {
    await handleSubscribe(res, raw, store, ownedIds, config, session);
    return true;
  }

  if (path === "/api/playbook-store/unsubscribe") {
    const body = parsePlaybookRefBody(raw);
    if (!body) {
      sendJson(res, 400, { error: "malformed unsubscribe body" });
      return true;
    }
    if (!ownedIds.includes(body.id)) {
      sendJson(res, 200, { ok: false, error: "You can only unsubscribe your own account." });
      return true;
    }
    store.unsubscribe(body.id, body.playbookId);
    sendJson(res, 200, { ok: true });
    return true;
  }

  const body = parseSetEnabledBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed set-enabled body" });
    return true;
  }
  if (!ownedIds.includes(body.id)) {
    sendJson(res, 200, { ok: false, error: "You can only control your own subscriptions." });
    return true;
  }
  store.setEnabled(body.id, body.playbookId, body.enabled);
  sendJson(res, 200, { ok: true });
  return true;
}
