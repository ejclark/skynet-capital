import type {
  MarketContext,
  OrderIntent,
  OrderResult,
  PlaybookMode,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import type { GuardRefusal, RiskConfig } from "../engine/guards.js";
import { applyGuardsWithVerdicts } from "../engine/guards.js";
import { BETA_SCOUT_ID, betaScoutExitIntents, betaScoutIntents } from "../playbooks/beta-scout.js";
import type { BrokerPort } from "../ports/broker.js";
import type { AutonomousTrader, TraderMode } from "./autonomous-trader.js";
import type { ScoutState } from "./bots-state-db.js";
import type { DecisionRecord, IntentOutcome } from "./decision-record.js";
import { fleetEquity } from "./equity-watch.js";
import { actionFor } from "./option-cycle.js";
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

/** The id the beta scout files its decisions under — it trades on the first bot's account. */
export const BETA_SCOUT_PERSONA_ID = "beta-scout";

/** One live bot: its broker (for equity marks + scout portfolio reads) and its already-wired
 *  `AutonomousTrader` (which owns its own persona, risk, cooldown, and kill-switch check). */
export interface LiveBot {
  readonly personaName: string;
  readonly broker: BrokerPort;
  readonly trader: AutonomousTrader;
}

/**
 * Beta-scout configuration (`src/playbooks/beta-scout.ts`) — absent means no host account. Zero
 * picks means disarmed: it picks nothing new, but still sells the picks it already holds on the next
 * trading day, so switching the setting off never strands one.
 */
export interface BetaScoutDeps {
  readonly maxPicks: number;
  readonly broker: BrokerPort;
  readonly universe: readonly string[];
  readonly managedSymbols: ReadonlySet<string>;
  readonly risk: RiskConfig;
  readonly mode: TraderMode;
  /**
   * The host bot's subscriptions as they stand now (#4642 slice 10). The scout opens only while
   * that bot is subscribed to `BETA-SCOUT` with the subscription on — armed (`maxPicks`) AND
   * subscribed. Paused, it picks nothing new; unsubscribed, its picks are refused `unsubscribed`
   * and recorded once a day. Its next-day exits run in every case, disarmed included.
   */
  readonly subscriptions: () => readonly PlaybookSubscription[];
  /** What the scout has realized per playbook, from its OWN decisions (`BETA_SCOUT_PERSONA_ID`,
   *  never the host's), so a compounding BETA-SCOUT subscription grows or shrinks its cap. Absent =
   *  0, the flat cap. */
  readonly realizedPlForPlaybook?: (playbookId: string) => number;
}

/**
 * The host bot's subscriptions, read ONCE per scan (review of slice 10): where it stands on
 * BETA-SCOUT, the mode its orders carry, and the guards they clear (the subscribed-only rule, so an
 * unsubscribed pick is refused by name and every exit passes). One read for all three, so a Store
 * change swapped in while the scan awaits the broker can never let one half see it and not the other.
 */
interface ScoutHost {
  readonly state: "on" | "paused" | "none";
  readonly mode?: PlaybookMode;
  readonly risk: RiskConfig;
}

function readHost(scout: BetaScoutDeps): ScoutHost {
  const subscriptions = scout.subscriptions();
  const risk: RiskConfig = {
    ...scout.risk,
    subscriptions,
    subscribedOnly: true,
    ...(scout.realizedPlForPlaybook ? { realizedPlForPlaybook: scout.realizedPlForPlaybook } : {}),
  };
  const mine = subscriptions.filter((s) => s.playbookId === BETA_SCOUT_ID);
  const on = mine.find((s) => s.enabled);
  if (on) return { state: "on", mode: on.mode, risk };
  return { state: mine.length > 0 ? "paused" : "none", risk };
}

export interface LiveCycleDeps {
  readonly traders: readonly LiveBot[];
  readonly safety: SafetyController;
  readonly scout?: BetaScoutDeps;
  /**
   * Durable home for the scout's day-state (`bots-state-db.ts`'s `scoutStateStore`). Absent =
   * process memory only, today's cold-start behavior. Confirmed live 2026-09-04: without it every
   * restart re-armed the scout for a fresh "day" and it placed another pair of forced picks.
   */
  readonly scoutState?: {
    load(): ScoutState | undefined;
    save(state: ScoutState): void;
  };
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
  /** Every bot's portfolio from the cycle's equity read, in `traders` order — what the price stream
   *  reads to keep a held ticker priced (#4777). Not called when the read failed. */
  readonly onPortfolios?: (portfolios: readonly Portfolio[]) => void;
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
  /** The day an unsubscribed scan was last recorded — once a day, never every cycle. In memory: a
   *  restart records it once more, which costs one record, never an order. */
  private unsubscribedNotedDay = "";
  /** The day a subscribed scan whose every pick the guards refused (a cap below one share, E1
   *  before 10:00…) was last recorded — once a day. Unlike the unsubscribed latch it never stops the
   *  scan: a refusal can lift later the same day. */
  private refusalNotedDay = "";

  constructor(deps: LiveCycleDeps) {
    this.deps = deps;
    const restored = deps.scoutState?.load();
    if (restored) {
      this.scoutDay = restored.day;
      this.scoutRanToday = restored.ranToday;
      this.scoutFiredOrganicallyToday = restored.firedOrganicallyToday;
      for (const symbol of restored.ownedSymbols) this.scoutOwnedSymbols.add(symbol);
    }
  }

  /** Persist the scout's day-state after every transition — best-effort, never on the hot path. */
  private persistScoutState(): void {
    this.deps.scoutState?.save({
      day: this.scoutDay,
      ranToday: this.scoutRanToday,
      firedOrganicallyToday: this.scoutFiredOrganicallyToday,
      ownedSymbols: [...this.scoutOwnedSymbols],
    });
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
      this.deps.onPortfolios?.(portfolios);
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
  /**
   * Stage the scout for a session that has not opened yet (Eric, 2026-09-04): the market is
   * closed, `sessionDay` is the date of Alpaca's `next_open`, and the scout runs its one daily
   * scan NOW against the durable momentum/sentiment windows. Its picks go in as ordinary day
   * market orders, which Alpaca queues and fills at that open — and they SPEND that session's
   * scout budget (`scoutDay` = the session, latched), so the in-hours cycle that day stays
   * silent instead of firing a second pair. The day rollover runs first, exactly as it would at
   * that session's first tick: yesterday's scout picks are exited (queued for the same open).
   * Returns how many picks were submitted; 0 when already staged/run for that session, when the
   * scan is empty (retry later — a weekend of polls costs one portfolio read each), or when dark.
   */
  stageScout(context: MarketContext, sessionDay: string): Promise<number> {
    if (this.scoutDay === sessionDay && (this.scoutRanToday || this.scoutFiredOrganicallyToday)) {
      return Promise.resolve(0);
    }
    return this.runBetaScout(context, false, sessionDay);
  }

  private async runBetaScout(
    context: MarketContext,
    firedOrganicallyThisCycle: boolean,
    sessionDay?: string,
  ): Promise<number> {
    const scout = this.deps.scout;
    if (!scout) {
      return 0;
    }
    const today = sessionDay ?? context.asOf.slice(0, 10);
    const host = readHost(scout); // the one read of the host's subscriptions for this scan
    const exited =
      today !== this.scoutDay ? await this.rollScoutDay(today, context, scout, host) : [];
    // Disarmed (`SKYNET_BETA_FORCING` off): yesterday's picks were still sold above; nothing new.
    if (scout.maxPicks <= 0) {
      return 0;
    }
    if (firedOrganicallyThisCycle && !this.scoutFiredOrganicallyToday) {
      this.scoutFiredOrganicallyToday = true;
      this.persistScoutState();
    }
    if (this.scoutRanToday || this.scoutFiredOrganicallyToday) {
      return 0;
    }
    return this.scanScout(context, scout, host, today, exited);
  }

  /** Today's one scan, once the day's latches allow it: armed AND subscribed (#4642 slice 10). */
  private async scanScout(
    context: MarketContext,
    scout: BetaScoutDeps,
    host: ScoutHost,
    today: string,
    exited: readonly string[],
  ): Promise<number> {
    // Paused, it opens nothing new — the day's exits already ran. Unsubscribed, the scan runs once to record what it would have bought, refused by name.
    if (host.state === "paused" || (host.state === "none" && this.unsubscribedNotedDay === today)) {
      return 0;
    }
    const portfolio = await scout.broker.getPortfolio();
    const picks = betaScoutIntents(
      context,
      portfolio,
      scout.universe,
      exited.length > 0 ? new Set([...scout.managedSymbols, ...exited]) : scout.managedSymbols,
      false,
      { maxPicks: scout.maxPicks, ...(host.mode ? { mode: host.mode } : {}) },
    );
    const verdict = applyGuardsWithVerdicts(picks, portfolio, context, host.risk);
    if (host.state === "none") {
      if (picks.length === 0) return 0; // nothing to record yet — look again next cycle
      this.unsubscribedNotedDay = today;
      await this.recordRefusedScan(picks, scout, verdict.refused);
      return 0;
    }
    const guarded = verdict.approved;
    // An EMPTY scan must not spend the day. Confirmed live 2026-09-04: the first cycle after a
    // restart runs on the first price tick, when the sentiment window is still empty (the first
    // news poll lands ≥60s later) and momentum has a single tick — every candidate reads "skip",
    // and latching before the scan burned the scout's one daily shot before the trackers were
    // warm. The latch below guards a FAILED SUBMIT (never retry that every cycle); a scan that
    // found nothing simply looks again next cycle, which is what "if nothing organic fires by the
    // scout's daily check" always meant. Picks the guards refused are recorded once a day, and the
    // scan keeps looking: a refusal (E1 before 10:00) can lift later the same day.
    if (guarded.length === 0) {
      if (verdict.refused.length > 0 && this.refusalNotedDay !== today) {
        this.refusalNotedDay = today;
        await this.recordRefusedScan(picks, scout, verdict.refused);
      }
      return 0;
    }
    this.scoutRanToday = true; // set BEFORE submitting — a failed submit must not retry every cycle
    for (const intent of guarded) {
      this.scoutOwnedSymbols.add(intent.symbol);
    }
    this.persistScoutState(); // before the submit, for the same reason the latch is
    await this.submitScoutIntents(guarded, scout);
    return guarded.length;
  }

  /** Record a scan none of whose picks may be placed — record-only BY CONSTRUCTION: it hands the
   *  submit an empty approved list, so no order can leave here whatever the guards said. */
  private recordRefusedScan(
    picks: readonly OrderIntent[],
    scout: BetaScoutDeps,
    refused: readonly GuardRefusal[],
  ): Promise<void> {
    return this.submitScoutIntents(picks, scout, { approved: [], refused });
  }

  /**
   * A new scout day: reset the day's latches and sell every lot the scout still owns — whatever its
   * subscription now says and whether or not it is still armed, so a pause, an unsubscribe or
   * switching the setting off never strands one. The sell carries the subscription's mode, as the
   * buy did. Returns the symbols it exited: they never re-enter in the same scan. Live, a queued
   * exit still shows as held (so the scan skips it anyway); an instant-fill broker would otherwise
   * let the scout sell and re-buy the same name in one breath. Churn is not a signal.
   */
  private async rollScoutDay(
    today: string,
    context: MarketContext,
    scout: BetaScoutDeps,
    host: ScoutHost,
  ): Promise<readonly string[]> {
    this.scoutDay = today;
    this.scoutRanToday = false;
    this.scoutFiredOrganicallyToday = false;
    const exited: string[] = [];
    if (this.scoutOwnedSymbols.size > 0) {
      const portfolio = await scout.broker.getPortfolio();
      const exits = betaScoutExitIntents(portfolio, this.scoutOwnedSymbols, host.mode);
      // Exits pass the guards too: a scout lot is never sold out from under a sold call written on
      // the same shares (`uncovers-short-call`). Sells skip every entry rule — the subscribed-only
      // rule included — so a plain exit is approved exactly as before. Ownership is released only
      // for an exit the guards let through — a refused one keeps the lot the scout's, so the next
      // rollover tries again rather than orphaning it.
      const verdict = applyGuardsWithVerdicts(exits, portfolio, context, host.risk);
      for (const exit of verdict.approved) {
        this.scoutOwnedSymbols.delete(exit.symbol);
        exited.push(exit.symbol);
      }
      await this.submitScoutIntents(exits, scout, verdict);
    }
    this.persistScoutState();
    return exited;
  }

  /** Submit the scout's guarded intents and record the cycle. `verdict` is the guards' split when the
   *  caller guarded `raw` itself with refusals worth recording; absent, `raw` was already approved. */
  private async submitScoutIntents(
    raw: readonly OrderIntent[],
    scout: BetaScoutDeps,
    verdict?: {
      readonly approved: readonly OrderIntent[];
      readonly refused: readonly GuardRefusal[];
    },
  ): Promise<void> {
    if (raw.length === 0) {
      return;
    }
    const intents = verdict?.approved ?? raw;
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
      outcomes.push({ intent, action: actionFor(result), result });
    }
    const refusals = verdict?.refused ?? [];
    this.deps.onDecision?.({
      at: now(),
      personaId: BETA_SCOUT_PERSONA_ID,
      mode: scout.mode,
      rawIntents: raw,
      guardedIntents: intents,
      outcomes,
      ...(refusals.length > 0 ? { refusals } : {}),
    });
  }
}
