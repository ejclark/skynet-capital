import type { Persona } from "../personas/persona.js";
import { type Bot, credentialEnvNames } from "./bot.js";

/** The result of loading bots: those wired up, and those still missing credentials. */
export interface BotLoadResult {
  readonly bots: Bot[];
  /** Persona ids that had no credentials in the environment. */
  readonly missing: string[];
}

/**
 * Build the bot roster from an environment map. A persona becomes a bot only when both
 * its key and secret are present; otherwise it's reported in `missing` so the caller can
 * tell the user exactly which paper accounts still need to be created. Pure over its `env`
 * argument, so it's testable without touching `process.env`.
 */
export function loadBots(
  personas: readonly Persona[],
  env: Readonly<Record<string, string | undefined>>,
): BotLoadResult {
  const bots: Bot[] = [];
  const missing: string[] = [];

  for (const persona of personas) {
    const names = credentialEnvNames(persona.id);
    const apiKey = env[names.key];
    const apiSecret = env[names.secret];

    if (apiKey && apiSecret) {
      const baseUrl = env.ALPACA_PAPER_BASE_URL;
      bots.push({ persona, credentials: { apiKey, apiSecret, ...(baseUrl ? { baseUrl } : {}) } });
    } else {
      missing.push(persona.id);
    }
  }

  return { bots, missing };
}
