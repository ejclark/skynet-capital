/**
 * The Settings page's client model (#738 phase 5c) — mirrors the settings API. The client
 * renders the server's answers verbatim: identity comes from the session on the server side,
 * refusals are the account service's own sentences, and the typed remove-confirmation is
 * verified by the service — the client's arming of the button is a courtesy, never the gate.
 */

export interface OwnedAccount {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly hostConfigured: boolean;
  readonly profile: { readonly displayName: string; readonly timezone?: string } | null;
}

export interface TimezoneChoice {
  readonly value: string;
  readonly label: string;
}

export interface SettingsIndex {
  readonly authConfigured: boolean;
  readonly adminWired: boolean;
  readonly accounts: readonly OwnedAccount[];
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

async function postSettings<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(detail.error ?? `POST ${url} → ${res.status}`);
  }
  return (await res.json()) as T;
}

export const saveProfile = (input: {
  readonly id: string;
  readonly displayName?: string;
  readonly timezone?: string;
}): Promise<SettingsWriteResult> => postSettings("/api/settings/profile", input);

export const removeAccountRequest = (input: {
  readonly id: string;
  readonly confirmName: string;
}): Promise<SettingsWriteResult> => postSettings("/api/settings/remove", input);
