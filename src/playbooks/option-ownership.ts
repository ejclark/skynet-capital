import type { EnabledPlaybook } from "./playbook.js";

/**
 * ONE OPTION PLAYBOOK PER UNDERLYING, AND IT OWNS THE TICKER (#4645). An option play claims its
 * underlyings for the bot that runs it: its contracts and the shares under them are one book, and a
 * second decision-maker selling those shares (or writing a second call on them) is exactly the
 * fight the ownership rule in `playbook.ts` exists to prevent.
 *
 *   1. Walking the roster in order, an option playbook whose underlying an earlier one already
 *      claimed is REFUSED — dropped from the roster, loudly.
 *   2. Every other playbook loses the claimed symbols from its basket, loudly — S1-NVDA stops
 *      trading NVDA shares while the NVDA spread is subscribed.
 *
 * The managed set, the scout's skip set and the subscription baskets all follow from the narrowed
 * roster this returns. A roster with no option playbook comes back unchanged.
 */
export function claimOptionUnderlyings(
  enabled: readonly EnabledPlaybook[],
  log: (line: string) => void,
): EnabledPlaybook[] {
  const claimedBy = new Map<string, string>();
  const refused = new Set<EnabledPlaybook>();
  for (const entry of enabled) {
    const underlyings = entry.playbook.options?.underlyings;
    if (!underlyings) continue;
    const taken = underlyings.filter((u) => claimedBy.has(u));
    if (taken.length > 0) {
      refused.add(entry);
      const owners = taken.map((u) => `${u} (${claimedBy.get(u)})`).join(", ");
      log(`${entry.playbook.id} refused — another option playbook already trades ${owners}`);
      continue;
    }
    for (const u of underlyings) claimedBy.set(u, entry.playbook.id);
  }
  if (claimedBy.size === 0) return [...enabled];
  return enabled.flatMap((entry) => {
    if (refused.has(entry)) return [];
    if (entry.playbook.options) return [entry];
    const lost = entry.playbook.symbols.filter((s) => claimedBy.has(s));
    if (lost.length === 0) return [entry];
    const to = lost.map((s) => `${s} → ${claimedBy.get(s)}`).join(", ");
    log(`${entry.playbook.id} hands ${to}; it stops trading them on this bot`);
    const symbols = entry.playbook.symbols.filter((s) => !claimedBy.has(s));
    return [{ ...entry, playbook: { ...entry.playbook, symbols } }];
  });
}
