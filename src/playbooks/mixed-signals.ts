/**
 * MIXED-SIGNALS DETECTOR (#3194, step 5 — OBSERVE-ONLY). Stage 1 of the #3186 safeguard ladder
 * needs a testable answer to "the signals are mixed"; this module is that answer, shipped as a
 * pure observation that is logged and never acted on.
 *
 * THE RULE (written down literally, so a later PR can be judged against it):
 *   For a symbol in a playbook that opts in (`playbook.mixedSignals` present), the signals are
 *   MIXED when BOTH shared signals carry a direction AND the directions disagree:
 *     |momentum|      ≥ momentumFloor   (default 0.02 — a 2% short-window move), and
 *     |newsSentiment| ≥ sentimentFloor  (default 0.2 on the [-1, 1] scale), and
 *     sign(momentum) ≠ sign(newsSentiment).
 *   A signal below its floor, or absent from the context, is NO reading — never a disagreement.
 *   Falsifier: the rule earns step 5b only if a flagged cycle is a worse time to ENTER than an
 *   unflagged one. If, at the first 30 logged observations on an opted-in playbook or by
 *   2026-11-30 (whichever comes first), the next cycle's move in the playbook's direction is no
 *   worse after a flagged cycle than after an unflagged one, the rule is flagging noise — re-fit
 *   the floors or drop it before any suspend is wired.
 *
 * Why opt-in, never global: "mixed" is strategy-relative. Sauron's rollover and rebound entries
 * (`src/personas/sauron.ts`) trade EXACTLY this disagreement — euphoric news on falling price —
 * so for a contrarian play a mixed reading is the signal, not a warning. Only a playbook whose
 * edge assumes news and price agree should declare it.
 *
 * Isolation (#3194's decision-isolation contract): the detector's only inputs are the ONE shared
 * `MarketContext` feed and the observing playbook's own declaration. It never takes a portfolio,
 * another playbook's intents, or any derived signal, so one bot's logic cannot reach another's
 * observation — `derivesFrom` is not needed here because nothing derived is read at all.
 *
 * Observe-only by construction: `detectMixedSignals` returns observations, not intents, and
 * `observeMixedSignals` only hands each one to a log sink. Wiring a reading to suspend entries is
 * step 5b — its own PR, in the same opt-in shape (`action` below widens from "observe").
 */
import type { MarketContext } from "../domain/types.js";
import type { EnabledPlaybook } from "./playbook.js";

export const DEFAULT_MOMENTUM_FLOOR = 0.02;
export const DEFAULT_SENTIMENT_FLOOR = 0.2;

/**
 * A playbook's opt-in to the detector. `action` is a one-member union today on purpose: the
 * step-5b wiring adds its suspend-entries member here, so an opted-in playbook keeps observing
 * until a PR explicitly moves it — no silent promotion from logging to acting.
 */
export interface MixedSignalsDial {
  readonly action: "observe";
  readonly momentumFloor?: number;
  readonly sentimentFloor?: number;
}

/** One symbol, one cycle, both signals pointing opposite ways past their floors. */
export interface MixedSignalsObservation {
  readonly playbookId: string;
  readonly symbol: string;
  readonly asOf: string;
  readonly momentum: number;
  readonly newsSentiment: number;
}

/** Where observations go — a line-based log, matching the runtime scripts' `log.log` idiom. */
export interface MixedSignalsSink {
  log(line: string): void;
}

/** The default sink — discards every line, so a caller that passes none logs nothing. */
export const SILENT_MIXED_SIGNALS_SINK: MixedSignalsSink = { log: () => undefined };

/** A reading's direction past its floor: +1, -1, or 0 for "no reading". */
function direction(value: number | undefined, floor: number): number {
  if (value === undefined || Math.abs(value) < floor) {
    return 0;
  }
  return Math.sign(value);
}

/** The rule above, evaluated for every opted-in playbook's symbols. Pure. */
export function detectMixedSignals(
  enabled: readonly EnabledPlaybook[],
  context: MarketContext,
): MixedSignalsObservation[] {
  const observations: MixedSignalsObservation[] = [];
  for (const { playbook } of enabled) {
    const dial = playbook.mixedSignals;
    if (!dial) {
      continue;
    }
    const momentumFloor = dial.momentumFloor ?? DEFAULT_MOMENTUM_FLOOR;
    const sentimentFloor = dial.sentimentFloor ?? DEFAULT_SENTIMENT_FLOOR;
    for (const symbol of playbook.symbols) {
      const momentum = context.momentum?.[symbol];
      const newsSentiment = context.newsSentiment?.[symbol];
      const m = direction(momentum, momentumFloor);
      const s = direction(newsSentiment, sentimentFloor);
      if (momentum === undefined || newsSentiment === undefined || m === 0 || s === 0 || m === s) {
        continue;
      }
      observations.push({
        playbookId: playbook.id,
        symbol,
        asOf: context.asOf,
        momentum,
        newsSentiment,
      });
    }
  }
  return observations;
}

/** The log line for one observation — plain words, the numbers that tripped it. */
export function formatMixedSignals(o: MixedSignalsObservation): string {
  return (
    `[mixed-signals] ${o.playbookId} ${o.symbol} @ ${o.asOf}: momentum ` +
    `${(o.momentum * 100).toFixed(1)}% vs news sentiment ${o.newsSentiment.toFixed(2)} ` +
    "(observe-only — no order placed, changed or held back)"
  );
}

/** Detect, then log each observation. Returns nothing a caller could act on. */
export function observeMixedSignals(
  enabled: readonly EnabledPlaybook[],
  context: MarketContext,
  sink: MixedSignalsSink,
): void {
  for (const o of detectMixedSignals(enabled, context)) {
    sink.log(formatMixedSignals(o));
  }
}
