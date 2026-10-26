import { RESTRICT_DRAWDOWN_PCT } from "../risk/risk-ladder.js";
import { equityDrawdown } from "./equity-sparkline.js";
import type { EquitySample } from "./history-store.js";

/**
 * SYSTEM VITALS — the budget-bar gauges on a decision's detail view (Eric: "think of the metrics
 * we post back to the details view of an activity line item as gauges... high level succinct
 * feedback to state the health of the system and if it is healthy or in an unsustainable state").
 *
 * A gauge is a BUDGET BAR, not a raw number: the fill answers "how much room is left against ITS
 * OWN cap," never "what is the value" — the sustainability question, not the magnitude one. Every
 * gauge carries a word, a number, and a bar (`docs/BRAND.md` → *Accessibility*: hue never carries
 * meaning alone), and every gauge has an honest "not yet measurable" state that renders as such —
 * never as zero, never as a full bar. `measured: false` is that state; a consumer must never
 * fabricate a `fraction` for one.
 *
 * Only `lossHeadroom` is computable today (from equity history + the risk ladder's own cap). The
 * other three (`edgeVsHold`, `proof`, `breadth`) need measures PR 7 hasn't built yet — they render
 * their honest empty state until then. That is the anti-overfitting guardrail working, not a gap
 * to apologise for.
 */

export interface VitalGauge {
  readonly label: string;
  readonly measured: boolean;
  /** 0..1 fill — present ONLY when `measured` is true. */
  readonly fraction?: number;
  readonly valueText: string;
  readonly detailText?: string;
}

export interface WireTradeVitals {
  readonly lossHeadroom: VitalGauge;
  readonly edgeVsHold: VitalGauge;
  readonly proof: VitalGauge;
  readonly breadth: VitalGauge;
}

function unmeasured(label: string, word: string): VitalGauge {
  return { label, measured: false, valueText: word };
}

/**
 * Loss headroom AS OF one decision: peak-to-trough drawdown (`equityDrawdown`) over every equity
 * sample up to and including `atIso`, against `RESTRICT_DRAWDOWN_PCT` — the same 5% daily-loss cap
 * `SafetyController`'s live breaker already watches (`risk-ladder.ts`'s own module doc: "the same
 * number... already wired"), so this gauge never quietly redraws a line the real breaker draws.
 *
 * Deliberately drawdown-from-peak rather than a day-open-baseline reading (the ladder's own exact
 * shape, `readRiskLadder`): reconstructing an historical day-open baseline for an arbitrary past
 * timestamp needs a day-boundary index this view doesn't have. Drawdown-from-peak is the same
 * DIRECTION of signal computed from data already on hand — an honest, cheaper proxy, not the
 * breaker's own reading.
 */
export function lossHeadroomGauge(samples: readonly EquitySample[], atIso: string): VitalGauge {
  const upToDecision = samples.filter((s) => s.at <= atIso);
  const dd = equityDrawdown(upToDecision);
  if (!dd) return unmeasured("Loss headroom", "not yet measured");

  const ddFraction = dd.ddPct / 100;
  const cap = RESTRICT_DRAWDOWN_PCT;
  const fraction = Math.max(0, Math.min(1, 1 - ddFraction / cap));
  return {
    label: "Loss headroom",
    measured: true,
    fraction,
    valueText: `${Math.round(fraction * 100)}% left`,
    detailText: `${(ddFraction * 100).toFixed(1)}% of ${(cap * 100).toFixed(1)}% cap`,
  };
}

/** The three gauges PR 7's measures haven't landed yet. Never a fabricated value in the meantime. */
export function unmeasuredVitals(): Omit<WireTradeVitals, "lossHeadroom"> {
  return {
    edgeVsHold: unmeasured("Edge vs. hold", "not yet measured"),
    // "Proof" gets its own word, not the generic one: an honest CI-straddles-zero reading IS the
    // anti-overfitting guardrail working, and the copy should say so rather than apologise
    // (docs/plans/where-are-we-documenting-*.md's own instruction).
    proof: unmeasured("Proof", "unproven"),
    breadth: unmeasured("Breadth", "not yet measured"),
  };
}

/** The full four-gauge block for one decision, `lossHeadroom` live, the rest honestly empty. */
export function wireTradeVitals(samples: readonly EquitySample[], atIso: string): WireTradeVitals {
  return { lossHeadroom: lossHeadroomGauge(samples, atIso), ...unmeasuredVitals() };
}
