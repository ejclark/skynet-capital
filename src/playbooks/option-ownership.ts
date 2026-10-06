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

/**
 * ONE ENTRY PER PLAYBOOK (#4651). A bot's roster merges the env list with its own subscriptions
 * (`mergeRosters`), and neither promises a playbook appears once: a repeated SKYNET_PLAYBOOKS token
 * ("SAURON,SAURON:aggressive", "S1-NVDA,S1-NVDA") would run the same rules twice, and the guards
 * would approve both buys — twice the position. The first entry per id wins (after the merge, that
 * is the account's own subscription when it has one); every repeat is refused, loudly.
 */
export function onePerPlaybook(
  enabled: readonly EnabledPlaybook[],
  log: (line: string) => void,
): EnabledPlaybook[] {
  const first = new Map<string, EnabledPlaybook>();
  return enabled.filter((entry) => {
    const kept = first.get(entry.playbook.id);
    if (!kept) {
      first.set(entry.playbook.id, entry);
      return true;
    }
    log(
      `${entry.playbook.id}:${entry.mode} refused — ${kept.playbook.id}:${kept.mode} is already ` +
        "on this bot's roster, and a playbook runs once",
    );
    return false;
  });
}

/**
 * A PERSONA'S OWN RULES YIELD TO EVERY OTHER PLAYBOOK (#4651). A `rulesOf` playbook (SAURON) trades
 * a whole universe as one basket, so any symbol another enabled playbook trades is that playbook's:
 * the basket loses it, loudly, the way an option claim narrows one (above). Applied after the option
 * claims, it makes the ownership rule `withPlaybooks` applies to Sauron's own reflexes hold for the
 * playbook too — on another bot SAURON never sells S1-NVDA's NVDA — and it keeps a Store allocation
 * honest: the guards size SAURON against its narrowed basket, so one position never counts against
 * two allocations. A roster with no `rulesOf` playbook comes back unchanged.
 */
export function yieldPersonaRules(
  enabled: readonly EnabledPlaybook[],
  log: (line: string) => void,
): EnabledPlaybook[] {
  const ownedBy = new Map<string, string>();
  for (const { playbook } of enabled) {
    if (playbook.rulesOf !== undefined) continue;
    for (const s of playbook.symbols) if (!ownedBy.has(s)) ownedBy.set(s, playbook.id);
  }
  return enabled.map((entry) => {
    if (entry.playbook.rulesOf === undefined) return entry;
    const lost = entry.playbook.symbols.filter((s) => ownedBy.has(s));
    if (lost.length === 0) return entry;
    const to = lost.map((s) => `${s} → ${ownedBy.get(s)}`).join(", ");
    log(`${entry.playbook.id} hands ${to}; it stops trading them on this bot`);
    const symbols = entry.playbook.symbols.filter((s) => !ownedBy.has(s));
    return { ...entry, playbook: { ...entry.playbook, symbols } };
  });
}
