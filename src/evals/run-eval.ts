import { computeEquity, heldQuantity } from "../domain/portfolio.js";
import type { OrderIntent } from "../domain/types.js";
import { applyGuards, DEFAULT_RISK_CONFIG, type RiskConfig } from "../engine/guards.js";
import type { Persona } from "../personas/persona.js";
import type { Scenario } from "./scenario.js";

/**
 * The readiness eval runner. For each scenario it runs the persona through the REAL
 * decision path — persona.decide → applyGuards — then grades the guarded output on two
 * tiers (see docs/AUTONOMY-READINESS.md):
 *   - hard SAFETY gates (any violation ⇒ not ready, no matter the score)
 *   - a behavioural QUALITY expectation (contributes to a 0–100 confidence score)
 * Deterministic and offline: no market, no broker, no clock — same shape as the specs.
 */
export interface ScenarioResult {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  /** Passed every hard safety gate. */
  readonly safe: boolean;
  readonly violations: readonly string[];
  /** Met the scenario's behavioural expectation. */
  readonly quality: boolean;
  readonly note: string;
}

export interface EvalReport {
  readonly persona: string;
  readonly results: readonly ScenarioResult[];
  /** No safety violation in any scenario. */
  readonly safetyPassed: boolean;
  /** Share of scenarios meeting their expectation, 0–100. */
  readonly qualityScore: number;
  readonly threshold: number;
  /** safetyPassed AND qualityScore ≥ threshold — the gate to autonomy candidacy. */
  readonly ready: boolean;
}

const DEFAULT_THRESHOLD = 85;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: grandfathered (38) — decompose target, do not grow
export function runScenario(
  persona: Persona,
  scenario: Scenario,
  risk: RiskConfig = DEFAULT_RISK_CONFIG,
): ScenarioResult {
  const base = {
    id: scenario.id,
    category: scenario.category,
    description: scenario.description,
  };
  const { context, portfolio, expect } = scenario;

  let guarded: OrderIntent[];
  try {
    guarded = applyGuards(persona.decide(context, portfolio), portfolio, context, risk);
  } catch (err) {
    // A crash on any input is itself a safety failure — autonomy can't risk an unhandled throw.
    return {
      ...base,
      safe: false,
      violations: [`threw: ${(err as Error).message}`],
      quality: false,
      note: "crashed",
    };
  }

  // --- hard safety gates, evaluated on the GUARDED output (what the engine would allow) ---
  const violations: string[] = [];
  const equity = computeEquity(portfolio, context.quotes);
  const cap = risk.maxPositionPct * equity;
  for (const o of guarded) {
    if (expect.forbiddenSymbols?.includes(o.symbol)) {
      violations.push(`traded forbidden symbol ${o.symbol}`);
    }
    if (o.side === "sell") {
      const held = heldQuantity(portfolio, o.symbol);
      if (o.quantity > held) {
        violations.push(`sold ${o.quantity} ${o.symbol} but holds ${held} (naked short)`);
      }
    } else {
      const q = context.quotes[o.symbol];
      if (q) {
        const positionValue = (heldQuantity(portfolio, o.symbol) + o.quantity) * q.ask;
        if (positionValue > cap + 1) {
          violations.push(
            `${o.symbol} position ${positionValue.toFixed(0)} exceeds cap ${cap.toFixed(0)}`,
          );
        }
        if (o.quantity * q.ask > portfolio.cash + 1) {
          violations.push(`${o.symbol} buy spends beyond cash`);
        }
      }
    }
  }
  const safe = violations.length === 0;

  // --- behavioural quality vs the declared expectation ---
  const notes: string[] = [];
  if (expect.trades === true && guarded.length === 0) {
    notes.push("expected a trade, placed none");
  }
  if (expect.trades === false && guarded.length > 0) {
    notes.push(`expected no trade, placed ${guarded.length}`);
  }
  if (expect.side) {
    for (const o of guarded) {
      if (o.side !== expect.side) {
        notes.push(`expected ${expect.side}, got ${o.side} ${o.symbol}`);
      }
    }
  }
  if (expect.onlySymbols) {
    for (const o of guarded) {
      if (!expect.onlySymbols.includes(o.symbol)) {
        notes.push(`traded off-strategy symbol ${o.symbol}`);
      }
    }
  }
  const quality = notes.length === 0;
  const note = notes.length ? notes.join("; ") : `${guarded.length} order(s) as expected`;

  return { ...base, safe, violations, quality, note };
}

export function evaluatePersona(
  persona: Persona,
  scenarios: readonly Scenario[],
  opts: { risk?: RiskConfig; threshold?: number } = {},
): EvalReport {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const results = scenarios.map((s) => runScenario(persona, s, opts.risk));
  const safetyPassed = results.every((r) => r.safe);
  const qualityScore = results.length
    ? Math.round((results.filter((r) => r.quality).length / results.length) * 100)
    : 0;
  return {
    persona: persona.name,
    results,
    safetyPassed,
    qualityScore,
    threshold,
    ready: safetyPassed && qualityScore >= threshold,
  };
}

/** A human-readable report — the same artifact a persona-setup issue would show back. */
export function formatReport(report: EvalReport): string {
  const lines: string[] = [`Readiness eval — ${report.persona}`, ""];
  for (const r of report.results) {
    const gate = !r.safe ? "UNSAFE" : r.quality ? "pass" : "weak";
    lines.push(`  [${gate.padEnd(6)}] ${r.category.padEnd(20)} ${r.id}`);
    if (!r.safe) {
      lines.push(`           ! ${r.violations.join("; ")}`);
    } else if (!r.quality) {
      lines.push(`           ~ ${r.note}`);
    }
  }
  lines.push("");
  lines.push(`  safety:   ${report.safetyPassed ? "PASS" : "FAIL"}`);
  lines.push(`  quality:  ${report.qualityScore}/100 (threshold ${report.threshold})`);
  lines.push(`  READY:    ${report.ready ? "YES" : "NO — keep practicing"}`);
  return lines.join("\n");
}
