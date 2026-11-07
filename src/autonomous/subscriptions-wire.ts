import { createHash } from "node:crypto";
import type { PlaybookSubscription } from "../domain/types.js";
import { isRecord } from "../storage/parse-guards.js";
import {
  parseSubscriptionsState,
  type SubscriptionsState,
} from "../subscriptions/subscription-state.js";
import { type AllocationsState, parseAllocations } from "../subscriptions/subscriptions-file.js";

/**
 * THE SUBSCRIPTIONS WIRE — how the Playbook Store's saved subscriptions reach the `bots` process
 * (issue #3595).
 *
 * The two apps keep two different files. `fly.toml` pins `SKYNET_SUBSCRIPTIONS_FILE` to the
 * dashboard's volume; `fly.bots.toml` sets nothing, so the bots process falls back to a relative
 * path on its own machine and reads it exactly once, at boot (`autonomous-live-wiring.ts`). A
 * member subscribing, re-allocating or toggling a playbook in the UI therefore never reached a
 * live bot at all — it shipped green and ran dark.
 *
 * The fix rides the `GET /controls` poll the bots process already makes every ~30s, the same
 * additive shape `decision-wire.ts`'s `decisionsCursor` uses and for the same reasons: no new
 * route, no new credential, and no `fly*.toml` change (envelope-protected). The dashboard stays
 * the source of truth — this is a pull, never a push.
 *
 * Expand/contract across the app/bots deploy split (the two apps can run different commits): an
 * app that predates this simply omits the field, which the bots side reads as "not reported" and
 * leaves the roster it already has; a bots build that predates it ignores a field it doesn't know.
 * `kind: "subscriptions.v1"` is versioned from day one for the same reason `decision.v1` is — a
 * future wire change that adds a BEHAVIORAL field must add a new kind rather than silently
 * reinterpreting this one, because `subscriptionsVersion` below is computed over exactly the
 * behavioral fields this version knows about.
 *
 * Carried, never behavioral (#4469 slice 3c): any field a newer build put on a record (#4772), and
 * `allocations`, each account's capital per strategy (the app checks budgets against them). The
 * version names its fields, so neither moves it. A subscription's `playTarget` (#5483 slice 3) is
 * carried the same way, because it is observe-only: a bot logs where the play stands against it and
 * trades exactly as it would without it. The slice that lets a target change what a bot does adds a
 * new kind, as v2 and v3 did.
 *
 * The kind's history, each step expand first (the bots read a kind before the app sends it):
 * v2 (#4469 slice 3c) added a subscription's inline conviction, v3 (#5482 slice 2) its
 * `convictionId`, the pointer at a conviction record whose check gates the pair
 * (`with-conviction-gate.ts`), and v4 (#5482 contract piece 4) dropped the inline conviction's
 * words and day, keeping one bit: whether a subscription still carried a copy with no pointer.
 *
 * THE INLINE FIELD IS RETIRED (#5482, the contract step's last piece): no build reads a
 * subscription's inline conviction (`subscription-state.ts` drops it on read), so v4's one bit is
 * FROZEN at `false`. Frozen, not removed: every real state already hashed to that value, so the
 * version is byte for byte what the builds before computed, and app and bots deploy in either order.
 * A snapshot from an older app that still carried a copy no longer reproduces its own version here
 * and is read as "not reported" (the roster in force stays), never applied without the bit.
 *
 * V4 IS THE ONLY KIND (#5482, the contract step's close). The app has sent v4 since #6000
 * (2026-10-25), so v1 to v3 stayed readable only for a rollback past it. A deploy's automatic
 * rollback goes back one release, and every release since sends v4. Any other kind now reads as
 * "not reported": the bots keep the roster in force, or at boot the kept one (`subscriptions-cache.ts`),
 * and never apply a pair under a version that did not vouch for its pointer. The next behavioral
 * field adds a kind again, expand first: the bots read both before the app sends the new one.
 *
 * V5 (#6954 slice 5c, EXPAND): a subscription's `belowBarFloorPct`, the owner's own smaller
 * below-bar floor, joins the version. The bots read v4 and v5; the app still sends v4, and sends v5
 * once this has deployed (5c's second half, which also gives the Store its writer). A v5 version
 * names the floor only where one is set, so a state with no floor hashes byte for byte as v4 does
 * and the switch swaps no roster. A v4 snapshot never vouched for a floor, so one is stripped from
 * it before it is applied: a floor reaches a bot only under a version that would move if it changed.
 */

/** The kind the app sends. */
export const SUBSCRIPTIONS_SNAPSHOT_KIND = "subscriptions.v4";

/** The kind whose version names the owner's below-bar floor (#6954 slice 5c). */
export const SUBSCRIPTIONS_SNAPSHOT_KIND_V5 = "subscriptions.v5";

/** Every kind the bots read. */
export type SubscriptionsSnapshotKind =
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND_V5;

const READ_KINDS: ReadonlySet<unknown> = new Set<SubscriptionsSnapshotKind>([
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V5,
]);

/**
 * Defensive bounds on a snapshot. This app's roster is a handful of bots and its registry a
 * handful of playbooks, so these are generous headroom against a malformed/hostile payload, not a
 * limit anyone should hit. A snapshot that exceeds either is dropped IN FULL rather than
 * truncated: a partial subscription set reads as a wrong one — a bot trading capital it was never
 * allocated — which is strictly worse than "not reported".
 */
const MAX_ACCOUNTS = 64;
const MAX_SUBSCRIPTIONS_PER_ACCOUNT = 64;

/** A 16-hex content fingerprint — see `subscriptionsVersion`. */
const VERSION = /^[0-9a-f]{16}$/;

export interface SubscriptionsSnapshot {
  readonly kind: SubscriptionsSnapshotKind;
  /**
   * Epoch ms, stamped by the APP as it read its own store. The ordering the bots side uses to
   * refuse a snapshot older than the one already in force — a reordered response, or an app that
   * rolled back onto an older store, must never rewind a live roster.
   */
  readonly at: number;
  /** What this snapshot makes the fleet trade, fingerprinted — see `subscriptionsVersion`. */
  readonly version: string;
  /** Every account's subscriptions, keyed by `accountId` (a bot's `persona.id`). */
  readonly accounts: SubscriptionsState;
  /** Each account's allocation per strategy; omitted when none is set. Outside `version`. */
  readonly allocations?: AllocationsState;
}

/**
 * The fields that change what a bot actually trades. Deliberately EXCLUDES `createdAt`/`updatedAt`:
 * the version answers "is the fleet trading something different now?", and a toggle flipped off and
 * back on is the same roster with newer timestamps. Bumping the version there would churn a swap
 * (and, from slice 2, every `DecisionRecord`'s `subscriptionsVersion`) for no behavioral change.
 * The eighth term is the retired inline conviction's bit, frozen at what "none" always hashed to.
 * Under v5 an owner's below-bar floor follows it, only where one is set (this file's header).
 */
function behavioralFields(
  sub: PlaybookSubscription,
  kind: SubscriptionsSnapshotKind,
): readonly unknown[] {
  const v4 = [
    sub.playbookId,
    sub.mode,
    sub.capitalAllocated,
    sub.enabled,
    sub.symbols ? [...sub.symbols].sort() : null,
    sub.compoundAllocation === true,
    sub.convictionId ?? null,
    false,
  ];
  return kind === SUBSCRIPTIONS_SNAPSHOT_KIND_V5 && sub.belowBarFloorPct !== undefined
    ? [...v4, sub.belowBarFloorPct]
    : v4;
}

/** A state with every owner floor taken off — what a v4 snapshot is applied as, since its version
 *  never named one. */
function withoutOwnerFloors(state: SubscriptionsState): SubscriptionsState {
  return Object.fromEntries(
    Object.entries(state).map(([accountId, subs]) => [
      accountId,
      subs.map(({ belowBarFloorPct: _unvouched, ...sub }) => sub),
    ]),
  );
}

/**
 * A stable fingerprint of what a subscriptions state makes the fleet trade. Canonicalized before
 * hashing (accounts sorted by id, each account's subscriptions sorted by playbook id, symbol
 * filters sorted) so the same roster written in a different order is the same version — otherwise
 * a rewrite of the store file would look like a change and swap every bot's roster for nothing.
 */
export function subscriptionsVersion(
  state: SubscriptionsState,
  kind: SubscriptionsSnapshotKind = SUBSCRIPTIONS_SNAPSHOT_KIND,
): string {
  const canonical = Object.keys(state)
    .sort()
    .map((accountId) => [
      accountId,
      [...(state[accountId] ?? [])]
        .sort((a, b) => a.playbookId.localeCompare(b.playbookId))
        .map((sub) => behavioralFields(sub, kind)),
    ]);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex").slice(0, 16);
}

/** App side: the snapshot to fold into a `GET /controls` response. */
export function buildSubscriptionsSnapshot(
  state: SubscriptionsState,
  at: number,
  allocations?: AllocationsState,
): SubscriptionsSnapshot {
  return {
    kind: SUBSCRIPTIONS_SNAPSHOT_KIND,
    at,
    version: subscriptionsVersion(state),
    accounts: state,
    ...(allocations && Object.keys(allocations).length > 0 ? { allocations } : {}),
  };
}

/** Bounds check on the RAW payload, before any parsing — so an oversized body is refused by shape
 *  rather than by how much of it happened to survive `parseSubscriptionsState`. */
function withinBounds(accounts: Record<string, unknown>): boolean {
  const entries = Object.entries(accounts);
  if (entries.length > MAX_ACCOUNTS) return false;
  return entries.every(
    ([, subs]) => !Array.isArray(subs) || subs.length <= MAX_SUBSCRIPTIONS_PER_ACCOUNT,
  );
}

/**
 * Bots side: what an authenticated poll's body says about the Playbook Store, or `undefined` for
 * anything short of a clean, well-shaped, self-consistent payload — an app build that predates the
 * field, a truncated or garbled value, an over-large one, or a payload whose claimed `version`
 * does not reproduce from its own contents.
 *
 * That last check is the honesty rule this wire turns on: `parseSubscriptionsState` is deliberately
 * lenient (it drops individual malformed subscriptions rather than failing the whole file), which
 * is right for a local store but wrong for a roster a bot is about to trade — a dropped
 * subscription would leave the bot trading LESS than the version it reports. Recomputing the
 * fingerprint over what actually parsed means a snapshot is applied only when the bots side can
 * reproduce the app's own claim about it, and is otherwise read as "not reported" — never as a
 * partial roster. (A payload carrying EXTRA junk that parses away to exactly the claimed version
 * passes, and correctly so: what is applied is then precisely the roster the version describes.)
 * `allocations` sits outside the version, so it is read leniently and never sinks a snapshot.
 */
export function parseSubscriptionsSnapshot(value: unknown): SubscriptionsSnapshot | undefined {
  if (!isRecord(value)) return undefined;
  const { kind, at, version, accounts } = value;
  if (!READ_KINDS.has(kind)) return undefined;
  const read = kind as SubscriptionsSnapshotKind;
  if (typeof at !== "number" || !Number.isFinite(at) || at <= 0) return undefined;
  if (typeof version !== "string" || !VERSION.test(version)) return undefined;
  if (!(isRecord(accounts) && withinBounds(accounts))) return undefined;
  const parsed = parseSubscriptionsState(accounts);
  if (!parsed || subscriptionsVersion(parsed, read) !== version) return undefined;
  const allocations = parseAllocations(value.allocations);
  return {
    kind: read,
    at,
    version,
    accounts: read === SUBSCRIPTIONS_SNAPSHOT_KIND_V5 ? parsed : withoutOwnerFloors(parsed),
    ...(Object.keys(allocations).length > 0 ? { allocations } : {}),
  };
}
