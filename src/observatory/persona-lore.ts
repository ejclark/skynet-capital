/**
 * Persona **display identity** — the character card behind a bot, keyed by `personaId`.
 *
 * This is deliberately decoupled from the persona *behaviour* in `src/personas/*` (which lives in the
 * trading engine). The observatory renderer has no runtime access to `Persona` objects — it renders
 * from `ParticipantSnapshot`, which carries only `personaId` — so identity reaches the UI through this
 * pure lookup, not by importing the engine. (Confirmed via `graphify path SauronPersona →
 * renderIndividualBody`.)
 *
 * `name`/`thesis` mirror the persona classes; a test asserts parity so they never drift. `lore` is the
 * optional character/legend line — the seed of the extensible mixed-multiverse lore layer. Only Sauron
 * carries one today; the rest await the pantheon direction.
 */
export interface PersonaLore {
  /** Display name — mirrors the persona class `name`. */
  readonly name: string;
  /** One-line strategy thesis — mirrors the persona class `thesis`. */
  readonly thesis: string;
  /** Optional character/legend line — the lore flavor layer (extensible). */
  readonly lore?: string;
}

export const PERSONA_LORE: Record<string, PersonaLore> = {
  "news-fader": {
    name: "The News Fader",
    thesis: "The crowd over-reacts to headlines; fade the hype, buy the panic.",
  },
  "retail-investor": {
    name: "The Retail Investor",
    thesis: "Buys the hype, sells the fear — the crowd the News Fader trades against.",
  },
  futurist: {
    name: "The Futurist",
    thesis: "Own the future early; buy confirmed strength and hold through the noise.",
  },
  "gold-bug": {
    name: "The Gold Bug",
    thesis: "When fear spreads, flee to gold and hold it; never trust a risk asset.",
  },
  "day-trader": {
    name: "The Day Trader",
    thesis: "Seasoned tape-reader; rides big-tech momentum and cuts losers fast.",
  },
  "rumor-trader": {
    name: "The Rumor Trader",
    thesis: "Buy the whisper, sell the headline — accumulate the build, exit the euphoria.",
  },
  sauron: {
    name: "Sauron",
    thesis:
      "Impose order on the market's chaos — read the crowd's fear and greed, act on neither; fade exhausted euphoria, claim what panic discards.",
    lore: "The order-imposer — modelled on Annatar, before the corruption. He reads fear and greed but is ruled by neither; the market's extremes are his opportunity.",
  },
};

/** Look up a persona's display identity by id (undefined when absent or unmapped). */
export function personaLore(id?: string): PersonaLore | undefined {
  return id ? PERSONA_LORE[id] : undefined;
}
