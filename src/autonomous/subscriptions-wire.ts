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
 * version names its fields, so neither moves it.
 *
 * `subscriptions.v2` (#4469 slice 3c part 2) is the one wire change that adds a behavioral field:
 * a subscription's `conviction` (its reason and check date), which a bot acts on (criteria 11 and
 * 12, `conviction-check.ts`). It fingerprints v1's fields plus that one and nothing else, so a spec
 * can show only the added field moved. EXPAND FIRST: the bots read both kinds from this build on,
 * and the app keeps sending v1 until part 3 writes a conviction, so an app that deploys ahead of
 * its bots never sends a kind they cannot read. A v1 snapshot's version does not describe a
 * conviction, so the bots drop the one it carries rather than act on a field the version never
 * vouched for.
 */

export const SUBSCRIPTIONS_SNAPSHOT_KIND = "subscriptions.v1";
export const SUBSCRIPTIONS_SNAPSHOT_KIND_V2 = "subscriptions.v2";
export type SubscriptionsSnapshotKind =
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND_V2;

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
 */
function behavioralFields(
  sub: PlaybookSubscription,
  kind: SubscriptionsSnapshotKind,
): readonly unknown[] {
  const v1 = [
    sub.playbookId,
    sub.mode,
    sub.capitalAllocated,
    sub.enabled,
    sub.symbols ? [...sub.symbols].sort() : null,
    sub.compoundAllocation === true,
  ];
  if (kind === SUBSCRIPTIONS_SNAPSHOT_KIND) return v1;
  return [...v1, sub.conviction ? [sub.conviction.reason, sub.conviction.checkOn] : null];
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
  kind: SubscriptionsSnapshotKind = SUBSCRIPTIONS_SNAPSHOT_KIND,
): SubscriptionsSnapshot {
  return {
    kind,
    at,
    version: subscriptionsVersion(state, kind),
    accounts: state,
    ...(allocations && Object.keys(allocations).length > 0 ? { allocations } : {}),
  };
}

/** The state with every conviction left off — what a v1 version vouches for. */
function withoutConvictions(state: SubscriptionsState): SubscriptionsState {
  return Object.fromEntries(
    Object.entries(state).map(([accountId, subs]) => [
      accountId,
      subs.map(({ conviction: _conviction, ...rest }) => rest),
    ]),
  );
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
  if (kind !== SUBSCRIPTIONS_SNAPSHOT_KIND && kind !== SUBSCRIPTIONS_SNAPSHOT_KIND_V2) {
    return undefined;
  }
  if (typeof at !== "number" || !Number.isFinite(at) || at <= 0) return undefined;
  if (typeof version !== "string" || !VERSION.test(version)) return undefined;
  if (!(isRecord(accounts) && withinBounds(accounts))) return undefined;
  const parsed = parseSubscriptionsState(accounts);
  if (!parsed || subscriptionsVersion(parsed, kind) !== version) return undefined;
  const allocations = parseAllocations(value.allocations);
  return {
    kind,
    at,
    version,
    // A v1 version does not describe a conviction, so none of its convictions is applied.
    accounts: kind === SUBSCRIPTIONS_SNAPSHOT_KIND ? withoutConvictions(parsed) : parsed,
    ...(Object.keys(allocations).length > 0 ? { allocations } : {}),
  };
}
