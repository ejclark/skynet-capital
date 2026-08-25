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
 * realized profit) return once short-lot matching lands (#468); they will be bonus points, never
 * ladder gates.
 */

/** Course level — the hundreds digit of the trade codes the course teaches. Extensible upward. */
export type CourseLevel = 100 | 200 | 300;

export interface Milestone {
  readonly id: string;
  /** Achievement-style title — phrased as a thing you DO ("Buy your first stock"). */
  readonly title: string;
  /** One line on what it is and why it matters. */
  readonly detail: string;
  /** Points awarded when completed — the score that drives the game. */
  readonly points: number;
  /** Trade-type code whose first FILLED order earns this milestone (every trade milestone has one). */
  readonly tradeType?: TradeTypeCode;
  /** Where a NON-trade milestone is earned — a trade milestone derives its own ticket link. */
  readonly earnAt?: { readonly href: string; readonly label: string };
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
 * 300 is directional longs** — defined-risk bets with leverage. Everything riskier (spreads,
 * condors, undefined-risk) is intentionally absent until a later course.
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
];

/** The one community milestone's id — the earning path derives it (`domain/community.ts`). */
export const FEEDBACK_MILESTONE_ID = "first-feedback";

/**
 * THE COMMUNITY TRACK — a 100-level course (Eric, 2026-08-25: "giving feedback should be listed as
 * a 100 level milestone"), deliberately held BESIDE the trade ladder rather than inside it.
 *
 * Two reasons it is its own track, not a `10x` trade code. It must never gate the Wheel — course
 * locks chain off `COURSES` alone, so filing feedback cannot become a prerequisite for options.
 * And it does not claim to be a trade, which is what lets it satisfy the fill-only ruling instead
 * of bending it: a trade milestone's proof is an order id, and this one's proof is the GitHub issue
 * number the filing produced (`server/feedback-log.ts`). Both are server-created evidence the
 * member cannot self-assert — the standard the ruling actually sets. `progression.ts` is untouched.
 */
const COMMUNITY_COURSE: Course = {
  level: 100,
  id: "community",
  title: "The league — build the desk with us",
  subtitle:
    "This desk gets better because members say what's broken and what's missing. Sending that note is a real contribution, and it counts like one.",
  milestones: [
    {
      id: FEEDBACK_MILESTONE_ID,
      title: "File your first piece of feedback",
      detail:
        "Send a bug, a feature idea, or a side quest from the Feedback page. It becomes a real tracked issue, and that issue number is the proof — so this one can't be self-marked either.",
      points: 15,
      earnAt: { href: "/feedback", label: "share feedback →" },
    },
  ],
};

/**
 * Every course points can be earned in — the trade ladder plus the community track, in the order
 * the Milestones page stacks them. Sorted by level (a stable sort, so the community card lands
 * just after the trade course it shares level 100 with, never after the 300s).
 */
export const ALL_COURSES: readonly Course[] = [...COURSES, COMMUNITY_COURSE].sort(
  (a, b) => a.level - b.level,
);

/** One milestone by id, across every track — the lookup the unlock banner reads. */
export function milestoneById(id: string): Milestone | undefined {
  for (const course of ALL_COURSES) {
    const hit = course.milestones.find((m) => m.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/** Total points available across every course — the denominator for a completion percentage. */
export function totalPoints(): number {
  return ALL_COURSES.reduce((sum, c) => sum + c.milestones.reduce((s, m) => s + m.points, 0), 0);
}

/** Points earned for a set of completed milestone ids. */
export function pointsFor(completed: ReadonlySet<string>): number {
  let total = 0;
  for (const c of ALL_COURSES) {
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
 * Which course levels a learner has unlocked. Level 100 is always open; each higher course unlocks
 * only when the one before it is fully complete. Display truth for the Milestones page — the
 * progression service unions in any course that already holds an earned milestone, so seeded
 * history with ladder gaps never shows an earn inside a locked course.
 *
 * Walks `COURSES`, never `ALL_COURSES`: the community track sits at level 100 (always open) and is
 * deliberately outside this chain, so filing feedback can never become a prerequisite for options.
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
