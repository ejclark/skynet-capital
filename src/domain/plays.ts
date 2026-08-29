import type { TradeTypeCode } from "./trade-types.js";

/**
 * The PLAYS CATALOG — the extended options-strategy curriculum: the six ruling-16 trade types plus
 * the multi-leg strategies beyond them (spreads, condors, butterflies, strangles, straddles, a call
 * ladder). New traders start at the bottom (the cash-covered put) and earn their way up; the
 * complex/undefined-risk plays stay locked until the earlier levels are learned.
 *
 * **Ruling 16 (`trade-types.ts`) is the one numbering source** — the desk's course codes
 * (101/102/201/202/301/302) are never re-derived here. `code` cites that code verbatim for the two
 * strategies ruling 16 already defines (cash-secured put = 201, covered call = 202); it is
 * `undefined` for everything beyond ruling 16's current six, because those don't have a desk code
 * yet (no order path — see the options order-path issue). `level`/`order` are this catalog's OWN
 * teaching-difficulty ladder, spanning strategies ruling 16 doesn't reach; they are never a second
 * numbering scheme for what ruling 16 already codes.
 *
 * This is pure teaching data, deliberately decoupled from the trading engine (`src/personas/*`) and
 * the login animation's `STRATS` (which has its own, unrelated legacy numbers — never read `code`
 * from there or vice versa). Currently unused by `/learn` (`curriculum.ts` + `progression.ts` drive
 * that today) and by the ticket (`plays-api-routes.ts` reads `trade-types.ts` directly) — this is
 * the catalog a future in-app play picker for the multi-leg strategies will gate against.
 */

/** Risk tier — ascending. Level 1 is the safest entry point; level 4 is advanced / undefined-risk. */
export type PlayLevel = 1 | 2 | 3 | 4;

export interface PlayLevelMeta {
  readonly level: PlayLevel;
  /** Short title shown on the level header. */
  readonly title: string;
  /** One line framing the level's risk character. */
  readonly summary: string;
}

/** The four levels, safest first. A learner unlocks level N+1 by completing level N. */
export const PLAY_LEVELS: readonly PlayLevelMeta[] = [
  {
    level: 1,
    title: "Income basics",
    summary: "Defined obligations that pay you a premium up front. The safest way in — start here.",
  },
  {
    level: 2,
    title: "Defined-risk direction",
    summary: "Take a side with a hard cap on the loss. You know the worst case before you enter.",
  },
  {
    level: 3,
    title: "Range & multi-leg",
    summary: "Combine legs to profit from a range or a move — still with a defined maximum loss.",
  },
  {
    level: 4,
    title: "Advanced",
    summary: "The highest-risk plays, including positions whose loss is not capped. Graduate here.",
  },
];

export interface Play {
  readonly id: string;
  readonly name: string;
  readonly level: PlayLevel;
  /** Ordering WITHIN a level — lower is taught first (the cash-covered put leads level 1). */
  readonly order: number;
  /**
   * Ruling 16's own course code (`trade-types.ts`), cited verbatim — never re-numbered here.
   * `undefined` for strategies ruling 16 doesn't yet define a code for.
   */
  readonly code?: TradeTypeCode;
  /** Whether the maximum loss is capped ("defined") or open-ended ("undefined"). */
  readonly risk: "defined" | "undefined";
  /** One-line gist. */
  readonly summary: string;
  /** The market read that makes this play the right tool. */
  readonly whenToUse: string;
  /** Plain-language max profit characterization (educational, not a dollar figure). */
  readonly maxProfit: string;
  /** Plain-language max loss characterization — the honest downside. */
  readonly maxLoss: string;
  /** The concept this play teaches — why it earns its spot on the ladder. */
  readonly teaches: string;
}

/**
 * The catalog. Order in this array is the pedagogical order; `level` + `order` are the source of
 * truth the academy and any future picker sort by. The **cash-covered put leads** — it's the least
 * abstract ("get paid to set a buy price") and the safest place to learn how options pay a premium.
 */
export const PLAYS: readonly Play[] = [
  {
    id: "cash-covered-put",
    name: "Cash-Covered Put",
    level: 1,
    order: 0,
    code: "201",
    risk: "defined",
    summary: "Sell a put and get paid to set the price you'd happily buy the stock at.",
    whenToUse:
      "You'd be glad to own a solid stock, but only at a lower price. Sell a put at that price and collect a premium while you wait.",
    maxProfit: "The premium you collected — kept in full if the stock stays above your strike.",
    maxLoss:
      "If the stock falls, you buy it at your strike (cash set aside covers it). Your loss is the drop below that price, softened by the premium.",
    teaches:
      "How selling an option collects a premium, what a strike is, and the obligation you take on in exchange for getting paid.",
  },
  {
    id: "covered-call",
    name: "Covered Call",
    level: 1,
    order: 1,
    code: "202",
    risk: "defined",
    summary: "Own 100 shares and sell a call against them to harvest income.",
    whenToUse:
      "You hold shares in a calm-to-slightly-rising stock and want to earn income while it drifts. You sell a call and pocket the premium.",
    maxProfit: "The premium plus any gain up to the strike — the shares get called away above it.",
    maxLoss:
      "You still own the shares, so a big drop hurts as it would anyway — but the premium cushions it.",
    teaches:
      "The mirror image of the put: how holding the underlying lets you sell upside for income, and the trade-off of capping your gains.",
  },
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    level: 2,
    order: 0,
    risk: "defined",
    summary: "Bet on a measured move up, with the cost and the risk both capped.",
    whenToUse:
      "You expect a stock to rise, but not moon. Buy a call and sell a higher one to lower your cost and define your risk.",
    maxProfit:
      "The distance between the two strikes, minus what you paid — capped at the top strike.",
    maxLoss: "Limited to the net premium you paid. That's the whole downside, known up front.",
    teaches:
      "How combining two options (a spread) caps both cost and risk — your first multi-leg play and the idea of defined risk.",
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    level: 3,
    order: 0,
    risk: "defined",
    summary: "Profit when a stock stays range-bound — collect the credit if it goes nowhere.",
    whenToUse:
      "You think a stock will churn sideways. Sell a put spread and a call spread around the range and keep the credit if it stays put.",
    maxProfit: "The net credit collected — kept if price finishes between your short strikes.",
    maxLoss:
      "Capped by the width of the spreads minus the credit. Defined, but larger than the profit.",
    teaches:
      "How to profit from low volatility and time decay, and how four legs combine into a defined-risk range bet.",
  },
  {
    id: "butterfly",
    name: "Butterfly",
    level: 3,
    order: 1,
    risk: "defined",
    summary: "A precise bet that a stock pins a specific price at expiration.",
    whenToUse:
      "You expect a stock to land near a particular level. The butterfly pays the most if it finishes right at the center strike.",
    maxProfit: "Largest at the center strike; a small, cheap ticket for a targeted payoff.",
    maxLoss: "Limited to the small premium paid — low cost, low probability, defined risk.",
    teaches:
      "Precision and probability: how a cheap, defined-risk structure can target an exact outcome.",
  },
  {
    id: "long-strangle",
    name: "Long Strangle",
    level: 3,
    order: 2,
    risk: "defined",
    summary: "Win on a big move in either direction — you don't need to pick the way.",
    whenToUse:
      "You expect a large move but aren't sure which way (earnings, a catalyst). Buy an out-of-the-money call and put.",
    maxProfit: "Effectively uncapped on a large move — the bigger the break, the better.",
    maxLoss:
      "Limited to the premium paid for both legs, if the stock sits still and both expire worthless.",
    teaches:
      "How to buy volatility itself, and why a still market is the enemy of a long options position (time decay).",
  },
  {
    id: "short-straddle",
    name: "Short Straddle",
    level: 4,
    order: 0,
    risk: "undefined",
    summary: "Sell premium betting a stock barely moves — high income, uncapped risk.",
    whenToUse:
      "You expect dead-calm and rich premium. Sell a call and a put at the same strike and collect both — but a big move cuts deep.",
    maxProfit: "The two premiums collected — kept if the stock pins the strike.",
    maxLoss:
      "UNCAPPED. A large move in either direction can lose far more than you collected. This is why it's the last level.",
    teaches:
      "The danger of undefined risk: how selling naked premium inverts the strangle's payoff and demands real discipline.",
  },
  {
    id: "call-ladder",
    name: "Call Ladder",
    level: 4,
    order: 1,
    risk: "undefined",
    summary: "A layered call structure with room to run — and a tail risk to respect.",
    whenToUse:
      "You want upside exposure with reduced cost by selling extra calls — but the extra short call opens uncapped risk above.",
    maxProfit: "Defined in the middle range where the structure pays.",
    maxLoss:
      "Open-ended above the top strike if the stock runs hard — an advanced, undefined-risk tail.",
    teaches:
      "How stacking legs (a ladder) reshapes a payoff, and how an extra short leg can quietly reintroduce uncapped risk.",
  },
];

/** Plays at a given level, in teaching order. */
export function playsAtLevel(level: PlayLevel): readonly Play[] {
  return PLAYS.filter((p) => p.level === level).sort((a, b) => a.order - b.order);
}

/** The very first play a new trader should learn — the ladder's bottom rung. */
export function firstPlay(): Play {
  return [...PLAYS].sort((a, b) => a.level - b.level || a.order - b.order)[0] as Play;
}

/**
 * Which plays a learner at `unlockedLevel` may currently SELECT. Everything at or below their level
 * is available; higher levels stay withheld until they graduate. One place enforces "know your
 * audience" for every surface (academy, and a future in-app picker).
 */
export function unlockedPlays(unlockedLevel: PlayLevel): readonly Play[] {
  return PLAYS.filter((p) => p.level <= unlockedLevel);
}

/** True when a play is still withheld for a learner at `unlockedLevel`. */
export function isLocked(play: Play, unlockedLevel: PlayLevel): boolean {
  return play.level > unlockedLevel;
}
