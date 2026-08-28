/**
 * The journey's client model (#738 phase 6b) — mirrors `LearnView`. The proof discipline rides
 * the payload: an earned milestone carries its fill date and order id; nothing here can be
 * self-marked. Celebrations and comprehension checks belong to the server page — this model
 * only counts them so the shell can point there.
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

export interface Journey {
  readonly linked: boolean;
  readonly points: number;
  readonly totalPoints: number;
  readonly rank: string;
  readonly courses: readonly JourneyCourse[];
  readonly celebrating: number;
  readonly pendingChecks: number;
}

export async function fetchJourney(): Promise<Journey> {
  const res = await fetch("/api/learn", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`learn ${res.status}`);
  return (await res.json()) as Journey;
}
