import { postJson } from "./post";

/**
 * Feedback's client model (#738 phase 9d) — mirrors `/api/feedback`. The coach rides the
 * pre-existing `/feedback/coach` endpoint (JSON from birth); it only DRAFTS — a submit through
 * `submitFeedbackRequest` is the one path that files anything. Since the 2026-09-03 handoff the
 * caller is Moneypenny's rail (`moneypenny.ts`), not a form: the member's words go to the coach,
 * its draft files, the same authorities either way. Screenshots are serialized exactly as the
 * legacy form's hidden field was, so the server's `parseImages` stays the single authority on
 * what an attachment may be.
 */

export type FeedbackKind = "bug" | "feature" | "idea";

export interface RecentFiling {
  readonly issueNumber: number;
  readonly title: string;
  readonly kind: FeedbackKind;
  readonly filedAt: string;
  readonly url: string;
  readonly status?: "open" | "needs-info" | "needs-eric" | "next-slice" | "shipped";
}

/** One unclaimed community-track earn (#567), ready for its one-time fanfare — the fill-earned
 *  ladder's exact pattern, one level over: the filed issue IS the proof. */
export interface CommunityCelebration {
  readonly milestoneId: string;
  readonly title: string;
  readonly issueNumber: number;
}

export interface FeedbackIndex {
  readonly enabled: boolean;
  readonly coachEnabled: boolean;
  readonly followupEnabled: boolean;
  /** How many times this member has filed feedback — the already-durable log's own length. */
  readonly feedbackCount: number;
  /** Fresh community-track earns awaiting their one-time celebration. */
  readonly celebrating: readonly CommunityCelebration[];
  readonly recent: readonly RecentFiling[];
}

export async function fetchFeedbackIndex(): Promise<FeedbackIndex> {
  const res = await fetch("/api/feedback", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`feedback ${res.status}`);
  return (await res.json()) as FeedbackIndex;
}

type ClaimAnswer = { readonly ok: true } | { readonly ok: false; readonly error: string };

/** Bank the one-time celebration for the community track — the service filters ids against the
 *  real track, mirroring `/api/learn/claim`. */
export const claimCommunityMilestones = (ack: readonly string[]): Promise<ClaimAnswer> =>
  postJson("/api/feedback/claim", { ack });

export type SubmitAnswer =
  | { readonly ok: true; readonly url: string; readonly number: number }
  | { readonly ok: false; readonly error: string };

export interface AttachedImage {
  readonly name: string;
  readonly type: string;
  readonly dataUrl: string;
}

export const submitFeedbackRequest = (input: {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly spec?: unknown;
  readonly images?: readonly AttachedImage[];
}): Promise<SubmitAnswer> =>
  postJson("/api/feedback", {
    ...input,
    ...(input.images?.length ? { images: JSON.stringify(input.images) } : { images: undefined }),
  });

export const followupRequest = (input: {
  readonly issueNumber: number;
  readonly details: string;
}): Promise<{ readonly ok: boolean; readonly error?: string }> =>
  postJson("/api/feedback/followup", input);

export interface CoachMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
  /** Screenshots on the opening note only (#1020) — serialized exactly like a plain submission's
   *  images, so the server's `sanitizeImages` stays the one authority on shape. */
  readonly images?: readonly AttachedImage[];
}

export type CoachAnswer =
  | { readonly ok: true; readonly done: false; readonly question: string }
  | {
      readonly ok: true;
      readonly done: true;
      readonly title: string;
      readonly details: string;
      readonly area?: string;
      readonly spec: unknown;
    }
  | { readonly ok: false; readonly error: string };

/** One coach turn — the pre-existing endpoint both doors share. Drafts only; never files. */
export const coachTurn = (input: {
  readonly kind: FeedbackKind;
  readonly messages: readonly CoachMessage[];
}): Promise<CoachAnswer> => postJson("/feedback/coach", input);
