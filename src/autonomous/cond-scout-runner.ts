import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { applyGuardsWithVerdicts, type GuardRefusal, type RiskConfig } from "../engine/guards.js";
import {
  COND_SCOUT_ID,
  type CondScoutConfig,
  readConditions,
  scanConditions,
} from "../playbooks/cond-scout.js";
import {
  checkShadowExit,
  openShadowProbe,
  probeIntent,
  type ShadowClose,
  type ShadowProbe,
  type ShadowSnapshot,
  snapshotProbe,
} from "../playbooks/cond-scout-ledger.js";
import { type ProbeRetro, probeRetro } from "../playbooks/cond-scout-retro.js";
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

/** In-flight snapshot cadence (#3651 slice 3, settled 2026-09-24): hourly, not every ~15s pass —
 *  a 5-to-14-day thesis needs its shape over time, not a tick tape, and the bots volume is small. */
export const SNAPSHOT_EVERY_MS = 3_600_000;

export interface CondScoutStore {
  loadOpen(): readonly ShadowProbe[];
  saveOpen(probe: ShadowProbe): void;
  /** Removes the probe from the open set and keeps the close. */
  close(close: ShadowClose): void;
  /** The newest closes first — how a restart rebuilds today's latches from the ledger itself. */
  recentCloses(limit: number): readonly ShadowClose[];
  saveSnapshot(snapshot: ShadowSnapshot): void;
  /** One probe's snapshots — how a close after a restart still sees the whole path. */
  snapshotsFor(probeId: string): readonly ShadowSnapshot[];
  saveRetro(retro: ProbeRetro): void;
}

const isoDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

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
  readonly onSnapshot?: (snapshot: ShadowSnapshot) => void;
  readonly onRetro?: (retro: ProbeRetro) => void;
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
  /** Last snapshot per probe id. Not persisted: a restart takes one extra snapshot, never misses. */
  private readonly lastSnapshotAt = new Map<string, number>();
  /** This process's snapshots per open probe — the retro's source when no store is wired. */
  private readonly snapshots = new Map<string, ShadowSnapshot[]>();

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
    if (this.closedDay !== sessionDay) this.startSession(sessionDay);
    this.closeDue(context, at);
    await this.snapshotDue(context, sessionDay, at);
    if (this.openedDay === sessionDay || this.deps.blockedReason()) return;
    await this.openNew(context, sessionDay, at);
  }

  /**
   * A new session day — or the first pass after a restart. Both latches are rebuilt from the
   * stored ledger, never assumed empty: a mid-session restart must not open a second batch, nor
   * re-open a symbol stopped out earlier that day.
   */
  private startSession(sessionDay: string): void {
    this.closedDay = sessionDay;
    this.closedToday.clear();
    const recent = this.deps.store?.recentCloses(100) ?? [];
    for (const close of recent) {
      if (isoDay(close.closedAt) === sessionDay) this.closedToday.add(close.probe.symbol);
    }
    const probes = [...this.open.values(), ...recent.map((c) => c.probe)];
    if (probes.some((p) => isoDay(p.openedAt) === sessionDay)) this.openedDay = sessionDay;
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
      this.lastSnapshotAt.delete(close.probe.id);
      this.closedToday.add(close.probe.symbol);
      this.deps.store?.close(close);
      this.deps.onClose?.(close);
      const retro = probeRetro(
        close,
        this.deps.store?.snapshotsFor(close.probe.id) ?? this.snapshots.get(close.probe.id) ?? [],
      );
      this.snapshots.delete(close.probe.id);
      this.deps.store?.saveRetro(retro);
      this.deps.onRetro?.(retro);
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
    await this.ensureCloses(sessionDay);
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

    // One probe at a time, each judged against the book as the previous one left it — so the
    // guards' own cash clamp holds the experiment to its shadow capital, exactly as a broker
    // would hold a real account to its cash. Anything that no longer fits is refused as
    // `insufficient-cash`, keeping the record's raw − approved = refused invariant.
    const approved: OrderIntent[] = [];
    const refused: GuardRefusal[] = [];
    for (const { probe, intent } of candidates) {
      const verdict = applyGuardsWithVerdicts(
        [intent],
        this.shadowPortfolio(),
        context,
        this.deps.risk,
      );
      refused.push(...verdict.refused);
      const ok = verdict.approved[0];
      if (!ok) continue;
      approved.push(ok);
      // The guards may clamp the size: a probe opens at the approved quantity, never the asked one.
      const opened =
        ok.quantity === probe.quantity
          ? probe
          : { ...probe, quantity: ok.quantity, notional: probe.entryPrice * ok.quantity };
      this.open.set(opened.symbol, opened);
      this.deps.store?.saveOpen(opened);
      const quote = context.quotes[opened.symbol];
      const hypothesis = hypotheses.find((h) => h.symbol === opened.symbol);
      if (quote) this.recordSnapshot(snapshotProbe(opened, quote, at, hypothesis?.reading));
    }
    // A scan that produced candidates spends the session whether or not any survived: a book the
    // guards refuse now would refuse identically every pass for the rest of the day.
    this.openedDay = sessionDay;
    const intents = candidates.map((c) => c.intent);
    this.deps.onDecision?.({
      at,
      personaId: COND_SCOUT_PERSONA_ID,
      mode: "observe",
      rawIntents: intents,
      guardedIntents: approved,
      outcomes: approved.map((intent) => ({ intent, action: "observed" })),
      context,
      ...(refused.length > 0 ? { refusals: refused } : {}),
    });
  }

  /** Daily closes change once a session: fetched on the first pass that needs them, reused after. */
  private async ensureCloses(sessionDay: string): Promise<void> {
    if (this.closesDay === sessionDay) return;
    this.closes = await this.deps.closesFor(this.deps.universe);
    this.closesDay = sessionDay;
  }

  /** Every open probe whose last snapshot is an hour old gets another: quote, conditions, mark. */
  private async snapshotDue(context: MarketContext, sessionDay: string, at: number): Promise<void> {
    const due = [...this.open.values()].filter(
      (p) => at - (this.lastSnapshotAt.get(p.id) ?? Number.NEGATIVE_INFINITY) >= SNAPSHOT_EVERY_MS,
    );
    if (due.length === 0) return;
    await this.ensureCloses(sessionDay);
    for (const probe of due) {
      const quote = context.quotes[probe.symbol];
      if (!quote) continue; // no quote, no honest mark — try again next pass
      const reading = readConditions(context, probe.symbol, this.closes[probe.symbol] ?? []);
      this.recordSnapshot(snapshotProbe(probe, quote, at, reading));
    }
  }

  private recordSnapshot(snapshot: ShadowSnapshot): void {
    this.lastSnapshotAt.set(snapshot.probeId, snapshot.at);
    this.snapshots.set(snapshot.probeId, [
      ...(this.snapshots.get(snapshot.probeId) ?? []),
      snapshot,
    ]);
    this.deps.store?.saveSnapshot(snapshot);
    this.deps.onSnapshot?.(snapshot);
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
