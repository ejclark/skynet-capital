import {
  type BotControls,
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

/** Does this persona have a hardcore build to switch to? The settings form offers the switch only
 *  then, and the write refuses it otherwise (#4535 slice 3b). */
export function hasHardcoreBuild(id: string): boolean {
  return Object.hasOwn(HARDCORE_BUILDS, id);
}

/**
 * One persona's build, standard or hardcore — what the live flip swaps in (#4535 slice 2c). A fresh
 * instance each call. `undefined` when the id names no persona, or asks for a hardcore build the
 * persona has none of (the caller refuses that loudly, never guesses).
 */
export function personaBuild(id: string, hardcore: boolean): Persona | undefined {
  if (hardcore) return HARDCORE_BUILDS[id]?.();
  return createDefaultPersonas().find((p) => p.id === id);
}

export interface HardcoreRoster {
  readonly personas: Persona[];
  /** Ids actually swapped to their hardcore build (the runner tunes cooldown + pack by these). */
  readonly hardcore: ReadonlySet<string>;
  /** The ids the env alone names that have a hardcore build — the fallback a bot with no stored
   *  setting keeps, so the live flip (`watchHardcore`) can fall back to it exactly as boot did. */
  readonly envIds: ReadonlySet<string>;
  /** Ids named in the env that have no hardcore build — refused loudly, never guessed. */
  readonly rejected: readonly string[];
}

/** The ids `SKYNET_HARDCORE_BOTS` names, split into those with a hardcore build and those without. */
function parseEnvHardcore(env: NodeJS.ProcessEnv): { ids: Set<string>; rejected: string[] } {
  const wanted = (env.SKYNET_HARDCORE_BOTS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return {
    ids: new Set(wanted.filter((id) => HARDCORE_BUILDS[id])),
    rejected: wanted.filter((id) => !HARDCORE_BUILDS[id]),
  };
}

/**
 * The offline replay's stand-in for the owner's stored settings: the env roster as per-bot hardcore
 * booleans. The live bots no longer read `SKYNET_HARDCORE_BOTS` as a fallback (#4535 slice 4c-2); a
 * replay has no dashboard to ask, so the env is its only source.
 */
export function envHardcoreControls(env: NodeJS.ProcessEnv): ControlsState {
  const bots: Record<string, BotControls> = {};
  for (const id of parseEnvHardcore(env).ids) bots[id] = { hardcore: true };
  return { bots };
}

/**
 * Swap the personas the owner's stored settings name for their hardcore research-mode builds
 * (Eric's directive, 2026-08-20 — see `sauron-hardcore.ts`). Dark by default: a bot with no stored
 * hardcore setting keeps its standard build, whatever `SKYNET_HARDCORE_BOTS` says (#4535 slice
 * 4c-2). The env roster is still parsed — `envIds` is what the bots app reports upstream so the
 * dashboard can copy it into a bot's stored settings once, and `rejected` keeps an unknown id loud.
 */
export function applyHardcore(
  personas: Persona[],
  env: NodeJS.ProcessEnv,
  controls: ControlsState = EMPTY_CONTROLS,
): HardcoreRoster {
  const { ids: envIds, rejected } = parseEnvHardcore(env);
  const wanted = effectiveHardcoreIds(
    personas.map((p) => p.id),
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
    envIds,
    rejected,
  };
}
