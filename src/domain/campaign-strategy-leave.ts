/**
 * LEAVING BUILD A STRATEGY — the one way out of the mode, and what carries the member's thesis out
 * (#6952 slice 4, criterion 5: "their thesis SHALL exist as conviction claims with falsifiers or a
 * playbook draft in shadow test, never as a live order").
 *
 * A member moves on to play only when the campaign's names carry a view whose every claim has a
 * falsifier, a play in its shadow test, or a chain (saved shadow-only, chain-form.ts). A draft play
 * not yet in its shadow test does not count, and neither does a promoted play: promotion is the
 * shadow test's own later step, and a play that can trade is never this mode's output. Only
 * records on the encounters' names count; a member's views and plays on other names belong to
 * other campaigns.
 *
 * Pure. Paper only, SIM. Nothing here places an order, and nothing it returns can.
 */
import type { AuthoredPlayRecord } from "../playbooks/authored-play-draft.js";
import type { PlaybookChain } from "../playbooks/chain.js";
import { CHAINABLE } from "../playbooks/chain-form.js";
import { type Conviction, convictionProblems } from "../playbooks/conviction-record.js";
import { findPair, type Pair } from "../playbooks/pair-table.js";
import type { StrategyDoor, StrategyEncounter } from "./campaign-strategy.js";
import { CAMPAIGN_MODES, type CampaignMode } from "./campaigns.js";

/** What the member saved through this campaign's doors, as the forms' own stores hold it. */
export interface StrategyBuilt {
  readonly views?: readonly Conviction[];
  readonly plays?: readonly AuthoredPlayRecord[];
  readonly chains?: readonly PlaybookChain[];
}

/** One saved record that carries the member's thesis out of the mode. */
export interface Held {
  readonly door: StrategyDoor;
  readonly id: string;
  readonly symbol: string;
}

export type Leave =
  | {
      readonly ok: true;
      readonly next: CampaignMode;
      readonly holds: readonly Held[];
      /** Records on the campaign's names that did not count, and why. */
      readonly notes: readonly string[];
    }
  | { readonly ok: false; readonly problems: readonly string[] };

const NEXT_MODE: CampaignMode =
  CAMPAIGN_MODES[CAMPAIGN_MODES.indexOf("build-strategy") + 1] ?? "play";

function viewHolds(
  views: readonly Conviction[],
  names: ReadonlySet<string>,
  lookup: (id: string) => Pair | undefined,
): Held[] {
  return views.flatMap((v) => {
    // The conviction form's own rules (a dated falsifier per claim, a pair it may steer), so the
    // exit and the form can never judge one view differently; plus a falsifier on every claim.
    const falsified =
      convictionProblems(v, lookup).length === 0 &&
      v.claims.length > 0 &&
      v.claims.every((c) => c.falsifier.trim().length > 0);
    const symbol = v.steers.flatMap((id) => lookup(id)?.symbols ?? []).find((s) => names.has(s));
    return falsified && symbol ? [{ door: "view" as const, id: v.id, symbol }] : [];
  });
}

function playHolds(
  plays: readonly AuthoredPlayRecord[],
  names: ReadonlySet<string>,
): { readonly holds: Held[]; readonly notes: string[] } {
  const holds: Held[] = [];
  const notes: string[] = [];
  for (const p of plays) {
    const symbol = p.spec.symbols[0];
    if (symbol === undefined || !names.has(symbol)) continue;
    switch (p.status) {
      case "shadow":
        holds.push({ door: "play", id: p.id, symbol });
        break;
      case "draft":
        notes.push(`"${p.name}" is saved as a draft: start its shadow test and it counts.`);
        break;
      case "promoted":
        notes.push(
          `"${p.name}" is promoted and can trade, so it does not count: this mode hands on views and shadow tests, never a play that trades.`,
        );
        break;
      default: {
        // A status added later must be placed here on purpose, never read as one of the above.
        const unplaced: never = p.status;
        throw new Error(
          `campaign-strategy-leave: no rule for a play whose status is ${String(unplaced)}`,
        );
      }
    }
  }
  return { holds, notes };
}

function chainHolds(chains: readonly PlaybookChain[], names: ReadonlySet<string>): Held[] {
  return chains.flatMap((c) => {
    const symbol = c.links
      .flatMap((l) => [l.from, l.to])
      .map((id) => CHAINABLE[id]?.symbol)
      .find((s): s is string => s !== undefined && names.has(s));
    return symbol ? [{ door: "chain" as const, id: c.id, symbol }] : [];
  });
}

/**
 * Whether a member may leave build-a-strategy mode (criterion 5), and what carries their thesis
 * out. Only records on the encounters' names count: a member's views and plays on other names
 * belong to other campaigns. Nothing here places an order, and nothing it returns can.
 */
export function leaveBuildStrategy(
  encounters: readonly StrategyEncounter[],
  built: StrategyBuilt,
  lookup: (id: string) => Pair | undefined = findPair,
): Leave {
  const names = new Set(encounters.map((e) => e.symbol));
  if (names.size === 0)
    return {
      ok: false,
      problems: [
        "There is no name to build on yet: pick one to watch or enter in find names, and it comes here.",
      ],
    };
  const plays = playHolds(built.plays ?? [], names);
  const holds = [
    ...viewHolds(built.views ?? [], names, lookup),
    ...plays.holds,
    ...chainHolds(built.chains ?? [], names),
  ];
  if (holds.length > 0) return { ok: true, next: NEXT_MODE, holds, notes: plays.notes };
  return {
    ok: false,
    problems: [
      ...plays.notes,
      "Nothing carries your thesis out yet: save a view with a falsifier on each claim, a play in its shadow test, or a chain, on one of this campaign's names.",
    ],
  };
}
