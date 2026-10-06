import { dirname, join } from "node:path";
import type { HouseRosterReport } from "../autonomous/house-roster-wire.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import {
  EMPTY_SEED_MARKERS,
  parseSeedMarkers,
  type SeedMarkers,
  seedFromHouseRoster,
} from "../subscriptions/subscription-seed.js";
import {
  createSubscriptionStore,
  type SubscriptionStore,
  subscriptionsFilePath,
} from "./subscription-store.js";

/**
 * The dashboard's half of #4535 slice 1b: on each `/controls` poll carrying the bots app's
 * house-roster report, seed any house bot account not yet seeded (`subscription-seed.ts` holds
 * the rules). The common case — every account already marked — is one small read and no write.
 *
 * Write order is the crash-safety: subscriptions first, markers second. A crash between the two
 * leaves the subscriptions seeded and the account unmarked, and the next poll then finds every
 * playbook already held, adds nothing, and writes the marker. The reverse order could mark an
 * account that was never seeded.
 *
 * The marker file sits beside the subscriptions file (same directory, so on the dashboard's
 * `/data` volume wherever `SKYNET_SUBSCRIPTIONS_FILE` points) — derived, never a new env var.
 */
export interface SubscriptionSeeder {
  /** Seed what the report says; returns the accounts seeded by this call (usually none). */
  seed(report: HouseRosterReport, at?: Date): readonly string[];
}

export function seedMarkersPathFrom(subscriptionsPath: string): string {
  return join(dirname(subscriptionsPath), "playbook-subscription-seeds.json");
}

export function createSubscriptionSeeder(
  subscriptions: SubscriptionStore,
  markersPath: string,
  onReadError?: (message: string) => void,
): SubscriptionSeeder {
  const markers = new JsonFileStore<SeedMarkers>({
    path: markersPath,
    parse: (raw) => parseSeedMarkers(raw) ?? undefined,
    empty: EMPTY_SEED_MARKERS,
    label: "subscription seed markers",
    ...(onReadError ? { onReadError } : {}),
  });
  return {
    seed: (report, at = new Date()) => {
      const current = markers.load();
      if (report.accounts.every((id) => current[id])) return [];
      const result = seedFromHouseRoster(subscriptions.load(), current, report, at);
      if (result.seeded.length === 0) return [];
      subscriptions.replace(result.state);
      markers.write(result.markers);
      return result.seeded;
    },
  };
}

/** Build the seeder from the environment, beside `SKYNET_SUBSCRIPTIONS_FILE`. */
export function createSubscriptionSeederFromEnv(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): SubscriptionSeeder {
  return createSubscriptionSeeder(
    createSubscriptionStore(env, onReadError),
    seedMarkersPathFrom(subscriptionsFilePath(env)),
    onReadError,
  );
}
