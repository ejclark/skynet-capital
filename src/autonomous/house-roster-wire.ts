import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";

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
 * this omits the header; an app that predates it ignores it. Anything malformed, oversized or
 * empty reads as "not reported", never as a partial roster, because a partial roster would seed
 * a bot with less than it trades today.
 */

export const CONTROLS_BOT_ROSTER_HEADER = "x-skynet-bots-roster";

/** One house-roster entry: just what a seeded subscription needs. */
export interface HouseRosterEntry {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
}

export interface HouseRosterReport {
  /** The bot accounts (persona ids) this bots process runs the house roster on. */
  readonly accounts: readonly string[];
  /** The env roster in its own order, which `mergeRosters` preserves. */
  readonly roster: readonly HouseRosterEntry[];
}

/** Generous headroom over a handful of bots and playbooks; over either, drop the whole report. */
const MAX_ACCOUNTS = 32;
const MAX_ENTRIES = 64;

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

/** Bots side: the report for this boot's wired bots and the env roster's enabled playbooks. */
export function houseRosterReport(
  accounts: readonly string[],
  enabled: readonly EnabledPlaybook[],
): HouseRosterReport {
  return {
    accounts: [...accounts],
    roster: enabled.map((e) => ({ playbookId: e.playbook.id, mode: e.mode })),
  };
}

/** Bots side: the header to add to the poll. Empty when there is nothing to seed. */
export function controlsPollRosterHeaders(
  report: HouseRosterReport | undefined,
): Record<string, string> {
  if (!report || report.accounts.length === 0 || report.roster.length === 0) return {};
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

function isBoundedArray(value: unknown, max: number): value is unknown[] {
  return Array.isArray(value) && value.length > 0 && value.length <= max;
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
  const { accounts, roster } = decoded as Record<string, unknown>;
  if (!(isBoundedArray(accounts, MAX_ACCOUNTS) && accounts.every(isNonEmptyString))) {
    return undefined;
  }
  if (!(isBoundedArray(roster, MAX_ENTRIES) && roster.every(isEntry))) return undefined;
  return {
    accounts: [...new Set(accounts)],
    roster: roster.map((e) => ({ playbookId: e.playbookId, mode: e.mode })),
  };
}
