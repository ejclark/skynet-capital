import {
  type ControlsState,
  EMPTY_CONTROLS,
  effectiveHardcoreIds,
} from "../autonomous/bot-controls.js";
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

/** Whether a persona id has a hardcore build to offer — Mission Control shows the switch only then. */
export function hasHardcoreBuild(id: string): boolean {
  return Boolean(HARDCORE_BUILDS[id]);
}

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
 * default: an empty/unset var changes nothing. The owner's Mission Control state, when given,
 * overrides the env per bot (an explicit store boolean can both arm and disarm), so the GUI —
 * not env pushes — is the day-to-day switch (Eric, 2026-08-21).
 */
export function applyHardcore(
  personas: Persona[],
  env: NodeJS.ProcessEnv,
  controls: ControlsState = EMPTY_CONTROLS,
): HardcoreRoster {
  const envWanted = (env.SKYNET_HARDCORE_BOTS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const rejected = envWanted.filter((id) => !HARDCORE_BUILDS[id]);
  const envIds = new Set(envWanted.filter((id) => HARDCORE_BUILDS[id]));
  const wanted = effectiveHardcoreIds(
    personas.map((p) => p.id),
    envIds,
    controls,
  );
  const hardcore = new Set<string>();
  for (const id of wanted) {
    if (HARDCORE_BUILDS[id]) hardcore.add(id);
    else rejected.push(id); // store armed a bot with no hardcore build — refuse loudly, never guess
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
