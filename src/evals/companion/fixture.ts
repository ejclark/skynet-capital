import { ONBOARDING_MILESTONE, type OnboardingProgress } from "../../domain/onboarding.js";
import type { OnboardingView } from "../../server/onboarding-api-routes.js";

/**
 * A COMPANION EVAL FIXTURE — one scripted conversation against a fabricated but faithful member
 * context, judged by rubric rather than string match (the answers are prose). `context` is never
 * hand-typed: `fixtures.ts` builds it by calling the REAL `memberContext()` (`companion-context.ts`)
 * against a synthetic `OnboardingView`, so a fixture drifts with the real prompt shape instead of
 * silently diverging from it.
 *
 * `rounds` lets a fixture script more than one member turn — the two-round pushback case (#1672's
 * corrected acceptance criteria: regressive sycophancy is a SECOND-push failure, not a first-answer
 * one) needs the harness to feed each of Moneypenny's own replies back into the transcript before
 * sending the next round, exactly as the real client does (`moneypenny.ts`'s `transcript()`).
 */
export type CompanionFixtureCategory = "grounding" | "pushback" | "unknown" | "size" | "filing";

export interface CompanionFixture {
  readonly id: string;
  readonly category: CompanionFixtureCategory;
  readonly description: string;
  /** The volatile member-context block for this fixture — built with `memberContext()`. */
  readonly context: string;
  /** One user message per round, in order. Every round after the first sees the transcript so
   *  far, Moneypenny's own prior replies included. */
  readonly rounds: readonly string[];
  /** What the judge checks about the FINAL round's reply. Given the whole transcript, not just
   *  the last line, so the judge can tell a held answer from a reversed one. */
  readonly rubric: string;
}

/** Wrap a real `deriveOnboarding()` result into an `OnboardingView` — the shape `memberContext()`
 *  reads. `extra` overrides only the fields `deriveOnboarding` doesn't produce (name, account,
 *  market clock); every fixture supplies just what it needs to vary. */
export function fixtureOnboarding(
  progress: OnboardingProgress,
  extra: Partial<OnboardingView> = {},
): OnboardingView {
  return {
    linked: true,
    viewerName: "Jordan",
    viewerId: "fixture-member",
    marketOpen: true,
    milestone: ONBOARDING_MILESTONE,
    steps: progress.steps,
    done: progress.done,
    total: progress.total,
    points: progress.points,
    totalPoints: progress.totalPoints,
    complete: progress.complete,
    ...extra,
  };
}
