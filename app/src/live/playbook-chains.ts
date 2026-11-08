/**
 * MEMBERS' OWN CHAINS, CLIENT SIDE (#6959 slice 3b) — the chains a member draws on R&D → Playbooks.
 * The wire shape is the server's `MemberChainView` verbatim; the form's types and the one function
 * that judges them (`chainFromForm`) are the server's too, imported, so the screen reads a pick as
 * allowed or refused by the very code the save runs.
 *
 * Route contract (`src/server/member-chains-api-routes.ts`):
 *   GET  /api/playbook-chains         → { chains: MemberChainView[] }
 *   POST /api/playbook-chains/save    → { ok: true, chain } | { ok: false, refusals } | { ok: false, error }
 *   POST /api/playbook-chains/delete  → { ok } | { ok: false, error }
 * No member param: identity comes from the session alone. A saved chain is shadow only — nothing
 * here places an order.
 */
import type { ChainForm, ChainRefusal } from "../../../src/playbooks/chain-form";
import type { MemberChainView } from "../../../src/server/member-chains-api-routes";
import { postJson } from "./post";

export type { MemberChainView };

export const playbookChainsKey = ["playbook-chains"] as const;

export async function fetchPlaybookChains(): Promise<readonly MemberChainView[]> {
  const res = await fetch("/api/playbook-chains", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`playbook-chains ${res.status}`);
  const body = (await res.json()) as { readonly chains: readonly MemberChainView[] };
  return body.chains ?? [];
}

export type SaveChainResult =
  | { readonly ok: true; readonly chain: MemberChainView }
  | { readonly ok: false; readonly refusals?: readonly ChainRefusal[]; readonly error?: string };

export const saveChainRequest = (form: ChainForm, replaceId?: string): Promise<SaveChainResult> =>
  postJson("/api/playbook-chains/save", { form, ...(replaceId ? { replaceId } : {}) });

export const discardChainRequest = (
  id: string,
): Promise<{ readonly ok: boolean; readonly error?: string }> =>
  postJson("/api/playbook-chains/delete", { id });
