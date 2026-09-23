import { createHash } from "node:crypto";
import type { PlaybookSubscription } from "../domain/types.js";
import { isRecord } from "../storage/parse-guards.js";
import {
  parseSubscriptionsState,
  type SubscriptionsState,
} from "../subscriptions/subscription-state.js";

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
 */

export const SUBSCRIPTIONS_SNAPSHOT_KIND = "subscriptions.v1";

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
  readonly kind: typeof SUBSCRIPTIONS_SNAPSHOT_KIND;
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
}

/**
 * The fields that change what a bot actually trades. Deliberately EXCLUDES `createdAt`/`updatedAt`:
 * the version answers "is the fleet trading something different now?", and a toggle flipped off and
 * back on is the same roster with newer timestamps. Bumping the version there would churn a swap
 * (and, from slice 2, every `DecisionRecord`'s `subscriptionsVersion`) for no behavioral change.
 */
function behavioralFields(sub: PlaybookSubscription): readonly unknown[] {
  return [
    sub.playbookId,
    sub.mode,
    sub.capitalAllocated,
    sub.enabled,
    sub.symbols ? [...sub.symbols].sort() : null,
    sub.compoundAllocation === true,
  ];
}

/**
 * A stable fingerprint of what a subscriptions state makes the fleet trade. Canonicalized before
 * hashing (accounts sorted by id, each account's subscriptions sorted by playbook id, symbol
 * filters sorted) so the same roster written in a different order is the same version — otherwise
 * a rewrite of the store file would look like a change and swap every bot's roster for nothing.
 */
export function subscriptionsVersion(state: SubscriptionsState): string {
  const canonical = Object.keys(state)
    .sort()
    .map((accountId) => [
      accountId,
      [...(state[accountId] ?? [])]
        .sort((a, b) => a.playbookId.localeCompare(b.playbookId))
        .map(behavioralFields),
    ]);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex").slice(0, 16);
}

/** App side: the snapshot to fold into a `GET /controls` response. */
export function buildSubscriptionsSnapshot(
  state: SubscriptionsState,
  at: number,
): SubscriptionsSnapshot {
  return {
    kind: SUBSCRIPTIONS_SNAPSHOT_KIND,
    at,
    version: subscriptionsVersion(state),
    accounts: state,
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
 */
export function parseSubscriptionsSnapshot(value: unknown): SubscriptionsSnapshot | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind !== SUBSCRIPTIONS_SNAPSHOT_KIND) return undefined;
  const { at, version, accounts } = value;
  if (typeof at !== "number" || !Number.isFinite(at) || at <= 0) return undefined;
  if (typeof version !== "string" || !VERSION.test(version)) return undefined;
  if (!(isRecord(accounts) && withinBounds(accounts))) return undefined;
  const parsed = parseSubscriptionsState(accounts);
  if (!parsed || subscriptionsVersion(parsed) !== version) return undefined;
  return { kind: SUBSCRIPTIONS_SNAPSHOT_KIND, at, version, accounts: parsed };
}
