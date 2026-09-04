import { passingCount } from "../domain/comprehension.js";
import { checkFor } from "../domain/comprehension-checks.js";
import { COURSES, totalPoints } from "../domain/curriculum.js";
import { type EarnedEngagement, engagementMilestone } from "../domain/engagement.js";
import {
  type EarnedMilestone,
  LADDER_GATE_NOTE,
  ladderNeighbor,
  milestoneForCode,
} from "../domain/progression.js";
import type { AcademyProgress } from "../server/progression-service.js";

/**
 * MILESTONES AS DATA — `/api/learn`, the JSON twin behind the shell's
 * journey. The honesty rule is inherited whole (Eric, 2026-08-25: progress a user can claim with
 * zero proof is worthless): a milestone is EARNED only by a real filled order, and the proof —
 * fill date + order id — rides every earned row. Level 100 opens from the start; each higher
 * course unlocks when the one below completes.
 *
 * Since 8b the celebration and the comprehension gate render IN the shell, so this view carries
 * them whole — with one hard rule: the check ships its questions and options only. The answer
 * key and the per-question reasons NEVER serialize here; grading lives in
 * `server/progression-service.ts`, and the browser is asked, never trusted
 * (`/api/learn/check` returns the graded result with the reasons attached).
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

/** One unclaimed earn, ready for its one-time fanfare. */
interface CelebrationView {
  readonly milestoneId: string;
  readonly code: string;
  readonly name: string;
  /** The next rung this earn opened — absent when it was the top of the ladder. */
  readonly opened?: { readonly code: string; readonly name: string };
}

/** One question, options only — the answer index and the reason stay server-side. */
interface CheckQuestionView {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
}

/** The first gated earn's check — one gate at a time, exactly like the server page. */
interface CheckGateView {
  readonly milestoneId: string;
  readonly code: string;
  readonly title: string;
  readonly concept: string;
  /** What the member DID to earn this — the fill itself is never in question. */
  readonly did: string;
  /** Right answers needed of `total` — stated, so the bar is never a mystery. */
  readonly needed: number;
  readonly total: number;
  readonly questions: readonly CheckQuestionView[];
}

/** One unclaimed engagement earn — no ladder code, no next rung: it isn't a trade. */
interface EngagementCelebrationView {
  readonly milestoneId: string;
  readonly title: string;
  readonly points: number;
}

export interface LearnView {
  /** False when the session resolves to no account — the journey shows from the start. */
  readonly linked: boolean;
  readonly points: number;
  readonly totalPoints: number;
  readonly rank: string;
  /** The feedback gate (#1119), when it holds: the reason and the sentence the pages show. */
  readonly gate?: { readonly reason: string; readonly note: string };
  readonly courses: readonly CourseView[];
  /** Fresh earns awaiting their one-time celebration — the shell renders the fanfare. */
  readonly celebrating: readonly CelebrationView[];
  /** Fresh engagement earns awaiting their one-time celebration — same fanfare
   *  treatment, a separate track from the trade ladder. */
  readonly engagementCelebrating: readonly EngagementCelebrationView[];
  /** How many earns still wait behind a comprehension check (the gate below included). */
  readonly pendingChecks: number;
  /** The first gated earn's check, when one is waiting — questions only, never the key. */
  readonly check?: CheckGateView;
}

function engagementCelebrationView(m: EarnedEngagement): EngagementCelebrationView {
  const milestone = engagementMilestone(m.milestoneId);
  return {
    milestoneId: m.milestoneId,
    title: milestone?.title ?? "Milestone",
    points: milestone?.points ?? 0,
  };
}

function celebrationView(m: EarnedMilestone): CelebrationView {
  const next = ladderNeighbor(m.code, 1);
  return {
    milestoneId: m.milestoneId,
    code: m.code,
    name: milestoneForCode(m.code)?.title ?? `course ${m.code}`,
    ...(next ? { opened: { code: next.code, name: next.name } } : {}),
  };
}

/** The first pending earn an actual check gates. Strips grading fields on the way out. */
function gateView(pending: readonly EarnedMilestone[]): CheckGateView | undefined {
  for (const earn of pending) {
    const check = checkFor(earn.milestoneId);
    if (!check) continue;
    return {
      milestoneId: check.milestoneId,
      code: earn.code,
      title: check.title,
      concept: check.concept,
      did: milestoneForCode(earn.code)?.title ?? `Course ${earn.code}`,
      needed: passingCount(check.questions.length),
      total: check.questions.length,
      questions: check.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })),
    };
  }
  return undefined;
}

export function learnJsonView(progress?: AcademyProgress): LearnView {
  const earnedById = new Map((progress?.earned ?? []).map((m) => [m.milestoneId, m]));
  const levels = progress?.unlockedLevels ?? new Set([COURSES[0]?.level ?? 100]);
  const gate = gateView(progress?.pendingChecks ?? []);
  return {
    linked: progress !== undefined,
    points: progress?.points ?? 0,
    totalPoints: totalPoints(),
    rank: progress?.rank.title ?? "Observer",
    ...(progress?.ladderGate
      ? { gate: { reason: progress.ladderGate, note: LADDER_GATE_NOTE } }
      : {}),
    courses: COURSES.map((course) => {
      const milestones = course.milestones.map((m) => {
        const earned = earnedById.get(m.id);
        return {
          id: m.id,
          title: m.title,
          detail: m.detail,
          points: m.points,
          // In-shell since 10b: the shell ticket speaks ?play=, so the milestone lands there.
          ...(m.tradeType ? { ticket: `/app/trade?play=${m.tradeType}` } : {}),
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
    celebrating: (progress?.celebrating ?? []).map(celebrationView),
    engagementCelebrating: (progress?.engagementCelebrating ?? []).map(engagementCelebrationView),
    pendingChecks: progress?.pendingChecks?.length ?? 0,
    ...(gate ? { check: gate } : {}),
  };
}
