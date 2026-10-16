/**
 * OBSERVE A PLAY'S TARGET ON A LIVE BOOK (#5483 slice 3; plan #5494 step 3). A wrapper over the
 * composed persona that reads each subscribed play's book against its target and logs what the
 * band rebalancer WOULD do. It places nothing: `decide` returns the inner persona's intents, the
 * very same array, after the observation, so no code path from a reading reaches an order, a size,
 * a cancel or a held-back intent. A reading that throws is said once and the decision goes on.
 *
 * WHAT IT READS. A play's budget is its ceiling (`capitalAllocated`). What is deployed is the
 * engine's own commitment (`committedToPlaybook`): the basket's shares at their marks, the cash a
 * sold put sets aside, and the long contracts at their marks; holding is the ceiling less what the
 * deployed positions cost. A play with no budget has no ceiling, so it is said once and not read.
 * The math is the backtest's (`play-target.ts`).
 *
 * WHICH PLAYS. A subscription carries its own target (`playTarget`), checked against its
 * playbook's bounds; one the bounds refuse is said once and not observed. A subscription with none
 * is observed only if it is the FIRST-RUN play below. The backtest's call was to run the band first
 * on the CRWV books (the one name where it beat holding everything), and that wheel is on Sauron's
 * account, so that is the one bot: one play, the default target. Its owner's target replaces the
 * default the day one is written. Every other bot's persona comes back unwrapped.
 *
 * WHAT IT SAYS, AND WHEN. A line when a play is first read (its target, what the edges mean as a
 * price move, where it stands), and a line each time its level changes (inside, signal, gate), so a
 * signal that never reaches its gate shows as a signal. Not a line per cycle.
 *
 * FALSIFIER. The first-run target is the account-level default applied to one play. If by
 * 2026-11-30 it sat at the gate level on more than half of the cycles it was read, that target does
 * not describe how the play is run: re-set it from the play's own sizing before any action is
 * wired.
 */

import { bookNeeds } from "../domain/option-book.js";
import { positionFor, positionValue } from "../domain/portfolio.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  PlayTarget,
  Portfolio,
} from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import { contractMultiplier, parseOccSymbol } from "../trading/option-symbols.js";
import {
  type BandLevel,
  DEFAULT_PLAY_TARGET,
  HOUSE_PLAY_BOUNDS,
  type PlayBook,
  type PlayReading,
  type ResolvedPlayTarget,
  readPlayTarget,
  resolvePlayTarget,
  tripMoves,
} from "./play-target.js";
import type { EnabledPlaybook } from "./playbook.js";

/** Where observations go: a line-based log, the same idiom as the mixed-signals sink. */
export interface TargetObservationSink {
  log(line: string): void;
}

/** The plays observed with the default target when their subscription states none: one bot. */
export const FIRST_RUN_PLAY_TARGETS: readonly {
  readonly accountId: string;
  readonly playbookId: string;
  readonly target: PlayTarget;
}[] = [{ accountId: "sauron", playbookId: "CRWV-WHEEL", target: DEFAULT_PLAY_TARGET }];

export interface TargetObservationDeps {
  /** The bot these plays belong to (a persona id, as subscriptions are keyed). */
  readonly accountId: string;
  readonly subscriptions: readonly PlaybookSubscription[];
  readonly enabled: readonly EnabledPlaybook[];
  readonly log: TargetObservationSink;
  /** Overridable for specs; the live wiring uses the table above. */
  readonly firstRun?: typeof FIRST_RUN_PLAY_TARGETS;
}

/**
 * One play's book, off the portfolio. Long shares and long contracts count as deployed; a sold
 * put's collateral counts as deployed too (it is the play's commitment, #5483 amendment 6), at the
 * cash it sets aside.
 */
export function playBookOf(
  portfolio: Portfolio,
  context: MarketContext,
  symbols: readonly string[],
  ceiling: number,
): PlayBook {
  let active = 0;
  let deployedCost = 0;
  for (const symbol of symbols) {
    const held = positionFor(portfolio, symbol);
    if (held && held.quantity > 0) {
      active += positionValue(held, context.quotes[symbol]?.last);
      deployedCost += held.quantity * held.avgPrice;
    }
  }
  for (const position of portfolio.positions) {
    const parts = parseOccSymbol(position.symbol);
    if (parts && position.quantity > 0 && symbols.includes(parts.underlying)) {
      active += positionValue(position, undefined);
      deployedCost += position.quantity * position.avgPrice * contractMultiplier(position.symbol);
    }
  }
  const collateral = bookNeeds(portfolio).cashByUnderlying;
  for (const symbol of symbols) {
    const cash = collateral.get(symbol) ?? 0;
    active += cash;
    deployedCost += cash;
  }
  return { ceiling, active, deployedCost };
}

const points = (n: number): number => Math.round(n * 1000) / 10;
const pct = (n: number): string => `${points(n)}%`;
const signedPts = (n: number): string => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}`;
const usd = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;
const NOTE = "(SIM, observe-only: no order placed, changed or held back)";

function watchingLine(
  who: string,
  target: ResolvedPlayTarget,
  ceiling: number,
  reading: PlayReading,
): string {
  const { signal, gate } = tripMoves(target);
  const rise = (m: number) => (Number.isFinite(m) ? `a ${pct(m)} rise` : "no rise");
  return (
    `${who}: watching. Target ${pct(target.weight)} of its ${usd(ceiling)} budget deployed ` +
    `(lean ${pct(target.lean.min)} to ${pct(target.lean.max)}); signal at ${points(target.band.signal)} ` +
    `points, gate at ${points(target.band.gate)}. From the center, a ${pct(-signal.fall)} fall or ` +
    `${rise(signal.rise)} in the position trips the signal, a ${pct(-gate.fall)} fall or ` +
    `${rise(gate.rise)} the gate. Now ${pct(reading.share)} (${signedPts(reading.drift)} points): ` +
    `${reading.level}. ${NOTE}`
  );
}

function changeLine(who: string, asOf: string, from: BandLevel, reading: PlayReading): string {
  const where =
    `${pct(reading.share)} deployed vs a ${pct(reading.target)} target ` +
    `(${signedPts(reading.drift)} points; ${usd(reading.active)} active, ${usd(reading.holding)} holding)`;
  if (reading.level === "inside") {
    return `${who} @ ${asOf}: back inside its band from ${from}: ${where}. ${NOTE}`;
  }
  return `${who} @ ${asOf}: ${reading.level} (${reading.direction}): ${where}. Would: ${reading.wouldDo}. ${NOTE}`;
}

interface Watched {
  readonly who: string;
  readonly playbookId: string;
  readonly symbols: readonly string[];
  readonly ceiling: number | undefined;
  readonly target: ResolvedPlayTarget;
}

/** Which plays carry a target this build can observe, and why each other one is not. */
function watchedPlays(deps: TargetObservationDeps): Watched[] {
  const firstRun = deps.firstRun ?? FIRST_RUN_PLAY_TARGETS;
  const watched: Watched[] = [];
  for (const sub of deps.subscriptions) {
    if (!sub.enabled) continue;
    const own =
      sub.playTarget ??
      firstRun.find((f) => f.accountId === deps.accountId && f.playbookId === sub.playbookId)
        ?.target;
    const entry = deps.enabled.find((e) => e.playbook.id === sub.playbookId);
    if (!(own && entry)) continue;
    const who = `[play-target] ${deps.accountId} ${sub.playbookId}`;
    const resolved = resolvePlayTarget(own, entry.playbook.targetBounds ?? HOUSE_PLAY_BOUNDS);
    if (!resolved.ok) {
      deps.log.log(`${who}: target ignored, ${resolved.reason}. ${NOTE}`);
      continue;
    }
    watched.push({
      who,
      playbookId: sub.playbookId,
      symbols: entry.playbook.symbols,
      ceiling:
        sub.capitalAllocated !== undefined && sub.capitalAllocated > 0
          ? sub.capitalAllocated
          : undefined,
      target: resolved.target,
    });
  }
  return watched;
}

export function withTargetObservation(inner: Persona, deps: TargetObservationDeps): Persona {
  const watched = watchedPlays(deps);
  if (watched.length === 0) return inner;
  const lastLevel = new Map<string, BandLevel>();
  const told = new Set<string>();
  const saidOnce = (key: string, line: string): void => {
    if (told.has(key)) return;
    told.add(key);
    deps.log.log(line);
  };

  const observe = (context: MarketContext, portfolio: Portfolio): void => {
    for (const play of watched) {
      if (play.ceiling === undefined) {
        saidOnce(
          `${play.playbookId}|budget`,
          `${play.who}: no budget set, so there is no ceiling to read its target against ${NOTE}`,
        );
        continue;
      }
      const reading = readPlayTarget(
        play.target,
        playBookOf(portfolio, context, play.symbols, play.ceiling),
      );
      const before = lastLevel.get(play.playbookId);
      lastLevel.set(play.playbookId, reading.level);
      if (before === undefined) {
        deps.log.log(watchingLine(play.who, play.target, play.ceiling, reading));
      } else if (before !== reading.level) {
        deps.log.log(changeLine(play.who, context.asOf, before, reading));
      }
    }
  };

  return {
    ...inner,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const intents = inner.decide(context, portfolio);
      try {
        observe(context, portfolio);
      } catch (error) {
        try {
          saidOnce(
            "failed",
            `[play-target] ${deps.accountId}: reading failed (${error instanceof Error ? error.message : String(error)}); trading goes on ${NOTE}`,
          );
        } catch {
          // The log itself is down: the observation is lost, the decision is not.
        }
      }
      return intents;
    },
  };
}
