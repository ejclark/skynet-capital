import type { AlpacaCredentials } from "../alpaca/credentials.js";
import type { ControlsState } from "../autonomous/bot-controls.js";
import type { BotCredentialsClient } from "../autonomous/bot-credentials-client.js";
import type { Bot } from "../bots/bot.js";

/**
 * Boot-time credential priming for `run-autonomous.ts`: replace each bot's env-sourced credential
 * with the store's current pair BEFORE anything is built on it.
 *
 * Confirmed live 2026-09-04: the shared market clock, the news poller, and the daily-loss seed
 * were all constructed on `bots[0].credentials` straight from `SKYNET_BOT_<PERSONA>_KEY/SECRET`,
 * and the bridge-delivered rotated credential only reached them via `credentials.reconcile()`
 * dozens of lines later — so every boot printed a screen of expected 401s from the dead env key
 * and then quietly swapped to the working one. The log read as "still broken" to anyone skimming
 * it, and that misread cost a real incident (docs/LESSONS.md, 2026-09-04). Priming first means
 * the boot log tells the truth: a 401 at boot is a real 401.
 *
 * Env stays the break-glass default (docs/AUTONOMY-DEPLOY.md): a bot the bridge can't serve —
 * bridge down, no store row yet — boots on env exactly as before and self-heals on the next poll.
 */
export async function primeBotCredentials(
  credentials: BotCredentialsClient,
  bootControls: ControlsState,
  bots: readonly Bot[],
  log: (line: string) => void = console.log,
): Promise<Bot[]> {
  const primed = new Map<string, AlpacaCredentials>();
  await credentials.prime(bootControls, (id, next) => primed.set(id, next));
  return bots.map((bot) => {
    const next = primed.get(bot.persona.id);
    if (!next) return bot;
    log(`[creds] ${bot.persona.id}: booting on the store credential (env superseded)`);
    return { ...bot, credentials: next };
  });
}
