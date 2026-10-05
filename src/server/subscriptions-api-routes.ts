import type { IncomingMessage, ServerResponse } from "node:http";
import { playbookStoreCatalog } from "../discovery/playbook-store.js";
import { BOTS_ONLY_NOTE } from "../domain/playbook-bots-only.js";
import { DELEGATION_LOCKED_NOTE, delegationLocked } from "../domain/playbook-delegation.js";
import { playbookStoreView } from "../observatory/playbook-store-json-view.js";
import type { SubscriptionsState } from "../subscriptions/subscription-state.js";
import { accountKind } from "./account-kind.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { readJsonPost, requireGet, sendJson } from "./page-shell.js";
import {
  parseConfigureBody,
  parsePlaybookRefBody,
  parseSetEnabledBody,
  parseSubscribeBody,
} from "./subscriptions-api-bodies.js";

/**
 * THE PLAYBOOK STORE API (issue #885) — an account's own subscriptions, never another's.
 *
 *   GET  /api/playbook-store?id=<accountId>   → the catalog, merged with that account's own
 *                                                subscriptions IF the session owns it — otherwise
 *                                                the bare catalog (no cross-account visibility).
 *   POST /api/playbook-store/subscribe        → SubscriptionStore.subscribe (create or replace).
 *   POST /api/playbook-store/configure        → SubscriptionStore.configure — re-tune an existing
 *                                                subscription, never touching enabled (#4649).
 *   POST /api/playbook-store/unsubscribe      → SubscriptionStore.unsubscribe.
 *   POST /api/playbook-store/set-enabled      → SubscriptionStore.setEnabled.
 *
 * Same posture as settings-api-routes.ts: bodies must be application/json, strict shape gate
 * (400, never coerce — `subscriptions-api-bodies.ts`), size-capped, identity from the session and
 * nowhere else — ownership is `resolveOwnedIds(session, config).includes(id)`, exactly like the
 * bot-control write.
 *
 * THE TWO WRITES THAT DELEGATE CAPITAL — subscribe and configure — pass three gates, in #4610's
 * order: ownership, then BOT ACCOUNTS ONLY (#4610, `domain/playbook-bots-only.ts`), then the
 * delegation fog (#1707): held until the VIEWER'S own ladder has earned rung 102
 * (`domain/playbook-delegation.ts`). The fog reads the member's ladder, never the subscribed
 * account's: capital is delegated by a person, and a bot account has no ladder to consult. The
 * autonomous runner writes through `SubscriptionStore` directly rather than over HTTP, so nothing
 * here can gate a bot's own trading. Unsubscribe and set-enabled pass ownership only — on every
 * owned account, human or bot — because restricting how someone leaves or pauses a position would
 * be a safety bug, not a lesson.
 */

const BODY_CAP_BYTES = 4_096;

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

/** Only a positive "human" refuses — an account whose kind is unknown is let through
 *  (`account-kind.ts` explains why each fallback leans that way). A config with no hub wired
 *  reads as an empty board, never a throw. */
function isHumanAccount(config: DashboardServerConfig, id: string): boolean {
  return accountKind(id, config.hub?.getState().participants ?? []) === "human";
}

/**
 * The gates a write that delegates capital passes, in #4610's order: ownership → bot account →
 * the viewer's fog. Answers the sentence to refuse with, or undefined to go ahead.
 */
async function delegationRefusal(
  id: string,
  ownedIds: readonly string[],
  notYours: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<string | undefined> {
  if (!ownedIds.includes(id)) return notYours;
  if (isHumanAccount(config, id)) return BOTS_ONLY_NOTE;
  // The fog, enforced where it counts: the disabled control is rendering, this is the gate.
  if (await viewerDelegationLocked(config, session)) return DELEGATION_LOCKED_NOTE;
  return undefined;
}

/**
 * A symbols filter only narrows a playbook's own basket — the guard refuses an entry outside it
 * (`clampBuy`, entry side only) — so a ticker outside the basket would make a subscription that
 * can never open anything. Refused in words rather than saved. An id the catalog does not know
 * (a seeded or retired playbook) has no basket to check against, so it is not second-guessed.
 */
function basketRefusal(
  playbookId: string,
  symbols: readonly string[] | undefined,
): string | undefined {
  const basket = playbookStoreCatalog().find((entry) => entry.id === playbookId)?.symbols;
  const outside = basket ? (symbols ?? []).filter((s) => !basket.includes(s)) : [];
  return outside.length > 0
    ? `${outside.join(", ")} ${outside.length === 1 ? "isn't" : "aren't"} in ${playbookId}'s basket — a symbol filter can only narrow it.`
    : undefined;
}

/**
 * THE SUBSCRIBER COUNT (#3970) — enabled subscriptions per playbook across every account, as a bare
 * number and nothing else. One pass over the whole store; the account ids are the keys walked and
 * are dropped right here, so nothing that names a subscriber can reach the response (#885's "no
 * cross-account visibility", and #3834's rule that a playbook's owner is never revealed). A paused
 * subscription is not counted: it delegates nothing, so it would overstate who is using the playbook.
 */
function subscriberCounts(state: SubscriptionsState): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const subs of Object.values(state)) {
    for (const sub of subs) {
      if (sub.enabled) counts.set(sub.playbookId, (counts.get(sub.playbookId) ?? 0) + 1);
    }
  }
  return counts;
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
  // The store omits an account until its first subscribe, so an owned account with no entry yet is
  // an EMPTY list — never "not yours", which hid the Subscribe form from every fresh account (#3623).
  const state = config.subscriptions?.load();
  const subscriptions = owns && id && state ? (state[id] ?? []) : undefined;
  const view = playbookStoreView(
    subscriptions,
    await viewerDelegationLocked(config, session),
    [],
    Boolean(owns && id && isHumanAccount(config, id)),
  );
  // Unwired store → no count at all, rather than a false "No subscribers yet".
  const counts = state ? subscriberCounts(state) : undefined;
  sendJson(
    res,
    200,
    counts
      ? {
          ...view,
          cards: view.cards.map((card) => ({ ...card, subscribers: counts.get(card.id) ?? 0 })),
        }
      : view,
  );
}

type Store = NonNullable<DashboardServerConfig["subscriptions"]>;

/** Subscribe — an `await` inside the router's busiest branch, so its own function. */
async function handleSubscribe(
  res: ServerResponse,
  raw: string,
  store: Store,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const body = parseSubscribeBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed subscribe body" });
    return;
  }
  const refusal = await delegationRefusal(
    body.id,
    ownedIds,
    "You can only subscribe your own account.",
    config,
    session,
  );
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  store.subscribe(body.id, {
    playbookId: body.playbookId,
    mode: body.mode,
    capitalAllocated: body.capitalAllocated,
    enabled: true,
    ...(body.symbols ? { symbols: body.symbols } : {}),
    ...(body.compoundAllocation ? { compoundAllocation: true } : {}),
  });
  sendJson(res, 200, { ok: true });
}

/**
 * Configure (#4649) — the Store's Edit. Gated exactly like subscribe, because raising a budget or
 * widening a filter is more delegation. Never creates a subscription and never changes whether one
 * runs: a paused subscription stays paused through an edit.
 */
async function handleConfigure(
  res: ServerResponse,
  raw: string,
  store: Store,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const body = parseConfigureBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed configure body" });
    return;
  }
  const refusal =
    (await delegationRefusal(
      body.id,
      ownedIds,
      "You can only change your own account's playbooks.",
      config,
      session,
    )) ?? basketRefusal(body.playbookId, body.tuning.symbols);
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  const saved = store.configure(body.id, body.playbookId, body.tuning);
  sendJson(
    res,
    200,
    saved
      ? { ok: true }
      : { ok: false, error: `Not subscribed to ${body.playbookId} — subscribe first.` },
  );
}

const WRITE_PATHS: readonly string[] = [
  "/api/playbook-store/subscribe",
  "/api/playbook-store/configure",
  "/api/playbook-store/unsubscribe",
  "/api/playbook-store/set-enabled",
];

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
  if (!WRITE_PATHS.includes(path)) return false;

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
  if (path === "/api/playbook-store/configure") {
    await handleConfigure(res, raw, store, ownedIds, config, session);
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
