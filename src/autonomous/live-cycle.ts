import type { MarketContext, OrderIntent, OrderResult } from "../domain/types.js";
import type { RiskConfig } from "../engine/guards.js";
import { applyGuards } from "../engine/guards.js";
import { betaScoutExitIntents, betaScoutIntents } from "../playbooks/beta-scout.js";
import type { BrokerPort } from "../ports/broker.js";
import type { AutonomousTrader, TraderMode } from "./autonomous-trader.js";
import type { DecisionRecord, IntentOutcome } from "./decision-record.js";
import { fleetEquity } from "./equity-watch.js";
import type { SafetyController } from "./safety.js";

/**
 * The live per-cycle orchestration core (`docs/GAPS-2026-08.md` item 7) — the reusable half of
 * `run-autonomous.ts`'s `runLive()`, split out on the same shape as `runtime/run-cycle.ts`: pure,
 * dependency-injected orchestration logic (equity marking, per-bot evaluation, the beta scout)
 * with every broker, the safety controller, and every side-effect (logging, the audit sink)
 * passed in — nothing constructed here, nothing imported from an Alpaca/network module. The
 * script keeps the wiring: constructing real brokers, the market-hours throttle, and turning
 * these hooks into console output.
 */

/** One live bot: its broker (for equity marks + scout portfolio reads) and its already-wired
 *  `AutonomousTrader` (which owns its own persona, risk, cooldown, and kill-switch check). */
export interface LiveBot {
  readonly personaName: string;
  readonly broker: BrokerPort;
  readonly trader: AutonomousTrader;
}

/** Beta-scout configuration (`src/playbooks/beta-scout.ts`) — absent/zero-picks means dark. */
export interface BetaScoutDeps {
  readonly maxPicks: number;
  readonly broker: BrokerPort;
  readonly universe: readonly string[];
  readonly managedSymbols: ReadonlySet<string>;
  readonly risk: RiskConfig;
  readonly mode: TraderMode;
}

export interface LiveCycleDeps {
  readonly traders: readonly LiveBot[];
  readonly safety: SafetyController;
  readonly scout?: BetaScoutDeps;
  /**
   * The kill-switch/breaker gate consulted before every scout submission. Kept as its own
   * injection point rather than reading `safety.blockedReason()` directly: the live script's
   * version also polls a halt file (filesystem I/O with no place in this pure core), and each
   * trader's own gate is already baked into its `AutonomousTrader` at construction.
   */
  readonly blockedReason: () => string | null;
  /** Injectable clock (ms) for the scout's `DecisionRecord.at` — fixed in tests. */
  readonly now?: () => number;
  /** Every order the scout itself submits (bots report their own via their `AutonomousTrader`). */
  readonly onResult?: (result: OrderResult) => void;
  /** The scout's own per-cycle decision record (bots emit theirs via their own `AutonomousTrader`). */
  readonly onDecision?: (record: DecisionRecord) => void;
  readonly onEquityReadError?: (error: unknown) => void;
  readonly onEvalError?: (personaName: string, error: unknown) => void;
  readonly onBetaScoutError?: (error: unknown) => void;
  readonly onScoutHalted?: (reason: string) => void;
  readonly onScoutObserve?: (intent: OrderIntent) => void;
}

/**
 * Runs the live decision loop cycle by cycle. A class (not a bare function) because the beta
 * scout is stateful ACROSS cycles — which day it last ran, whether it already fired today, and
 * which symbols it still owns — the same reason `AutonomousTrader` is a class rather than a
 * function (its per-symbol cooldown map). Construct once per process; call `runCycle` on every
 * throttled tick.
 */
export class LiveCycleRunner {
  private readonly deps: LiveCycleDeps;
  private scoutDay = "";
  private scoutRanToday = false;
  private scoutFiredOrganicallyToday = false;
  private readonly scoutOwnedSymbols = new Set<string>();

  constructor(deps: LiveCycleDeps) {
    this.deps = deps;
  }

  /**
   * One decision cycle: data-gap check, mark the fleet's equity into the daily-loss breaker,
   * evaluate every bot (tracking whether anything organic fired), then let the beta scout fill
   * the silence if nothing did. Mirrors `maybeEvaluate` in the original script exactly — the
   * throttle/market-hours gate around calling this stays in the script as wiring.
   */
  async runCycle(context: MarketContext): Promise<void> {
    const { safety, traders } = this.deps;
    safety.checkContext(context); // data-gap breaker — a blind bot must not trade

    // Daily-loss breaker feed: mark the fleet to this cycle's quotes BEFORE evaluating, so a
    // breach halts this very cycle. A failed read is skipped — the breaker judges real equity
    // only, never an outage (the error/data-gap breakers own outages).
    try {
      const portfolios = await Promise.all(traders.map((t) => t.broker.getPortfolio()));
      safety.recordEquity(fleetEquity(portfolios, context));
    } catch (error) {
      this.deps.onEquityReadError?.(error);
    }

    let firedOrganicallyThisCycle = false;
    for (const bot of traders) {
      try {
        const results = await bot.trader.evaluate(context);
        if (results.length > 0) {
          firedOrganicallyThisCycle = true;
        }
        safety.recordSuccess();
      } catch (error) {
        safety.recordError();
        this.deps.onEvalError?.(bot.personaName, error);
      }
    }

    // Beta scout runs AFTER every bot's organic evaluation this cycle, so a real signal always
    // gets first chance — the scout only fills the silence, never races an organic trade for the
    // fill.
    try {
      await this.runBetaScout(context, firedOrganicallyThisCycle);
    } catch (error) {
      this.deps.onBetaScoutError?.(error);
    }
  }

  // `firedOrganicallyThisCycle` is applied AFTER the day-rollover reset below, not before —
  // otherwise the first cycle of a new day that also happens to carry an organic fire would set
  // the flag and then immediately have the rollover wipe it back to false, letting the scout
  // fire anyway (docs/LESSONS.md, 2026-08-13).
  private async runBetaScout(
    context: MarketContext,
    firedOrganicallyThisCycle: boolean,
  ): Promise<void> {
    const scout = this.deps.scout;
    if (!scout || scout.maxPicks <= 0) {
      return;
    }
    const today = context.asOf.slice(0, 10);
    if (today !== this.scoutDay) {
      this.scoutDay = today;
      this.scoutRanToday = false;
      this.scoutFiredOrganicallyToday = false;
      if (this.scoutOwnedSymbols.size > 0) {
        const portfolio = await scout.broker.getPortfolio();
        const exits = betaScoutExitIntents(portfolio, this.scoutOwnedSymbols);
        for (const exit of exits) {
          this.scoutOwnedSymbols.delete(exit.symbol);
        }
        await this.submitScoutIntents(exits, scout);
      }
    }
    if (firedOrganicallyThisCycle) {
      this.scoutFiredOrganicallyToday = true;
    }
    if (this.scoutRanToday || this.scoutFiredOrganicallyToday) {
      return;
    }
    this.scoutRanToday = true; // set BEFORE acting — a failed submit must not retry every cycle
    const portfolio = await scout.broker.getPortfolio();
    const guarded = applyGuards(
      betaScoutIntents(context, portfolio, scout.universe, scout.managedSymbols, false, {
        maxPicks: scout.maxPicks,
      }),
      portfolio,
      context,
      scout.risk,
    );
    for (const intent of guarded) {
      this.scoutOwnedSymbols.add(intent.symbol);
    }
    await this.submitScoutIntents(guarded, scout);
  }

  private async submitScoutIntents(intents: OrderIntent[], scout: BetaScoutDeps): Promise<void> {
    if (intents.length === 0) {
      return;
    }
    const blocked = this.deps.blockedReason();
    if (blocked) {
      this.deps.onScoutHalted?.(blocked);
      return;
    }
    const now = this.deps.now ?? Date.now;
    const outcomes: IntentOutcome[] = [];
    for (const intent of intents) {
      if (scout.mode !== "live") {
        this.deps.onScoutObserve?.(intent);
        outcomes.push({ intent, action: "observed" });
        continue;
      }
      const result = await scout.broker.submit(intent);
      this.deps.safety.recordOrder();
      this.deps.onResult?.(result);
      outcomes.push({ intent, action: result.status === "filled" ? "placed" : "rejected", result });
    }
    this.deps.onDecision?.({
      at: now(),
      personaId: "beta-scout",
      mode: scout.mode,
      rawIntents: intents,
      guardedIntents: intents,
      outcomes,
    });
  }
}
