/**
 * AUTHORED PLAYS, CLIENT SIDE (#5457 slice 1) — a member's own draft playbooks on R&D → Playbooks.
 * The wire shape is the server's `AuthoredPlayView` verbatim; the form's types and the one function
 * that judges them (`specFromForm`) are the server's too, imported, so the screen reads a value as
 * allowed or refused by the very code the save runs.
 *
 * Route contract (`src/server/authored-plays-api-routes.ts`):
 *   GET  /api/authored-plays         → { plays: AuthoredPlayView[] }
 *   POST /api/authored-plays/save    → { ok: true, play } | { ok: false, refusals } | { ok: false, error }
 *   POST /api/authored-plays/delete  → { ok }
 * No account or member param: identity comes from the session alone.
 */
import type { AuthoredPlayForm, FormRefusal } from "../../../src/playbooks/authored-play-form";
import type { AuthoredPlayView } from "../../../src/server/authored-plays-api-routes";
import { postJson } from "./post";

export type { AuthoredPlayView };

export const authoredPlaysKey = ["authored-plays"] as const;

export async function fetchAuthoredPlays(): Promise<readonly AuthoredPlayView[]> {
  const res = await fetch("/api/authored-plays", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`authored-plays ${res.status}`);
  const body = (await res.json()) as { readonly plays: readonly AuthoredPlayView[] };
  return body.plays;
}

export type SaveDraftResult =
  | { readonly ok: true; readonly play: AuthoredPlayView }
  | { readonly ok: false; readonly refusals?: readonly FormRefusal[]; readonly error?: string };

export const saveDraftRequest = (
  form: AuthoredPlayForm,
  replaceId?: string,
): Promise<SaveDraftResult> =>
  postJson("/api/authored-plays/save", { form, ...(replaceId ? { replaceId } : {}) });

export const discardDraftRequest = (id: string): Promise<{ readonly ok: boolean }> =>
  postJson("/api/authored-plays/delete", { id });
