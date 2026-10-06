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
 * account that was never seeded. A pass that only marks — every account already held what the
 * seed would add — writes the marker alone and leaves the subscriptions file byte for byte.
 *
 * Unattended, so it never writes over a file it could not read whole (`loadIfReadable`): an
 * unreadable subscriptions file would be replaced by the seed alone, one with a record the parser
 * dropped would lose that record for good, and an unreadable marker file would re-seed what an
 * owner unsubscribed. Each skips the seed, reported, until the file reads whole again. Every read and
 * write is synchronous, so nothing — a Store click, the other seed, a second poll — lands between
 * this read and its write.
 *
 * Each seed's markers sit in their own file beside the subscriptions file (same directory, so on
 * the dashboard's `/data` volume wherever `SKYNET_SUBSCRIPTIONS_FILE` points) — derived, never a
 * new env var — so one seed's marker on an account never stops the other.
 */
/** What one seed call wrote — both empty on almost every poll. */
export interface SeedWrite {
  /** Accounts that gained a subscription (and were marked). */
  readonly added: readonly string[];
  /** Accounts only marked: they already held everything this seed would add. */
  readonly markedOnly: readonly string[];
}

const NOTHING: SeedWrite = { added: [], markedOnly: [] };

export interface SubscriptionSeeder {
  /** Seed what the report says. */
  seed(report: HouseRosterReport, at?: Date): SeedWrite;
}

/** The own-rules seed: `accounts` are the bots the bots app reports running (persona ids). */
export interface OwnRulesSeeder {
  seed(accounts: readonly string[], at?: Date): SeedWrite;
}

export function seedMarkersPathFrom(subscriptionsPath: string): string {
  return join(dirname(subscriptionsPath), "playbook-subscription-seeds.json");
}

export function ownRulesSeedMarkersPathFrom(subscriptionsPath: string): string {
  return join(dirname(subscriptionsPath), "playbook-own-rules-seeds.json");
}

/** Read markers, skip when settled, read subscriptions, plan purely, write subscriptions (only when
 *  an account gained one) then markers. `pending` is the cheap pre-check that spares the
 *  subscriptions read on most polls. */
function markedSeed<Input>(
  subscriptions: SubscriptionStore,
  markersPath: string,
  pending: (markers: SeedMarkers, input: Input) => boolean,
  plan: (state: SubscriptionsState, markers: SeedMarkers, input: Input, at: Date) => SeedResult,
  onReadError?: (message: string) => void,
): (input: Input, at?: Date) => SeedWrite {
  const markers = new JsonFileStore<SeedMarkers>({
    path: markersPath,
    parse: (raw) => parseSeedMarkers(raw) ?? undefined,
    empty: EMPTY_SEED_MARKERS,
    label: "subscription seed markers",
    ...(onReadError ? { onReadError } : {}),
  });
  return (input, at = new Date()) => {
    const current = markers.loadIfReadable();
    if (!(current && pending(current, input))) return NOTHING;
    const state = subscriptions.loadIfReadable();
    if (!state) return NOTHING;
    const result = plan(state, current, input, at);
    if (result.seeded.length === 0) return NOTHING;
    if (result.added.length > 0) subscriptions.replace(result.state);
    markers.write(result.markers);
    return {
      added: result.added,
      markedOnly: result.seeded.filter((id) => !result.added.includes(id)),
    };
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
    const bots = report.gate?.map((v) => v.id) ?? [];
    return [
      ...logLines(
        report.houseRoster ? roster.seed(report.houseRoster, at) : NOTHING,
        "seeded from the bots app's SKYNET_PLAYBOOKS roster (uncapped)",
        "marked as seeded from SKYNET_PLAYBOOKS, nothing added (already held)",
      ),
      ...logLines(
        bots.length > 0 ? ownRules.seed(bots, at) : NOTHING,
        "seeded each bot's own-rules playbook (standard, uncapped)",
        "marked for the own-rules seed, nothing added (already held)",
      ),
    ];
  };
}

/** One line per kind of write, so a mark-only pass never reads as a seed. */
function logLines(write: SeedWrite, addedLabel: string, markedLabel: string): string[] {
  return [
    ...(write.added.length > 0 ? [`[subscriptions] ${addedLabel}: ${write.added.join(", ")}`] : []),
    ...(write.markedOnly.length > 0
      ? [`[subscriptions] ${markedLabel}: ${write.markedOnly.join(", ")}`]
      : []),
  ];
}
