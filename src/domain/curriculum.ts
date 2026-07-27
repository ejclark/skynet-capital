/**
 * The CURRICULUM — the gamified learning journey that turns "options homework" into a game with
 * milestones, points, and unlockable levels. It is deliberately ORDERED by real trading progression,
 * not by strategy taxonomy: a new member starts by buying a share, learns the **Wheel** (cash-covered
 * put → covered call → repeat), and only then unlocks directional long options. Riskier material stays
 * hidden until earlier levels are graduated — "know your audience," enforced in one place.
 *
 * Pure data. The academy renders it; a future engine can auto-complete milestones from real Alpaca
 * account activity (today they're self-marked, since bot/account polling isn't continuous yet).
 */

/** Course level. 100 = the basics (the Wheel); 200 = directional long options. Extensible upward. */
export type CourseLevel = 100 | 200;

export interface Milestone {
  readonly id: string;
  /** Achievement-style title — phrased as a thing you DO ("Buy your first stock"). */
  readonly title: string;
  /** One line on what it is and why it matters. */
  readonly detail: string;
  /** Points awarded when completed — the score that drives the game. */
  readonly points: number;
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
 * The courses, in order. **Level 100 is the Wheel** — the safest, most concrete way to learn how
 * options pay you: own stock you'd want anyway, get paid to buy it lower (cash-covered put), get paid
 * to cap your upside (covered call), repeat. Level 200 (buying long calls/puts) unlocks only after
 * 100 is complete. Everything riskier (spreads, condors, undefined-risk) is intentionally absent here
 * until a later course — we don't put risky selections in front of beginners.
 */
export const COURSES: readonly Course[] = [
  {
    level: 100,
    id: "wheel-basics",
    title: "The Wheel — get paid to own good stocks",
    subtitle:
      "The safest way to learn options income. Buy a stock you'd be happy to own, sell puts and calls around it, and let premium do the work — one turn of the wheel at a time.",
    milestones: [
      {
        id: "buy-first-stock",
        title: "Buy your first stock",
        detail:
          "You have cash; buy 100 shares of a solid company you'd be glad to own. This is the foundation the whole Wheel turns on.",
        points: 25,
      },
      {
        id: "first-cash-covered-put",
        title: "Sell your first cash-covered put",
        detail:
          "Set aside cash and sell a put at a price you'd happily buy at. You get paid a premium to wait — the Wheel's entry.",
        points: 30,
      },
      {
        id: "first-covered-call",
        title: "Sell your first covered call",
        detail:
          "On shares you own, sell a call to collect income while the stock drifts. The Wheel's other half.",
        points: 30,
      },
      {
        id: "otm-expiry",
        title: "Let an option expire out-of-the-money",
        detail:
          "Watch a put or call you sold expire worthless (out-of-the-money). You keep the whole premium — this is how the Wheel pays.",
        points: 25,
      },
      {
        id: "first-profit-100",
        title: "Book your first profit",
        detail:
          "Close a position or let it expire in the green. Your first realized win on the ladder — the habit that compounds.",
        points: 40,
      },
    ],
  },
  {
    level: 200,
    id: "directional-longs",
    title: "Directional options — buying calls & puts",
    subtitle:
      "Now that the Wheel is second nature, learn to take a directional bet with defined risk: buy a call to bet up, a put to bet down. Leverage cuts both ways — respect it.",
    milestones: [
      {
        id: "long-basics",
        title: "Learn how long options work",
        detail:
          "Buying a call (bet up) or a put (bet down): your risk is limited to what you paid, but time decay works against you.",
        points: 30,
      },
      {
        id: "first-long-put",
        title: "Buy your first long put",
        detail:
          "Pay a premium for the right to sell at a strike — a defined-risk bet that a stock falls.",
        points: 40,
      },
      {
        id: "first-long-call",
        title: "Buy your first long call",
        detail:
          "Pay a premium for the right to buy at a strike — a defined-risk bet that a stock rises.",
        points: 40,
      },
      {
        id: "sell-long-position",
        title: "Sell a long position",
        detail:
          "Close a call or put you bought — lock in the result instead of riding it to expiration.",
        points: 30,
      },
      {
        id: "first-profit-200",
        title: "Book a profit on a long option",
        detail: "Your first green exit on a directional trade — you've earned the next level.",
        points: 50,
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
 * Which course levels a learner has unlocked. Level 100 is always open; each higher course unlocks
 * only when the one before it is fully complete. This is the gate that hides risky material upfront.
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
export const RANKS: readonly Rank[] = [
  { title: "Observer", atPoints: 0 },
  { title: "Apprentice", atPoints: 25 },
  { title: "Wheeler", atPoints: 110 },
  { title: "Options Trader", atPoints: 200 },
  { title: "Strategist", atPoints: 340 },
];

/** The highest rank earned at a given point total. */
export function rankFor(points: number): Rank {
  let earned: Rank = RANKS[0] as Rank;
  for (const r of RANKS) {
    if (points >= r.atPoints) earned = r;
  }
  return earned;
}
