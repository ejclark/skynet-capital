import { dirname, join } from "node:path";
import type { ControlsPollReport } from "../autonomous/controls-poll-wire.js";
import type { HouseRosterReport } from "../autonomous/house-roster-wire.js";
import { registeredPlaybooks } from "../playbooks/registry.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import {
  EMPTY_SEED_MARKERS,
  type OwnRulesPlaybook,
  parseSeedMarkers,
  type SeedMarkers,
  type SeedResult,
  seedFromHouseRoster,
  seedOwnRules,
} from "../subscriptions/subscription-seed.js";
import type { SubscriptionsState } from "../subscriptions/subscription-state.js";
import {
  createSubscriptionStore,
  type SubscriptionStore,
  subscriptionsFilePath,
} from "./subscription-store.js";

/**
 * The dashboard's half of the subscription seeds (`subscription-seed.ts` holds the rules): on each
 * `/controls` poll, seed any bot account the poll reports that is not yet marked. Two seeds, one
 * write path: #4535 slice 1b's from the bots app's env roster, and #4642 slice 9b's of a bot's own
 * rules (`SAURON` on `sauron`). The common case — every account already marked — is one small
 * read and no write.
 *
 * Write order is the crash-safety: subscriptions first, markers second. A crash between the two
 * leaves the subscriptions seeded and the account unmarked, and the next poll then finds every
 * playbook already held, adds nothing, and writes the marker. The reverse order could mark an
 * account that was never seeded.
 *
 * Unattended, so it never writes over a file it could not read: an unreadable subscriptions file
 * would be replaced by the seed alone, and an unreadable marker file would re-seed what an owner
 * unsubscribed. Either one skips the seed, reported, until the file reads again. Every read and
 * write is synchronous, so nothing — a Store click, the other seed, a second poll — lands between
 * this read and its write.
 *
 * Each seed's markers sit in their own file beside the subscriptions file (same directory, so on
 * the dashboard's `/data` volume wherever `SKYNET_SUBSCRIPTIONS_FILE` points) — derived, never a
 * new env var — so one seed's marker on an account never stops the other.
 */
export interface SubscriptionSeeder {
  /** Seed what the report says; returns the accounts seeded by this call (usually none). */
  seed(report: HouseRosterReport, at?: Date): readonly string[];
}

/** The own-rules seed: `accounts` are the bots the bots app reports running (persona ids). */
export interface OwnRulesSeeder {
  seed(accounts: readonly string[], at?: Date): readonly string[];
}

export function seedMarkersPathFrom(subscriptionsPath: string): string {
  return join(dirname(subscriptionsPath), "playbook-subscription-seeds.json");
}

export function ownRulesSeedMarkersPathFrom(subscriptionsPath: string): string {
  return join(dirname(subscriptionsPath), "playbook-own-rules-seeds.json");
}

/** Read markers, skip when settled, read subscriptions, plan purely, write subscriptions then
 *  markers. `pending` is the cheap pre-check that spares the subscriptions read on most polls. */
function markedSeed<Input>(
  subscriptions: SubscriptionStore,
  markersPath: string,
  pending: (markers: SeedMarkers, input: Input) => boolean,
  plan: (state: SubscriptionsState, markers: SeedMarkers, input: Input, at: Date) => SeedResult,
  onReadError?: (message: string) => void,
): (input: Input, at?: Date) => readonly string[] {
  const markers = new JsonFileStore<SeedMarkers>({
    path: markersPath,
    parse: (raw) => parseSeedMarkers(raw) ?? undefined,
    empty: EMPTY_SEED_MARKERS,
    label: "subscription seed markers",
    ...(onReadError ? { onReadError } : {}),
  });
  return (input, at = new Date()) => {
    const current = markers.loadIfReadable();
    if (!(current && pending(current, input))) return [];
    const state = subscriptions.loadIfReadable();
    if (!state) return [];
    const result = plan(state, current, input, at);
    if (result.seeded.length === 0) return [];
    subscriptions.replace(result.state);
    markers.write(result.markers);
    return result.seeded;
  };
}

export function createSubscriptionSeeder(
  subscriptions: SubscriptionStore,
  markersPath: string,
  onReadError?: (message: string) => void,
): SubscriptionSeeder {
  return {
    seed: markedSeed<HouseRosterReport>(
      subscriptions,
      markersPath,
      (markers, report) => report.accounts.some((id) => !markers[id]),
      seedFromHouseRoster,
      onReadError,
    ),
  };
}

export function createOwnRulesSeeder(
  subscriptions: SubscriptionStore,
  markersPath: string,
  playbooks: readonly OwnRulesPlaybook[],
  onReadError?: (message: string) => void,
): OwnRulesSeeder {
  const owners = new Set(playbooks.flatMap((p) => (p.rulesOf === undefined ? [] : [p.rulesOf])));
  return {
    seed: markedSeed<readonly string[]>(
      subscriptions,
      markersPath,
      (markers, accounts) => accounts.some((id) => owners.has(id) && !markers[id]),
      (state, markers, accounts, at) => seedOwnRules(state, markers, accounts, playbooks, at),
      onReadError,
    ),
  };
}

/**
 * Both seeds for each `/controls` poll, built from the environment (beside
 * `SKYNET_SUBSCRIPTIONS_FILE`, over the registry's playbooks); returns a log line for each seed that
 * wrote. The env roster seeds first, so a `SAURON` named in `SKYNET_PLAYBOOKS` keeps its env mode
 * and the own-rules seed only marks it. The own-rules seed reads the poll's gate verdicts — one per
 * bot the bots app runs, keyed by persona id, the key the runner reads a bot's subscriptions by — so
 * a human account is never a candidate, and no new field crosses the wire.
 */
export function pollSeedsFromEnv(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): (report: ControlsPollReport, at?: Date) => readonly string[] {
  const subscriptions = createSubscriptionStore(env, onReadError);
  const path = subscriptionsFilePath(env);
  const roster = createSubscriptionSeeder(subscriptions, seedMarkersPathFrom(path), onReadError);
  const ownRules = createOwnRulesSeeder(
    subscriptions,
    ownRulesSeedMarkersPathFrom(path),
    registeredPlaybooks(),
    onReadError,
  );
  return (report, at = new Date()) => {
    const lines: string[] = [];
    const fromRoster = report.houseRoster ? roster.seed(report.houseRoster, at) : [];
    if (fromRoster.length > 0) {
      lines.push(
        `[subscriptions] seeded from the bots app's SKYNET_PLAYBOOKS roster (uncapped): ${fromRoster.join(", ")}`,
      );
    }
    const bots = report.gate?.map((v) => v.id) ?? [];
    const fromOwnRules = bots.length > 0 ? ownRules.seed(bots, at) : [];
    if (fromOwnRules.length > 0) {
      lines.push(
        `[subscriptions] seeded each bot's own-rules playbook once (standard, uncapped; an existing one kept as is): ${fromOwnRules.join(", ")}`,
      );
    }
    return lines;
  };
}
