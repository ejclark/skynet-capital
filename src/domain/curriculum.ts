import type { TradeTypeCode } from "./trade-types.js";

/**
 * The CURRICULUM — the gamified learning journey that turns "options homework" into a game with
 * milestones, points, and unlockable levels. It is deliberately ORDERED by real trading progression,
 * not by strategy taxonomy, and its numbering IS the desk's: course 100 teaches the stock trades
 * (101 buy, 102 sell), course 200 the Wheel's option legs (201 cash-secured put, 202 covered call),
 * course 300 directional longs (301/302). Riskier material stays hidden until earlier levels are
 * graduated — "know your audience," enforced in one place.
 *
 * Pure data. Every milestone names the trade-type code whose first FILLED order earns it
 * (`tradeType`), so progression derives from real executed trades — never self-marked
 * (`src/domain/progression.ts` does the deriving). Outcome milestones (an OTM expiry, a first
 * realized profit) return once short-lot matching lands; they will be bonus points, never
 * ladder gates.
 */

/** Course level — the hundreds digit of the trade codes the course teaches. Extensible upward. */
export type CourseLevel = 100 | 200 | 300 | 400 | 500;

export interface Milestone {
  readonly id: string;
  /** Achievement-style title — phrased as a thing you DO ("Buy your first stock"). */
  readonly title: string;
  /** One line on what it is and why it matters. */
  readonly detail: string;
  /** Points awarded when completed — the score that drives the game. */
  readonly points: number;
  /** Trade-type code whose first FILLED order earns this milestone (every v1 milestone has one). */
  readonly tradeType?: TradeTypeCode;
}

export interface Course {
  readonly level: CourseLevel;
  readonly id: string;
  readonly title: string;
  /** The framing that makes the course feel like a chapter, not a chore. */
  readonly subtitle: string;
  readonly milestones: readonly Milestone[];
}

/**
 * The courses, in order. **Level 100 is stock basics** — own it, book it — because everything the
 * Wheel does rests on shares you actually hold. **Level 200 is the Wheel** (it writes options, so it
 * is 200-level by definition): get paid to buy lower, get paid to cap your upside, repeat. **Level
 * 300 is directional longs** — defined-risk bets with leverage. **Level 400 is spreads** — combining
 * two legs, unlocked only once both directional longs are earned (#1671: Eric's own bar — "you
 * shouldn't bother with this until you know the mechanics up to buying long put/calls" — is exactly
 * what gating on both 301 and 302 already enforces). **Level 500 is zero-DTE** — same-day expiration,
 * the fastest clock, gated behind spreads. A compound strategy like an iron condor (two spreads run
 * together) is not its own course — it belongs to the Playbook Store once it has real strategy
 * content, not the ladder (#1671's settled forks).
 */
export const COURSES: readonly Course[] = [
  {
    level: 100,
    id: "stock-basics",
    title: "Stock basics — own it, book it",
    subtitle:
      "The foundation everything else stands on: buy shares of a company you'd be glad to hold, then sell some and book a result for real. Two trades, and the desk is yours.",
    milestones: [
      {
        id: "first-buy",
        title: "Buy your first stock",
        detail:
          "You have cash; buy shares of a solid company you'd be glad to own. This is the foundation the whole Wheel turns on — covered calls later need 100 shares per contract.",
        points: 25,
        tradeType: "101",
      },
      {
        id: "first-sell",
        title: "Sell your first stock",
        detail:
          "Sell shares you hold and book the gain or loss for real. Taking a result — green or red — is the habit that separates trading from hoping.",
        points: 25,
        tradeType: "102",
      },
    ],
  },
  {
    level: 200,
    id: "the-wheel",
    title: "The Wheel — get paid to own good stocks",
    subtitle:
      "The safest way to learn options income. Sell puts and calls around a stock you'd be happy to own, and let premium do the work — one turn of the wheel at a time.",
    milestones: [
      {
        id: "first-cash-secured-put",
        title: "Sell your first cash-secured put",
        detail:
          "Set aside cash and sell a put at a price you'd happily buy at. You get paid a premium to wait — the Wheel's entry.",
        points: 35,
        tradeType: "201",
      },
      {
        id: "first-covered-call",
        title: "Sell your first covered call",
        detail:
          "On shares you own, sell a call to collect income while the stock drifts. The Wheel's other half.",
        points: 35,
        tradeType: "202",
      },
    ],
  },
  {
    level: 300,
    id: "directional-longs",
    title: "Directional options — buying calls & puts",
    subtitle:
      "Now that the Wheel is second nature, learn to take a directional bet with defined risk: buy a put to bet down, a call to bet up. Leverage cuts both ways — respect it.",
    milestones: [
      {
        id: "first-long-put",
        title: "Buy your first long put",
        detail:
          "Pay a premium for the right to sell at a strike — a defined-risk bet that a stock falls.",
        points: 40,
        tradeType: "301",
      },
      {
        id: "first-long-call",
        title: "Buy your first long call",
        detail:
          "Pay a premium for the right to buy at a strike — a defined-risk bet that a stock rises.",
        points: 40,
        tradeType: "302",
      },
    ],
  },
  {
    level: 400,
    id: "spreads",
    title: "Spreads — defined risk, two legs",
    subtitle:
      "You know both sides of a directional bet now — combine two legs into one order and cap your cost and your risk together.",
    milestones: [
      {
        id: "first-vertical-spread",
        title: "Place your first vertical spread",
        detail:
          "Buy one option and sell another of the same type and expiration at a different strike, as one order. The short leg pays for part of the long leg — that's the trade-off for a lower, defined risk.",
        points: 45,
        tradeType: "401",
      },
    ],
  },
  {
    level: 500,
    id: "zero-dte",
    title: "Zero-DTE — the fastest clock",
    subtitle:
      "Same principles, no runway: an option expiring today decays fastest and moves fastest. Respect the clock.",
    milestones: [
      {
        id: "first-zero-dte",
        title: "Trade your first zero-DTE order",
        detail:
          "Place an option order — single-leg or a spread — that expires today. Every hour that passes is a bigger share of what's left of the position's life.",
        points: 50,
        tradeType: "501",
      },
    ],
  },
];

/** Total points available across every course — the denominator for a completion percentage. */
export function totalPoints(): number {
  return COURSES.reduce((sum, c) => sum + c.milestones.reduce((s, m) => s + m.points, 0), 0);
}

/** Points earned for a set of completed milestone ids. */
export function pointsFor(completed: ReadonlySet<string>): number {
  let total = 0;
  for (const c of COURSES) {
    for (const m of c.milestones) {
      if (completed.has(m.id)) total += m.points;
    }
  }
  return total;
}

/** A course is COMPLETE when every one of its milestones is done. */
export function courseComplete(course: Course, completed: ReadonlySet<string>): boolean {
  return course.milestones.every((m) => completed.has(m.id));
}

/**
 * Every milestone id → the course it belongs to. A cheap pre-check for a caller deciding whether
 * `graduatingLevel`'s real ledger read is worth doing at all — `progression-service.ts`'s
 * `acknowledge` skips reading the fill + tag ledgers entirely for an id that names no course, or
 * whose course is already banked graduated. Never a substitute for `graduatingLevel`'s own
 * completeness check: EVERY milestone in a course can map here, not only its canonical-order last
 * one — see `graduatingLevel`'s doc on why ladder position is the wrong test.
 */
export const MILESTONE_COURSE_LEVEL: ReadonlyMap<string, CourseLevel> = new Map(
  COURSES.flatMap((c) => c.milestones.map((m) => [m.id, c.level] as const)),
);

/**
 * The course a milestone GRADUATES — undefined unless `completed` (the participant's REAL earned
 * set, re-derived from fills — never a client-submitted list) proves milestoneId's WHOLE course,
 * not just this one code.
 *
 * Deliberately NOT "is milestoneId the course's canonical-order last milestone": `unlockedCodes`
 * gating the ticket does NOT mean fills arrive in ladder order — seeded/imported history is
 * explicitly allowed to have gaps (`progression.ts`'s `unlockedCodes` doc — "a trade you have
 * actually done is never locked away from you"), so a member can earn a course's LAST milestone
 * (say, a covered call) with no earlier one (a cash-secured put) on record yet. If the earlier one
 * lands and is claimed LATER, checking ladder position alone would never re-fire for it (that id
 * isn't the course's canonical last one either) — the graduation would be silently lost forever.
 * Testing "is milestoneId IN this course, and is the course complete" instead catches the
 * graduation at whichever milestone the PARTICIPANT'S OWN history happens to complete it with,
 * in whatever order it actually happened. #469 slice 4's ceremony + companion congratulation key
 * off this (`progression-service.ts`'s `acknowledge`, `onboarding-api-routes.ts`'s
 * `freshGraduation`).
 */
export function graduatingLevel(
  milestoneId: string,
  completed: ReadonlySet<string>,
): CourseLevel | undefined {
  for (const course of COURSES) {
    if (course.milestones.some((m) => m.id === milestoneId) && courseComplete(course, completed)) {
      return course.level;
    }
  }
  return undefined;
}

/**
 * Which course levels a learner has unlocked. Level 100 is always open; each higher course unlocks
 * only when the one before it is fully complete. Display truth for the Milestones page — the
 * progression service unions in any course that already holds an earned milestone, so seeded
 * history with ladder gaps never shows an earn inside a locked course.
 */
export function unlockedLevels(completed: ReadonlySet<string>): Set<CourseLevel> {
  const open = new Set<CourseLevel>([COURSES[0]?.level ?? 100]);
  for (let i = 1; i < COURSES.length; i++) {
    const prev = COURSES[i - 1];
    const cur = COURSES[i];
    if (prev && cur && courseComplete(prev, completed)) open.add(cur.level);
  }
  return open;
}

/** Rank badges — a light progression flavor keyed off points earned. */
export interface Rank {
  readonly title: string;
  readonly atPoints: number;
}
const RANKS: readonly Rank[] = [
  { title: "Observer", atPoints: 0 },
  { title: "Apprentice", atPoints: 25 },
  { title: "Trader", atPoints: 50 },
  { title: "Wheeler", atPoints: 120 },
  { title: "Strategist", atPoints: 200 },
];

/** The highest rank earned at a given point total. */
export function rankFor(points: number): Rank {
  let earned: Rank = RANKS[0] as Rank;
  for (const r of RANKS) {
    if (points >= r.atPoints) earned = r;
  }
  return earned;
}
