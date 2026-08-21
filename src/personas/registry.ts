import { BankerPersona } from "./banker.js";
import { DayTraderPersona } from "./day-trader.js";
import { FuturistPersona } from "./futurist.js";
import { GoldBugPersona } from "./gold-bug.js";
import { NewsFaderPersona } from "./news-fader.js";
import type { Persona } from "./persona.js";
import { ProspectorPersona, WARM_UP_CLAIMS } from "./prospector.js";
import { RetailInvestorPersona } from "./retail-investor.js";
import { RumorTraderPersona } from "./rumor-trader.js";
import { SauronPersona } from "./sauron.js";
import { SauronHardcorePersona } from "./sauron-hardcore.js";

/**
 * The roster. Add a persona here and it's automatically available to any runner
 * that iterates the registry — no other wiring. The four are intentionally
 * distinct archetypes so the shared shape (interface, config pattern, engine
 * integration) is exercised across genuinely different behavior:
 *  - News Fader: fades hype, buys panic
 *  - Retail Investor: buys hype, panic-sells (the Fader's mirror)
 *  - Futurist: buys confirmed momentum, ignores news
 *  - Gold Bug: flees to the safe haven on risk-off, hoards it
 *  - Sauron: the cold order-imposer — fades exhausted euphoria, claims what panic discards
 *  - Banker: the house's income engine — underwrites calm, harvests gains, protects the vault
 *  - Prospector: the warm-up harness — stakes a small claim on every planned name so the live
 *    trading path actually gets exercised, cuts barren claims fast, lets a paying seam run
 */
export function createDefaultPersonas(): Persona[] {
  return [
    new NewsFaderPersona(),
    new RetailInvestorPersona(),
    new FuturistPersona(),
    new GoldBugPersona(),
    new DayTraderPersona(),
    new RumorTraderPersona(),
    new SauronPersona(),
    new BankerPersona(),
    new ProspectorPersona(WARM_UP_CLAIMS),
  ];
}

/** The personas that have a hardcore research-mode build. Same id — same account, same ledger. */
const HARDCORE_BUILDS: Readonly<Record<string, () => Persona>> = {
  sauron: () => new SauronHardcorePersona(),
};

export interface HardcoreRoster {
  readonly personas: Persona[];
  /** Ids actually swapped to their hardcore build (the runner tunes cooldown + pack by these). */
  readonly hardcore: ReadonlySet<string>;
  /** Ids named in the env that have no hardcore build — refused loudly, never guessed. */
  readonly rejected: readonly string[];
}

/**
 * Swap the personas named in `SKYNET_HARDCORE_BOTS` (comma-separated ids) for their hardcore
 * research-mode builds (Eric's directive, 2026-08-20 — see `sauron-hardcore.ts`). Dark by
 * default: an empty/unset var changes nothing, and flipping it rides the same approval-gated
 * autonomy-ops path as `SKYNET_PLAYBOOKS`.
 */
export function applyHardcore(personas: Persona[], env: NodeJS.ProcessEnv): HardcoreRoster {
  const wanted = (env.SKYNET_HARDCORE_BOTS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const hardcore = new Set<string>();
  const rejected: string[] = [];
  for (const id of wanted) {
    if (HARDCORE_BUILDS[id]) hardcore.add(id);
    else rejected.push(id);
  }
  return {
    personas: personas.map((p) => {
      const build = hardcore.has(p.id) ? HARDCORE_BUILDS[p.id] : undefined;
      return build ? build() : p;
    }),
    hardcore,
    rejected,
  };
}
