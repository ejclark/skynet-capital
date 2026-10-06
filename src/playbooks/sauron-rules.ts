import { BOTS_UNIVERSE } from "../domain/bots-universe.js";
import { SauronPersona } from "../personas/sauron.js";
import type { Playbook } from "./playbook.js";

/** The standard rules, default config — what a bot OTHER than Sauron runs when it subscribes. Pure
 *  (same inputs, same intents), so one shared instance is safe. */
const STANDARD_RULES = new SauronPersona();

/**
 * SAURON (#4642 slice 9a, design on #4651) — Sauron's own persona rules as a subscribable playbook,
 * exact by construction rather than translated (#3208's settled shape; `HC-SAURON` is the lossy
 * tactical translation and stays as it is).
 *
 * ON SAURON'S OWN ACCOUNT (`rulesOf` matches the bot's base persona) `decide` below is never
 * called: `withPlaybooks` runs the bot's own persona exactly as it does today — whichever build is
 * armed, hardcore included — and stamps each reflex with this playbook's id and the subscription's
 * mode. The symbols every OTHER enabled playbook trades stay that playbook's, as they always were.
 * So an uncapped, unfiltered subscription changes nothing about what he trades; it makes his share
 * orders attributable, which is what lets a Store pause act on them once unattributed orders are
 * refused (slice 10). An owner-set capital cap or symbol filter then clamps or refuses his buys
 * through the guards, as for any playbook (`subscriptionTerms`).
 *
 * ON ANY OTHER BOT it is an ordinary `decide` playbook: the standard rules on that bot's own
 * account, kept to the bots' universe and stamped by `playbookIntents`.
 *
 * ON EITHER, its basket yields every symbol another enabled playbook trades (`yieldPersonaRules`,
 * applied when the live roster resolves), so it never sells another playbook's position and a Store
 * allocation on it counts only its own names.
 *
 * Deliberately absent: an exit-safety dial (a trip would add a sell his rules never make) and a
 * window (`rulesOf` makes the verdict "tactical", which the roll call reads as "reading live price
 * and sentiment every pass").
 */
export const SAURON: Playbook = {
  id: "SAURON",
  rulesOf: STANDARD_RULES.id,
  symbols: BOTS_UNIVERSE,
  thesis:
    "Sauron's own rules: sell a held name into euphoria once momentum has rolled over, and buy a " +
    "name panic has thrown away once momentum has turned up — exactly the orders his persona places.",
  evidence:
    "src/personas/sauron.ts — his persona's rules, run unchanged. No backtest stands behind them " +
    "yet; docs/BOTS-SAURON.md grades them low and notes the standard rules carry no stop-loss.",
  // Unused: his rules size every order themselves, so the mode a subscriber picks changes nothing
  // about size. Present only because `Playbook` requires it; a Store allocation still caps buys.
  size: { conservative: 0, standard: 0, aggressive: 0 },
  // No window: `rulesOf` makes the verdict "tactical" (`readsLiveSignals`), so the roll call, the
  // Store and the trader never ask. Only the morning brief reads it, for an env-named playbook.
  desiredState: () => "no-window",
  decide: (context, portfolio) => STANDARD_RULES.decide(context, portfolio),
};
