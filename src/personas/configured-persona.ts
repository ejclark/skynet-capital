import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import type { Persona } from "./persona.js";

/**
 * Shared scaffolding for personas built around a single tunable config object:
 * store it (immutable, defaulted by the caller). Every persona in this module
 * follows this exact shape — `id`/`name`/`thesis`/`decide` stay abstract so each
 * persona's own identity and logic are untouched; only the config plumbing is shared.
 */
export abstract class ConfiguredPersona<TConfig> implements Persona {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly thesis: string;

  protected readonly config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  abstract decide(context: MarketContext, portfolio: Portfolio): OrderIntent[];
}
