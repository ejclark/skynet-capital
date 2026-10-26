import type { IncomingMessage, ServerResponse } from "node:http";
import { envNamedFor } from "../autonomous/house-roster-wire.js";
import { playbookStoreCatalog } from "../discovery/playbook-store.js";
import { BOTS_ONLY_NOTE } from "../domain/playbook-bots-only.js";
import {
  DELEGATION_LOCKED_NOTE,
  delegationLocked,
  raisesDelegation,
} from "../domain/playbook-delegation.js";
import type { SubscriptionConviction } from "../domain/types.js";
import {
  playbookStoreView,
  withUnmovedConvictions,
} from "../observatory/playbook-store-json-view.js";
import { withOwnSteering } from "../observatory/steered-by-view.js";
import { CONVICTIONS, type ConvictionLookup } from "../playbooks/conviction-store.js";
import { movesNoCapital, STRATEGIES } from "../playbooks/pair-table.js";
import { asOwnConviction } from "../subscriptions/pair-conviction.js";
import {
  allocationChangeRefusal,
  allocationRefusal,
  checkOnRefusal,
} from "../subscriptions/strategy-budgets.js";
import { newSubscriptionRefusal } from "../subscriptions/subscribe-eligibility.js";
import { liveNeedsRefusal } from "../subscriptions/subscribe-live-needs.js";
import type { SubscriptionsState } from "../subscriptions/subscription-state.js";
import { accountKind } from "./account-kind.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId, resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { creditFor } from "./feedback-attribution.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { readJsonPost, requireGet, sendJson } from "./page-shell.js";
import {
  dropPairConviction,
  type OwnViews,
  type WithConviction,
  writeWithConviction,
} from "./pair-conviction-write.js";
import { withForecasts } from "./pair-forecast.js";
import { subscribeLiveReads } from "./subscribe-live-reads.js";
import { recordAllocationWrite, recordSubscriptionWrite } from "./subscription-changes.js";
import {
  parseAllocationBody,
  parseConfigureBody,
  parseConvictionBody,
  parsePlaybookRefBody,
  parseSetEnabledBody,
  parseSubscribeBody,
} from "./subscriptions-api-bodies.js";
import { servePreflight } from "./subscriptions-preflight-route.js";

/**
 * THE PLAYBOOK STORE API (issue #885) — an account's own subscriptions, never another's.
 *
 *   GET  /api/playbook-store?id=<accountId>   → the catalog, merged with that account's own
 *                                                subscriptions IF the session owns it — otherwise
 *                                                the bare catalog (no cross-account visibility).
 *   GET  /api/playbook-store/preflight        → what Subscribe would say to a pair at a budget,
 *                                                asked first, writing nothing (`subscriptions-preflight-route.ts`).
 *   POST /api/playbook-store/subscribe        → SubscriptionStore.subscribe (create or replace).
 *   POST /api/playbook-store/configure        → SubscriptionStore.configure — re-tune an existing
 *                                                subscription, never touching enabled (#4649).
 *   POST /api/playbook-store/unsubscribe      → SubscriptionStore.unsubscribe.
 *   POST /api/playbook-store/set-enabled      → SubscriptionStore.setEnabled.
 *   POST /api/playbook-store/conviction       → SubscriptionStore.setConviction — the owner's reason
 *                                                and check day on a pair they hold (#4469 3c part 3).
 *   POST /api/playbook-store/allocation       → SubscriptionStore.setAllocation — the account's
 *                                                allocation for one strategy, or null to clear it.
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
 *
 * A NEW subscription then passes what its pair needs (#4469 slice 3a, criterion 9,
 * `subscriptions/subscribe-eligibility.ts`): an id something resolves, current research, a print on
 * file for a date-keyed window, a ticker no same-kind pair on the bot already trades. A subscription
 * the account already holds is never re-checked — Edit, Pause, Unsubscribe and a replacing
 * re-subscribe go through as before.
 *
 * EACH TICKER'S BUDGET FITS ITS STRATEGY'S ALLOCATION (#4469 slice 3c part 3, criterion 5,
 * `subscriptions/strategy-budgets.ts`): a subscribe or an Edit that raises a budget past what the
 * account gave the strategy is refused in words; one that keeps or lowers it never is. Setting an
 * allocation caps what may be delegated and delegates nothing, so it passes ownership and bots-only,
 * never the fog. A conviction's new date can resume a pair a failed check stopped — more delegation
 * — so it passes all three gates, like Edit.
 *
 * EVERY WRITE IS LOGGED (#4535 slice 3c, `subscription-changes.ts`): who, before and after, in the
 * same settings change log a bot's Settings card lists — both or neither.
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
export async function delegationRefusal(
  id: string,
  ownedIds: readonly string[],
  notYours: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  /** False for an edit that only LOWERS exposure: reducing risk is never gated (#4649 review). */
  delegates = true,
): Promise<string | undefined> {
  if (!ownedIds.includes(id)) return notYours;
  if (isHumanAccount(config, id)) return BOTS_ONLY_NOTE;
  // The fog, enforced where it counts: the disabled control is rendering, this is the gate.
  if (delegates && (await viewerDelegationLocked(config, session))) return DELEGATION_LOCKED_NOTE;
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
  const entry = playbookStoreCatalog().find((card) => card.id === playbookId);
  const basket = entry?.pickFrom ?? entry?.symbols;
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
 * Neither is a human account's, saved before #4610: the runner never reads it, so it trades nothing.
 */
function subscriberCounts(
  state: SubscriptionsState,
  isHuman: (accountId: string) => boolean,
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const [accountId, subs] of Object.entries(state)) {
    if (isHuman(accountId)) continue;
    for (const sub of subs) {
      if (sub.enabled) counts.set(sub.playbookId, (counts.get(sub.playbookId) ?? 0) + 1);
    }
  }
  return counts;
}

/** The records a pointer on this account resolves to: the seeded ones, then the member views handed
 *  to it — the bots' own rule (`autonomous-convictions.ts`), so a row never shows a view that does
 *  not steer that bot. */
function ownLookup(config: DashboardServerConfig, accountId: string): ConvictionLookup {
  const held = config.memberConvictions?.pointers().heldBy(accountId) ?? [];
  return (id) => CONVICTIONS.get(id) ?? held.find((c) => c.id === id);
}

const editorOf = (session: Session | undefined): string => session?.email ?? "unknown";

/** A subscription write stating `conviction`, kept as the owner's own view on the pair first
 *  (`pair-conviction-write.ts`, #5482 contract piece 3). */
function writeConviction<T>(
  config: DashboardServerConfig,
  session: Session | undefined,
  ref: { readonly id: string; readonly playbookId: string },
  conviction: SubscriptionConviction | undefined,
  write: (viewsBefore: OwnViews) => T,
): WithConviction<T> {
  const owner = session ? creditFor(session) : "The owner";
  const at = config.now?.() ?? new Date();
  const pair = { accountId: ref.id, playbookId: ref.playbookId };
  return writeWithConviction(config.memberConvictions, pair, conviction, owner, at, write);
}

const asOfIso = (config: DashboardServerConfig): string =>
  (config.now?.() ?? new Date()).toISOString();

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
  const lookup = owns && id ? ownLookup(config, id) : undefined;
  // An owner's own view on a pair reads as the reason and day they typed (#5482 contract piece 3).
  const subscriptions =
    id && state && lookup
      ? (state[id] ?? []).map((sub) => asOwnConviction(sub, lookup))
      : undefined;
  const bare = playbookStoreView(
    subscriptions,
    await viewerDelegationLocked(config, session),
    [],
    Boolean(owns && id && isHumanAccount(config, id)),
    asOfIso(config),
    id ? envNamedFor(config.readHouseRoster?.(), id) : undefined,
    // The viewed account's own allocations, only for a viewer who owns it — as its subscriptions.
    subscriptions && id ? config.subscriptions?.loadAllocations()[id] : undefined,
  );
  // Each single-ticker row carries R&D's call for its next earnings report (#5444), and an owned
  // account's rows the view its own pointer names — a member's handed-over one (#5482 slice 6c).
  const forecast = withForecasts(bare.strategies, asOfIso(config));
  // A pair whose conviction is still inline runs exits-only on the bots, and its row says so.
  const strategies =
    subscriptions && lookup && id
      ? withUnmovedConvictions(withOwnSteering(forecast, subscriptions, lookup), state?.[id] ?? [])
      : forecast;
  const view = { ...bare, strategies };
  // Unwired store → no count at all, rather than a false "No subscribers yet".
  const counts = state
    ? subscriberCounts(state, (accountId) => isHumanAccount(config, accountId))
    : undefined;
  sendJson(
    res,
    200,
    counts
      ? {
          ...view,
          cards: view.cards.map((card) => ({ ...card, subscribers: counts.get(card.id) ?? 0 })),
          strategies: view.strategies.map((card) => ({
            ...card,
            pairs: card.pairs.map((row) => ({ ...row, subscribers: counts.get(row.id) ?? 0 })),
          })),
        }
      : view,
  );
}

type Store = NonNullable<DashboardServerConfig["subscriptions"]>;

/** A strategy whose playbooks send no order has no money to allocate (#4535 slice 3a). */
function noAllocationRefusal(strategy: keyof typeof STRATEGIES): string | undefined {
  return STRATEGIES[strategy].movesNoCapital
    ? `${STRATEGIES[strategy].name} places no orders, so there is no capital to allocate to it.`
    : undefined;
}

/** Subscribe — an `await` inside the router's busiest branch, so its own function. */
async function handleSubscribe(
  res: ServerResponse,
  raw: string,
  store: Store,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const parsed = parseSubscribeBody(raw);
  // A playbook that sends no order takes no budget and no compounding, whatever a client sends
  // (the shadow scout, #4535 slice 3a); every other playbook needs its budget.
  const noCapital = parsed !== undefined && movesNoCapital(parsed.playbookId);
  if (!parsed || (!noCapital && parsed.capitalAllocated === undefined)) {
    sendJson(res, 400, { error: "malformed subscribe body" });
    return;
  }
  const body: NonNullable<typeof parsed> = noCapital
    ? { ...parsed, capitalAllocated: undefined, compoundAllocation: undefined }
    : parsed;
  const envNamed = envNamedFor(config.readHouseRoster?.(), body.id);
  const held = store.load()[body.id] ?? [];
  const delegation = await delegationRefusal(
    body.id,
    ownedIds,
    "You can only subscribe your own account.",
    config,
    session,
  );
  const needs = {
    playbookId: body.playbookId,
    subscriptions: held,
    asOfIso: asOfIso(config),
    ...(body.conviction ? { conviction: true } : {}),
    ...(envNamed ? { envNamed } : {}),
  };
  const refusal =
    delegation ??
    (body.conviction ? checkOnRefusal(body.conviction.checkOn, asOfIso(config)) : undefined) ??
    newSubscriptionRefusal(needs) ??
    allocationRefusal({
      playbookId: body.playbookId,
      capitalAllocated: body.capitalAllocated,
      subscriptions: held,
      allocations: store.loadAllocations()[body.id],
    }) ??
    // The live reads cost broker calls, so they run last and only for a subscription the account
    // does not already hold — a replacing re-subscribe is never re-judged. A playbook that sends
    // no order has nothing to read a price or a chain for.
    (noCapital || held.some((sub) => sub.playbookId === body.playbookId)
      ? undefined
      : await liveNeedsRefusal(
          { ...needs, mode: body.mode, capitalAllocated: body.capitalAllocated ?? 0 },
          subscribeLiveReads(config, body.id),
        ));
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  const done = writeConviction(config, session, body, body.conviction, (viewsBefore) =>
    recordSubscriptionWrite(
      config,
      store,
      body,
      editorOf(session),
      () =>
        store.subscribe(body.id, {
          playbookId: body.playbookId,
          mode: body.mode,
          ...(body.capitalAllocated !== undefined
            ? { capitalAllocated: body.capitalAllocated }
            : {}),
          enabled: true,
          ...(body.symbols ? { symbols: body.symbols } : {}),
          ...(body.compoundAllocation ? { compoundAllocation: true } : {}),
          ...(body.conviction ? { conviction: body.conviction } : {}),
        }),
      viewsBefore,
    ),
  );
  sendJson(res, 200, done.ok ? { ok: true } : { ok: false, error: done.reason });
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
  const held = ownedIds.includes(body.id) ? (store.load()[body.id] ?? []) : [];
  const prior = held.find((s) => s.playbookId === body.playbookId);
  const refusal =
    (await delegationRefusal(
      body.id,
      ownedIds,
      "You can only change your own account's playbooks.",
      config,
      session,
      prior === undefined || raisesDelegation(prior, body.tuning),
    )) ??
    basketRefusal(body.playbookId, body.tuning.symbols) ??
    (prior
      ? allocationRefusal({
          playbookId: body.playbookId,
          capitalAllocated: body.tuning.capitalAllocated,
          subscriptions: held,
          allocations: store.loadAllocations()[body.id],
        })
      : undefined);
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  // A playbook that sends no order keeps no budget and no compounding, whatever an edit sends.
  const tuning = movesNoCapital(body.playbookId)
    ? { mode: body.tuning.mode, ...(body.tuning.symbols ? { symbols: body.tuning.symbols } : {}) }
    : body.tuning;
  const saved = recordSubscriptionWrite(config, store, body, editorOf(session), () =>
    store.configure(body.id, body.playbookId, tuning),
  );
  sendJson(
    res,
    200,
    saved
      ? { ok: true }
      : { ok: false, error: `Not subscribed to ${body.playbookId} — subscribe first.` },
  );
}

/** Conviction — the owner's reason and check day on a pair the account already holds. */
async function handleConviction(
  res: ServerResponse,
  raw: string,
  store: Store,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const body = parseConvictionBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed conviction body" });
    return;
  }
  const refusal =
    (await delegationRefusal(
      body.id,
      ownedIds,
      "You can only change your own account's playbooks.",
      config,
      session,
    )) ?? checkOnRefusal(body.conviction.checkOn, asOfIso(config));
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  // A conviction on a pair the account does not hold writes no view: there is nothing to point.
  if (!store.load()[body.id]?.some((s) => s.playbookId === body.playbookId)) {
    sendJson(res, 200, {
      ok: false,
      error: `Not subscribed to ${body.playbookId} — subscribe first.`,
    });
    return;
  }
  const done = writeConviction(config, session, body, body.conviction, (viewsBefore) =>
    recordSubscriptionWrite(
      config,
      store,
      body,
      editorOf(session),
      () => store.setConviction(body.id, body.playbookId, body.conviction),
      viewsBefore,
    ),
  );
  sendJson(res, 200, done.ok ? { ok: true } : { ok: false, error: done.reason });
}

/** Allocation — what the account gives one strategy; the budgets already set must fit under it. */
async function handleAllocation(
  res: ServerResponse,
  raw: string,
  store: Store,
  ownedIds: readonly string[],
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const body = parseAllocationBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed allocation body" });
    return;
  }
  const refusal =
    (await delegationRefusal(
      body.id,
      ownedIds,
      "You can only change your own account's allocations.",
      config,
      session,
      false,
    )) ??
    noAllocationRefusal(body.strategy) ??
    allocationChangeRefusal(store.load()[body.id] ?? [], body.strategy, body.capitalAllocated);
  if (refusal) {
    sendJson(res, 200, { ok: false, error: refusal });
    return;
  }
  recordAllocationWrite(config, store, body, body.capitalAllocated, editorOf(session));
  sendJson(res, 200, { ok: true });
}

const WRITE_PATHS: readonly string[] = [
  "/api/playbook-store/subscribe",
  "/api/playbook-store/configure",
  "/api/playbook-store/unsubscribe",
  "/api/playbook-store/set-enabled",
  "/api/playbook-store/conviction",
  "/api/playbook-store/allocation",
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
  if (path === "/api/playbook-store/preflight") {
    await servePreflight(req, res, config, session);
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
  if (path === "/api/playbook-store/conviction") {
    await handleConviction(res, raw, store, ownedIds, config, session);
    return true;
  }
  if (path === "/api/playbook-store/allocation") {
    await handleAllocation(res, raw, store, ownedIds, config, session);
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
    recordSubscriptionWrite(config, store, body, editorOf(session), () =>
      store.unsubscribe(body.id, body.playbookId),
    );
    dropPairConviction(config.memberConvictions, {
      accountId: body.id,
      playbookId: body.playbookId,
    });
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
  recordSubscriptionWrite(config, store, body, editorOf(session), () =>
    store.setEnabled(body.id, body.playbookId, body.enabled),
  );
  sendJson(res, 200, { ok: true });
  return true;
}
