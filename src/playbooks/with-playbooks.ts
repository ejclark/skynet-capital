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
import { type EnabledPlaybook, type PlaybookEvent, playbookIntents } from "./playbook.js";

export function withPlaybooks(
  base: Persona,
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
  /** Recent external events (e.g. TACO signals) for any event-driven play in the roster.
   *  Optional and additive — every existing call site keeps working unchanged. */
  events: readonly PlaybookEvent[] = [],
): Persona {
  if (enabled.length === 0) {
    return base;
  }
  const managed = new Set(enabled.map((e) => e.playbook.symbol));
  return {
    id: base.id,
    name: base.name,
    thesis: base.thesis,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const plays = playbookIntents(enabled, context, portfolio, calendar, events);
      const reflexes = base.decide(context, portfolio).filter((i) => !managed.has(i.symbol));
      return [...plays, ...reflexes];
    },
  };
}
