import { type EvalReport, evaluatePersona, runScenario } from "../evals/run-eval.js";
import type { Scenario } from "../evals/scenario.js";
import type { Persona } from "../personas/persona.js";

/**
 * The READINESS GATE (Phase 1 of `docs/AUTONOMY-PLAN.md`). A persona may only trade live once it has
 * EARNED it by passing its readiness eval — enablement is tied to a green score, not just an env var.
 * This is deliberately strict: no quality pack, or any safety violation, or a sub-threshold score →
 * NOT ready. A not-ready persona can still run in observe mode (watched, but placing nothing), which
 * is exactly how you build confidence in it before it's trusted.
 *
 * Pure and offline — it runs the same evals as `npm run eval:persona` / `eval:safety`, so the runner's
 * gate and the CLI report can never disagree.
 */
export interface ReadinessResult {
  readonly personaId: string;
  /** True only when the persona is safe AND has a passing quality pack. */
  readonly ready: boolean;
  /** Human-readable reason (the gate's verdict), shown at startup. */
  readonly reason: string;
  /** The quality report, when a pack exists. */
  readonly report?: EvalReport;
}

export interface ReadinessInputs {
  /** Persona-specific readiness pack (quality + safety). Absent = cannot be certified ready. */
  readonly pack?: readonly Scenario[];
  /** The generic safety battery every persona must survive. */
  readonly safetyScenarios: readonly Scenario[];
  /** Quality threshold override (defaults to the eval's own default). */
  readonly threshold?: number;
}

/**
 * Assess whether `persona` has earned live trading. Order of checks (fail fast):
 *   1. Generic safety battery — any violation ⇒ not ready.
 *   2. A readiness pack must exist — no pack ⇒ not ready (build one first).
 *   3. The pack's `ready` verdict (safe AND quality ≥ threshold).
 */
export function assessReadiness(persona: Persona, inputs: ReadinessInputs): ReadinessResult {
  const safetyViolations = inputs.safetyScenarios.flatMap(
    (s) => runScenario(persona, s).violations,
  );
  if (safetyViolations.length > 0) {
    return {
      personaId: persona.id,
      ready: false,
      reason: `failed the safety battery (${safetyViolations.length} violation(s): ${safetyViolations[0]})`,
    };
  }

  if (!inputs.pack || inputs.pack.length === 0) {
    return {
      personaId: persona.id,
      ready: false,
      reason:
        "no readiness pack — safe, but not yet certified (build a scenario pack to enable live)",
    };
  }

  const report = evaluatePersona(
    persona,
    inputs.pack,
    inputs.threshold !== undefined ? { threshold: inputs.threshold } : {},
  );
  return {
    personaId: persona.id,
    ready: report.ready,
    reason: report.ready
      ? `READY — safe, quality ${report.qualityScore}/100 (threshold ${report.threshold})`
      : `not ready — quality ${report.qualityScore}/100 below threshold ${report.threshold}`,
    report,
  };
}
