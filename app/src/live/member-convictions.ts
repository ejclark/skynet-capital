/**
 * A MEMBER'S CONVICTIONS, CLIENT SIDE (#5482 slice 6b) — the views a member states on R&D →
 * Playbooks. The wire shapes are the server's, imported as types, so the screen and the routes can
 * never disagree on what a draft, a card or a problem is.
 *
 * Route contract (`src/server/member-convictions-api-routes.ts`):
 *   GET  /api/convictions/mine    → { label, note, convictions, steerable }
 *   POST /api/convictions/draft   → { ok: true, conviction, card, note } | { ok: false, problems }
 *   POST /api/convictions/save    → the same, and the record is kept   (body: { draft, replaceId? })
 *   POST /api/convictions/delete  → { ok } | { ok: false, error }        (body: { id })
 * No member param: identity comes from the session alone. `/draft` writes nothing; it is the
 * preview, and `/save` judges the same draft again before it keeps it.
 */
import type { DraftCard } from "../../../src/playbooks/conviction-draft";
import type { ConvictionDraftInput } from "../../../src/playbooks/conviction-parse";
import type { Conviction } from "../../../src/playbooks/conviction-record";
import type {
  MemberConvictionView,
  SteerablePairView,
} from "../../../src/server/member-convictions-api-routes";
import { postJson } from "./post";

export type { ConvictionDraftInput, DraftCard, MemberConvictionView, SteerablePairView };

export interface MyConvictions {
  readonly note: string;
  readonly convictions: readonly MemberConvictionView[];
  readonly steerable: readonly SteerablePairView[];
}

export const myConvictionsKey = ["member-convictions"] as const;

export async function fetchMyConvictions(): Promise<MyConvictions> {
  const res = await fetch("/api/convictions/mine", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`convictions ${res.status}`);
  const body = (await res.json()) as Partial<MyConvictions>;
  return {
    note: body.note ?? "",
    convictions: body.convictions ?? [],
    steerable: body.steerable ?? [],
  };
}

export type DraftAnswer =
  | {
      readonly ok: true;
      readonly conviction: Conviction;
      readonly card: DraftCard;
      readonly saved: boolean;
      readonly note: string;
    }
  | { readonly ok: false; readonly problems?: readonly string[]; readonly error?: string };

const body = (draft: ConvictionDraftInput, replaceId?: string) => ({
  draft,
  ...(replaceId ? { replaceId } : {}),
});

/** What the view would change, judged by the server; nothing is kept. */
export const previewConvictionRequest = (
  draft: ConvictionDraftInput,
  replaceId?: string,
): Promise<DraftAnswer> => postJson("/api/convictions/draft", body(draft, replaceId));

/** Keep the view as a draft (one that steers nothing yet), or replace the member's own `replaceId`. */
export const saveConvictionRequest = (
  draft: ConvictionDraftInput,
  replaceId?: string,
): Promise<DraftAnswer> => postJson("/api/convictions/save", body(draft, replaceId));

export const deleteConvictionRequest = (
  id: string,
): Promise<{ readonly ok: boolean; readonly error?: string }> =>
  postJson("/api/convictions/delete", { id });
