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
