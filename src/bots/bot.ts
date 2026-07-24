import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { Persona } from "../personas/persona.js";

/** The Alpaca paper credentials for one bot's account. */
export type BotCredentials = AlpacaCredentials;

/** A bot is a persona bound to the paper account it trades. */
export interface Bot {
  readonly persona: Persona;
  readonly credentials: BotCredentials;
}

/** The default paper Trading API endpoint. */
export const ALPACA_PAPER_BASE_URL = "https://paper-api.alpaca.markets";

/**
 * Env var names for a persona's credentials, e.g. persona "news-fader" maps to
 * SKYNET_BOT_NEWS_FADER_KEY / SKYNET_BOT_NEWS_FADER_SECRET. Deriving the names from the
 * persona id keeps configuration convention-over-configuration — add a persona, and its
 * env vars are implied.
 */
export function credentialEnvNames(personaId: string): { key: string; secret: string } {
  const slug = personaId.toUpperCase().replaceAll("-", "_");
  return { key: `SKYNET_BOT_${slug}_KEY`, secret: `SKYNET_BOT_${slug}_SECRET` };
}
