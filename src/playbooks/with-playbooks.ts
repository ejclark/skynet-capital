/**
 * Decorate a persona with a playbook roster. The composed persona's decide():
 *   1. runs every enabled playbook (entries + exits, fully attributed), then
 *   2. runs the base persona, SUPPRESSING its intents on playbook-managed symbols —
 *      one position, one decision-maker (see playbook.ts → ownership rule).
 *
 * The trader, guards, audit trail, and readiness gate all see an ordinary Persona — the
 * playbook layer is invisible to every downstream system except through the attribution
 * fields it stamps on its intents.
 */
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import {
  type MixedSignalsSink,
  observeMixedSignals,
  SILENT_MIXED_SIGNALS_SINK,
} from "./mixed-signals.js";
import {
  type EnabledPlaybook,
  type PlaybookEvent,
  playbookIntents,
  playbookVerdicts,
} from "./playbook.js";

export function withPlaybooks(
  base: Persona,
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
  /** Recent external events (e.g. TACO signals) for any event-driven play in the roster.
   *  Optional and additive — every existing call site keeps working unchanged. */
  events: readonly PlaybookEvent[] = [],
  /** Where mixed-signals observations are logged (#3194 step 5). Observe-only: the detector runs
   *  after this cycle's intents are fixed and its output never reaches them. Defaults to a no-op,
   *  and no playbook opts in today, so every existing call site is unchanged. */
  mixedSignalsLog: MixedSignalsSink = SILENT_MIXED_SIGNALS_SINK,
): Persona {
  if (enabled.length === 0) {
    return base;
  }
  const managed = new Set(enabled.flatMap((e) => e.playbook.symbols));
  return {
    id: base.id,
    name: base.name,
    thesis: base.thesis,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const plays = playbookIntents(enabled, context, portfolio, calendar, events);
      const reflexes = base.decide(context, portfolio).filter((i) => !managed.has(i.symbol));
      observeMixedSignals(enabled, context, mixedSignalsLog);
      return [...plays, ...reflexes];
    },
    playbookVerdicts: (context) => playbookVerdicts(enabled, context.asOf, calendar, events),
  };
}
