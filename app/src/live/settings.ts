/**
 * The Settings page's client model (#738 phase 5c) — mirrors the settings API. The client
 * renders the server's answers verbatim: identity comes from the session on the server side,
 * refusals are the account service's own sentences, and the typed remove-confirmation is
 * verified by the service — the client's arming of the button is a courtesy, never the gate.
 */

import { postJson } from "./post";

export interface OwnedAccount {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly hostConfigured: boolean;
  readonly profile: { readonly displayName: string; readonly timezone?: string } | null;
  /** The own-bot switch's state — present exactly when this is your bot and controls are wired. */
  readonly suspended?: boolean;
  /** The bot's own settings and their change log (#4535 slice 3b) — same presence as `suspended`. */
  readonly settings?: BotSettings;
}

/** Who made a change, as the server tells it — never an email: the viewer, another owner of the
 *  bot, the one-time copy of the bots app's own setting (#4535 slice 4c), or the app moving a
 *  conviction pointer by its own rule (#5482). */
export type ChangeAuthor =
  | "you"
  | "another owner"
  | "the operations setting, copied once"
  | "the app, on its own";

/** One recorded change to a bot's settings; `null` = not set here, the operations setting stands —
 *  or, on a Store line (`subscription:<playbookId>`), not subscribed. A subscription is a one-line
 *  summary string the server wrote (#4535 slice 3c). */
export interface BotSettingChange {
  readonly at: string;
  readonly setting: string;
  readonly before: boolean | number | string | null;
  readonly after: boolean | number | string | null;
  readonly proposedBy: ChangeAuthor;
  readonly approvedBy: ChangeAuthor;
}

export interface BotSettings {
  /** Present exactly when the bot has a hardcore build; `null` = not set here. */
  readonly hardcore?: boolean | null;
  /** Present exactly when this bot runs the forced daily pick; `null` = not set here. */
  readonly betaPicks?: number | null;
  /** Present exactly when this bot runs the forced daily pick; `null` = not set here. */
  readonly betaStage?: boolean | null;
  readonly maxBetaPicks: number;
  readonly changes: readonly BotSettingChange[];
}

export interface TimezoneChoice {
  readonly value: string;
  readonly label: string;
}

export interface SettingsIndex {
  readonly authConfigured: boolean;
  readonly adminWired: boolean;
  readonly accounts: readonly OwnedAccount[];
  /** True while the fleet-wide stand-down holds — every bot is halted regardless of its switch. */
  readonly fleetSuspended: boolean;
  readonly timezones: readonly TimezoneChoice[];
}

export type SettingsWriteResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

export async function fetchSettings(): Promise<SettingsIndex> {
  const res = await fetch("/api/settings", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`settings ${res.status}`);
  return (await res.json()) as SettingsIndex;
}

/**
 * Does the session own this account? The index only ever lists the session's OWN accounts, so
 * membership in it IS the ownership answer — the server's, not a client guess. Desk-scoped chrome
 * asks before offering an owner-only destination; an unloaded (or unauthed) index answers `false`,
 * because hiding a link costs a click and showing a wrong one moves you somewhere you didn't ask
 * for (#785).
 */
export function ownsAccount(settings: SettingsIndex | undefined, id: string): boolean {
  return settings?.accounts.some((account) => account.id === id) === true;
}

export const saveProfile = (input: {
  readonly id: string;
  readonly displayName?: string;
  readonly timezone?: string;
}): Promise<SettingsWriteResult> => postJson("/api/settings/profile", input);

export const removeAccountRequest = (input: {
  readonly id: string;
  readonly confirmName: string;
}): Promise<SettingsWriteResult> => postJson("/api/settings/remove", input);

/** Replace, never reveal: keys are pasted and sent once; existing secrets are never fetched,
 *  displayed, or echoed — the server verifies the NEW key against Alpaca before storing. */
export const rotateCredentialsRequest = (input: {
  readonly id: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}): Promise<SettingsWriteResult> => postJson("/api/settings/rotate", input);

/** Flip your OWN bot's switch — ownership is the server's check, same tier as renaming it. */
export const botControlRequest = (input: {
  readonly id: string;
  readonly action: "suspend" | "resume";
}): Promise<{ readonly ok: true; readonly suspended: boolean } | { ok: false; error: string }> =>
  postJson("/api/settings/bot-control", input);

/** Change your OWN bot's hardcore build, forced-pick count or after-close staging; `null` hands it
 *  back to the operations setting. Ownership is the server's check, same tier as the switch above. */
export const botSettingsRequest = (input: {
  readonly id: string;
  readonly hardcore?: boolean | null;
  readonly betaPicks?: number | null;
  readonly betaStage?: boolean | null;
}): Promise<{ readonly ok: true } | { ok: false; error: string }> =>
  postJson("/api/settings/bot-settings", input);
