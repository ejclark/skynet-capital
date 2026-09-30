import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { applyGuardsWithVerdicts, type RiskConfig } from "../engine/guards.js";
import { COND_SCOUT_ID, type CondScoutConfig, scanConditions } from "../playbooks/cond-scout.js";
import {
  checkShadowExit,
  openShadowProbe,
  probeIntent,
  type ShadowClose,
  type ShadowProbe,
} from "../playbooks/cond-scout-ledger.js";
import type { DecisionRecord } from "./decision-record.js";

/**
 * COND-SCOUT's per-pass orchestration (#3651 slice 2b) — the stateful half of the scout, on the
 * same pattern as `live-cycle.ts`'s beta scout: pure and dependency-injected, with the daily-close
 * source, the durable store and every sink passed in. Nothing here can reach a broker — it holds
 * no `BrokerPort` at all, which is the structural guarantee behind the shadow ledger (Eric,
 * 2026-09-30: results stay in the health dashboard; no account's numbers move).
 *
 * Each pass: close any open probe whose stop or horizon the current quote reaches, then — until
 * one opens for the session — scan the universe and open the strongest hypotheses that survive the
 * same `applyGuards` a real order faces, against a shadow portfolio. Every open and close is one
 * `DecisionRecord` under `personaId: "cond-scout"` in `observe` mode: decided, never submitted.
 */

export const COND_SCOUT_PERSONA_ID = "cond-scout";

/** Shadow capital the probes draw from: ten $5k probes at most, so the guards' position cap
 *  measures each probe against a book the size of the experiment, not a real account. */
const DEFAULT_SHADOW_CAPITAL = 50_000;

export interface CondScoutStore {
  loadOpen(): readonly ShadowProbe[];
  saveOpen(probe: ShadowProbe): void;
  /** Removes the probe from the open set and keeps the close. */
  close(close: ShadowClose): void;
}

export interface CondScoutDeps {
  readonly universe: readonly string[];
  /** Daily closes per symbol, oldest first, ending at the last completed session. */
  readonly closesFor: (
    symbols: readonly string[],
  ) => Promise<Readonly<Record<string, readonly number[]>>>;
  readonly risk: RiskConfig;
  /** The kill switch / breakers. Halted = no new probes; open ones still close on the books. */
  readonly blockedReason: () => string | null;
  readonly store?: CondScoutStore;
  readonly config?: CondScoutConfig;
  readonly shadowCapital?: number;
  readonly now?: () => number;
  readonly onDecision?: (record: DecisionRecord) => void;
  readonly onClose?: (close: ShadowClose) => void;
}

function exitIntent(close: ShadowClose): OrderIntent {
  const { probe } = close;
  return {
    symbol: probe.symbol,
    side: "sell",
    quantity: probe.quantity,
    type: "market",
    playbookId: COND_SCOUT_ID,
    playbookMode: "conservative",
    reason:
      `COND-SCOUT SHADOW PROBE exit (${close.reason}) — simulated fill at the bid ` +
      `${close.exitPrice.toFixed(2)}, no order sent. ROI ${(close.roi * 100).toFixed(2)}% over ` +
      `${close.daysHeld.toFixed(1)} days.`,
  };
}

export class CondScoutRunner {
  private readonly deps: CondScoutDeps;
  private readonly open = new Map<string, ShadowProbe>();
  private openedDay = "";
  /** Symbols closed this session: a stopped-out thesis never re-opens the same day — churn is not
   *  a signal (the beta scout's own rollover rule, `live-cycle.ts`). */
  private closedDay = "";
  private readonly closedToday = new Set<string>();
  private closesDay = "";
  private closes: Readonly<Record<string, readonly number[]>> = {};

  constructor(deps: CondScoutDeps) {
    this.deps = deps;
    for (const probe of deps.store?.loadOpen() ?? []) this.open.set(probe.symbol, probe);
  }

  /** Open probes, keyed by symbol — read-only view for health reporting. */
  openProbes(): readonly ShadowProbe[] {
    return [...this.open.values()];
  }

  async runPass(context: MarketContext, sessionDay = context.asOf.slice(0, 10)): Promise<void> {
    const at = (this.deps.now ?? Date.now)();
    if (this.closedDay !== sessionDay) {
      this.closedDay = sessionDay;
      this.closedToday.clear();
    }
    this.closeDue(context, at);
    if (this.openedDay === sessionDay || this.deps.blockedReason()) return;
    await this.openNew(context, sessionDay, at);
  }

  private closeDue(context: MarketContext, at: number): void {
    const closed: ShadowClose[] = [];
    for (const probe of this.open.values()) {
      const quote = context.quotes[probe.symbol];
      const close = quote ? checkShadowExit(probe, quote, at) : undefined;
      if (!close) continue;
      closed.push(close);
    }
    if (closed.length === 0) return;
    for (const close of closed) {
      this.open.delete(close.probe.symbol);
      this.closedToday.add(close.probe.symbol);
      this.deps.store?.close(close);
      this.deps.onClose?.(close);
    }
    const intents = closed.map(exitIntent);
    this.deps.onDecision?.({
      at,
      personaId: COND_SCOUT_PERSONA_ID,
      mode: "observe",
      rawIntents: intents,
      guardedIntents: intents,
      outcomes: intents.map((intent) => ({ intent, action: "observed" })),
      context,
    });
  }

  private async openNew(context: MarketContext, sessionDay: string, at: number): Promise<void> {
    // Daily closes change once a session: fetched on the first pass of the day, reused after.
    if (this.closesDay !== sessionDay) {
      this.closes = await this.deps.closesFor(this.deps.universe);
      this.closesDay = sessionDay;
    }
    const config = this.deps.config ?? {};
    const hypotheses = scanConditions(
      context,
      this.deps.universe,
      this.closes,
      new Set([...this.open.keys(), ...this.closedToday]),
      config,
    );
    // An empty scan doesn't spend the day: early passes run before sentiment has warmed up
    // (the beta scout's own 2026-09-04 lesson, `live-cycle.ts`).
    if (hypotheses.length === 0) return;

    const stopPct = config.stopPct ?? 0.05;
    const candidates = hypotheses.flatMap((hypothesis) => {
      const quote = context.quotes[hypothesis.symbol];
      const probe = quote ? openShadowProbe(hypothesis, quote, at, stopPct) : undefined;
      return probe ? [{ probe, intent: probeIntent(hypothesis, probe.quantity) }] : [];
    });
    if (candidates.length === 0) return;

    const intents = candidates.map((c) => c.intent);
    const verdicts = applyGuardsWithVerdicts(
      intents,
      this.shadowPortfolio(),
      context,
      this.deps.risk,
    );
    // The guards may clamp a buy's size as well as refuse it: a probe opens at the quantity the
    // guards approved, never the one it asked for.
    const approvedQty = new Map(verdicts.approved.map((i) => [i.symbol, i.quantity]));
    for (const { probe } of candidates) {
      const quantity = approvedQty.get(probe.symbol);
      if (quantity === undefined || quantity < 1) continue;
      const opened =
        quantity === probe.quantity
          ? probe
          : { ...probe, quantity, notional: probe.entryPrice * quantity };
      this.open.set(opened.symbol, opened);
      this.deps.store?.saveOpen(opened);
    }
    if (approvedQty.size > 0) this.openedDay = sessionDay;
    this.deps.onDecision?.({
      at,
      personaId: COND_SCOUT_PERSONA_ID,
      mode: "observe",
      rawIntents: intents,
      guardedIntents: verdicts.approved,
      outcomes: verdicts.approved.map((intent) => ({ intent, action: "observed" })),
      context,
      ...(verdicts.refused.length > 0 ? { refusals: verdicts.refused } : {}),
    });
  }

  /** The book the guards judge a probe against: shadow capital less what open probes tie up. */
  private shadowPortfolio(): Portfolio {
    const probes = [...this.open.values()];
    const committed = probes.reduce((sum, p) => sum + p.notional, 0);
    return {
      cash: (this.deps.shadowCapital ?? DEFAULT_SHADOW_CAPITAL) - committed,
      positions: probes.map((p) => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.entryPrice,
      })),
    };
  }
}
