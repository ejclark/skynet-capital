import type { BotControls } from "../autonomous/bot-controls.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE SETTINGS CHANGE LOG (#4535 slice 3b, the plan's EARS criterion 4): every change to what a bot
 * does is recorded with who proposed it, who approved it, the value before and the value after.
 *
 * Ownership is the only gate (Eric, #928 — nobody changes an account that is not theirs; there is no
 * approval step), so today the owner who makes a change both proposes and approves it and the two
 * fields hold the same person. They are kept apart on purpose: the log's shape is the criterion's,
 * so an approval step added later changes who fills the second field, not the file.
 *
 * `before` / `after` are the STORED values; `null` means nothing was stored, so the bots app's own
 * setting stands (the env fallback each setting documents in `bot-controls.ts`). A Store write
 * (slice 3c, `subscription-changes.ts`) records a subscription as a one-line summary string, and
 * there `null` means not subscribed.
 *
 * Who is the signed-in email, the same tier as the controls file's own `updatedBy`. It is never sent
 * to the browser: the settings API answers "you" or "another owner" (`settings-api-routes.ts`) — or,
 * for a one-time copy of the bots app's own setting (`env-settings-seed.ts`), says so.
 *
 * Plain JSON beside bot-controls.json (no new env var, no `fly.toml` change — envelope-protected),
 * the `council-store.ts` posture. Newest last; each account keeps its latest `MAX_CHANGES_PER_ACCOUNT`.
 */

export type SettingValue = boolean | number | string | null;

export interface SettingsChange {
  readonly at: string;
  /** `suspended`, `hardcore`, `betaPicks`, `betaStage` (the controls state), or a Store write's
   *  `subscription:<playbookId>` / `allocation:<strategy>` (slice 3c), or which conviction view
   *  steers a pair, `conviction:<playbookId>` (#5482, `conviction-pointer-changes.ts`). */
  readonly setting: string;
  readonly before: SettingValue;
  readonly after: SettingValue;
  readonly proposedBy: string;
  readonly approvedBy: string;
}

export interface SettingsChangeLogState {
  readonly accounts: Readonly<Record<string, readonly SettingsChange[]>>;
}

export const EMPTY_SETTINGS_CHANGES: SettingsChangeLogState = { accounts: {} };

/** A few months of an owner's clicks; older lines drop off the front. */
export const MAX_CHANGES_PER_ACCOUNT = 200;

const MAX_FIELD_LENGTH = 200;

/** The longest text value a line keeps — a longer one is dropped on read, so writers trim to it. */
export const MAX_SETTING_TEXT = MAX_FIELD_LENGTH;

const boundedText = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_FIELD_LENGTH;

const isSettingValue = (value: unknown): value is SettingValue =>
  value === null ||
  typeof value === "boolean" ||
  boundedText(value) ||
  (typeof value === "number" && Number.isFinite(value));

function parseChange(raw: unknown): SettingsChange | null {
  if (!isRecord(raw)) return null;
  const { at, setting, before, after, proposedBy, approvedBy } = raw;
  if (!(boundedText(at) && boundedText(setting))) return null;
  if (!(boundedText(proposedBy) && boundedText(approvedBy))) return null;
  if (!(isSettingValue(before) && isSettingValue(after))) return null;
  return { at, setting, before, after, proposedBy, approvedBy };
}

/** Total, defensive parse — a torn file degrades to empty, never a throw (`parseCouncilState`). */
export function parseSettingsChangeLog(raw: unknown): SettingsChangeLogState | null {
  if (!(isRecord(raw) && isRecord(raw.accounts))) return null;
  const accounts: Record<string, SettingsChange[]> = {};
  for (const [id, list] of Object.entries(raw.accounts)) {
    if (!Array.isArray(list)) continue;
    const changes = list.map(parseChange).filter((c): c is SettingsChange => c !== null);
    if (changes.length > 0) accounts[id] = changes;
  }
  return { accounts };
}

export class SettingsChangeLog {
  private readonly file: JsonFileStore<SettingsChangeLogState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseSettingsChangeLog(raw) ?? undefined,
      empty: EMPTY_SETTINGS_CHANGES,
      label: "settings-changes",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** False when the file is there but did not read whole: an unattended writer (the env-settings
   *  seed) skips its write then, since `record` would write the part it read over the rest. */
  readable(): boolean {
    return this.file.loadIfReadable() !== undefined;
  }

  /** One account's changes, newest first, at most `limit`. */
  list(accountId: string, limit = MAX_CHANGES_PER_ACCOUNT): SettingsChange[] {
    const changes = this.file.load().accounts[accountId] ?? [];
    return changes.slice(-limit).reverse();
  }

  /** Append changes to one account. A change whose before equals its after is not a change and
   *  is dropped, so a repeated click records nothing. */
  record(accountId: string, changes: readonly SettingsChange[]): void {
    const real = changes.filter((c) => c.before !== c.after);
    if (real.length === 0) return;
    const state = this.file.load();
    const next = [...(state.accounts[accountId] ?? []), ...real].slice(-MAX_CHANGES_PER_ACCOUNT);
    this.file.write({ accounts: { ...state.accounts, [accountId]: next } });
  }
}

const LOGGED_SETTINGS = ["suspended", "hardcore", "betaPicks", "betaStage"] as const;

/** One log line per setting that moved between two stored entries. */
export function controlsChanges(
  prev: BotControls,
  next: BotControls,
  editor: string,
  at: Date,
): SettingsChange[] {
  // Suspend has no fallback to hand back to: never set IS on, so it compares as false, and resuming
  // a bot never suspended here records nothing (code review of #4535 slice 3b).
  const stored = (c: BotControls, key: (typeof LOGGED_SETTINGS)[number]): SettingValue =>
    key === "suspended" ? c.suspended === true : (c[key] ?? null);
  return LOGGED_SETTINGS.filter((key) => stored(prev, key) !== stored(next, key)).map((key) => ({
    at: at.toISOString(),
    setting: key,
    before: stored(prev, key),
    after: stored(next, key),
    proposedBy: editor,
    approvedBy: editor,
  }));
}

/**
 * Record what moved, after the change was saved — both or neither: a log that can't be written runs
 * `undo` (the saved change put back) and throws, so no change is ever applied unrecorded.
 */
export function recordControlsChange(
  log: SettingsChangeLog | undefined,
  botId: string,
  changes: readonly SettingsChange[],
  undo: () => void,
): void {
  try {
    log?.record(botId, changes);
  } catch (err) {
    undo();
    throw err;
  }
}

/** A sibling of the already-pinned controls file — the move `councilFilePathFrom` makes. */
export function settingsChangeLogPathFrom(controlsFilePath: string): string {
  return siblingPath(controlsFilePath, "settings-changes.json");
}

export function createSettingsChangeLog(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): SettingsChangeLog {
  return new SettingsChangeLog(
    settingsChangeLogPathFrom(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json"),
    onReadError,
  );
}
