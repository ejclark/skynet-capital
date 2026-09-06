import { TRADE_TYPES, type TradeTypeCode } from "./trade-types.js";

/**
 * THE PLAYBOOK STORE'S FOG (issue #1707) — the one rung that gates handing an account's capital to
 * a house playbook, and the sentence that names it. `docs/FOG-OF-WAR.md`, applied to a capability
 * that was open to everyone while the playbooks' own bodies were not.
 *
 * WHY 102, AND NOT "the rung the card names". The Playbook Store renders the BOT roster
 * (`src/discovery/playbook-store.ts` → `src/playbooks/registry.ts`: S1-NVDA, G1-GOOG, TACO-DJT),
 * and those entries carry no rung — `unlocksAfter` belongs to the deliberately separate HUMAN
 * catalog in `playbook-catalog.ts`. So the honest gate is the rung the CAPABILITY assumes, not one
 * copied off a card that never had it. Every house play's `desiredState` is long → flat: it buys
 * and it sells. Rung 102 ("Sell stock — take profit or cut a loss") is exactly that round trip,
 * and it is already what the human `accumulator` playbook unlocks on.
 *
 * The rung must be EARNED, not merely open (`docs/FOG-OF-WAR.md` criterion 3: the unlock is
 * evidence — a real fill — never a claim). Wheels off is never fogged, matching the ladder itself:
 * a member the seeding rule already trusts is not coached.
 *
 * Withheld here: the ability to delegate. Never withheld: what a playbook does, when it enters,
 * both of its exits, and how to leave one. Exits are exempt everywhere this is applied.
 */

/** The ladder rung whose filled order opens capital delegation. */
export const DELEGATION_RUNG: TradeTypeCode = "102";

/** The rung's real broker term, read from the one catalog that owns it. */
export const DELEGATION_RUNG_NAME =
  TRADE_TYPES.find((t) => t.code === DELEGATION_RUNG)?.name ?? DELEGATION_RUNG;

/**
 * The one sentence the door is drawn with — the same words on the disabled control and in the
 * server's refusal, so a member can never be told two different things about one gate.
 * States what the rung teaches, never a warning (`docs/FOG-OF-WAR.md` criterion 9).
 */
export const DELEGATION_LOCKED_NOTE =
  `Delegating capital opens after your first filled ${DELEGATION_RUNG} (${DELEGATION_RUNG_NAME}). ` +
  "Every house playbook buys and then sells for you — the round trip by hand is the rung that proves it.";

/** The gate as data, for the JSON view and the UI that renders the door. */
export interface DelegationGateView {
  readonly locked: boolean;
  readonly unlocksAfter: TradeTypeCode;
  readonly unlocksAfterName: string;
  readonly note: string;
}

/**
 * Locked = training wheels on and rung 102 not yet earned by a real fill. No progression view at
 * all (no service, no linked desk) reads as wheels-off, exactly like `plays-api-routes.ts` —
 * absence never invents a restriction.
 */
export function delegationLocked(
  progression:
    | { readonly wheels: boolean; readonly earnedByCode: ReadonlyMap<TradeTypeCode, unknown> }
    | undefined,
): boolean {
  return Boolean(progression?.wheels) && !progression?.earnedByCode.has(DELEGATION_RUNG);
}

/** The gate rendered as the view's own field — always present, so the door is always describable. */
export function delegationGateView(locked: boolean): DelegationGateView {
  return {
    locked,
    unlocksAfter: DELEGATION_RUNG,
    unlocksAfterName: DELEGATION_RUNG_NAME,
    note: DELEGATION_LOCKED_NOTE,
  };
}
