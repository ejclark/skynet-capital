/**
 * THE BELOW-BAR FLOOR (#6954 slice 5). A pair whose study misses its playbook's own bar — the △
 * "below the house bar" tier (`belowHouseBar` in `pair-table.ts`: NVDA's pre-print run-up at
 * p 0.0032 against about 0.001, the NVDA call spread that borrows it, NBIS's dip-to-bounce at t 2.2
 * against 3.5) — keeps trading as it does today, at a smaller size written once, here.
 *
 * WHY C, AND NOT RECORD-ONLY. #6771 asked what a below-bar ticker may do: A record only, B trade
 * only on a subscriber's dated view, or C trade as today under one floor. Eric, 2026-11-06: "Work to
 * enable the intent, which is fully autonomous trade execution where we steer, not just watching."
 * Record-only is watching, and a view required before each trade puts a person in every trade, so
 * it reads as C (#6954 call 1). The weaker evidence is answered with size, said on every decision.
 *
 * HOW IT BINDS. The guards size an opening order from such a pair to at most this share of the
 * account's equity (`RiskConfig.openCeiling`), beside the cash, position-cap and budget bounds they
 * already take the smallest of; an order whose single unit costs more is refused `below-bar-floor`.
 * Exits are never sized by it. The playbook layer labels each opening order "below its bar"
 * (`labelBelowBar`, applied in `with-playbooks.ts`), so the decision record says why it was small.
 *
 * WHY 1%. Half the standard share size of the one below-bar share play (S1-NVDA: 1% / 2% / 3% by
 * mode, `registry.ts`), a third of the 3% position cap, and no larger than its conservative size,
 * so the floor never lets a below-bar pair grow past what it would place today. UNMEASURED: a stated
 * default. Falsifier (#6954 call 1): wrong if by 2026-12-31 at least 10 closed below-bar paper
 * trades average worse than −2% while at-or-above-bar pairs are positive — that pair then drops to
 * record-only. An owner will be able to set a smaller floor on a subscription, never a larger one
 * (#6954 slice 5's later piece); until then this constant is the only floor.
 */
import type { OrderIntent } from "../domain/types.js";
import { belowHouseBar, findPair, type Pair } from "./pair-table.js";
import { isExitIntent } from "./playbook.js";

/** The most one opening order from a below-bar pair may risk, as a share of account equity. */
export const BELOW_BAR_FLOOR_PCT = 0.01;

/** The words every below-bar opening order carries on its decision record. */
export const BELOW_BAR_LABEL = "below its bar";

type PairLookup = (id: string) => Pair | undefined;

/** Whether a playbook's pair misses its own bar. An id the table does not know is not below it:
 *  the floor narrows a known weak pair, and the subscribed-only and exit-plan rules already refuse
 *  an open from an unknown one. */
export function belowBar(playbookId: string, lookup: PairLookup = findPair): boolean {
  const pair = lookup(playbookId);
  return pair !== undefined && belowHouseBar(pair.evidence);
}

/**
 * The guards' ceiling for one playbook (`RiskConfig.openCeiling`): the floor when its pair is below
 * its bar, else `undefined` (no ceiling). Bound to the lookup once, so a spec can hand it a table.
 */
export function openCeilingFor(
  lookup: PairLookup = findPair,
): (playbookId: string) => number | undefined {
  return (playbookId) => (belowBar(playbookId, lookup) ? BELOW_BAR_FLOOR_PCT : undefined);
}

/** "· below its bar: sized to at most 1% of the account" — the tail an opening order gains. */
export function belowBarNote(pct: number = BELOW_BAR_FLOOR_PCT): string {
  const shown = Number((pct * 100).toFixed(2));
  return ` · ${BELOW_BAR_LABEL}: sized to at most ${shown}% of the account`;
}

/** An opening order from a below-bar pair, with the label on its reason; every other order as it
 *  came. Exits are left alone: the floor sizes opens only, and a label there would say otherwise. */
export function labelBelowBar(intent: OrderIntent, lookup: PairLookup = findPair): OrderIntent {
  if (!intent.playbookId || isExitIntent(intent) || !belowBar(intent.playbookId, lookup)) {
    return intent;
  }
  if (intent.reason.includes(BELOW_BAR_LABEL)) return intent;
  return { ...intent, reason: `${intent.reason}${belowBarNote()}` };
}
