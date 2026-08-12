import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { findAccountCollisions } from "../observatory/account-collisions.js";
import type { Bot } from "./bot.js";

/**
 * Refuses to trade any bot whose credentials resolve to an Alpaca account another bot is ALSO
 * resolving to. See `account-collisions.ts` for why this exists — the incident it closes
 * (2026-08-11) is precisely that a bot's credentials can be swapped for another bot's without
 * either one failing to authenticate, so this is the one check that actually catches it: it
 * queries each bot's real account id and refuses the pair rather than letting both trade the
 * same book unattributably.
 *
 * A bot whose account read fails outright is left in — that's the existing "unreachable"
 * failure mode (loud, and already handled elsewhere); this guard only acts on a CONFIRMED
 * shared account, never on missing information.
 */
export async function guardAccountCollisions(
  bots: readonly Bot[],
  clientFor: (bot: Bot) => AlpacaTradingClient,
): Promise<{
  readonly safe: Bot[];
  readonly collisions: ReturnType<typeof findAccountCollisions>;
}> {
  const resolved = await Promise.all(
    bots.map(async (bot) => {
      try {
        const account = await clientFor(bot).getAccount();
        return { id: bot.persona.id, accountId: account.id };
      } catch {
        // Unreachable is a different, already-loud failure mode — not this guard's concern.
        return { id: bot.persona.id, accountId: undefined };
      }
    }),
  );
  const collisions = findAccountCollisions(resolved);
  const collided = new Set(collisions.flatMap((c) => c.ids));
  return { safe: bots.filter((bot) => !collided.has(bot.persona.id)), collisions };
}
