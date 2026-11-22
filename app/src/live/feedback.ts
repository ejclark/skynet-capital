import type { FeedbackStatus } from "../../../src/domain/feedback-status";
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
  /** The server's one mapping (`statusFromIssue`); absent when the status fetch failed, so the
   *  row shows no badge rather than a wrong one. */
  readonly status?: FeedbackStatus;
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
  /** The version this server is currently running — what a `shipped` filing is confirmed live
   *  in (#429's "stamped with the release version"). Empty string if it couldn't be read. */
  readonly appVersion: string;
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

/** Mirrors `FollowupOutcome` in src/server/feedback-followup.ts (the shell never imports the
 *  server tree). */
export type FollowupOutcome =
  | "rechecking"
  | "backlog"
  | "held"
  | "building"
  | "closed"
  | "unchanged";

/** What a sent follow-up did (#5848, #7548): on a filing queued to build and not yet started, the
 *  server takes it out of the queue until the automatic check has read the follow-up, and names
 *  what happened otherwise, so the line never promises a build that isn't coming.
 *  An unknown or missing outcome gets the plain line — the comment posted, nothing more claimed.
 *  One copy for both doors that follow up — the Feedback screen's box and Moneypenny's card
 *  (#7286 slice 8) — so the two never tell a member different things about the same build. */
const SENT = "Sent — it's on your issue.";
const SENT_LINES: Readonly<Record<FollowupOutcome, string>> = {
  rechecking:
    "Sent — it's on your issue. It's checked again with your follow-up before it's built.",
  backlog: "Sent — it's on your issue; it builds once it's picked from the queue.",
  held: "Sent — it's on your issue; the build waits on a person first.",
  building: "Sent — it's on your issue; it's being built right now.",
  closed: "Sent — it's on your issue. This one is closed, so nothing rebuilds from it.",
  unchanged: SENT,
};
export const followupSentLine = (outcome: FollowupOutcome | undefined): string =>
  outcome && Object.hasOwn(SENT_LINES, outcome) ? SENT_LINES[outcome] : SENT;

export const followupRequest = (input: {
  readonly issueNumber: number;
  readonly details: string;
}): Promise<{
  readonly ok: boolean;
  readonly error?: string;
  /** What the follow-up did to the build (#5848) — feedback-followup.ts decides it off the issue
   *  as it stands, with the claim's own pull rule. */
  readonly outcome?: FollowupOutcome;
}> => postJson("/api/feedback/followup", input);

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
      /** The coach's brief stopped short (#6205) — its details say so and quote the member. */
      readonly cut?: true;
    }
  | { readonly ok: false; readonly error: string };

/** One coach turn — the pre-existing endpoint both doors share. Drafts only; never files. */
export const coachTurn = (input: {
  readonly kind: FeedbackKind;
  readonly messages: readonly CoachMessage[];
}): Promise<CoachAnswer> => postJson("/feedback/coach", input);
