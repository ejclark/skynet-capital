import { participantReturnPct } from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * The standings producer — the ONE place relative bot performance becomes a landmark dial, so
 * every view (board cards, /u/:id, /compare) reads the same honest rank instead of each
 * defaulting the Eye to full power. "The landmark IS the scoreboard" (docs/LIVING-UNIVERSE.md)
 * only holds if no view renders a prominence the standings didn't produce.
 */

/**
 * Rank the bots by return% and map each to a landmark "prominence" 0..1 — the leveling dial for the
 * persona landmark (best bot = 1, worst = ~0.55, linear by rank). Pure; humans/no-bots → empty map.
 * The landmark becomes the scoreboard: a better bot's Eye grows larger relative to its peers.
 */
export function botLandmarkProminence(
  participants: readonly ParticipantSnapshot[],
): Map<string, number> {
  const bots = participants
    .filter((p) => p.kind === "bot" && !p.error)
    .sort((a, b) => participantReturnPct(b) - participantReturnPct(a));
  const out = new Map<string, number>();
  if (bots.length === 1) {
    const only = bots[0];
    if (only) out.set(only.id, 1);
    return out;
  }
  bots.forEach((p, i) => {
    out.set(p.id, 1 - (i / (bots.length - 1)) * 0.45);
  });
  return out;
}
