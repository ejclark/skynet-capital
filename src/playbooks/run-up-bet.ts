import { optionBook } from "../domain/option-book.js";
import { heldQuantity } from "../domain/portfolio.js";
import type { OrderIntent, Portfolio } from "../domain/types.js";
import { spreadShape } from "./call-spread.js";
import { findPair, type StrategyId } from "./pair-table.js";
import { type EnabledPlaybook, isExitIntent } from "./playbook.js";

/**
 * ONE RUN-UP BET PER ACCOUNT (#4469 slice 2e, call 5) — while an account holds a run-up bet on one
 * ticker, neither run-up strategy opens on a second. A "run-up bet" is shares held on a ticker the
 * pre-print run-up trades, or an open call-spread vertical on a ticker the call spread trades; the
 * two are one kind of bet because they ride the same thing, a stock rallying into its print.
 *
 * WHY: the sweep (`docs/research/multi-symbol-sweep.md`) found peers rally through each other's
 * windows, so two run-up bets at once are one bet counted twice, not two bets. The falsifier is
 * dated on the plan: its re-run after the Feb 2027 prints, by 2027-03-31, finding peers decoupled.
 *
 * WHAT IT DOES NOT TOUCH. Exits always pass — an open position is managed to exit by the strategy
 * that opened it, held or not. The SAME ticker is not a second bet (the spread beside the run-up on
 * NVDA is today's hand-off, `option-ownership.ts`, which decides who trades it). A member-authored
 * play has no pair-table row and is never counted or refused: it is the member's own bet (#809).
 *
 * WHAT IT READS. The roster says which tickers the account's run-up strategies trade; the portfolio
 * says which of them it holds. Positions carry no record of their opener (`spreadShape`'s doc), so
 * shares on a run-up ticker are read as the run-up's own — the ownership rule already keeps every
 * other playbook off a ticker a run-up trades. A run-up unsubscribed while it holds shares stops
 * being counted: nothing on the roster can say those shares are its own any longer.
 *
 * One pass, in roster order: when two run-up strategies would open on different tickers in the same
 * cycle, the first intent wins and the later one waits for the next cycle's read.
 */

const RUN_UP_STRATEGIES: ReadonlySet<StrategyId> = new Set(["pre-print-run-up", "call-spread"]);

/** The run-up strategy a playbook id is a pair of, or undefined for anything else (an authored play, SAURON). */
function runUpStrategyOf(playbookId: string | undefined): StrategyId | undefined {
  const strategy = playbookId === undefined ? undefined : findPair(playbookId)?.strategy;
  return strategy !== undefined && RUN_UP_STRATEGIES.has(strategy) ? strategy : undefined;
}

/** Whether the portfolio holds this entry's own kind of bet on its ticker. */
function holdsBet(entry: EnabledPlaybook, portfolio: Portfolio): boolean {
  const ticker = entry.playbook.symbols[0];
  if (ticker === undefined) return false;
  return runUpStrategyOf(entry.playbook.id) === "call-spread"
    ? spreadShape(optionBook(portfolio, ticker)).kind === "vertical"
    : heldQuantity(portfolio, ticker) > 0;
}

/** The tickers the account holds a run-up bet on, by the run-up strategies the roster enables. */
export function runUpBetTickers(
  enabled: readonly EnabledPlaybook[],
  portfolio: Portfolio,
): ReadonlySet<string> {
  const held = new Set<string>();
  for (const entry of enabled) {
    if (runUpStrategyOf(entry.playbook.id) === undefined || !holdsBet(entry, portfolio)) continue;
    for (const symbol of entry.playbook.symbols) held.add(symbol);
  }
  return held;
}

/**
 * The cycle's intents with every second-ticker run-up open removed. Each refusal is reported once
 * to `refuse` as one plain line (the caller dedupes across cycles); everything else comes back in
 * order, unchanged.
 */
export function oneRunUpBet(
  enabled: readonly EnabledPlaybook[],
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  refuse: (line: string) => void = () => undefined,
): OrderIntent[] {
  const bets = new Set(runUpBetTickers(enabled, portfolio));
  return intents.filter((intent) => {
    if (runUpStrategyOf(intent.playbookId) === undefined || isExitIntent(intent)) return true;
    const other = [...bets].find((ticker) => ticker !== intent.symbol);
    if (other !== undefined) {
      refuse(
        `${intent.playbookId} refused — the account already holds a run-up bet on ${other}, ` +
          `so it does not open one on ${intent.symbol} too`,
      );
      return false;
    }
    bets.add(intent.symbol);
    return true;
  });
}
