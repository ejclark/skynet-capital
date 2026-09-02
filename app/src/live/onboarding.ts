/**
 * Onboarding's client model — mirrors `GET /api/onboarding` (`onboarding-api-routes.ts`). Every
 * done-state is the server's reading of a ledger; this module carries no progress of its own.
 */

export type OnboardingStepId = "connect" | "first-feedback" | "first-trade";

export interface OnboardingStep {
  readonly id: OnboardingStepId;
  readonly title: string;
  readonly detail: string;
  readonly points: number;
  readonly route: string;
  readonly done: boolean;
}

export interface OnboardingAccount {
  readonly id: string;
  readonly displayName: string;
  readonly equity: number;
  readonly cash: number;
  readonly stale: boolean;
  readonly rungsEarned: number;
  readonly rungsTotal: number;
  readonly nextUp?: { readonly code: string; readonly title: string };
}

export interface Onboarding {
  readonly linked: boolean;
  readonly milestone: {
    readonly id: string;
    readonly code: string;
    readonly title: string;
    readonly desc: string;
  };
  readonly steps: readonly OnboardingStep[];
  readonly done: number;
  readonly total: number;
  readonly points: number;
  readonly totalPoints: number;
  readonly complete: boolean;
  readonly account?: OnboardingAccount;
}

export async function fetchOnboarding(): Promise<Onboarding> {
  const res = await fetch("/api/onboarding", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`onboarding ${res.status}`);
  return (await res.json()) as Onboarding;
}
