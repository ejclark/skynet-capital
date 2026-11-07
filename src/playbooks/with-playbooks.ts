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
 * ONE RUN-UP BET PER ACCOUNT (#4469 slice 2e, `run-up-bet.ts`): the plays' intents pass through it,
 * so a second run-up strategy never opens on another ticker while the account holds one. Exits and
 * every non-run-up intent pass unchanged.
 *
 * THE OWN-RULES STOP (#6954 slice 4). The own-rules entry never reaches `playbookIntents`, so its
 * stop (`exitSafety`, `SAURON`'s house stop) is run here, running or paused: a tripped name gets the
 * stop's sell, stamped with that playbook, and the base persona's reflexes on it are dropped for the
 * cycle — the safety net overrides the rules rather than competing with them for the same sale.
 * And a play its stop sold out of a name opens nothing on it until its window closes, or the next
 * session for a play with none (`stop-latch.ts`): a stop followed by a buy-back is a churn machine.
 *
 * THE BELOW-BAR LABEL (#6954 slice 5). An opening order from a pair below its playbook's evidence
 * bar says so on its reason ("below its bar", `fit-floor.ts`), so its decision record explains why
 * the guards sized it small. Exits and every other order pass unchanged.
 *
 * A PAUSED entry (`exitsOnly`, #4651) opens nothing new (`playbookIntents`), and its names stay its
 * own exactly as when it runs: the base persona stays off them, buys and sells, held or flat. It
 * records no verdict, and a paused own-rules entry is ignored altogether. With no paused entry
 * nothing here differs from a roster without the field.
 */
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import type { IntradayBarsOf } from "../domain/intraday-bar.js";
import {
  type ListedExpirations,
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionDemand,
  type OrderIntent,
  type Portfolio,
} from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import { labelBelowBar } from "./fit-floor.js";
import {
  type MixedSignalsSink,
  observeMixedSignals,
  SILENT_MIXED_SIGNALS_SINK,
} from "./mixed-signals.js";
import { observationDelta } from "./observation-delta.js";
import { mergeOptionDemand } from "./option-demand.js";
import {
  type EnabledPlaybook,
  exitSafetyIntents,
  type PlaybookEvent,
  type PlaybookReads,
  playbookIntents,
  playbookVerdicts,
} from "./playbook.js";
import { oneRunUpBet } from "./run-up-bet.js";
import { stopLatch } from "./stop-latch.js";

/** The option half of a composed persona: present only when an enabled playbook is an option play. */
function optionSurface(
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
  reads: PlaybookReads,
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
            playbook.optionDemand?.(asOfIso, portfolio, listed, calendar, mode, reads) ??
            NO_OPTION_DEMAND,
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
    enabled
      // A dark playbook (`observeOnly`, #5489) holds nothing, so it takes no name from anyone.
      .filter((e) => e.playbook.rulesOf !== baseId && !e.playbook.observeOnly)
      .flatMap((e) => e.playbook.symbols),
  );
}

/** Whether a play's window is open now, for the stop latch: `undefined` for a play with no window
 *  (a `decide` play or a persona's own rules), whose latch runs to the next session instead. */
function windowOpen(
  enabled: readonly EnabledPlaybook[],
  playbookId: string,
  asOf: string,
  calendar: readonly EarningsPrint[],
  events: readonly PlaybookEvent[],
): boolean | undefined {
  const playbook = enabled.find((e) => e.playbook.id === playbookId)?.playbook;
  if (!playbook || playbook.decide || playbook.rulesOf !== undefined) return undefined;
  return playbook.desiredState(asOf, calendar, events) === "long";
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
  /** Where a refused run-up open is said (#4469 2e), once per distinct line however many cycles
   *  repeat it. Defaults to silence; the live wiring points it at its `[playbooks]` log. */
  refusalLog: (line: string) => void = () => undefined,
  /** The 5-minute bars a dark playbook (`observeOnly`, #5489) records its would-be orders from. A
   *  synchronous read of the feed's cache; asking for a ticker is what makes the feed fetch it.
   *  Defaults to no bars, so a roster built without a feed records its verdict and nothing else. */
  intradayBars: IntradayBarsOf = () => undefined,
  /** What a `decide` playbook may read beyond the context — the daily high, its own memory
   *  (`PlaybookReads`). Defaults to none, and a play reads an absent read as "unknown". */
  reads: PlaybookReads = {},
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
  const ownEntry = enabled.find((e) => e.playbook.rulesOf === base.id);
  const own = ownEntry && !ownEntry.exitsOnly ? ownEntry : undefined;
  const others = enabled.filter((e) => e.playbook.rulesOf !== base.id);
  const running = enabled.filter((e) => !e.exitsOnly);
  const managed = managedSymbols(base.id, enabled);
  const attribute = (intent: OrderIntent): OrderIntent =>
    own ? { ...intent, playbookId: own.playbook.id, playbookMode: own.mode } : intent;
  // One run-up bet per account (#4469 2e): a refusal repeats every cycle, so each line says it once.
  const told = new Set<string>();
  const refuseRunUp = (line: string): void => {
    if (told.has(line)) return;
    told.add(line);
    refusalLog(line);
  };
  // What a dark playbook would have done, said once and again only when it moves (`observation-delta`).
  const newly = observationDelta();
  // A play stopped out of a name stays out of it (`stop-latch.ts`); each hold is said once.
  const latch = stopLatch();
  const holdsAfterStop = (intent: OrderIntent, asOf: string): boolean => {
    if (!latch.holds(intent)) return false;
    const windowed = windowOpen(enabled, intent.playbookId ?? "", asOf, calendar, events);
    const until = windowed === undefined ? "the next session" : "its window closes";
    refuseRunUp(
      `${intent.playbookId} was stopped out of ${intent.symbol}; it opens nothing on it until ${until}`,
    );
    return true;
  };

  return {
    id: base.id,
    name: base.name,
    thesis: base.thesis,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const plays = oneRunUpBet(
        others,
        playbookIntents(others, context, portfolio, calendar, events, reads),
        portfolio,
        refuseRunUp,
      );
      // Every enforced stop this pass, the own-rules entry's included — the same pure call
      // `playbookIntents` makes for the others, which already placed theirs in `plays`.
      const safety = exitSafetyIntents(enabled, context, portfolio).intents;
      latch.note(safety, context.asOf);
      latch.sweep(context.asOf, (id) => windowOpen(enabled, id, context.asOf, calendar, events));
      const stops = ownEntry ? safety.filter((i) => i.playbookId === ownEntry.playbook.id) : [];
      const stopped = new Set(stops.map((i) => i.symbol));
      const reflexes = base
        .decide(context, portfolio)
        .filter((i) => !(managed.has(i.symbol) || stopped.has(i.symbol)))
        .map(attribute);
      observeMixedSignals(running, context, mixedSignalsLog);
      return [...plays, ...stops, ...reflexes]
        .filter((i) => !holdsAfterStop(i, context.asOf))
        .map((i) => labelBelowBar(i));
    },
    // A paused entry records no verdict: the roll call reads a verdict as "this playbook ran".
    playbookVerdicts: (context) => playbookVerdicts(running, context.asOf, calendar, events),
    // What a dark playbook records. Present only when one is on the roster, read after the intents
    // are fixed, and never handed to them: its return type is not an order.
    ...(enabled.some((e) => e.playbook.observe)
      ? {
          playbookObservations: (context: MarketContext) =>
            newly(
              running.flatMap(({ playbook }) =>
                playbook.observe
                  ? playbook.observe({
                      bars: intradayBars,
                      asOf: context.asOf,
                      quotes: context.quotes,
                      calendar,
                    })
                  : [],
              ),
            ),
        }
      : {}),
    ...optionSurface(enabled, calendar, reads),
  };
}
