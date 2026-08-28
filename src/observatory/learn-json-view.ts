import { COURSES, totalPoints } from "../domain/curriculum.js";
import type { AcademyProgress } from "./render-dashboard.js";

/**
 * MILESTONES AS DATA (#738 phase 6b) — `/api/learn`, the JSON twin behind the shell's journey.
 * The honesty rule is inherited whole (Eric, 2026-08-25: progress a user can claim with zero
 * proof is worthless): a milestone is EARNED only by a real filled order, and the proof — fill
 * date + order id — rides every earned row. Level 100 opens from the start; each higher course
 * unlocks when the one below completes. Celebrations and comprehension checks keep their
 * server-side flows; this view only COUNTS them so the shell can point at the full page.
 */

interface MilestoneView {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly points: number;
  /** The ticket pre-set to this play, when the milestone IS a trade. */
  readonly ticket?: string;
  /** The proof: present exactly when a real filled order earned it. */
  readonly earned?: { readonly on: string; readonly orderId: string };
}

interface CourseView {
  readonly level: number;
  readonly title: string;
  readonly subtitle: string;
  readonly locked: boolean;
  readonly done: number;
  readonly total: number;
  readonly milestones: readonly MilestoneView[];
}

export interface LearnView {
  /** False when the session resolves to no account — the journey shows from the start. */
  readonly linked: boolean;
  readonly points: number;
  readonly totalPoints: number;
  readonly rank: string;
  readonly courses: readonly CourseView[];
  /** Fresh earns awaiting their one-time celebration — the full page owns that moment. */
  readonly celebrating: number;
  /** Earns gated on a comprehension check — the full page owns the check. */
  readonly pendingChecks: number;
}

export function learnJsonView(progress?: AcademyProgress): LearnView {
  const earnedById = new Map((progress?.earned ?? []).map((m) => [m.milestoneId, m]));
  const levels = progress?.unlockedLevels ?? new Set([COURSES[0]?.level ?? 100]);
  return {
    linked: progress !== undefined,
    points: progress?.points ?? 0,
    totalPoints: totalPoints(),
    rank: progress?.rank.title ?? "Observer",
    courses: COURSES.map((course) => {
      const milestones = course.milestones.map((m) => {
        const earned = earnedById.get(m.id);
        return {
          id: m.id,
          title: m.title,
          detail: m.detail,
          points: m.points,
          ...(m.tradeType ? { ticket: `/trade?play=${m.tradeType}` } : {}),
          ...(earned ? { earned: { on: earned.at.slice(0, 10), orderId: earned.orderId } } : {}),
        };
      });
      const done = milestones.filter((m) => m.earned).length;
      return {
        level: course.level,
        title: course.title,
        subtitle: course.subtitle,
        locked: !levels.has(course.level),
        done,
        total: milestones.length,
        milestones,
      };
    }),
    celebrating: progress?.celebrating?.length ?? 0,
    pendingChecks: progress?.pendingChecks?.length ?? 0,
  };
}
