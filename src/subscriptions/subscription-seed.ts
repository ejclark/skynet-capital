import type { HouseRosterReport } from "../autonomous/house-roster-wire.js";
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
 */

export const SEEDED_FROM_ENV_ROSTER = "SKYNET_PLAYBOOKS";

export interface SeedMarker {
  /** Where the seed came from — today only the bots app's env roster. */
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
  /** The accounts this call seeded — empty means nothing to write. */
  readonly seeded: readonly string[];
}

/** Pure: what seeding `report` onto `state` produces. Idempotent by construction. */
export function seedFromHouseRoster(
  state: SubscriptionsState,
  markers: SeedMarkers,
  report: HouseRosterReport,
  at: Date,
): SeedResult {
  if (report.roster.length === 0) return { state, markers, seeded: [] };
  const stamp = at.toISOString();
  const nextState: Record<string, readonly PlaybookSubscription[]> = { ...state };
  const nextMarkers: Record<string, SeedMarker> = { ...markers };
  const seeded: string[] = [];
  for (const accountId of report.accounts) {
    if (markers[accountId]) continue;
    const existing = state[accountId] ?? [];
    const held = new Set(existing.map((s) => s.playbookId));
    const added: PlaybookSubscription[] = [];
    for (const entry of report.roster) {
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
    if (added.length > 0) nextState[accountId] = [...added, ...existing];
    nextMarkers[accountId] = {
      seededFrom: SEEDED_FROM_ENV_ROSTER,
      at: stamp,
      playbookIds: added.map((s) => s.playbookId),
    };
    seeded.push(accountId);
  }
  return seeded.length > 0
    ? { state: nextState, markers: nextMarkers, seeded }
    : { state, markers, seeded };
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
