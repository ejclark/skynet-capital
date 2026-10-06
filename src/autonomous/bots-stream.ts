import { unmanagedTickers } from "../domain/bots-universe.js";
import type { Portfolio } from "../domain/types.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";
import { isOccSymbol } from "../trading/option-symbols.js";

/**
 * What the bots' one price stream carries, kept current without a restart (#4777).
 *
 * The stream used to be the ten names fixed at boot, so a playbook trading anything else had no
 * quote and could never enter: G1-GOOG trades GOOG, the list carries GOOGL, and the bot sat "● On"
 * forever with nothing bought. It now carries the ten names, plus every ticker an enabled playbook
 * on any bot trades, plus every share ticker any bot holds — recomputed on every roster swap (the
 * Store's subscriptions, an options-level change) and on every cycle's portfolio read.
 *
 * Never the registry's whole list: a ticker nobody enabled is a ticker nobody asked to price. And
 * the extra quotes never widen a base persona's universe — `personas/universe-view.ts` cuts its
 * view back to the ten names; only the playbook that asked for a ticker sees it.
 *
 * A held ticker stays streamed after its playbook leaves, so the lot keeps a LIVE price for equity
 * and the daily-loss breaker; a ticker that leaves the stream leaves the momentum tracker too
 * (`MomentumTracker.track`), so a frozen price is never restamped as fresh.
 */

/** One bot's roster, as far as the stream cares — `BotRoster` satisfies it. */
export interface StreamRoster {
  readonly bot: { readonly persona: { readonly id: string } };
  readonly enabled: readonly EnabledPlaybook[];
}

/** The stream's symbol set: the universe in its own order, then everything else, sorted. */
export function streamedSymbols(
  universe: readonly string[],
  rosters: readonly Pick<StreamRoster, "enabled">[],
  held: Iterable<string>,
): string[] {
  const extra = new Set<string>(held);
  for (const roster of rosters) {
    for (const { playbook } of roster.enabled) {
      for (const symbol of playbook.symbols) extra.add(symbol);
    }
  }
  for (const symbol of universe) extra.delete(symbol);
  return [...universe, ...[...extra].sort()];
}

/** The share tickers a portfolio holds. Option contracts are priced off the option market, never
 *  the stock stream, so an OCC symbol is never subscribed. */
export function heldShareSymbols(portfolio: Portfolio): string[] {
  return portfolio.positions
    .filter((p) => p.quantity !== 0 && !isOccSymbol(p.symbol))
    .map((p) => p.symbol);
}

export interface BotsStream {
  /** Recompute from the current rosters and the last holdings read; resubscribes only on a change. */
  refresh(): void;
  /** A fresh read of every bot's portfolio, aligned with `rosters()` by index. */
  observeHoldings(portfolios: readonly Portfolio[]): void;
  /** What the stream carries now. */
  symbols(): readonly string[];
}

export function followBotsStream(deps: {
  readonly stream: { resubscribe(symbols: readonly string[]): void };
  readonly tracker: { track(symbols: readonly string[]): void };
  readonly universe: readonly string[];
  readonly rosters: () => readonly StreamRoster[];
  readonly log?: (line: string) => void;
}): BotsStream {
  const log = deps.log ?? (() => undefined);
  let current: readonly string[] | undefined;
  let held: readonly string[] = [];
  let unmanagedSeen = "";

  const refresh = () => {
    const next = streamedSymbols(deps.universe, deps.rosters(), held);
    const before = current;
    if (before && before.length === next.length && before.every((s, i) => s === next[i])) return;
    current = next;
    deps.stream.resubscribe(next);
    deps.tracker.track(next);
    const added = before ? next.filter((s) => !before.includes(s)) : [];
    const dropped = before ? before.filter((s) => !next.includes(s)) : [];
    const delta = [...added.map((s) => `+${s}`), ...dropped.map((s) => `-${s}`)].join(" ");
    log(`[market-data] streaming ${next.join(", ")}${delta ? ` (${delta}) — no restart` : ""}`);
  };

  // A lot no playbook on its bot trades, outside the ten names its persona sees: priced, but
  // nothing on that bot will ever sell it. Said once per change, never every cycle.
  const warnUnmanaged = (portfolios: readonly Portfolio[]) => {
    const rosters = deps.rosters();
    const lines = portfolios.flatMap((portfolio, i) => {
      const roster = rosters[i];
      if (!roster) return [];
      const managed = new Set(roster.enabled.flatMap((e) => e.playbook.symbols));
      const orphans = unmanagedTickers(heldShareSymbols(portfolio), managed, deps.universe);
      return orphans.length > 0 ? [`${roster.bot.persona.id} holds ${orphans.join(", ")}`] : [];
    });
    const key = lines.join("; ");
    if (key && key !== unmanagedSeen) {
      log(
        `[market-data] UNMANAGED: ${key} — no playbook it runs trades it and its persona sees only the ten names; kept priced, but nothing will sell it`,
      );
    }
    unmanagedSeen = key;
  };

  return {
    refresh,
    observeHoldings(portfolios) {
      held = [...new Set(portfolios.flatMap(heldShareSymbols))];
      warnUnmanaged(portfolios);
      refresh();
    },
    symbols: () => current ?? deps.universe,
  };
}
