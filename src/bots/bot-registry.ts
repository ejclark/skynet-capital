import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { Persona } from "../personas/persona.js";
import { type Bot, credentialEnvNames } from "./bot.js";

/** Parse SKYNET_AUTONOMOUS_BOTS ("id,id,..."), defaulting to just the Day Trader — the one
 *  roster env var every bot-facing script (run-autonomous, morning-brief) reads the same way. */
export function enabledBotIds(env: Readonly<Record<string, string | undefined>>): string[] {
  return (env.SKYNET_AUTONOMOUS_BOTS ?? "day-trader").split(",").map((s) => s.trim());
}

/** The result of loading bots: those wired up, and those still missing credentials. */
export interface BotLoadResult {
  readonly bots: Bot[];
  /** Persona ids with no usable credentials. */
  readonly missing: string[];
  /** The persona (if any) trading the shared account rather than one of its own. */
  readonly sharedAccount: string[];
}

/** The fallback pair: one paper account a single persona may borrow when it has none of its own. */
const SHARED_KEY = "SKYNET_BOT_KEY";
const SHARED_SECRET = "SKYNET_BOT_SECRET";

/**
 * Build the bot roster from an environment map.
 *
 * A persona prefers **its own** account (`SKYNET_BOT_<PERSONA>_KEY`/`_SECRET`) — per-account
 * separation is what makes the leaderboard's per-participant P/L mean anything. But demanding a
 * brand-new brokerage account before a persona can place its first order is pure ceremony during
 * warm-up, when there is one account and one experiment. So a persona with no dedicated pair borrows
 * the **shared** pair (`SKYNET_BOT_KEY`/`SKYNET_BOT_SECRET`).
 *
 * **The shared account has exactly one seat.** Two bots on one account is not a degraded experiment,
 * it is a broken one: positions merge, P/L is unattributable, and each sizes orders against cash the
 * other is spending. If several personas would borrow, none do — all are reported `missing`, because
 * failing loudly beats trading wrongly. Pass only the ENABLED roster, or idle personas will contend
 * for the seat.
 *
 * Pure over `env`, so it's testable without touching `process.env`.
 */
export function loadBots(
  personas: readonly Persona[],
  env: Readonly<Record<string, string | undefined>>,
): BotLoadResult {
  const baseUrl = env.ALPACA_PAPER_BASE_URL;
  const creds = (apiKey: string, apiSecret: string): AlpacaCredentials => ({
    apiKey,
    apiSecret,
    ...(baseUrl ? { baseUrl } : {}),
  });

  const own = new Map<string, AlpacaCredentials>();
  const borrowers: string[] = [];
  const sharedKey = env[SHARED_KEY];
  const sharedSecret = env[SHARED_SECRET];

  for (const persona of personas) {
    const names = credentialEnvNames(persona.id);
    const key = env[names.key];
    const secret = env[names.secret];
    if (key && secret) own.set(persona.id, creds(key, secret));
    else if (sharedKey && sharedSecret) borrowers.push(persona.id);
  }

  const seat = borrowers.length === 1 ? borrowers[0] : undefined;
  const bots: Bot[] = [];
  const missing: string[] = [];

  for (const persona of personas) {
    const mine = own.get(persona.id);
    if (mine) bots.push({ persona, credentials: mine });
    else if (persona.id === seat && sharedKey && sharedSecret) {
      bots.push({ persona, credentials: creds(sharedKey, sharedSecret) });
    } else missing.push(persona.id);
  }

  return { bots, missing, sharedAccount: seat ? [seat] : [] };
}
