import {
  type BotControls,
  type ControlsState,
  MAX_BETA_PICKS,
} from "../autonomous/bot-controls.js";
import type { HouseRosterReport } from "../autonomous/house-roster-wire.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import type { BotControlsStore } from "./bot-controls-store.js";
import { controlsChanges, type SettingsChangeLog } from "./settings-change-log.js";

/**
 * COPYING THE BOTS APP'S OWN SETTINGS INTO EACH BOT'S STORED SETTINGS, ONCE (#4535 slice 4c) — the
 * hardcore build, the forced-pick count and after-close staging. Slice 1b did this for playbooks
 * (`subscription-seed.ts`); these three were never copied, so a bot with no stored value still runs
 * on the bots app's env. Copied first, the env can retire with no bot's behaviour changing.
 *
 * The bots app reports what it parsed on the `/controls` poll (`house-roster-wire.ts`'s
 * `settings`); this writes, per reported account with no marker:
 *
 * - **hardcore = true** for an account the env names that has a hardcore build;
 * - **betaPicks** and **betaStage** for the forced pick's host (`accounts[0]`), when the env arms
 *   them — a count over `MAX_BETA_PICKS` is refused in the log, never stored smaller.
 *
 * Only what the env turned ON is written: once the env retires, nothing stored means off, which is
 * what the env's absence meant all along. **The owner's stored value always wins** — a setting the
 * bot already has is never touched. Each account is marked once, even when nothing was written, so
 * an owner who later hands a setting back ("the operations setting") is never re-seeded.
 *
 * Unattended, so as careful as the subscription seeds: never over a controls, change-log or marker
 * file it could not read whole, the change log records each copy (author `ENV_SEED_AUTHOR`, shown as a copy of the
 * operations setting, never as an owner), and a log that can't be written puts that bot back and
 * leaves it unmarked, so the next poll tries again. Write order — controls, log, marker — means a
 * crash midway re-runs as a no-op: the copied values are already stored, so the owner-wins rule
 * writes nothing and the marker lands.
 */

/** The change log's author for a copy this seed made — `bot-settings-route.ts` shows it in words. */
export const ENV_SEED_AUTHOR = "bots-app-env-seed";

export interface EnvSettingsMarker {
  /** ISO-8601. */
  readonly at: string;
  /** The settings this seed wrote on the account (may be empty). */
  readonly settings: readonly string[];
}

export type EnvSettingsMarkers = Readonly<Record<string, EnvSettingsMarker>>;

export interface EnvSettingsSeed {
  /** The accounts that gained a stored setting: what they held, and what they hold now. */
  readonly written: Readonly<
    Record<string, { readonly before: BotControls; readonly after: BotControls }>
  >;
  readonly markers: EnvSettingsMarkers;
  /** Every account this call marked. */
  readonly seeded: readonly string[];
  /** Log lines for an env value the app could not store. */
  readonly refused: readonly string[];
}

/** Pure: what seeding `report` onto `controls` produces. Idempotent by construction. */
export function seedEnvSettings(
  controls: ControlsState,
  markers: EnvSettingsMarkers,
  report: HouseRosterReport,
  hasHardcoreBuild: (id: string) => boolean,
  at: Date,
): EnvSettingsSeed {
  const { settings } = report;
  const nothing = { written: {}, markers, seeded: [], refused: [] };
  if (!settings) return nothing;
  const host = report.accounts[0];
  const written: Record<string, { before: BotControls; after: BotControls }> = {};
  const nextMarkers: Record<string, EnvSettingsMarker> = { ...markers };
  const seeded: string[] = [];
  const refused: string[] = [];
  for (const id of report.accounts) {
    if (nextMarkers[id]) continue;
    const before = controls.bots[id] ?? {};
    const copy: { hardcore?: boolean; betaPicks?: number; betaStage?: boolean } = {};
    if (before.hardcore === undefined && settings.hardcore.includes(id) && hasHardcoreBuild(id)) {
      copy.hardcore = true;
    }
    if (id === host && before.betaPicks === undefined && settings.betaPicks > 0) {
      if (settings.betaPicks <= MAX_BETA_PICKS) copy.betaPicks = settings.betaPicks;
      else {
        refused.push(
          `[settings] not copied: ${id}'s forced picks per day (${settings.betaPicks}) is over the app's ${MAX_BETA_PICKS} — set it on the bot's Settings card`,
        );
      }
    }
    if (id === host && before.betaStage === undefined && settings.betaStage) copy.betaStage = true;
    const names = Object.keys(copy);
    if (names.length > 0) written[id] = { before, after: { ...before, ...copy } };
    nextMarkers[id] = { at: at.toISOString(), settings: names };
    seeded.push(id);
  }
  return seeded.length > 0 ? { written, markers: nextMarkers, seeded, refused } : nothing;
}

function parseMarker(raw: unknown): EnvSettingsMarker | null {
  if (!(isRecord(raw) && typeof raw.at === "string")) return null;
  const { settings } = raw;
  if (!(Array.isArray(settings) && settings.every((s) => typeof s === "string"))) return null;
  return { at: raw.at, settings };
}

/** Total parse: a torn or foreign file is `null`, a malformed entry is dropped. */
export function parseEnvSettingsMarkers(raw: unknown): EnvSettingsMarkers | null {
  if (!isRecord(raw)) return null;
  const markers: Record<string, EnvSettingsMarker> = {};
  for (const [id, value] of Object.entries(raw)) {
    const marker = parseMarker(value);
    if (marker) markers[id] = marker;
  }
  return markers;
}

/** Beside the controls file it seeds — derived, never a new env var. */
export function envSettingsMarkersPathFrom(controlsFilePath: string): string {
  return siblingPath(controlsFilePath, "bot-controls-env-seeds.json");
}

/** The store-wired seed: one call per `/controls` poll; returns its log lines. */
export function createEnvSettingsSeeder(
  controls: BotControlsStore,
  changes: SettingsChangeLog | undefined,
  markersPath: string,
  hasHardcoreBuild: (id: string) => boolean,
  onReadError?: (message: string) => void,
): (report: HouseRosterReport, at?: Date) => readonly string[] {
  const markers = new JsonFileStore<EnvSettingsMarkers>({
    path: markersPath,
    parse: (raw) => parseEnvSettingsMarkers(raw) ?? undefined,
    empty: {},
    label: "settings seed markers",
    ...(onReadError ? { onReadError } : {}),
  });
  return (report, at = new Date()) => {
    if (!report.settings) return [];
    const current = markers.loadIfReadable();
    if (!(current && report.accounts.some((id) => !current[id]))) return [];
    const state = controls.loadIfReadable();
    if (!state || (changes && !changes.readable())) return [];
    const result = seedEnvSettings(state, current, report, hasHardcoreBuild, at);
    if (result.seeded.length === 0) return result.refused;
    const copied: string[] = [];
    const failed: string[] = [];
    const unmarked = new Set<string>();
    for (const [id, { before, after }] of Object.entries(result.written)) {
      controls.seedBots({ [id]: after });
      try {
        changes?.record(id, controlsChanges(before, after, ENV_SEED_AUTHOR, at));
        copied.push(`${id} (${result.markers[id]?.settings.join(", ")})`);
      } catch (error) {
        // Both or neither, as an owner's write: put the bot back and leave it for the next poll.
        controls.seedBots({ [id]: before });
        unmarked.add(id);
        failed.push(
          `[settings] copying ${id}'s settings failed, put back, retried next poll: ${String(error)}`,
        );
      }
    }
    markers.write(
      Object.fromEntries(Object.entries(result.markers).filter(([id]) => !unmarked.has(id))),
    );
    return [
      ...(copied.length > 0
        ? [
            `[settings] copied the bots app's own settings into each bot's stored settings: ${copied.join("; ")}`,
          ]
        : []),
      ...failed,
      ...result.refused,
    ];
  };
}
