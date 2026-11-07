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
 * Exits are never sized by it. Each opening order the floor sizes says "below its bar" on its
 * reason (`withBelowBarLabel`), so the decision record says why it was small. The live wiring turns
 * the label and the ceiling on together, around the whole composed persona, so an order can never
 * carry the label without the floor behind it, nor the floor without the label.
 *
 * WHAT IT BOUNDS. One order, not the holding: the position cap already bounds the holding, and the
 * one below-bar share play enters from flat only. The base is equity, as every guard bound is.
 *
 * WHY 1%. Half the standard share size of the one below-bar share play (S1-NVDA: 1% / 2% / 3% by
 * mode, `registry.ts`), a third of the 3% position cap, and no larger than its conservative size,
 * so the floor never lets a below-bar pair grow past what it would place today. UNMEASURED: a stated
 * default. Falsifier (#6954 call 1): wrong if by 2026-12-31 at least 10 closed below-bar paper
 * trades average worse than −2% while at-or-above-bar pairs are positive — that pair then drops to
 * record-only. An owner's smaller floor is the lever before that.
 *
 * THE OWNER'S FLOOR (#6954 slice 5c). A subscription may carry `belowBarFloorPct`, its owner's own
 * floor for that pair. It only ever tightens this one: the floor a pair runs under is the smaller of
 * the two (`floorPct`), so no setting can size a below-bar pair past what the house allows. The
 * guards' ceiling and the label's percent are the same function (`openCeilingFor`), so the words on
 * a decision always name the floor that sized it. A pair at or above its bar ignores the field: it
 * narrows weak evidence, not a pair's ordinary size.
 */
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import { belowHouseBar, findPair, type Pair } from "./pair-table.js";
import { pausedMayPlace } from "./playbook.js";

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

/** The guards' ceiling for one playbook (`RiskConfig.openCeiling`): a share of equity, or
 *  `undefined` for no ceiling. The label reads the same function, so its percent is the one applied. */
export type OpenCeiling = (playbookId: string) => number | undefined;

/** The owner's floor for each playbook, read off one bot's subscriptions (`belowBarFloorPct`). */
export type OwnerFloorOf = (playbookId: string) => number | undefined;

const NO_OWNER_FLOOR: OwnerFloorOf = () => undefined;

/** The floor a below-bar pair runs under: the owner's when it is smaller, else the house's, so a
 *  larger one reads as the house floor. A NaN (the parser refuses one) survives `Math.min`, and the
 *  guards fail it closed at 0 (`openCeilingUsd`): never a larger size. */
export function floorPct(ownerPct: number | undefined): number {
  return ownerPct === undefined ? BELOW_BAR_FLOOR_PCT : Math.min(BELOW_BAR_FLOOR_PCT, ownerPct);
}

/** Each playbook's owner floor on one bot, from that bot's subscriptions. */
export function ownerFloorsOf(subscriptions: readonly PlaybookSubscription[]): OwnerFloorOf {
  const floors = new Map(
    subscriptions.flatMap((sub) =>
      sub.belowBarFloorPct === undefined ? [] : [[sub.playbookId, sub.belowBarFloorPct] as const],
    ),
  );
  return (playbookId) => floors.get(playbookId);
}

/**
 * The ceiling for one bot: the floor (`floorPct`, the owner's when smaller) when a playbook's pair
 * is below its bar, else `undefined`. Bound to the lookup once, so a spec can hand it a table.
 */
export function openCeilingFor(
  lookup: PairLookup = findPair,
  ownerFloorOf: OwnerFloorOf = NO_OWNER_FLOOR,
): OpenCeiling {
  return (playbookId) =>
    belowBar(playbookId, lookup) ? floorPct(ownerFloorOf(playbookId)) : undefined;
}

/** "· below its bar: sized to at most 1% of the account" — the tail an opening order gains. */
export function belowBarNote(pct: number = BELOW_BAR_FLOOR_PCT): string {
  // Three significant figures, never a fixed count of decimals: an owner's 0.004% must not read "0%".
  const shown = Number((pct * 100).toPrecision(3));
  return ` · ${BELOW_BAR_LABEL}: sized to at most ${shown}% of the account`;
}

/** An order the floor sizes — an open that risks cash, from a below-bar pair — with the label on its
 *  reason, naming the percent `ceiling` sizes it to; every other order as it came. Exits and a
 *  covered call (which risks no cash, so the floor never sizes it: `pausedMayPlace`) are left alone,
 *  since the label would say otherwise. */
export function labelBelowBar(
  intent: OrderIntent,
  ceiling: OpenCeiling = openCeilingFor(),
): OrderIntent {
  if (!intent.playbookId || pausedMayPlace(intent)) return intent;
  const pct = ceiling(intent.playbookId);
  if (pct === undefined || intent.reason.includes(BELOW_BAR_LABEL)) return intent;
  return { ...intent, reason: `${intent.reason}${belowBarNote(pct)}` };
}

/** The composed persona, with every order it decides labelled (`labelBelowBar`) against the same
 *  `ceiling` the guards size with. Outermost, so the opens the wrappers add (a roll, a wind-down) are
 *  labelled too; every other method passes through. */
export function withBelowBarLabel(
  inner: Persona,
  ceiling: OpenCeiling = openCeilingFor(),
): Persona {
  return {
    ...inner,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      return inner.decide(context, portfolio).map((intent) => labelBelowBar(intent, ceiling));
    },
  };
}
