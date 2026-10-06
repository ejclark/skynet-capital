import type { OrderSettlement } from "../domain/order-settlement.js";
import { heldQuantity } from "../domain/portfolio.js";
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
import { afterExit, lotFromOutcome, lotShares, type ScoutLot, settleLots } from "./scout-lots.js";

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
  /** The bot account the scout trades on (its persona id). Each lot records it, and the scout sells
   *  only lots bought on the account it trades now. */
  readonly hostId?: string;
  /** How an order the scout left working ended, by its broker id (#4650's settlements) — read
   *  before a lot from a working buy is sold, which is never on the ordered quantity alone. Absent =
   *  no source: such a lot waits, never sold on a guess. */
  readonly settlementOf?: (orderId: string) => OrderSettlement | undefined;
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
  /** A plain line about the scout's lots worth an operator's eye (never per cycle). */
  readonly onScoutWarn?: (line: string) => void;
}

/**
 * Runs the live decision loop cycle by cycle. A class (not a bare function) because the beta
 * scout is stateful ACROSS cycles — which day it last ran, whether it already fired today, and
 * which lots (placed buys and their shares, `scout-lots.ts`) it still owns — the same reason
 * `AutonomousTrader` is a class rather than a function (its per-symbol cooldown map). Construct
 * once per process; call `runCycle` on every throttled tick.
 */
export class LiveCycleRunner {
  private readonly deps: LiveCycleDeps;
  private scoutDay = "";
  private scoutRanToday = false;
  private scoutFiredOrganicallyToday = false;
  /** The scout's own lots (`scout-lots.ts`): only placed buys, with their shares. */
  private scoutLots: ScoutLot[] = [];
  /** The lots offered for sale today (placed, refused or observed) — tried again next session, not
   *  next cycle. A blocked attempt marks nothing: those exits are tried again next cycle, never lost.
   *  A lot confirmed by its settlement later in the day is a lot not yet tried, so it sells then. */
  private exitTried: { day: string; lots: WeakSet<ScoutLot> } = { day: "", lots: new WeakSet() };
  /** The day a halted cycle last told the operator the scout skipped — once a day, not per cycle. */
  private haltNotedDay = "";
  /** Lots bought on another account than the scout's host now are said once per process. */
  private foreignLotsNoted = false;
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
      this.scoutLots = [...restored.ownedLots];
      if (restored.legacySymbols?.length) {
        deps.onScoutWarn?.(
          `[beta-scout] no longer tracking ${restored.legacySymbols.join(", ")}: saved before picks carried their share count, so the scout will not sell them — whatever holds them now manages them`,
        );
      }
    }
  }

  /** Persist the scout's day-state after every transition — best-effort, never on the hot path. */
  private persistScoutState(): void {
    this.deps.scoutState?.save({
      day: this.scoutDay,
      ranToday: this.scoutRanToday,
      firedOrganicallyToday: this.scoutFiredOrganicallyToday,
      ownedLots: this.scoutLots,
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
    if (today !== this.scoutDay) this.rollScoutDay(today);
    const exited = await this.exitDueLots(today, context, scout, host);
    // Disarmed (`SKYNET_BETA_FORCING` off): its due lots were still offered for sale above.
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
    // Halted: leave the day as it is — no scan, no latch — and look again once the halt lifts.
    if (this.haltedToday(today)) return 0;
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
    this.persistScoutState(); // before the submit, for the same reason the latch is
    // A lot only from a buy the broker actually took, recorded the moment it was — never before the
    // submit, never for a pick observed, blocked or rejected.
    await this.submitScoutIntents(guarded, scout, undefined, (outcome) => {
      const lot = lotFromOutcome(outcome, today, scout.hostId);
      if (!lot && outcome.result?.status === "working") {
        this.deps.onScoutWarn?.(
          `[beta-scout] ${outcome.intent.symbol} pick accepted with no order id — its fill cannot be confirmed, so the scout will not sell it`,
        );
      }
      if (!lot) return;
      this.scoutLots = [...this.scoutLots, lot];
      this.persistScoutState();
    });
    return guarded.length;
  }

  /** Whether the kill switch or a breaker holds the scout now; said once a day, never per cycle. */
  private haltedToday(today: string): boolean {
    const blocked = this.deps.blockedReason();
    if (!blocked) return false;
    if (this.haltNotedDay !== today) {
      this.haltNotedDay = today;
      this.deps.onScoutHalted?.(blocked);
    }
    return true;
  }

  /** Record a scan none of whose picks may be placed — record-only BY CONSTRUCTION: it hands the
   *  submit an empty approved list, so no order can leave here whatever the guards said. */
  private recordRefusedScan(
    picks: readonly OrderIntent[],
    scout: BetaScoutDeps,
    refused: readonly GuardRefusal[],
  ): Promise<boolean> {
    return this.submitScoutIntents(picks, scout, { approved: [], refused });
  }

  /** A new scout day: the day's latches reset. Selling the lots due is `exitDueLots`. */
  private rollScoutDay(today: string): void {
    this.scoutDay = today;
    this.scoutRanToday = false;
    this.scoutFiredOrganicallyToday = false;
    this.persistScoutState();
  }

  /** A lot this host may sell today: bought for an earlier session, on this account, with what it
   *  filled confirmed (never a buy still working). */
  private isDue(lot: ScoutLot, today: string, scout: BetaScoutDeps): boolean {
    return (
      !lot.workingOrderId &&
      lot.day < today &&
      (!(lot.host && scout.hostId) || lot.host === scout.hostId)
    );
  }

  private triedToday(lot: ScoutLot, today: string): boolean {
    return this.exitTried.day === today && this.exitTried.lots.has(lot);
  }

  /** The lots just offered — and what a partly filled sell left of one — wait for the next session. */
  private markTried(today: string, offered: readonly ScoutLot[]): void {
    if (this.exitTried.day !== today) this.exitTried = { day: today, lots: new WeakSet() };
    const wasOffered = (lot: ScoutLot) =>
      offered.some((o) => o.symbol === lot.symbol && o.day === lot.day && o.host === lot.host);
    for (const lot of this.scoutLots) {
      if (!lot.workingOrderId && wasOffered(lot)) this.exitTried.lots.add(lot);
    }
  }

  /** Each working lot turned into what its order filled, or dropped when it filled nothing. */
  private settleWorkingLots(scout: BetaScoutDeps): void {
    const settled = settleLots(this.scoutLots, scout.settlementOf);
    if (!settled.changed) return;
    this.scoutLots = settled.lots;
    this.persistScoutState();
  }

  /**
   * Offer every due lot for sale — whatever the subscription now says and whether or not the scout
   * is still armed, so a pause, an unsubscribe or switching the setting off never strands one. Each
   * sells at most its own shares and never more than the account holds; a lot the account no longer
   * holds is dropped. A lot is released only once its sell was placed: a halted cycle tries again
   * next cycle, and a refused, rejected or observed sell keeps the lot for the next session. The sell
   * carries the subscription's mode, as the buy did. Returns the symbols whose sells the guards let
   * through: they never re-enter in the same scan (an instant-fill broker would otherwise let the
   * scout sell and re-buy a name in one breath; churn is not a signal).
   */
  private async exitDueLots(
    today: string,
    context: MarketContext,
    scout: BetaScoutDeps,
    host: ScoutHost,
  ): Promise<readonly string[]> {
    this.noteForeignLots(today, scout);
    this.settleWorkingLots(scout);
    const due = this.scoutLots.filter(
      (lot) => this.isDue(lot, today, scout) && !this.triedToday(lot, today),
    );
    if (due.length === 0 || this.haltedToday(today)) return [];
    const portfolio = await scout.broker.getPortfolio();
    const gone = due.filter((lot) => heldQuantity(portfolio, lot.symbol) <= 0);
    this.scoutLots = this.scoutLots.filter((lot) => !gone.includes(lot));
    const exits = betaScoutExitIntents(
      portfolio,
      lotShares(due.filter((lot) => !gone.includes(lot))),
      host.mode,
    );
    // Exits pass the guards too: a scout lot is never sold out from under a sold call written on the
    // same shares (`uncovers-short-call`). Sells skip every entry rule — the subscribed-only rule
    // included — so a plain exit is approved exactly as before.
    const verdict = applyGuardsWithVerdicts(exits, portfolio, context, host.risk);
    // An exit releases only the lots it was sized from — never one tried earlier today, nor one
    // still working.
    const offered = await this.submitScoutIntents(exits, scout, verdict, (outcome) => {
      this.scoutLots = afterExit(this.scoutLots, outcome, (lot) => due.includes(lot));
      this.persistScoutState();
    });
    if (offered) this.markTried(today, due);
    this.persistScoutState();
    return offered ? verdict.approved.map((exit) => exit.symbol) : [];
  }

  /** Lots bought on another account than the one the scout trades now are never sold here (that
   *  broker is not this one); said once per process so an operator can move them by hand. */
  private noteForeignLots(today: string, scout: BetaScoutDeps): void {
    if (this.foreignLotsNoted) return;
    const foreign = this.scoutLots.filter(
      (lot) => lot.day < today && lot.host && scout.hostId && lot.host !== scout.hostId,
    );
    if (foreign.length === 0) return;
    this.foreignLotsNoted = true;
    this.deps.onScoutWarn?.(
      `[beta-scout] not selling ${foreign.map((l) => `${l.quantity} ${l.symbol} (bought on ${l.host})`).join(", ")}: the scout now trades on ${scout.hostId}`,
    );
  }

  /** Submit the scout's guarded intents and record the cycle. `verdict` is the guards' split when the
   *  caller guarded `raw` itself with refusals worth recording; absent, `raw` was already approved.
   *  `onOutcome` hears each intent's outcome the moment it lands, so what a placed order changed is
   *  kept even if a later submit throws. Returns false when a halt stopped it before anything was
   *  submitted or recorded. */
  private async submitScoutIntents(
    raw: readonly OrderIntent[],
    scout: BetaScoutDeps,
    verdict?: {
      readonly approved: readonly OrderIntent[];
      readonly refused: readonly GuardRefusal[];
    },
    onOutcome?: (outcome: IntentOutcome) => void,
  ): Promise<boolean> {
    if (raw.length === 0) {
      return true;
    }
    const intents = verdict?.approved ?? raw;
    const blocked = this.deps.blockedReason();
    if (blocked) {
      this.deps.onScoutHalted?.(blocked);
      return false;
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
      const outcome: IntentOutcome = { intent, action: actionFor(result), result };
      outcomes.push(outcome);
      onOutcome?.(outcome);
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
    return true;
  }
}
