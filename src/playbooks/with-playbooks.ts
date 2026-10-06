/**
 * Decorate a persona with a playbook roster. The composed persona's decide():
 *   1. runs every enabled playbook (entries + exits, fully attributed), then
 *   2. runs the base persona, SUPPRESSING its intents on playbook-managed symbols —
 *      one position, one decision-maker (see playbook.ts → ownership rule).
 *
 * The trader, guards, audit trail, and readiness gate all see an ordinary Persona — the
 * playbook layer is invisible to every downstream system except through the attribution
 * fields it stamps on its intents.
 *
 * A roster with an OPTION play (#4645) also tells the trader which underlyings it trades and which
 * quotes this cycle needs (`optionUnderlyings`, `optionDemand`); a roster without one carries
 * neither, so the trader reads no option market for it.
 *
 * A playbook that IS the base persona's own rules (`rulesOf === base.id`, today only `SAURON` on
 * Sauron's account — #4651) is not run as a playbook: it would be the same rules twice. Step 2 runs
 * the base persona exactly as above — suppressed on the OTHER playbooks' symbols, which stay theirs —
 * and stamps every surviving reflex with that playbook's id and mode. With no such playbook enabled
 * nothing here differs from a roster without the field.
 *
 * A PAUSED entry (`exitsOnly`, #4651) opens nothing new (`playbookIntents`), and its names stay its
 * own exactly as when it runs: the base persona stays off them, buys and sells, held or flat. It
 * records no verdict, and a paused own-rules entry is ignored altogether. With no paused entry
 * nothing here differs from a roster without the field.
 */
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import {
  type ListedExpirations,
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionDemand,
  type OrderIntent,
  type Portfolio,
} from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import {
  type MixedSignalsSink,
  observeMixedSignals,
  SILENT_MIXED_SIGNALS_SINK,
} from "./mixed-signals.js";
import { mergeOptionDemand } from "./option-demand.js";
import {
  type EnabledPlaybook,
  type PlaybookEvent,
  playbookIntents,
  playbookVerdicts,
} from "./playbook.js";

/** The option half of a composed persona: present only when an enabled playbook is an option play. */
function optionSurface(
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
): Pick<Persona, "optionUnderlyings" | "optionDemand"> {
  const optionPlays = enabled.filter((e) => e.playbook.options !== undefined);
  if (optionPlays.length === 0) return {};
  return {
    optionUnderlyings: [
      ...new Set(optionPlays.flatMap((e) => e.playbook.options?.underlyings ?? [])),
    ],
    optionDemand: (
      asOfIso: string,
      portfolio: Portfolio,
      listed: ListedExpirations,
    ): OptionDemand =>
      mergeOptionDemand(
        optionPlays.map(
          ({ playbook, mode }) =>
            playbook.optionDemand?.(asOfIso, portfolio, listed, calendar, mode) ?? NO_OPTION_DEMAND,
        ),
      ),
  };
}

/**
 * The symbols a bot's playbooks take from its base persona: every enabled basket, running or paused,
 * EXCEPT the base persona's own rules (`rulesOf === baseId`), whose orders are the persona's
 * reflexes. Static on purpose: a paused playbook keeps its names held or flat, so nothing else opens
 * a position its paused exits would then govern (#4651). The one definition — `withPlaybooks`
 * suppresses reflexes on it, and the beta scout skips it (`run-autonomous.ts`), so the two can never
 * disagree about which names a playbook owns.
 */
export function managedSymbols(baseId: string, enabled: readonly EnabledPlaybook[]): Set<string> {
  return new Set(
    enabled.filter((e) => e.playbook.rulesOf !== baseId).flatMap((e) => e.playbook.symbols),
  );
}

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
  // The base persona's own rules, when enabled as a playbook — run as the base, never as a play.
  // A live roster holds one entry per playbook (`onePerPlaybook`, applied where it resolves, which
  // is what stops a repeated env token running any playbook twice on any bot). Dropping EVERY
  // own-rules entry here also keeps a hand-built roster from running his rules a second time; the
  // first one names the stamp.
  // A PAUSED own-rules entry is ignored entirely: his reflexes run unlabelled, as before he
  // subscribed — his rules have no basket of positions to manage apart from himself.
  const own = enabled.find((e) => e.playbook.rulesOf === base.id && !e.exitsOnly);
  const others = enabled.filter((e) => e.playbook.rulesOf !== base.id);
  const running = enabled.filter((e) => !e.exitsOnly);
  const managed = managedSymbols(base.id, enabled);
  const attribute = (intent: OrderIntent): OrderIntent =>
    own ? { ...intent, playbookId: own.playbook.id, playbookMode: own.mode } : intent;
  return {
    id: base.id,
    name: base.name,
    thesis: base.thesis,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const plays = playbookIntents(others, context, portfolio, calendar, events);
      const reflexes = base
        .decide(context, portfolio)
        .filter((i) => !managed.has(i.symbol))
        .map(attribute);
      observeMixedSignals(running, context, mixedSignalsLog);
      return [...plays, ...reflexes];
    },
    // A paused entry records no verdict: the roll call reads a verdict as "this playbook ran".
    playbookVerdicts: (context) => playbookVerdicts(running, context.asOf, calendar, events),
    ...optionSurface(enabled, calendar),
  };
}
