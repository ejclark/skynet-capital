import type { MarketContext, OrderIntent, OrderResult, Portfolio } from "../domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG, type RiskConfig } from "../engine/guards.js";
import type { Persona } from "../personas/persona.js";
import type { BrokerPort, OpenShareOrder } from "../ports/broker.js";
import type { OptionMarketPort, OptionOrderTracker } from "../ports/option-market.js";
import { clientOrderIdFor } from "./client-order-id.js";
import type { DecisionRecord, IntentOutcome } from "./decision-record.js";
import { actionFor, DEFAULT_OPTION_COOLDOWN_MS, readCycleOptions } from "./option-cycle.js";

/** How the trader acts on its decisions. `observe` decides + logs but places NO orders. */
export type TraderMode = "observe" | "live";

export interface AutonomousTraderConfig {
  readonly persona: Persona;
  readonly broker: BrokerPort;
  readonly risk?: RiskConfig;
  /** Minimum gap between orders in the same symbol (ms). Guards against re-submitting
   *  while a fill is still in flight — a live account shows the position only after it fills. A buy
   *  still open past it is caught by the broker's open-order read instead (#4678). */
  readonly cooldownMs?: number;
  /** Injectable clock (ms) for deterministic cooldown tests. */
  readonly now?: () => number;
  /**
   * `observe` (dry run) computes the full decision and records it but submits nothing — the safe
   * default for a persona that hasn't earned live trading yet. `live` submits guarded orders.
   * Defaults to `live` to preserve existing callers; deployment defaults to observe (see the runner).
   */
  readonly mode?: TraderMode;
  /** Called for every submitted order's result (for logging). */
  readonly onResult?: (result: OrderResult) => void;
  /** Called once per cycle with the full decision record (raw intents, guards, per-intent outcome). */
  readonly onDecision?: (record: DecisionRecord) => void;
  /**
   * The kill switch / circuit breakers. Consulted at the top of every cycle — a non-null reason
   * halts the cycle before the persona is even asked, and nothing is placed. See `SafetyController`.
   */
  readonly blockedReason?: () => string | null;
  /** Seeds the cooldown clock at construction (e.g. restored after a process restart) — read
   *  once, never mutated by this class after that. */
  readonly initialCooldowns?: ReadonlyMap<string, number>;
  /** Fires every time a cooldown clock is set (i.e. right after an order places), so a caller can
   *  persist it durably without this class knowing anything about storage. */
  readonly onCooldownSet?: (symbol: string, at: number) => void;
  /** Where this cycle's option quotes come from. Absent = no option quotes, so no option play can
   *  price an order (every one it emits is refused `no-quote`). */
  readonly optionMarket?: OptionMarketPort;
  /** The option orders a previous submit left working, settled at the top of each live cycle. */
  readonly optionOrders?: OptionOrderTracker;
  /** Minimum gap between option attempts (approved OR refused, observe OR live) on one underlying.
   *  Default 10 minutes. In-memory. */
  readonly optionCooldownMs?: number;
}

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const NOTHING_WORKING: ReadonlySet<string> = new Set();

/**
 * The share orders still open at the broker this cycle (#4678): which symbols have a buy open, and
 * how many shares the open sells will take. `known: false` when the broker could not be asked —
 * then every buy waits (an order may be open) and no sell does (the broker itself refuses to sell
 * shares an open order already holds, so an exit is never the risk). `landed`: symbols whose
 * holding changed after the persona decided — an order filled mid-cycle, so it is in neither the
 * portfolio the persona saw nor the open-order list, and any share order on it waits a cycle.
 */
interface OpenShares {
  readonly known: boolean;
  readonly buying: ReadonlySet<string>;
  readonly selling: ReadonlyMap<string, number>;
  readonly landed: ReadonlySet<string>;
}

const NOTHING_OPEN: OpenShares = {
  known: true,
  buying: new Set(),
  selling: new Map(),
  landed: new Set(),
};
const OPEN_UNKNOWN: OpenShares = { ...NOTHING_OPEN, known: false };

function openSharesFrom(orders: readonly OpenShareOrder[]): OpenShares {
  const buying = new Set<string>();
  const selling = new Map<string, number>();
  for (const order of orders) {
    if (order.side === "buy") buying.add(order.symbol);
    else selling.set(order.symbol, (selling.get(order.symbol) ?? 0) + order.quantity);
  }
  return { ...NOTHING_OPEN, buying, selling };
}

/** Symbols held in a different quantity in `after` than in `before`, either side missing as 0. */
function holdingsChanged(before: Portfolio, after: Portfolio): Set<string> {
  const held = (p: Portfolio) => new Map(p.positions.map((x) => [x.symbol, x.quantity]));
  const was = held(before);
  const now = held(after);
  const changed = new Set<string>();
  for (const symbol of new Set([...was.keys(), ...now.keys()])) {
    if ((was.get(symbol) ?? 0) !== (now.get(symbol) ?? 0)) changed.add(symbol);
  }
  return changed;
}

interface Handled {
  readonly outcome: IntentOutcome;
  readonly result?: OrderResult;
}

/**
 * Runs one persona autonomously against a broker: on each `evaluate(context)` it asks the persona
 * to assess the market, risk-guards the intents, drops any symbol still inside its order cooldown,
 * and — in `live` mode — submits the rest. In `observe` mode it does everything EXCEPT submit, so a
 * bot's judgment can be watched with zero risk before it's trusted with real (paper) orders.
 *
 * Every cycle emits a `DecisionRecord` (via `onDecision`) capturing the raw intents, the guarded
 * intents, and what happened to each — the durable audit trail Phase 0 of the autonomy plan is built
 * on. The cooldown is the key safety valve for live trading — without it, a persona that stays
 * bullish would re-fire the same buy on every tick before the first fill lands.
 *
 * SHARE ORDERS STILL OPEN (#4678): the cooldown is a clock, and an order queued for the open
 * outlives it. So once a live cycle has a share intent, it reads the broker's open share orders —
 * once — and a buy waits (`cooldown-skipped`) while a buy of the same symbol is still open, while a
 * new sell is sized by the guards against what the open sells leave. A failed read holds every buy
 * and no sell. The portfolio is then read again, so an order that fills mid-cycle shows up in one
 * read or the other, and an order on a symbol whose holding moved waits a cycle. Observe mode
 * places nothing, so it reads nothing.
 *
 * OPTION ORDERS (#4645): before deciding, a live cycle settles any option order still working, then
 * reads only the quotes the persona asked for — never for an underlying that is cooling down or has
 * an order working. The persona decides on that enriched context; the record keeps the ORIGINAL one,
 * so option quotes never reach disk or the wire. One option attempt per underlying per
 * `optionCooldownMs` — observe mode included — and each submitted option order is stamped with its
 * client order id here, never by a playbook.
 */
export class AutonomousTrader {
  private readonly config: AutonomousTraderConfig;
  private readonly lastOrderAt = new Map<string, number>();
  /** Per underlying: when an option order was last attempted (approved or refused). In-memory. */
  private readonly optionAttemptAt = new Map<string, number>();
  /**
   * The persona + risk config this trader is CURRENTLY trading under. Held apart from `config`
   * (which is immutable) because a Playbook Store subscription change has to reach a running bot
   * without a restart (issue #3595) — see `swapRoster`.
   */
  private current: { readonly persona: Persona; readonly risk: RiskConfig };

  constructor(config: AutonomousTraderConfig) {
    this.config = config;
    this.current = { persona: config.persona, risk: config.risk ?? DEFAULT_RISK_CONFIG };
    if (config.initialCooldowns) {
      for (const [symbol, at] of config.initialCooldowns) {
        this.lastOrderAt.set(symbol, at);
      }
    }
  }

  /**
   * Swap the roster this bot trades, in place. The cooldown map — and, because the process keeps
   * running, every tracker feeding it — survives untouched; that durability is the whole reason
   * this is a swap rather than a rebuild (`subscription-sync.ts`, same posture as
   * `SwappableBotBroker.replaceCredentials`).
   *
   * Applied between cycles, never inside one: `evaluate` snapshots both halves together at the top
   * of a cycle, so a swap landing mid-cycle takes effect on the next one instead of pairing one
   * cycle's persona with another's guards.
   */
  swapRoster(next: { readonly persona: Persona; readonly risk: RiskConfig }): void {
    this.current = { persona: next.persona, risk: next.risk };
  }

  async evaluate(context: MarketContext): Promise<OrderResult[]> {
    // One read of the swappable pair, at the top — see `swapRoster`.
    const { persona, risk } = this.current;
    const now = (this.config.now ?? Date.now)();
    const mode: TraderMode = this.config.mode ?? "live";

    // Kill switch / circuit breakers first: if halted, decide nothing and place nothing this cycle.
    // The market context is still captured here — a halt is exactly the kind of cycle the
    // replay/counterfactual measures want to see, not a gap in the tape.
    // Before any gate: reading what a share order became places nothing, and the order may be the
    // beta scout's, which trades live on this account whatever this bot's mode or suspend (#4650).
    try {
      await this.config.optionOrders?.settleShares?.();
    } catch {
      // Never a reason to skip a cycle: an unread order is read again next cycle.
    }
    const blocked = this.config.blockedReason?.() ?? null;
    if (blocked) {
      this.config.onDecision?.({
        at: now,
        personaId: persona.id,
        mode,
        rawIntents: [],
        guardedIntents: [],
        outcomes: [],
        halted: blocked,
        context,
      });
      return [];
    }

    const decidedOn = await this.config.broker.getPortfolio();
    const working =
      mode === "live"
        ? ((await this.config.optionOrders?.settle()) ?? NOTHING_WORKING)
        : NOTHING_WORKING;
    const cooling = this.optionCooling(working, now);
    const options = await readCycleOptions(persona, this.config.optionMarket, {
      context,
      portfolio: decidedOn,
      // A snapshot: `cooling` grows as this cycle's attempts start their clocks, and the market read
      // must keep the set it was actually asked with.
      skip: new Set(cooling),
    });
    const enriched = options ? { ...context, options } : context;
    const rawIntents = persona.decide(enriched, decidedOn);
    const playbookVerdicts = persona.playbookVerdicts?.(enriched) ?? [];
    const { open, portfolio } = await this.readOpenShares(mode, rawIntents, decidedOn);
    const { approved: guardedIntents, refused: refusals } = applyGuardsWithVerdicts(
      rawIntents,
      portfolio,
      enriched,
      risk,
      open.selling,
    );

    const results: OrderResult[] = [];
    const outcomes: IntentOutcome[] = [];
    for (const [index, intent] of guardedIntents.entries()) {
      const handled = intent.option
        ? await this.handleOption(intent, index, { persona, mode, now, cooling })
        : await this.handleShares(intent, { mode, now, open });
      outcomes.push(handled.outcome);
      if (handled.result) results.push(handled.result);
    }
    // A refused option attempt starts its underlying's clock too — after the approved ones ran, so
    // a refused sibling never starves an approved close in the same cycle. Never on an underlying
    // already cooling: its quotes were skipped this cycle, so a close emitted without them is
    // refused `no-quote` — re-arming the clock on that refusal would keep it cooling (and quote-
    // less) forever, carrying the contract into expiry.
    for (const refusal of refusals) {
      const underlying = refusal.intent.symbol;
      if (refusal.intent.option && !cooling.has(underlying)) {
        this.optionAttemptAt.set(underlying, now);
        cooling.add(underlying);
      }
    }

    this.config.onDecision?.({
      at: now,
      personaId: persona.id,
      mode,
      rawIntents,
      guardedIntents,
      outcomes,
      // The context the cycle was HANDED — option quotes never reach disk or the wire.
      context,
      ...(refusals.length > 0 ? { refusals } : {}),
      ...(playbookVerdicts.length > 0 ? { playbookVerdicts } : {}),
    });
    return results;
  }

  /** Underlyings no option order may be attempted on this cycle: one still working at the broker,
   *  or one attempted inside the option cooldown. */
  private optionCooling(working: ReadonlySet<string>, now: number): Set<string> {
    const gap = this.config.optionCooldownMs ?? DEFAULT_OPTION_COOLDOWN_MS;
    const cooling = new Set(working);
    for (const [underlying, at] of this.optionAttemptAt) {
      if (now - at < gap) cooling.add(underlying);
    }
    return cooling;
  }

  /** The broker's open share orders, read once — after deciding, and only by a live cycle that
   *  decided a share order, so a quiet cycle costs no read. A broker with no such read has nothing
   *  open.
   *
   *  The portfolio is read again AFTER the order list, and the guards run on that later one: an
   *  order that fills before the list read is gone from the list, and only a portfolio read after it
   *  is sure to show the fill. At the open, when every order queued overnight fills, that window is
   *  exactly where they land. A symbol whose holding moved between the two portfolio reads waits a
   *  cycle, since the persona decided on shares it no longer has. */
  private async readOpenShares(
    mode: TraderMode,
    intents: readonly OrderIntent[],
    decidedOn: Portfolio,
  ): Promise<{ readonly open: OpenShares; readonly portfolio: Portfolio }> {
    const broker = this.config.broker;
    if (mode !== "live" || !intents.some((i) => !i.option) || !broker.openShareOrders) {
      return { open: NOTHING_OPEN, portfolio: decidedOn };
    }
    let open: OpenShares;
    try {
      open = openSharesFrom(await broker.openShareOrders());
    } catch {
      open = OPEN_UNKNOWN;
    }
    const portfolio = await broker.getPortfolio();
    return { open: { ...open, landed: holdingsChanged(decidedOn, portfolio) }, portfolio };
  }

  private async handleShares(
    intent: OrderIntent,
    cycle: { readonly mode: TraderMode; readonly now: number; readonly open: OpenShares },
  ): Promise<Handled> {
    const { mode, now, open } = cycle;
    const cooldown = this.config.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const last = this.lastOrderAt.get(intent.symbol);
    if (last !== undefined && now - last < cooldown) {
      return { outcome: { intent, action: "cooldown-skipped" } };
    }
    // A buy over one still open would stack a second order on the first: it waits, exactly as it
    // would inside the cooldown, until the broker no longer holds the earlier buy.
    if (intent.side === "buy" && (!open.known || open.buying.has(intent.symbol))) {
      return { outcome: { intent, action: "cooldown-skipped" } };
    }
    // An order on the symbol filled while this cycle was deciding: either side waits for a decision
    // made on the shares actually held.
    if (open.landed.has(intent.symbol)) {
      return { outcome: { intent, action: "cooldown-skipped" } };
    }
    if (mode === "observe") {
      // Dry run: record what WOULD have been placed, but touch neither the broker nor the cooldown.
      return { outcome: { intent, action: "observed" } };
    }
    const result = await this.config.broker.submit(intent);
    this.lastOrderAt.set(intent.symbol, now);
    this.config.onCooldownSet?.(intent.symbol, now);
    this.config.onResult?.(result);
    return { outcome: { intent, action: actionFor(result), result }, result };
  }

  private async handleOption(
    intent: OrderIntent,
    index: number,
    cycle: {
      readonly persona: Persona;
      readonly mode: TraderMode;
      readonly now: number;
      /** Mutable for the cycle: an attempt adds its underlying, so a sibling waits its turn. */
      readonly cooling: Set<string>;
    },
  ): Promise<Handled> {
    const underlying = intent.symbol;
    if (cycle.cooling.has(underlying)) {
      return { outcome: { intent, action: "cooldown-skipped" } };
    }
    // Observe mode starts the clock too: a watched bot attempts at the same pace a live one would.
    this.optionAttemptAt.set(underlying, cycle.now);
    cycle.cooling.add(underlying);
    if (cycle.mode === "observe") return { outcome: { intent, action: "observed" } };
    const stamped: OrderIntent = {
      ...intent,
      clientOrderId: clientOrderIdFor(cycle.persona.id, underlying, cycle.now, index),
    };
    const result = await this.config.broker.submit(stamped);
    this.config.onResult?.(result);
    return { outcome: { intent: stamped, action: actionFor(result), result }, result };
  }
}
