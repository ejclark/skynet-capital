import { ENGAGEMENT_MILESTONES } from "./engagement.js";

/**
 * MILESTONE M·01 — ONBOARDING. Three steps take a member from spectator to participant, and
 * every one of them is a fact the desk already records somewhere else — this module only reads
 * those facts back as one milestone (the Claude Design canvas "Alpaca onboarding process
 * streamline", 2026-09-02; IA settled in the plan issue that slice references; copy revised by the
 * 2026-09-03 handoff — the guide became accordions and Moneypenny became a rail, so step 2's
 * route opens the rail rather than a feedback page):
 *
 *   connect       — the session resolves to a HUMAN account on the board (participant store)
 *   first-feedback — the engagement track's own milestone (`engagement.ts`, a feedback-log entry)
 *   first-trade   — at least one ladder milestone earned by a real fill (`progression.ts`)
 *
 * SAME HONESTY RULE AS EVERY OTHER TRACK: nothing here is claimed by the browser or stored as
 * progress; the inputs are the ledgers, and the steps are derived on every read. Points: 10 a
 * step, 30 for the milestone — the canvas's "each step is worth 10 points". The feedback step IS
 * the engagement milestone, so its 10 comes from there (one source of truth, never counted twice).
 */

export type OnboardingStepId = "connect" | "first-feedback" | "first-trade";

export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly title: string;
  readonly detail: string;
  readonly points: number;
  /** Where the action lives — the shell route that completes this step. */
  readonly route: string;
}

export const ONBOARDING_STEP_POINTS = 10;

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "connect",
    title: "Connect your Alpaca paper account",
    detail:
      "Set up a free Alpaca paper account and link it here in five short steps, detailed below. We read keys only to verify and show your balance — no orders are ever placed on your behalf.",
    points: ONBOARDING_STEP_POINTS,
    route: "/app/onboarding",
  },
  {
    id: "first-feedback",
    title: "Meet Moneypenny, and file your first feedback",
    detail:
      "Moneypenny is our AI agent — your guide for learning the desk and filing feedback. Say hello and she'll take it from there.",
    points: ENGAGEMENT_MILESTONES.find((m) => m.id === "first-feedback")?.points ?? 0,
    // The rail, not a page: `?moneypenny=intro` opens the right rail with her intro script.
    route: "/app/onboarding?moneypenny=intro",
  },
  {
    id: "first-trade",
    title: "Make your first trade",
    detail:
      "The desk unlocks one rung at a time — buy a stock first, and each real fill opens the next play. No skipping ahead. Orders fill only while the market is open — 9:30 AM to 4:00 PM ET, Monday through Friday.",
    points: ONBOARDING_STEP_POINTS,
    route: "/app/trade?play=101",
  },
];

/** The milestone's identity, as the table of contents shows it. */
export const ONBOARDING_MILESTONE = {
  id: "onboarding",
  code: "M·01",
  title: "Onboarding",
  desc: "Get seated at the desk: connect Alpaca, file your first feedback, make your first trade.",
} as const;

/** Total points the milestone can award — 30 with the canvas's per-step value. */
export function onboardingTotalPoints(): number {
  return ONBOARDING_STEPS.reduce((sum, s) => sum + s.points, 0);
}

/** The evidence, one flag per step — each the output of a ledger the server already reads. */
export interface OnboardingEvidence {
  /** The session resolves to a human account on the board. */
  readonly connected: boolean;
  /** `engagement.ts` earned `first-feedback` (a real filing). */
  readonly feedbackFiled: boolean;
  /** At least one trade-ladder milestone is earned (a real fill). */
  readonly firstFillEarned: boolean;
}

export interface OnboardingStepState extends OnboardingStep {
  readonly done: boolean;
}

export interface OnboardingProgress {
  readonly steps: readonly OnboardingStepState[];
  readonly done: number;
  readonly total: number;
  readonly points: number;
  readonly totalPoints: number;
  readonly complete: boolean;
}

/** Fold the evidence into the milestone. Pure and total — the ledgers ARE the progress. */
export function deriveOnboarding(evidence: OnboardingEvidence): OnboardingProgress {
  const doneFor: Record<OnboardingStepId, boolean> = {
    connect: evidence.connected,
    "first-feedback": evidence.feedbackFiled,
    "first-trade": evidence.firstFillEarned,
  };
  const steps = ONBOARDING_STEPS.map((s) => ({ ...s, done: doneFor[s.id] }));
  const done = steps.filter((s) => s.done).length;
  return {
    steps,
    done,
    total: steps.length,
    points: steps.reduce((sum, s) => sum + (s.done ? s.points : 0), 0),
    totalPoints: onboardingTotalPoints(),
    complete: done === steps.length,
  };
}
