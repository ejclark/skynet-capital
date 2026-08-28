import { postJson } from "./post";

/**
 * The owner pages' client model (#738 phase 9e) — mirrors `/api/admin/*`. Every surface answers
 * `{owner:false}` to non-owners and the cards simply don't render; the server re-checks the
 * owner on every request, so everything here is rendering, never authority.
 */

export interface GuestEntry {
  readonly email: string;
  readonly addedAt: string;
  readonly addedBy: string;
  readonly joinedAt?: string;
}

export type GuestList =
  | { readonly owner: false }
  | { readonly owner: true; readonly secure: boolean; readonly entries: readonly GuestEntry[] };

export interface LinkedAccount {
  readonly id: string;
  readonly displayName: string;
  readonly kind: "human" | "bot";
  readonly owner?: string;
  readonly source?: string;
  readonly linked: boolean;
}

export type ClaimView =
  | { readonly owner: false }
  | { readonly owner: true; readonly accounts: readonly LinkedAccount[] };

export interface OpsSignal {
  readonly id: string;
  readonly label: string;
  readonly verdict: "ok" | "attention" | "unknown";
  readonly detail: string;
  readonly link?: { readonly href: string; readonly label: string };
}

export type OpsView =
  | { readonly owner: false }
  | {
      readonly owner: true;
      readonly status: {
        readonly generatedAt: string;
        readonly degraded: boolean;
        readonly signals: readonly OpsSignal[];
      };
    };

const getJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return (await res.json()) as T;
};

export const fetchGuestList = (): Promise<GuestList> => getJson("/api/admin/invite");
export const fetchClaims = (): Promise<ClaimView> => getJson("/api/admin/claim");
export const fetchOpsStatus = (): Promise<OpsView> => getJson("/api/admin/ops-status");

export type AdminAnswer = {
  readonly ok: boolean;
  readonly message?: string;
  readonly error?: string;
};

export const inviteRequest = (email: string): Promise<AdminAnswer> =>
  postJson("/api/admin/invite", { email });

export const linkRequest = (input: {
  readonly id: string;
  readonly email?: string;
  readonly unlink?: boolean;
}): Promise<AdminAnswer> => postJson("/api/admin/claim", input);
