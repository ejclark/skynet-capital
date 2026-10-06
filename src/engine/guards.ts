import { type EarningsPrint, etTimeOf, printWithin } from "../domain/earnings-calendar.js";
import { bookNeeds, opensRisk } from "../domain/option-book.js";
import { isBareContractOrder, optionOrderProblems } from "../domain/option-order.js";
import { computeEquity, heldQuantity } from "../domain/portfolio.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import { blocksRiskIncrease, type RiskTier } from "../risk/risk-ladder.js";
import { contractMultiplier } from "../trading/option-symbols.js";
import {
  claim,
  committedToPlaybook,
  openLedger,
  soldShares,
  spendableCash,
  subscriptionTerms,
  unspentCash,
  worsens,
} from "./guard-batch.js";
import { clampOption, type OptionBatch } from "./option-guards.js";
import { refusedAsUnsubscribed } from "./subscribed-only.js";

/**
 * Risk guardrails, applied by the engine to every persona's raw intents.
 *
 * This is the single place that enforces "you can't do that" — personas stay naive
 * about limits on purpose (DRY: one risk implementation, not one per persona). Guards
 * CLAMP rather than reject where they sensibly can (a friendlier DX: a slightly-too-big
 * order becomes a right-sized order instead of vanishing), and drop intents that clamp
 * to nothing.
 */

/**
 * The two universal findings of the eight-symbol sweep (docs/research/multi-symbol-sweep.md),
 * as guards. Both apply to OPENS only (a share buy, an option open) — exits always pass, because a
 * guard that blocks risk-reduction is a hazard, not a discipline.
 *
 * OPT-IN BY CONSTRUCTION: this config is absent from `DEFAULT_RISK_CONFIG`, so evals, the
 * readiness gate, and every existing caller are untouched. The production runner
 * (run-autonomous) is the one place that supplies it. Keep it that way — a discipline field
 * that leaked into the eval path would silently re-score every persona's readiness.
 */
interface TradeDiscipline {
  /** The forward print calendar (S2). Estimates count — they widen the flat window. */
  readonly calendar: readonly EarningsPrint[];
  /** S2: refuse buys when a print is within this many calendar days (default 2 = flat by D-1). */
  readonly printFlatDays?: number;
  /**
   * E1: drop non-`urgent` buys before this ET wall-clock time ("HH:MM", default "10:00").
   * Dropping IS deferring here: the live loop re-evaluates on every market event, so a
   * still-valid intent simply passes on the first post-window cycle.
   */
  readonly deferOpenUntilEt?: string;
}

export interface RiskConfig {
  /** Max fraction of equity any single new position may represent (0.2 = 20%). */
  readonly maxPositionPct: number;
  /** S2 + E1 (opt-in — see `TradeDiscipline`). Absent = both guards inert. */
  readonly discipline?: TradeDiscipline;
  /**
   * The ACCOUNT-level rung of the graduated risk ladder (`src/risk/risk-ladder.ts`), supplied by
   * whoever is watching equity — `SafetyController.riskReading()` in the autonomous lane.
   *
   * Absent means ABSENT, not `clear`: with no reading available the guards behave exactly as they
   * did before the ladder existed, which is what keeps evals, the readiness gate and every current
   * caller untouched. Read the tier from a real reading or leave it off; never default it to
   * `clear`, which would assert a safety this file cannot see.
   */
  readonly accountTier?: RiskTier;
  /**
   * This account's active playbook subscriptions. Scoped to one account already —
   * `RiskConfig` is built per-bot — so a buy's `playbookId` looks itself up here rather than the
   * guard taking an `accountId`. Absent or no match = no sub-allocation clamp, unchanged from
   * pre-subscription behavior.
   */
  readonly subscriptions?: readonly PlaybookSubscription[];
  /**
   * Each playbook's full symbol basket (`Playbook.symbols`), keyed by playbook id — a
   * subscription's budget is shared across every symbol its playbook trades, not just the one an
   * intent targets. Absent or no match falls back to the intent's own symbol only, unchanged
   * from pre-basket behavior (a one-symbol playbook needs no entry here at all).
   */
  readonly playbookSymbols?: ReadonlyMap<string, readonly string[]>;
  /**
   * Sum of realized P/L across every closed retrospective for one playbook, pre-bound to this
   * account's persona (`DecisionDb.realizedPlForPlaybook`, issue #3527 slice 3) — same DI shape
   * as `playbookSymbols`: the wiring layer already has the persona in scope, so this file never
   * needs to take one. Consulted only when a subscription has `compoundAllocation` enabled;
   * absent behaves as if every playbook had realized exactly 0 (the flat-budget default).
   */
  readonly realizedPlForPlaybook?: (playbookId: string) => number;
  /**
   * Alpaca `options_trading_level`, read at boot and on a credential rotation. Absent = every option
   * OPEN is refused (`options-level`) — fail closed; closes never need it.
   */
  readonly optionsLevel?: number;
  /** Oldest feed stamp an option quote may carry. Default `QUOTE_STALE_MS` (15 min). */
  readonly optionQuoteMaxAgeMs?: number;
  /**
   * Only a subscribed playbook may open a position (#4642 slice 10, `subscribed-only.ts`): an
   * opening intent whose `playbookId` names no enabled subscription in `subscriptions` is refused
   * `unsubscribed`. Exits always pass. Set by the live bots' roster (`tradingRoster`) and the forced
   * daily pick; absent everywhere else (evals, the readiness gate), which behave exactly as before.
   */
  readonly subscribedOnly?: true;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionPct: 0.2,
};

/**
 * Why a raw intent never made it into `approved` — named so a caller can compute the guard's
 * opportunity cost (would this have paid off?) without re-deriving the logic below. Kept as a
 * closed, stable string union: a new refusal path in this file must add a case here rather than
 * falling through to a vague default, which is exactly what made refusals unattributed before.
 */
export type GuardRefusalReason =
  /** The graduated risk ladder's BLOCK rung (opens only — see `applyGuards`'s own comment on why
   *  gating opens alone is sufficient). */
  | "ladder-block"
  /** S2: a print falls inside the flat window and the intent didn't claim `allowThroughPrint`. */
  | "s2-print"
  /** E1: before the configured open-deferral time and the intent didn't claim `urgent`. */
  | "e1-open"
  /** #885's symbol-targeting filter: the subscription aims at OTHER symbols only. */
  | "subscription-filter"
  /** No live quote for the symbol, or a non-positive ask — nothing to size against. */
  | "no-quote"
  /** Cash on hand rounds down to zero shares at the ask. */
  | "insufficient-cash"
  /** The per-position cap (`maxPositionPct`) leaves zero room at the current equity/holding. */
  | "position-cap"
  /** The subscription's own capital allocation leaves zero room. */
  | "subscription-budget"
  /** A sell against a symbol with nothing (or a non-positive quantity) held. */
  | "nothing-held"
  /** Not a well-formed option order — or a share-shaped order naming a contract. Never sent. */
  | "option-shape"
  /** The account's options approval level is too low for this open, or could not be read. */
  | "options-level"
  /** An option open with no finite capital allocation behind it. */
  | "option-unallocated"
  /** No earnings date on file for the underlying, so the expiry can't be shown to clear it. */
  | "option-print-unknown"
  /** The contract would still be open across the underlying's earnings print. */
  | "option-spans-print"
  /** The option quote the limit was priced against is too old. */
  | "option-quote-stale"
  /** The limit price sits outside the quoted bid/ask. */
  | "option-limit-outside-quote"
  /** Not enough free cash to secure the sold put. */
  | "put-not-secured"
  /** Not enough free shares to cover the sold call. */
  | "call-not-covered"
  /** Selling these shares would leave a sold call uncovered. */
  | "uncovers-short-call"
  /** The cash this buy needs is set aside to secure a sold put. */
  | "collateral-reserved"
  /** An order that would open a position, from no playbook the bot is subscribed to and has on
   *  (#4642 slice 10, `subscribed-only.ts`). Never an exit. */
  | "unsubscribed";

/** The single source of truth for the reason literals above — so a validator crossing a process
 *  boundary (`decision-wire-parts.ts`, on the bots↔app replication bridge) can check a foreign
 *  string against the real set instead of re-typing it a third time. */
export const GUARD_REFUSAL_REASONS: readonly GuardRefusalReason[] = [
  "ladder-block",
  "s2-print",
  "e1-open",
  "subscription-filter",
  "no-quote",
  "insufficient-cash",
  "position-cap",
  "subscription-budget",
  "nothing-held",
  "option-shape",
  "options-level",
  "option-unallocated",
  "option-print-unknown",
  "option-spans-print",
  "option-quote-stale",
  "option-limit-outside-quote",
  "put-not-secured",
  "call-not-covered",
  "uncovers-short-call",
  "collateral-reserved",
  "unsubscribed",
];

/** One raw intent the guards refused outright this cycle — the persona's own ask, unfiltered,
 *  paired with which rule refused it. */
export interface GuardRefusal {
  readonly intent: OrderIntent;
  readonly reason: GuardRefusalReason;
}

/** `approved` is exactly what `applyGuards` has always returned; `refused` is additive — every
 *  raw intent this cycle that did NOT make it into `approved`, in original order, each with the
 *  specific rule that dropped it. `refused.length === intents.length - approved.length` always. */
export interface GuardResult {
  readonly approved: readonly OrderIntent[];
  readonly refused: readonly GuardRefusal[];
}

type DisciplineOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | { readonly ok: false; readonly reason: "s2-print" | "e1-open" };

/**
 * S2 (never hold the print) + E1 (don't trade the open), entry side. The S2 exit side
 * (flattening an EXISTING position before a print) is an action, not a clamp — it belongs to the
 * playbook engine, which owns exits.
 */
function clampDiscipline(
  intent: OrderIntent,
  context: MarketContext,
  discipline: TradeDiscipline,
): DisciplineOutcome {
  const print = printWithin(
    intent.symbol,
    context.asOf,
    discipline.printFlatDays ?? 2,
    discipline.calendar,
  );
  if (print && !intent.allowThroughPrint) {
    return { ok: false, reason: "s2-print" }; // don't open what you'd be forced to flatten before the print.
  }
  const openUntil = discipline.deferOpenUntilEt ?? "10:00";
  if (!intent.urgent && etTimeOf(context.asOf) < openUntil) {
    return { ok: false, reason: "e1-open" }; // the open's spread is a certain cost; a non-urgent entry can wait.
  }
  return { ok: true, intent };
}

type BuySizingOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | {
      readonly ok: false;
      readonly reason: Extract<
        GuardRefusalReason,
        | "subscription-filter"
        | "no-quote"
        | "insufficient-cash"
        | "position-cap"
        | "subscription-budget"
        | "collateral-reserved"
      >;
    };

type SellSizingOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | {
      readonly ok: false;
      readonly reason: Extract<GuardRefusalReason, "nothing-held" | "uncovers-short-call">;
    };

type SizingOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | { readonly ok: false; readonly reason: GuardRefusalReason };

/** Clamp a buy so it neither overspends cash nor breaches the per-position cap. */
function clampBuy(
  intent: OrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig,
  { ledger, book }: OptionBatch,
): BuySizingOutcome {
  const quote = context.quotes[intent.symbol];
  if (!quote || quote.ask <= 0) {
    return { ok: false, reason: "no-quote" };
  }

  const terms = subscriptionTerms(intent, config);
  // Symbol-targeting filter (#885): a subscription with a non-empty `symbols` list refuses a buy
  // outright in any OTHER symbol — this is aim/restriction, not a soft preference. Entry side
  // only, same posture as every discipline guard in this file: a guard blocks opening risk, never
  // closing it, so an exit is never gated by this filter (see `clampSell`).
  if (terms.refusesSymbol) {
    return { ok: false, reason: "subscription-filter" };
  }

  // Dollars for ONE unit of the order. Every bound below divides by this. A share-shaped order
  // naming a contract is refused before it gets here (`option-shape`), so this is a share price
  // today; the multiplier stays so the unit rule has one spelling wherever a book is valued.
  const unitPrice = quote.ask * contractMultiplier(intent.symbol);
  const equity = computeEquity(portfolio, context.quotes);
  const existingValue = heldQuantity(portfolio, intent.symbol) * unitPrice;
  const positionBudget = Math.max(0, config.maxPositionPct * equity - existingValue);

  // Cash not set aside to secure a sold put — at worst, counting the option orders approved earlier
  // this batch — less what earlier intents paid out. With no short options and no option intents
  // both corrections are 0: the raw cash, exactly as before.
  const spendable = spendableCash(portfolio, ledger, book);
  const affordable = Math.floor(spendable / unitPrice);
  const withinPosition = Math.floor(positionBudget / unitPrice);

  // The subscription's budget is shared across its playbook's WHOLE basket — shares held, the
  // collateral its sold puts hold, its long contracts and this batch's earlier claims — so a
  // playbook can never commit its allocation twice (`committedToPlaybook`). With no option positions
  // that is the basket's share value, or this symbol's alone when no basket is registered: exactly
  // today's behavior for a one-symbol playbook. Compounding (#3527 slice 3, off by default) grows or
  // shrinks the budget by what the playbook has realized.
  // An uncapped subscription (no `capitalAllocated` — #4535's seeded house roster) carries no
  // budget at all: it sizes exactly like a house-roster entry, on cash and the position cap alone.
  const capital = terms.subscription?.capitalAllocated;
  const subscriptionBudgetShares =
    capital !== undefined
      ? Math.floor(
          Math.max(
            0,
            capital +
              terms.realizedPl -
              committedToPlaybook(intent, portfolio, context, config.playbookSymbols, {
                ledger,
                book,
              }),
          ) / unitPrice,
        )
      : undefined;

  const bounds = [intent.quantity, affordable, withinPosition];
  if (subscriptionBudgetShares !== undefined) bounds.push(subscriptionBudgetShares);
  const quantity = Math.min(...bounds);

  if (quantity > 0) {
    claim(ledger, {
      spent: quantity * unitPrice,
      ...(intent.playbookId ? { playbookId: intent.playbookId, risk: quantity * unitPrice } : {}),
    });
    return { ok: true, intent: { ...intent, quantity } };
  }
  // Attribute the specific bound that hit zero — checked in the same priority a reader would
  // reach for the fix: no cash at all is the most actionable, the position cap next, the
  // subscription's own allocation last (it's the narrowest and rarest budget of the three). Cash
  // that is there but promised to a sold put says so, rather than reading as "no cash".
  if (affordable <= 0) {
    const reserved = Math.floor(unspentCash(portfolio, ledger) / unitPrice) >= 1;
    return { ok: false, reason: reserved ? "collateral-reserved" : "insufficient-cash" };
  }
  if (withinPosition <= 0) return { ok: false, reason: "position-cap" };
  return { ok: false, reason: "subscription-budget" };
}

/**
 * Clamp a sell so it never sells more than is actually held (no accidental shorting), and never the
 * shares a sold call stands on — judged against the best cover the book has, so a call a long caps
 * (a debit spread's short) never blocks selling the stock under it.
 */
function clampSell(
  intent: OrderIntent,
  portfolio: Portfolio,
  { ledger }: OptionBatch,
): SellSizingOutcome {
  const held = heldQuantity(portfolio, intent.symbol);
  if (held <= 0) return { ok: false, reason: "nothing-held" };
  const unsold = held - soldShares(ledger, intent.symbol);
  const most = Math.min(intent.quantity, Math.max(0, unsold));
  // Zeroed by an earlier sell in the batch: plain `nothing-held`, never the call.
  if (!(most > 0)) return { ok: false, reason: "nothing-held" };
  const quantity = ledger.active ? largestSale(portfolio, ledger, intent.symbol, most) : most;
  if (!(quantity > 0)) return { ok: false, reason: "uncovers-short-call" };
  claim(ledger, { sold: { underlying: intent.symbol, shares: quantity } });
  return { ok: true, intent: { ...intent, quantity } };
}

/** The most of `most` shares a sale may take without leaving a sold call short of cover. Fewer
 *  shares sold never needs more cover, so the answer is found by halving. */
function largestSale(
  portfolio: Portfolio,
  ledger: OptionBatch["ledger"],
  underlying: string,
  most: number,
): number {
  const fits = (sells: number): boolean => {
    const worse = worsens(portfolio, ledger, underlying, { sells });
    return !(worse.shares || worse.cash);
  };
  if (fits(most)) return most;
  let low = 0;
  let high = Math.floor(most);
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(mid)) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** The S2/E1 check for an intent that opens risk. `allowThroughPrint` is a share-only opt-out: an
 *  option open is print-gated by its own expiry rule, never waved through. */
function disciplineReason(
  intent: OrderIntent,
  context: MarketContext,
  discipline: TradeDiscipline,
): "s2-print" | "e1-open" | undefined {
  const checked = intent.option ? { ...intent, allowThroughPrint: false } : intent;
  const outcome = clampDiscipline(checked, context, discipline);
  return outcome.ok ? undefined : outcome.reason;
}

/** The sizing clamp for one intent that cleared the shape, ladder and discipline checks. */
function clampOne(
  intent: OrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig,
  batch: OptionBatch,
): SizingOutcome {
  if (intent.option) return clampOption(intent, intent.option, portfolio, context, config, batch);
  return intent.side === "buy"
    ? clampBuy(intent, portfolio, context, config, batch)
    : clampSell(intent, portfolio, batch);
}

/**
 * Apply all guards to a batch of intents against a single portfolio snapshot, and say why for
 * every one that didn't survive — the data `docs/plans/where-are-we-documenting-*.md`'s "guard
 * opportunity cost" measure scores against. Guards size each intent against the *starting*
 * portfolio for the cycle; the one intra-cycle interaction they track is the batch ledger
 * (`guard-batch.ts`) — so a sold put and a share buy in one cycle cannot spend the same cash twice.
 *
 * `openSells` is what sell orders still open at the broker will take, per symbol (#4678): a new
 * sell is sized against the shares they leave, and refused `nothing-held` when they leave none.
 * Empty for a broker with nothing open, which sizes exactly as before.
 */
export function applyGuardsWithVerdicts(
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
  openSells?: ReadonlyMap<string, number>,
): GuardResult {
  const approved: OrderIntent[] = [];
  const refused: GuardRefusal[] = [];
  const ladderBlocks = config.accountTier !== undefined && blocksRiskIncrease(config.accountTier);
  const book = bookNeeds(portfolio);
  // An open no subscribed playbook placed is refused before anything sizes it, so the batch ledger
  // never counts it either. With the rule off, or every open subscribed, this is exactly the batch
  // as handed in.
  const unsubscribed = (intent: OrderIntent) => refusedAsUnsubscribed(intent, config);
  const sized = intents.filter((intent) => !unsubscribed(intent));
  const batch: OptionBatch = { ledger: openLedger(sized, book, portfolio, openSells), book };
  for (const intent of intents) {
    // Shape first, permanently: a share-shaped order naming a contract is never a way to trade one
    // (a contract only trades as a priced limit through `option`), and a malformed option order is
    // never sized at all — the same rule the builder and the wire parser use.
    if (isBareContractOrder(intent) || (intent.option && optionOrderProblems(intent).length > 0)) {
      refused.push({ intent, reason: "option-shape" });
      continue;
    }
    // Then who may open at all (#4642 slice 10): only a playbook the account is subscribed to.
    // Exits never reach this refusal (`subscribed-only.ts`).
    if (unsubscribed(intent)) {
      refused.push({ intent, reason: "unsubscribed" });
      continue;
    }
    // Whether this order ADDS risk: a share buy, or any option open (a sold put is a sell that opens
    // risk). For a share intent this is exactly `side === "buy"`.
    const opens = opensRisk(intent);
    // The ladder's BLOCK rung, ahead of everything else: no point sizing an order that is refused.
    // A share sell can only ever be risk-reducing, because `clampSell` refuses to sell more than is
    // held, and an option close only closes what is held. So blocking opens alone satisfies the
    // rung: new risk is refused, EXISTING POSITIONS ARE UNTOUCHED, and exits stay open — including
    // the force-flatten sells the bottom rung emits.
    if (opens && ladderBlocks) {
      refused.push({ intent, reason: "ladder-block" });
      continue;
    }
    // Trade discipline next (S2/E1, opens only): a dropped entry needs no sizing. S2 keys on
    // `intent.symbol`, which for an option order is the underlying.
    const discipline =
      opens && config.discipline ? disciplineReason(intent, context, config.discipline) : undefined;
    if (discipline) {
      refused.push({ intent, reason: discipline });
      continue;
    }
    const outcome = clampOne(intent, portfolio, context, config, batch);
    if (outcome.ok) {
      approved.push(outcome.intent);
    } else {
      refused.push({ intent, reason: outcome.reason });
    }
  }
  return { approved, refused };
}

/**
 * The pre-existing surface — every current caller (the trading engine, the readiness evals, the
 * risk specs) keeps this exact signature and behavior unchanged. `applyGuardsWithVerdicts` is the
 * additive superset the autonomous audit trail reads from.
 */
export function applyGuards(
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): OrderIntent[] {
  return [...applyGuardsWithVerdicts(intents, portfolio, context, config).approved];
}
