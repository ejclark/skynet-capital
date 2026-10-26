/**
 * A PLAY'S TARGET WEIGHT, LEAN AND BAND (#5483 slice 3, criterion 13), the pure half: what a play's
 * target may be, and what the band says about a book. OBSERVE-ONLY: nothing here returns an order,
 * an intent or anything a caller could place. `with-target-observation.ts` reads a live book with
 * it and logs; acting on a reading is a later slice.
 *
 * THE MODEL (amendment 6): the play's budget is its ceiling. The TARGET WEIGHT is the share of that
 * ceiling it keeps deployed at center; the LEAN is how far the target shifts right now, inside a
 * range the owner sets; the BAND is how far the actual share may drift from the leaned target. The
 * ceiling is the owner's, never raised here.
 *
 * THE MATH IS THE BACKTEST'S (`scripts/research/rebalance-band-math.mjs`, #5509): the share is
 * `activeShare(active, holding)` and a move trips a band on `|share - target| > band`, the same rule
 * `simulate` ran over the history that chose the defaults below. Holding is the part of the budget
 * not deployed at cost, so a price move changes the share the way it changed the backtest's.
 *
 * TWO LEVELS PER THRESHOLD (amendment 3, criterion 10). A SIGNAL (soft): past the band's first
 * edge, capital keeps flowing and the reading is recorded. A GATE (hard): past its second edge, the
 * move or new entry would stop until the reading recovers or the owner resets it. A gate stops
 * entries and moves, never an exit. Both levels are in every reading so their hit rates can be
 * compared across plays. In this slice neither one stops anything.
 *
 * THE DEFAULTS are the backtest's ship call (30% holding, a +/-5-point band: 70% weight, signal at
 * 5, gate at 10), applied as the lean range 60-80% (the holding range 20-40% it tested). The
 * outer bounds are the widest numbers that study or amendment 3 names: a weight and a lean inside
 * 60-80%, a signal up to 15 points (the widest band it ran) and a gate up to 20 (amendment 3's
 * original gate). A setting may only NARROW them (`resolvePlayTarget`); widening one is a
 * study's job, not a subscription's.
 *
 * LEAN has no source yet. Criterion 13 lets the lean come only from a recorded signal (the cycle
 * reading, a conviction claim), and neither exists, so every reading here leans by 0 points; the
 * range is stored and validated now so the signal slice adds one input, not a field.
 */

import { activeShare, triggerMoves } from "../../scripts/research/rebalance-band-math.mjs";
import type { PlayTarget } from "../domain/types.js";

/** What a playbook allows its plays' targets to be; a subscription's target may only sit inside. */
export interface PlayTargetBounds {
  /** The weight, and so the whole lean range, must sit inside this. */
  readonly weight: { readonly min: number; readonly max: number };
  /** The widest signal edge, in points of share. */
  readonly signalMax: number;
  /** The widest gate edge, in points of share. */
  readonly gateMax: number;
}

/** The bounds a playbook that declares none has: the ranges the backtest and amendment 3 cover. */
export const HOUSE_PLAY_BOUNDS: PlayTargetBounds = {
  weight: { min: 0.6, max: 0.8 },
  signalMax: 0.15,
  gateMax: 0.2,
};

/** The first-run target: the backtest's default, 30% holding with a +/-5-point band, gate at 10. */
export const DEFAULT_PLAY_TARGET: PlayTarget = {
  weight: 0.7,
  lean: { min: 0.6, max: 0.8 },
  band: { signal: 0.05, gate: 0.1 },
};

/** A target with nothing left to fill in: what a reading is taken against. */
export interface ResolvedPlayTarget {
  readonly weight: number;
  readonly lean: { readonly min: number; readonly max: number };
  readonly band: { readonly signal: number; readonly gate: number };
}

export type PlayTargetResolution =
  | { readonly ok: true; readonly target: ResolvedPlayTarget }
  | { readonly ok: false; readonly reason: string };

const EPS = 1e-9;
const LEAN_REACH = 0.1;
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;
const pts = (n: number): string => `${round4(n * 100)}`;
const inside = (n: number, lo: number, hi: number): boolean => n >= lo - EPS && n <= hi + EPS;
const refuse = (reason: string): PlayTargetResolution => ({ ok: false, reason });

/**
 * A target filled in and checked against the playbook's bounds, or the reason it was refused.
 * A missing lean defaults to 10 points either side of the weight, a missing band to the default
 * edges, each clipped to the bounds. A value outside the bounds is refused whole, never clamped:
 * a target the owner did not write is not one to observe.
 */
export function resolvePlayTarget(
  raw: PlayTarget,
  bounds: PlayTargetBounds = HOUSE_PLAY_BOUNDS,
): PlayTargetResolution {
  const { weight } = raw;
  if (!(weight > 0 && weight < 1))
    return refuse(`a weight of ${pts(weight)}% is not a share of a budget`);
  if (!inside(weight, bounds.weight.min, bounds.weight.max)) {
    return refuse(
      `a ${pts(weight)}% weight is outside this playbook's ${pts(bounds.weight.min)}-${pts(bounds.weight.max)}%`,
    );
  }
  const lean = raw.lean ?? {
    min: round4(Math.max(bounds.weight.min, weight - LEAN_REACH)),
    max: round4(Math.min(bounds.weight.max, weight + LEAN_REACH)),
  };
  if (!(lean.min <= lean.max && inside(weight, lean.min, lean.max))) {
    return refuse(
      `the lean range ${pts(lean.min)}-${pts(lean.max)}% does not contain the ${pts(weight)}% weight`,
    );
  }
  if (
    !(
      inside(lean.min, bounds.weight.min, bounds.weight.max) &&
      inside(lean.max, bounds.weight.min, bounds.weight.max)
    )
  ) {
    return refuse(
      `the lean range ${pts(lean.min)}-${pts(lean.max)}% is wider than this playbook's ${pts(bounds.weight.min)}-${pts(bounds.weight.max)}%`,
    );
  }
  const band = raw.band ?? {
    signal: Math.min(DEFAULT_PLAY_TARGET.band?.signal ?? 0.05, bounds.signalMax),
    gate: Math.min(DEFAULT_PLAY_TARGET.band?.gate ?? 0.1, bounds.gateMax),
  };
  if (!(band.signal > 0 && band.signal < band.gate)) {
    return refuse(
      `the signal edge (${pts(band.signal)}) must be above 0 and below the gate edge (${pts(band.gate)})`,
    );
  }
  if (band.signal > bounds.signalMax + EPS || band.gate > bounds.gateMax + EPS) {
    return refuse(
      `the band ${pts(band.signal)}/${pts(band.gate)} points is wider than this playbook's ${pts(bounds.signalMax)}/${pts(bounds.gateMax)}`,
    );
  }
  return { ok: true, target: { weight, lean, band } };
}

/** The target the band is read against: the weight leaned by `leanPoints`, held inside the range. */
export function leanedTarget(target: ResolvedPlayTarget, leanPoints = 0): number {
  return Math.min(target.lean.max, Math.max(target.lean.min, target.weight + leanPoints));
}

export type BandLevel = "inside" | "signal" | "gate";

/** What a book is, in the three numbers the band needs. */
export interface PlayBook {
  /** The play's budget: the ceiling the share is a share of. */
  readonly ceiling: number;
  /** What is deployed now, at its marks. */
  readonly active: number;
  /** What is deployed, at what it cost. The undeployed part of the ceiling is holding. */
  readonly deployedCost: number;
}

export interface PlayReading {
  readonly level: BandLevel;
  /** Over its target (a rally), under it (a fall), or neither inside the band's own noise. */
  readonly direction: "over" | "under" | null;
  /** Active share of active plus holding, as the backtest measures it. */
  readonly share: number;
  /** The leaned target the share is read against. */
  readonly target: number;
  /** `share - target`, in points of share as a fraction (0.081 = 8.1 points). */
  readonly drift: number;
  readonly active: number;
  readonly holding: number;
  /** Dollars the backtest's rule would move to put the share back on target. */
  readonly moveDollars: number;
  /** In words, what the cascading threshold would do. Observe-only: nothing does it. */
  readonly wouldDo: string;
}

/** Whole dollars with thousands separators ("$12,500") — the wording the play-band lines use. */
export const usdWhole = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

function wouldDo(level: BandLevel, direction: "over" | "under" | null, move: number): string {
  if (level === "inside" || direction === null) return "nothing: inside its band";
  if (level === "signal") {
    return direction === "over"
      ? `record it and tell its owner; capital keeps flowing, and the surplus (about ${usdWhole(move)}) would go to holding through the play's own exits`
      : `record it and tell its owner; capital keeps flowing, and about ${usdWhole(move)} would come out of holding through the play's own new entries`;
  }
  return direction === "over"
    ? "stop new entries into the play until it is back inside the band or its owner resets it; exits are never held back"
    : "stop moving holding into the play until it recovers or its owner resets it; exits are never held back";
}

/**
 * Read one play's book against its target. Pure, and the whole of "what would the rebalancer say":
 * a level, a direction, and the dollars the backtest's rule would move. The strict `>` is the
 * backtest's (`simulate`): a share exactly on an edge is still inside.
 */
export function readPlayTarget(
  target: ResolvedPlayTarget,
  book: PlayBook,
  leanPoints = 0,
): PlayReading {
  const holding = Math.max(0, book.ceiling - book.deployedCost);
  const share = activeShare(book.active, holding);
  const aim = leanedTarget(target, leanPoints);
  const drift = share - aim;
  const level: BandLevel =
    Math.abs(drift) > target.band.gate + EPS
      ? "gate"
      : Math.abs(drift) > target.band.signal + EPS
        ? "signal"
        : "inside";
  const direction = level === "inside" ? null : drift > 0 ? "over" : "under";
  const moveDollars = Math.abs(aim * (book.active + holding) - book.active);
  return {
    level,
    direction,
    share,
    target: aim,
    drift,
    active: book.active,
    holding,
    moveDollars,
    wouldDo: wouldDo(level, direction, moveDollars),
  };
}

/**
 * The price move, from the target, that trips each edge: what "5 points" means on THIS target
 * (the backtest's translation, `triggerMoves`). Falls are negative fractions; a rise that cannot
 * trip an edge is Infinity.
 */
export function tripMoves(target: ResolvedPlayTarget, leanPoints = 0) {
  const aim = leanedTarget(target, leanPoints);
  return {
    signal: triggerMoves(1 - aim, target.band.signal),
    gate: triggerMoves(1 - aim, target.band.gate),
  };
}
