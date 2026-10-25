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
 * `subscriptions.v2` (#4469 slice 3c part 2) is the one wire change that adds a behavioral field:
 * a subscription's `conviction` (its reason and check date), which a bot acts on (criteria 11 and
 * 12, `conviction-check.ts`). It fingerprints v1's fields plus that one and nothing else, so a spec
 * can show only the added field moved. EXPAND FIRST: the bots read both kinds from part 2 on, and
 * the app sent v1 until part 3 writes a conviction, so an app that deployed ahead of its bots never
 * sent a kind they could not read. The app sends v2 from part 3 (`dashboard-insights-bridge.ts`),
 * once the bots with part 2 were live; v1 stays readable for a rollback. A v1 snapshot's version does not describe a
 * conviction, so the bots drop the one it carries rather than act on a field the version never
 * vouched for.
 *
 * `subscriptions.v3` (#5482 slice 2) adds the second: a subscription's `convictionId`, the pointer
 * at a conviction record whose check date then gates the pair (`with-conviction-gate.ts`). The same
 * expand-first order: the bots read v3 from #5511 on, and the app sends v3 from the migrate step
 * (`dashboard-insights-bridge.ts`), once those bots were live; v2 stays readable for a rollback. A
 * v1 or v2 snapshot does not vouch for a pointer, so the bots drop it, and the pair is checked on
 * its own conviction as before. Since the contract step's piece 2 a pointed subscription carries
 * no inline conviction, so a bots build rolled back past v3 would run it with none on record.
 *
 * `subscriptions.v4` (#5482 contract piece 4) is a contract, not an addition: since this piece the
 * bots read pointers only (`statedCheck`), so an inline conviction's reason and day change nothing
 * a bot does, and v4 stops fingerprinting them. It keeps ONE bit of the inline field: whether a
 * subscription still carries one with no pointer, which is a copy the app's poll could not move
 * onto a view, and which runs its pair exits-only (`subscriptionRoster`). Dropping that bit would
 * let such a pair trade unchecked, the one state no owner chose. The same expand-first order: the
 * bots read v4 from #5989 on, and the app sends v4 from the piece's app half
 * (`dashboard-insights-bridge.ts`), once those bots were live; v3 stays readable for a rollback. A v2 snapshot never vouches for a pointer, so on a bots build with this
 * piece every pair it carries a conviction for runs exits-only: a rollback that far fails safe.
 */

export const SUBSCRIPTIONS_SNAPSHOT_KIND = "subscriptions.v1";
export const SUBSCRIPTIONS_SNAPSHOT_KIND_V2 = "subscriptions.v2";
export const SUBSCRIPTIONS_SNAPSHOT_KIND_V3 = "subscriptions.v3";
export const SUBSCRIPTIONS_SNAPSHOT_KIND_V4 = "subscriptions.v4";
export type SubscriptionsSnapshotKind =
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND_V2
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND_V3
  | typeof SUBSCRIPTIONS_SNAPSHOT_KIND_V4;
const SNAPSHOT_KINDS: readonly string[] = [
  SUBSCRIPTIONS_SNAPSHOT_KIND,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V2,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V3,
  SUBSCRIPTIONS_SNAPSHOT_KIND_V4,
];

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
  // v4: the pointer, and only whether an unmoved inline copy is there, never what it says.
  if (kind === SUBSCRIPTIONS_SNAPSHOT_KIND_V4) {
    return [...v1, sub.convictionId ?? null, sub.conviction !== undefined];
  }
  const v2 = [...v1, sub.conviction ? [sub.conviction.reason, sub.conviction.checkOn] : null];
  if (kind === SUBSCRIPTIONS_SNAPSHOT_KIND_V2) return v2;
  return [...v2, sub.convictionId ?? null];
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

/** The state with only the fields `kind`'s version vouches for: v1 leaves off every conviction
 *  and pointer, v2 every pointer, v3 and v4 nothing. v4 vouches that an inline conviction is there,
 *  not for its words or day, and nothing on the bots reads those any more (`statedCheck`). */
function vouchedFor(
  state: SubscriptionsState,
  kind: SubscriptionsSnapshotKind,
): SubscriptionsState {
  if (kind === SUBSCRIPTIONS_SNAPSHOT_KIND_V3 || kind === SUBSCRIPTIONS_SNAPSHOT_KIND_V4) {
    return state;
  }
  return Object.fromEntries(
    Object.entries(state).map(([accountId, subs]) => [
      accountId,
      subs.map(({ conviction, convictionId: _pointer, ...rest }) =>
        kind === SUBSCRIPTIONS_SNAPSHOT_KIND_V2 && conviction ? { ...rest, conviction } : rest,
      ),
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
  if (typeof kind !== "string" || !SNAPSHOT_KINDS.includes(kind)) return undefined;
  const known = kind as SubscriptionsSnapshotKind;
  if (typeof at !== "number" || !Number.isFinite(at) || at <= 0) return undefined;
  if (typeof version !== "string" || !VERSION.test(version)) return undefined;
  if (!(isRecord(accounts) && withinBounds(accounts))) return undefined;
  const parsed = parseSubscriptionsState(accounts);
  if (!parsed || subscriptionsVersion(parsed, known) !== version) return undefined;
  const allocations = parseAllocations(value.allocations);
  return {
    kind: known,
    at,
    version,
    // A version applies only what it describes: no conviction under v1, no pointer under v1 or v2;
    // under v4 an inline conviction counts only for being there (it holds its pair exits-only).
    accounts: vouchedFor(parsed, known),
    ...(Object.keys(allocations).length > 0 ? { allocations } : {}),
  };
}
