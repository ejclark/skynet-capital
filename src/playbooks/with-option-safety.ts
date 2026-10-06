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
import { mergeOptionDemand } from "./option-demand.js";
import { hygieneDemand, hygieneIntents } from "./option-hygiene.js";
import type { EnabledPlaybook } from "./playbook.js";

/**
 * Wrap a persona with expiry hygiene (`option-hygiene.ts`): its decide() returns the safety closes
 * due this cycle FIRST, then everything the inner persona decided — minus nothing; a contract the
 * inner playbooks already close is simply not closed twice. Its option demand adds the quotes those
 * closes need. Verdicts and `optionUnderlyings` pass straight through.
 *
 * Wraps `withPlaybooks` in every bot's trading roster (`tradingRoster`, #4642 slice 5), so a
 * contract on any bot account is looked after even when no option playbook is subscribed. With no
 * contracts held, the output is the inner persona's own.
 */
export function withOptionSafety(
  inner: Persona,
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
): Persona {
  return {
    id: inner.id,
    name: inner.name,
    thesis: inner.thesis,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const plays = inner.decide(context, portfolio);
      const claimed = new Set(
        plays
          .filter((i) => i.option?.effect === "close")
          .flatMap((i) => i.option?.legs.map((l) => l.occSymbol) ?? []),
      );
      return [...hygieneIntents(context, portfolio, enabled, calendar, claimed), ...plays];
    },
    ...(inner.playbookVerdicts
      ? { playbookVerdicts: (context: MarketContext) => inner.playbookVerdicts?.(context) ?? [] }
      : {}),
    ...(inner.optionUnderlyings ? { optionUnderlyings: inner.optionUnderlyings } : {}),
    optionDemand: (
      asOfIso: string,
      portfolio: Portfolio,
      listed: ListedExpirations,
    ): OptionDemand =>
      mergeOptionDemand([
        inner.optionDemand?.(asOfIso, portfolio, listed) ?? NO_OPTION_DEMAND,
        hygieneDemand(asOfIso, portfolio, enabled, calendar),
      ]),
  };
}
