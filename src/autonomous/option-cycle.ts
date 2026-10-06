import type { MarketContext, OptionMarket, OrderResult, Portfolio } from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import type { OptionMarketPort } from "../ports/option-market.js";

/**
 * The option half of one trader cycle, kept beside `autonomous-trader.ts`: reading the quotes a
 * persona asked for, and the one action mapping both halves share. Pure orchestration over ports —
 * nothing here knows Alpaca.
 */

/** Default minimum gap between option attempts on one underlying — approved or refused, observe or
 *  live. Bounds both refusal noise and the market reads behind it. */
export const DEFAULT_OPTION_COOLDOWN_MS = 10 * 60_000;

/**
 * The quotes this cycle's playbooks price from: asked of the port only when the persona has option
 * plays (or hygiene) AND a port is wired; nothing is read for a `skip` underlying. Fail-soft — a
 * throwing port reads as no quotes, never a failed cycle.
 */
export async function readCycleOptions(
  persona: Persona,
  port: OptionMarketPort | undefined,
  request: {
    readonly context: MarketContext;
    readonly portfolio: Portfolio;
    readonly skip: ReadonlySet<string>;
  },
): Promise<OptionMarket | undefined> {
  const demand = persona.optionDemand?.bind(persona);
  if (!(demand && port)) return undefined;
  const asOf = request.context.asOf;
  try {
    return await port.readOptionMarket({
      asOf,
      underlyings: persona.optionUnderlyings ?? [],
      skip: request.skip,
      demand: (listed) => demand(asOf, request.portfolio, listed),
    });
  } catch {
    return undefined;
  }
}

/** What a submitted order became in the audit trail: `unfilled` ended with nothing traded, so it
 *  reads as rejected downstream; `working` may still fill, so it is a placed order. */
export function actionFor(result: OrderResult): "placed" | "rejected" {
  return result.status === "rejected" || result.status === "unfilled" ? "rejected" : "placed";
}
