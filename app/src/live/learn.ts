import { postJson } from "./post";

/**
 * The journey's client model (#738 phases 6b + 8b) — mirrors `LearnView`. The proof discipline
 * rides the payload: an earned milestone carries its fill date and order id; nothing here can be
 * self-marked. The celebration and the comprehension gate render in the shell, but the honesty
 * stays server-side: the gate arrives as questions and options ONLY (never the answer key), the
 * verdict comes back graded from `/api/learn/check` with every reason attached, and the claim is
 * banked by the service against the real curriculum — the client renders, it never decides.
 */

export interface JourneyMilestone {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly points: number;
  readonly ticket?: string;
  readonly earned?: { readonly on: string; readonly orderId: string };
}

export interface JourneyCourse {
  readonly level: number;
  readonly title: string;
  readonly subtitle: string;
  readonly locked: boolean;
  readonly done: number;
  readonly total: number;
  readonly milestones: readonly JourneyMilestone[];
}

export interface JourneyCelebration {
  readonly milestoneId: string;
  readonly code: string;
  readonly name: string;
  readonly opened?: { readonly code: string; readonly name: string };
}

export interface CheckQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
}

export interface CheckGate {
  readonly milestoneId: string;
  readonly code: string;
  readonly title: string;
  readonly concept: string;
  readonly did: string;
  readonly needed: number;
  readonly total: number;
  readonly questions: readonly CheckQuestion[];
}

/** One graded question, verbatim from the server. `chosen` absent = left blank. */
export interface GradedAnswer {
  readonly questionId: string;
  readonly prompt: string;
  readonly chosen?: string;
  readonly correctAnswer: string;
  readonly correct: boolean;
  readonly why: string;
}

export interface CheckVerdict {
  readonly milestoneId: string;
  readonly title: string;
  readonly correct: number;
  readonly total: number;
  readonly needed: number;
  readonly passed: boolean;
  readonly answers: readonly GradedAnswer[];
  readonly verdict: string;
}

export interface Journey {
  readonly linked: boolean;
  readonly points: number;
  readonly totalPoints: number;
  readonly rank: string;
  readonly courses: readonly JourneyCourse[];
  readonly celebrating: readonly JourneyCelebration[];
  readonly pendingChecks: number;
  readonly check?: CheckGate;
}

export async function fetchJourney(): Promise<Journey> {
  const res = await fetch("/api/learn", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`learn ${res.status}`);
  return (await res.json()) as Journey;
}

type WriteAnswer = { readonly ok: true } | { readonly ok: false; readonly error: string };

/** Bank the one-time celebration — the service filters ids against the real curriculum. */
export const claimMilestones = (ack: readonly string[]): Promise<WriteAnswer> =>
  postJson("/api/learn/claim", { ack });

/** Post answer indices for grading. The verdict comes back — it is never ours to state. */
export const submitCheckAnswers = (
  milestoneId: string,
  answers: Readonly<Record<string, string>>,
): Promise<{ readonly ok: true; readonly result: CheckVerdict } | { ok: false; error: string }> =>
  postJson("/api/learn/check", { milestoneId, answers });
