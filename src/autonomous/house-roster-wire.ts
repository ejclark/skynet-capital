import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";
import { isRecord } from "../storage/parse-guards.js";

/**
 * THE HOUSE-ROSTER REPORT — the `bots` process telling the app which house-wide playbooks its
 * `SKYNET_PLAYBOOKS` env roster enables, and for which bot accounts (#4535 slice 1b).
 *
 * Why it has to travel: `SKYNET_PLAYBOOKS` is a secret on the bots app only, and the subscription
 * store lives on the dashboard's volume. The dashboard seeds each house bot's own subscriptions
 * from this report (`subscription-seed.ts`), which is what lets the env roster retire later in
 * the plan without any bot's roster changing.
 *
 * Rides the `/controls` poll as a header, the same additive shape as the persona gate header
 * (`controls-poll-wire.ts`, #666 / #3595) and for the same reasons: no new route, no new
 * credential, and expand/contract across the app/bots deploy split. A bots build that predates
 * this omits the header; an app that predates it ignores it. Anything malformed or oversized reads
 * as "not reported", never as a partial roster, because a partial roster would seed a bot with
 * less than it trades today.
 *
 * Two additions for #4535 slice 4c, which retires the env fallback:
 *
 * - **The accounts travel on their own.** An empty env roster still sends the report, because the
 *   app takes the forced daily pick's host from `accounts[0]` (`bot-settings-route.ts`) — with no
 *   roster to seed, the empty list seeds nothing (`seedFromHouseRoster`).
 * - **The bots app's other behaviour settings ride along** (`settings`): the hardcore ids, the
 *   forced-pick count, after-close staging and the shadow scout's names, so the app can copy each
 *   into the bot's stored settings once (`env-settings-seed.ts`) before the bots stop reading the
 *   env. Malformed, it is dropped on its own; the accounts and roster still read.
 */

export const CONTROLS_BOT_ROSTER_HEADER = "x-skynet-bots-roster";

/** One house-roster entry: just what a seeded subscription needs. */
export interface HouseRosterEntry {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
}

/** The bots app's env behaviour settings, as this boot parsed them — each the value that bot
 *  falls back to while it has no stored setting of its own. */
export interface EnvBotSettings {
  /** `SKYNET_HARDCORE_BOTS`: the ids named that have a hardcore build. */
  readonly hardcore: readonly string[];
  /** `SKYNET_BETA_FORCING`'s pick count, for the forced pick's host (`accounts[0]`). */
  readonly betaPicks: number;
  /** `SKYNET_BETA_FORCING`'s `+stage`, for the same host. */
  readonly betaStage: boolean;
  /** `SKYNET_COND_SCOUT_UNIVERSE`'s names, for the shadow scout's host (`accounts[0]`). */
  readonly condScoutUniverse: readonly string[];
}

export interface HouseRosterReport {
  /** The bot accounts (persona ids) this bots process runs, in its order: the first hosts the
   *  forced daily pick and the shadow scout. */
  readonly accounts: readonly string[];
  /** The env roster in its own order, which `mergeRosters` preserves. May be empty. */
  readonly roster: readonly HouseRosterEntry[];
  /** Absent from a bots build that predates #4535 slice 4c, or when it did not parse. */
  readonly settings?: EnvBotSettings;
}

/** Generous headroom over a handful of bots and playbooks; over either, drop the whole report. */
const MAX_ACCOUNTS = 32;
const MAX_ENTRIES = 64;
/** Far above any count the app stores (`MAX_BETA_PICKS`), so the seed can say it refused one. */
const MAX_REPORTED_PICKS = 1_000;
const MAX_SCOUT_NAMES = 64;
const MAX_SCOUT_NAME_LENGTH = 8;

/** App side: the playbook ids the bots app's own setting runs on `accountId`, in the bots' order —
 *  or `undefined` when no report names the account (none yet, or not a house bot), which is "not
 *  known", never "none". */
export function envNamedFor(
  report: HouseRosterReport | undefined,
  accountId: string,
): string[] | undefined {
  return report?.accounts.includes(accountId)
    ? report.roster.map((entry) => entry.playbookId)
    : undefined;
}

/** Bots side: the report for this boot's wired bots, the env roster's enabled playbooks and the
 *  env's other behaviour settings. */
export function houseRosterReport(
  accounts: readonly string[],
  enabled: readonly EnabledPlaybook[],
  settings?: EnvBotSettings,
): HouseRosterReport {
  return {
    accounts: [...accounts],
    roster: enabled.map((e) => ({ playbookId: e.playbook.id, mode: e.mode })),
    ...(settings ? { settings } : {}),
  };
}

/** Bots side: the header to add to the poll. Empty only when no bot is wired. */
export function controlsPollRosterHeaders(
  report: HouseRosterReport | undefined,
): Record<string, string> {
  if (!report || report.accounts.length === 0) return {};
  const encoded = Buffer.from(JSON.stringify(report), "utf8").toString("base64");
  return { [CONTROLS_BOT_ROSTER_HEADER]: encoded };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isEntry(value: unknown): value is HouseRosterEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.playbookId) &&
    typeof candidate.mode === "string" &&
    PLAYBOOK_MODES.includes(candidate.mode as PlaybookMode)
  );
}

function isBoundedArray(value: unknown, max: number, min = 1): value is unknown[] {
  return Array.isArray(value) && value.length >= min && value.length <= max;
}

const isScoutName = (value: unknown): value is string =>
  isNonEmptyString(value) && value.length <= MAX_SCOUT_NAME_LENGTH;

function parseSettings(raw: unknown): EnvBotSettings | undefined {
  if (!isRecord(raw)) return undefined;
  const { hardcore, betaPicks, betaStage, condScoutUniverse } = raw;
  if (!(isBoundedArray(hardcore, MAX_ACCOUNTS, 0) && hardcore.every(isNonEmptyString))) {
    return undefined;
  }
  const picksOk =
    typeof betaPicks === "number" &&
    Number.isInteger(betaPicks) &&
    betaPicks >= 0 &&
    betaPicks <= MAX_REPORTED_PICKS;
  if (!(picksOk && typeof betaStage === "boolean")) return undefined;
  if (
    !(isBoundedArray(condScoutUniverse, MAX_SCOUT_NAMES, 0) && condScoutUniverse.every(isScoutName))
  ) {
    return undefined;
  }
  return {
    hardcore: [...new Set(hardcore)],
    betaPicks,
    betaStage,
    condScoutUniverse: [...new Set(condScoutUniverse)],
  };
}

/** App side: the report an authenticated poll carried, or `undefined` for anything short of a
 *  clean, complete payload. */
export function parseControlsPollRoster(
  headers: NodeJS.Dict<string | string[]>,
): HouseRosterReport | undefined {
  const raw = headers[CONTROLS_BOT_ROSTER_HEADER];
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
  if (typeof decoded !== "object" || decoded === null) return undefined;
  const { accounts, roster, settings } = decoded as Record<string, unknown>;
  if (!(isBoundedArray(accounts, MAX_ACCOUNTS) && accounts.every(isNonEmptyString))) {
    return undefined;
  }
  if (!(isBoundedArray(roster, MAX_ENTRIES, 0) && roster.every(isEntry))) return undefined;
  const parsedSettings = parseSettings(settings);
  return {
    accounts: [...new Set(accounts)],
    roster: roster.map((e) => ({ playbookId: e.playbookId, mode: e.mode })),
    ...(parsedSettings ? { settings: parsedSettings } : {}),
  };
}
