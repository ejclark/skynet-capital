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
    lore: "The Illusion-Breaker. Every headline casts a glamour the crowd rushes to believe; she reads the enchantment for what it is and takes the other side — selling into the euphoria, buying the panic once the spell breaks.",
  },
  "retail-investor": {
    name: "The Retail Investor",
    thesis: "Buys the hype, sells the fear — the crowd the News Fader trades against.",
    lore: "The Everyman, swept along by the tide. He chases the roar and flees the shadow, one voice in the great herd — the honest mirror of the crowd whose emotion the sharper players fade. His fortune rises and falls with the mob's.",
  },
  futurist: {
    name: "The Futurist",
    thesis: "Own the future early; buy confirmed strength and hold through the noise.",
    lore: "The Oracle, who buys tomorrow before it arrives. She waits for the vision to confirm, then commits and holds through every tremor of doubt — conviction is her armor, and time her ally.",
  },
  "gold-bug": {
    name: "The Gold Bug",
    thesis: "When fear spreads, flee to gold and hold it; never trust a risk asset.",
    lore: "The Dragon on its hoard. When fear spreads across the realm it retreats to the one true metal and coils around it, trusting no paper promise. Slow, ancient, and unmoved — it endures what burns the rest.",
  },
  "day-trader": {
    name: "The Day Trader",
    thesis: "Seasoned tape-reader; rides big-tech momentum and cuts losers fast.",
    lore: "The Duelist — a fast blade who reads the tape like a fencer reads a stance. She rides momentum while it runs and cuts a losing position without hesitation. No position outlives its edge.",
  },
  "rumor-trader": {
    name: "The Rumor Trader",
    thesis: "Buy the whisper, sell the headline — accumulate the build, exit the euphoria.",
    lore: "The Whisperer, a spymaster trading in secrets before they become news. He accumulates on the quiet build and slips away the moment the whisper becomes a headline and the crowd floods in.",
  },
  banker: {
    name: "The Banker",
    thesis: "The house's income engine; underwrites calm markets, banks gains on schedule.",
    lore: "Keeper of the vault. The Banker never chases and never gambles — it writes its book in quiet markets, collects its due, and its realized income fills the tournament coffers. Raid the vault at your peril.",
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
