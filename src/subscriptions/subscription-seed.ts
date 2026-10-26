import type { HouseRosterEntry, HouseRosterReport } from "../autonomous/house-roster-wire.js";
import type { PlaybookSubscription } from "../domain/types.js";
import { isRecord } from "../storage/parse-guards.js";
import type { SubscriptionsState } from "./subscription-state.js";

/**
 * SEEDING A HOUSE BOT'S SUBSCRIPTIONS FROM THE ENV ROSTER (#4535 slice 1b).
 *
 * The bots app reports its `SKYNET_PLAYBOOKS` roster upstream (`house-roster-wire.ts`); this turns
 * that report into each house bot's own subscriptions, once per account, so the env roster can
 * retire later in the plan without any bot's roster or sizing changing. Three rules make it exact:
 *
 * - **Uncapped.** A seeded subscription has no `capitalAllocated` — the env roster never had a
 *   budget, and `clampBuy` applies none when it is absent. Same mode as the env entry.
 * - **The owner's own subscriptions win.** A playbook the account already subscribes to, enabled
 *   or paused, is never touched — exactly the entry `mergeRosters` already lets win today.
 * - **Seeded entries go first, in env order.** `mergeRosters` puts the house entries that are not
 *   overridden ahead of the account's own; prepending reproduces that order exactly.
 *
 * And once only: each seeded account gets a `seededFrom` marker, and an account with a marker is
 * never seeded again — so an owner who later unsubscribes from a seeded playbook stays
 * unsubscribed. The markers live in their own file (`subscription-seed-store.ts`), not in the
 * subscriptions file, whose content fingerprint (`subscriptionsVersion`) is the wire's contract.
 *
 * A second seed, a bot's own rules as its subscription (#4642 slice 9b), runs the same loop on its
 * own marker — `seedOwnRules` below.
 */

export const SEEDED_FROM_ENV_ROSTER = "SKYNET_PLAYBOOKS";

/** The second seed: a bot subscribed to the playbook that IS its persona's own rules (#4651 9b). */
export const SEEDED_FROM_OWN_RULES = "own-rules";

export interface SeedMarker {
  /** Where the seed came from — the bots app's env roster, or the bot's own rules. Each seed keeps
   *  its markers in its own file, so one seed's marker never stops the other. */
  readonly seededFrom: string;
  /** ISO-8601. */
  readonly at: string;
  /** The playbooks this seed added (may be empty when the owner already held them all). */
  readonly playbookIds: readonly string[];
}

export type SeedMarkers = Readonly<Record<string, SeedMarker>>;

export const EMPTY_SEED_MARKERS: SeedMarkers = {};

export interface SeedResult {
  readonly state: SubscriptionsState;
  readonly markers: SeedMarkers;
  /** The accounts this call marked — empty means nothing to write. */
  readonly seeded: readonly string[];
  /** Those of them that gained a subscription. The rest already held everything the seed would add
   *  and are only marked; when this is empty `state` is the very object passed in, so a caller
   *  writes the marker alone and never rewrites the subscriptions file for nothing. */
  readonly added: readonly string[];
}

/** One account's seed: the playbooks to add if it does not hold them yet, in order. */
interface AccountSeed {
  readonly accountId: string;
  readonly entries: readonly HouseRosterEntry[];
}

/**
 * The one loop both seeds run. Per account with no marker: add (uncapped, enabled) each entry it
 * does not already hold, placed by `place`, and mark the account — even when nothing was added,
 * because the owner already held it all (then its subscriptions are not even copied). An account
 * already marked is never touched again.
 */
function seedAccounts(
  state: SubscriptionsState,
  markers: SeedMarkers,
  seeds: readonly AccountSeed[],
  seededFrom: string,
  at: Date,
  place: (
    added: readonly PlaybookSubscription[],
    existing: readonly PlaybookSubscription[],
  ) => readonly PlaybookSubscription[],
): SeedResult {
  const stamp = at.toISOString();
  const nextState: Record<string, readonly PlaybookSubscription[]> = { ...state };
  const nextMarkers: Record<string, SeedMarker> = { ...markers };
  const seeded: string[] = [];
  const gained: string[] = [];
  for (const { accountId, entries } of seeds) {
    if (nextMarkers[accountId]) continue;
    const existing = state[accountId] ?? [];
    const held = new Set(existing.map((s) => s.playbookId));
    const added: PlaybookSubscription[] = [];
    for (const entry of entries) {
      if (held.has(entry.playbookId)) continue;
      held.add(entry.playbookId);
      added.push({
        accountId,
        playbookId: entry.playbookId,
        mode: entry.mode,
        enabled: true,
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
    if (added.length > 0) {
      nextState[accountId] = place(added, existing);
      gained.push(accountId);
    }
    nextMarkers[accountId] = {
      seededFrom,
      at: stamp,
      playbookIds: added.map((s) => s.playbookId),
    };
    seeded.push(accountId);
  }
  return {
    state: gained.length > 0 ? nextState : state,
    markers: seeded.length > 0 ? nextMarkers : markers,
    seeded,
    added: gained,
  };
}

/** Pure: what seeding `report` onto `state` produces. Idempotent by construction. */
export function seedFromHouseRoster(
  state: SubscriptionsState,
  markers: SeedMarkers,
  report: HouseRosterReport,
  at: Date,
): SeedResult {
  if (report.roster.length === 0) return { state, markers, seeded: [], added: [] };
  const seeds = report.accounts.map((accountId) => ({ accountId, entries: report.roster }));
  return seedAccounts(state, markers, seeds, SEEDED_FROM_ENV_ROSTER, at, (added, existing) => [
    ...added,
    ...existing,
  ]);
}

/** What the own-rules seed reads off a playbook: its id, and whose persona's rules it is. */
export interface OwnRulesPlaybook {
  readonly id: string;
  readonly rulesOf?: string;
}

/**
 * SEEDING A BOT'S OWN RULES AS ITS SUBSCRIPTION (#4642 slice 9b, design on #4651) — the cutover.
 *
 * A playbook with `rulesOf` IS a persona's own rules (`SAURON` → `"sauron"`). Subscribed on that
 * persona's own account, it changes nothing he trades, only labels his orders with the playbook's
 * id. The label is what lets a capital cap or symbol filter set in the Store's Edit act on his buys.
 * Since slice 10 only a subscribed playbook opens a position, so this subscription is also what lets
 * his rules buy at all: paused or unsubscribed, they only sell. So each reported bot whose persona has such a
 * playbook is subscribed to it once — standard, uncapped, enabled, no symbol filter: the shape that
 * changes only the label (`docs/BOTS-SAURON.md`'s 2026-10-06 correction row). `accounts` is the
 * bots app's own list of the bots it runs (persona ids), so a human account is never a candidate.
 *
 * - **Every other subscription is untouched.** The new entry is appended, where a Store subscribe
 *   puts it; nothing on the account is reordered, re-moded or re-allocated.
 * - **An account that already holds the playbook is marked, not changed** — subscribed by hand,
 *   paused, capped or seeded from the env roster, the owner's entry wins.
 * - **Once only, on its own marker.** The marker (`SEEDED_FROM_OWN_RULES`) lives apart from the
 *   env roster's, so a bot already seeded from `SKYNET_PLAYBOOKS` is still seeded here once, and an
 *   owner who later unsubscribes or pauses it stays that way.
 * - **A bot with no own-rules playbook gets no marker**, so it is still seeded if one is added.
 */
export function seedOwnRules(
  state: SubscriptionsState,
  markers: SeedMarkers,
  accounts: readonly string[],
  playbooks: readonly OwnRulesPlaybook[],
  at: Date,
): SeedResult {
  const seeds = accounts.flatMap((accountId): AccountSeed[] => {
    const own = playbooks.filter((p) => p.rulesOf === accountId);
    if (own.length === 0) return [];
    return [{ accountId, entries: own.map((p) => ({ playbookId: p.id, mode: "standard" })) }];
  });
  return seedAccounts(state, markers, seeds, SEEDED_FROM_OWN_RULES, at, (added, existing) => [
    ...existing,
    ...added,
  ]);
}

function parseMarker(raw: unknown): SeedMarker | null {
  if (!isRecord(raw)) return null;
  const { seededFrom, at, playbookIds } = raw;
  if (typeof seededFrom !== "string" || seededFrom.length === 0) return null;
  if (typeof at !== "string") return null;
  if (!(Array.isArray(playbookIds) && playbookIds.every((id) => typeof id === "string"))) {
    return null;
  }
  return { seededFrom, at, playbookIds };
}

/** Total parse: a torn or foreign file is `null`, a malformed entry is dropped. */
export function parseSeedMarkers(raw: unknown): SeedMarkers | null {
  if (!isRecord(raw)) return null;
  const markers: Record<string, SeedMarker> = {};
  for (const [accountId, value] of Object.entries(raw)) {
    const marker = parseMarker(value);
    if (marker) markers[accountId] = marker;
  }
  return markers;
}
