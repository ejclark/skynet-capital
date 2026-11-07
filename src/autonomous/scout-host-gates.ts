/**
 * THE FORCED PICK OBEYS ITS HOST BOT'S OWNER (#6954 slice 5b). The forced daily pick (the beta
 * scout, `live-cycle.ts`) trades on the first bot's account but is not that bot's trader, so the
 * owner's per-bot settings never reached it: a "suspended" bot kept taking test buys (the plan's
 * gate list, "Forced pick ignores per-bot suspend"). These are its three gates, each read at the
 * moment it decides, from the same `/controls` snapshot the host bot's own cycle reads:
 *
 *  - **exits** stop under the kill switch, the all-bots suspend and the host's own suspend — a
 *    suspend places nothing, exits included, as it does for the bot;
 *  - **opens** stop under all of those, the breakers, and the host's "stop opening, keep exits";
 *  - **watch only** on the host holds the scout's opens, like a halt — no scan and no day spent,
 *    so switching it off later the same session still lets the pick run — and turns any sale it
 *    offers into a recorded one, placing nothing (code review, slice 5b).
 *
 * No host (no bot wired) leaves only the process gates, as before.
 */

export interface ScoutHostControls {
  suspendedReason(botId: string): string | null;
  opensHeldReason(botId: string): string | null;
  watchOnly(botId: string): boolean;
}

export interface ScoutGates {
  /** For the forced pick's opens — `LiveCycleDeps.blockedReason`. */
  readonly blockedReason: () => string | null;
  /** For selling its lots — `LiveCycleDeps.exitBlockedReason`. */
  readonly exitBlockedReason: () => string | null;
  /** For the mode its orders go out in — `BetaScoutDeps.watchOnly`. */
  readonly watchOnly: () => boolean;
}

/** Why the forced pick opens nothing while its host watches. */
export const HOST_WATCHES_REASON = "its bot's owner set it to watch only";

const watchingReason = (controls: ScoutHostControls, hostId: string): string | null =>
  controls.watchOnly(hostId) ? HOST_WATCHES_REASON : null;

export function scoutHostGates(
  controls: ScoutHostControls,
  hostId: string | undefined,
  process: {
    /** The kill switch and the all-bots suspend. */
    readonly stopEverything: () => string | null;
    /** The breakers. */
    readonly openBlockedReason: () => string | null;
  },
): ScoutGates {
  const exitBlockedReason = () =>
    process.stopEverything() ?? (hostId ? controls.suspendedReason(hostId) : null);
  return {
    exitBlockedReason,
    blockedReason: () =>
      exitBlockedReason() ??
      process.openBlockedReason() ??
      (hostId ? (controls.opensHeldReason(hostId) ?? watchingReason(controls, hostId)) : null),
    watchOnly: () => (hostId ? controls.watchOnly(hostId) : false),
  };
}
