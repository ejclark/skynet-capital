import { DayTraderPersona } from "./day-trader.js";
import { FuturistPersona } from "./futurist.js";
import { GoldBugPersona } from "./gold-bug.js";
import { NewsFaderPersona } from "./news-fader.js";
import type { Persona } from "./persona.js";
import { RetailInvestorPersona } from "./retail-investor.js";
import { RumorTraderPersona } from "./rumor-trader.js";

/**
 * The roster. Add a persona here and it's automatically available to any runner
 * that iterates the registry — no other wiring. The four are intentionally
 * distinct archetypes so the shared shape (interface, config pattern, engine
 * integration) is exercised across genuinely different behavior:
 *  - News Fader: fades hype, buys panic
 *  - Retail Investor: buys hype, panic-sells (the Fader's mirror)
 *  - Futurist: buys confirmed momentum, ignores news
 *  - Gold Bug: flees to the safe haven on risk-off, hoards it
 */
export function createDefaultPersonas(): Persona[] {
  return [
    new NewsFaderPersona(),
    new RetailInvestorPersona(),
    new FuturistPersona(),
    new GoldBugPersona(),
    new DayTraderPersona(),
    new RumorTraderPersona(),
  ];
}
