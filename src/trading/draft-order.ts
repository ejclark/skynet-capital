import type { OptionType } from "./option-symbols.js";
import {
  buildOccSymbol,
  EXPIRATION_PATTERN,
  MAX_OCC_STRIKE,
  OCC_ROOT_PATTERN,
} from "./option-symbols.js";
import { normalizeSymbol } from "./order-ticket.js";

/**
 * THE MULTI-LEG DRAFT ORDER — a state machine for an order being built, decoupled from any one
 * screen (#582, slice 1).
 *
 * WHY THIS EXISTS. The desk's ticket (`option-ticket.ts`) is fixed to six named plays: you pick
 * a play and it asks for that play's numbers. There is no concept anywhere of "add a leg" — so a
 * vertical spread, the most ordinary structure in options, cannot be expressed at all. IBKR's
 * Strategy Builder and thinkorswim's chain-to-ticket flow both solve this the same way, and it is
 * not a screen: several entry points (a chain click, a builder panel, a saved template) all mutate
 * ONE in-progress order. That shared object is the missing piece, and this is it.
 *
 * PURE AND TOTAL. No I/O, no clock, no broker, no account. Every transition returns a new draft
 * and never throws; a transition that could not happen leaves the draft untouched and says why in
 * `refusals`. That makes the whole lifecycle testable as arithmetic, and it keeps this layer
 * honest about its own reach: it knows the LEGS, and nothing about the account holding them.
 *
 * THE SAFETY PROPERTY, stated once because everything else serves it: **an edit after validation
 * drops the draft back to `drafting` and discards the verdict.** Validation is a claim about a
 * specific set of legs; changing the legs makes the claim stale, and a stale pass is worse than no
 * pass because the review screen would render it as current. There is no transition that carries a
 * verdict across an edit, so no caller can construct one by accident.
 *
 * WHAT IS DELIBERATELY NOT HERE. Margin and collateral validation (slice 2) needs the account, so
 * this exposes `validate()` as a seam that TAKES a verdict rather than computing one. Payoff and
 * review rendering (slice 3) need premiums. Wiring the chain UI in (slice 4) needs a route. Each
 * is its own PR against envelope-protected files; this module touches none of them.
 */

/** Alpaca's `mleg` order class carries two to four legs. A fifth is refused, not silently dropped. */
export const MAX_LEGS = 4;

/** Not exported until something outside needs to name it: `DraftOrder["phase"]` already gives a
 *  caller the same type, and the dead-code gate counts an export nobody imports as debt. */
type DraftPhase = "empty" | "drafting" | "validated" | "reviewed" | "submitted";

/** One option leg. Options only in v1 — `mleg` is an options order class; a stock leg is a
 *  separate order, and pretending otherwise would build a structure the broker cannot accept. */
export interface DraftLeg {
  /** Stable for this leg's lifetime in this draft. Assigned on add, never reused. */
  readonly id: string;
  readonly underlying: string;
  readonly optionType: OptionType;
  readonly strike: number;
  /** ISO date, e.g. "2026-09-18". */
  readonly expiration: string;
  readonly action: "buy" | "sell";
  readonly contracts: number;
  /** Premium $/share this leg is willing to pay or accept. Absent means "at market". */
  readonly limitPrice?: number;
}

/** What a leg looks like before the draft gives it an identity. */
export type NewLeg = Omit<DraftLeg, "id">;

/**
 * A validation verdict, produced OUTSIDE this module by the layer that can see the account
 * (slice 2). Kept as a plain shape so the state machine never grows a dependency on the thing it
 * gates — the same reason `option-ticket.ts` takes a context rather than fetching one.
 */
export interface DraftVerdict {
  readonly ok: boolean;
  readonly refusals: readonly string[];
  readonly warnings: readonly string[];
}

export interface DraftOrder {
  readonly phase: DraftPhase;
  readonly legs: readonly DraftLeg[];
  /** Present only in `validated`, `reviewed` and `submitted`. Any edit clears it. */
  readonly verdict?: DraftVerdict;
  /** Why the LAST transition did not take effect. Cleared by every transition that succeeds. */
  readonly refusals: readonly string[];
  /** Monotonic; never rewound, so a removed leg's id can never be handed to a different leg. */
  readonly nextLegId: number;
}

export function emptyDraft(): DraftOrder {
  return { phase: "empty", legs: [], refusals: [], nextLegId: 1 };
}

/** Why this leg cannot join the draft — empty when it can. Shape only; the account is slice 2. */
function legRefusals(draft: DraftOrder, leg: NewLeg): string[] {
  const refusals: string[] = [];
  const underlying = normalizeSymbol(leg.underlying);
  // The OCC ROOT pattern, not the looser one a share ticket uses: every leg here is destined for
  // `buildOccSymbol`, and a root it cannot encode (a dotted class share) would assemble into a
  // string no broker recognises. Refusing at the door is what keeps `draftSymbols` total.
  if (!OCC_ROOT_PATTERN.test(underlying)) {
    refusals.push("That doesn't look like a symbol with listed options.");
  }
  if (!EXPIRATION_PATTERN.test(leg.expiration)) {
    refusals.push("Pick an expiration date from the chain.");
  }
  if (!(Number.isFinite(leg.strike) && leg.strike > 0 && leg.strike <= MAX_OCC_STRIKE)) {
    refusals.push("Pick a strike price from the chain.");
  }
  if (!(Number.isInteger(leg.contracts) && leg.contracts > 0)) {
    refusals.push("Contracts must be a positive whole number — one contract covers 100 shares.");
  }
  if (leg.limitPrice !== undefined && !(Number.isFinite(leg.limitPrice) && leg.limitPrice > 0)) {
    refusals.push("A limit price is the premium per share — it has to be above zero.");
  }
  if (draft.legs.length >= MAX_LEGS) {
    refusals.push(`A multi-leg order carries at most ${MAX_LEGS} legs.`);
  }
  // The same contract on the same side twice is a resize wearing a disguise: two legs that the
  // broker would net into one, with a total nobody typed. Refuse it and name the existing leg.
  if (draft.legs.some((l) => sameContract(l, leg) && l.action === leg.action)) {
    refusals.push(
      "That leg is already in this order — change its size instead of adding it twice.",
    );
  }
  return refusals;
}

function sameContract(
  a: Pick<DraftLeg, "underlying" | "optionType" | "strike" | "expiration">,
  b: NewLeg,
): boolean {
  return (
    normalizeSymbol(a.underlying) === normalizeSymbol(b.underlying) &&
    a.optionType === b.optionType &&
    a.strike === b.strike &&
    a.expiration === b.expiration
  );
}

/** Every edit lands here: legs change, phase resets to drafting, and the verdict is dropped. */
function edited(legs: readonly DraftLeg[], nextLegId: number): DraftOrder {
  return {
    phase: legs.length === 0 ? "empty" : "drafting",
    legs,
    refusals: [],
    nextLegId,
  };
}

/** Refuse a transition: the draft is untouched apart from carrying the reasons it was refused. */
function refused(draft: DraftOrder, refusals: readonly string[]): DraftOrder {
  return { ...draft, refusals };
}

export function addLeg(draft: DraftOrder, leg: NewLeg): DraftOrder {
  if (draft.phase === "submitted") return refused(draft, ["This order was already sent."]);
  const problems = legRefusals(draft, leg);
  if (problems.length) return refused(draft, problems);
  const added: DraftLeg = {
    ...leg,
    id: `leg-${draft.nextLegId}`,
    underlying: normalizeSymbol(leg.underlying),
  };
  return edited([...draft.legs, added], draft.nextLegId + 1);
}

export function removeLeg(draft: DraftOrder, id: string): DraftOrder {
  if (draft.phase === "submitted") return refused(draft, ["This order was already sent."]);
  if (!draft.legs.some((l) => l.id === id)) {
    return refused(draft, ["That leg isn't part of this order."]);
  }
  return edited(
    draft.legs.filter((l) => l.id !== id),
    draft.nextLegId,
  );
}

/** Change one leg's limit price. `undefined` means "at market" and is a legitimate reprice. */
export function repriceLeg(
  draft: DraftOrder,
  id: string,
  limitPrice: number | undefined,
): DraftOrder {
  if (draft.phase === "submitted") return refused(draft, ["This order was already sent."]);
  const target = draft.legs.find((l) => l.id === id);
  if (!target) return refused(draft, ["That leg isn't part of this order."]);
  if (limitPrice !== undefined && !(Number.isFinite(limitPrice) && limitPrice > 0)) {
    return refused(draft, ["A limit price is the premium per share — it has to be above zero."]);
  }
  // Spreading `{ limitPrice: undefined }` would leave the key present and undefined, which reads
  // back as "at market" only by accident. Rebuild the leg without it instead.
  const { limitPrice: _wasPriced, ...bare } = target;
  const repriced: DraftLeg = limitPrice === undefined ? bare : { ...bare, limitPrice };
  return edited(
    draft.legs.map((l) => (l.id === id ? repriced : l)),
    draft.nextLegId,
  );
}

/**
 * Record an outside verdict. A failing verdict does NOT advance the phase — it leaves the draft in
 * `drafting` with the refusals visible, because "we checked and it fails" and "we have not checked"
 * must not look the same to the review screen.
 */
export function validate(draft: DraftOrder, verdict: DraftVerdict): DraftOrder {
  if (draft.phase === "submitted") return refused(draft, ["This order was already sent."]);
  if (draft.legs.length < 2) {
    return refused(draft, ["A multi-leg order needs at least two legs."]);
  }
  if (!verdict.ok) {
    return {
      phase: "drafting",
      legs: draft.legs,
      verdict,
      refusals: [...verdict.refusals],
      nextLegId: draft.nextLegId,
    };
  }
  return {
    phase: "validated",
    legs: draft.legs,
    verdict,
    refusals: [],
    nextLegId: draft.nextLegId,
  };
}

/** Open the review screen. Only a validated draft can be reviewed. */
export function review(draft: DraftOrder): DraftOrder {
  if (draft.phase !== "validated") {
    return refused(draft, ["This order hasn't been checked against your account yet."]);
  }
  return { ...draft, phase: "reviewed", refusals: [] };
}

/**
 * Fire. Reachable ONLY from `reviewed` — the house invariant that the review screen is the single
 * path to an order, expressed as a state transition rather than as discipline at each call site.
 */
export function submitDraft(draft: DraftOrder): DraftOrder {
  if (draft.phase !== "reviewed") {
    return refused(draft, ["Orders are only sent from the review screen."]);
  }
  return { ...draft, phase: "submitted", refusals: [] };
}

/**
 * Short calls this draft does not cap on its own — the legs behind an unlimited-loss warning.
 *
 * A short call's loss has no ceiling unless a long call caps it: same underlying, a strike at or
 * above the short's (so the cap engages), an expiration at or after it (a long that expires first
 * leaves the short bare for the remaining days), and at least as many contracts.
 *
 * JUDGES THE DRAFT ALONE. A covered call is covered by SHARES, which live in the account, not in
 * this leg set — so a legitimately covered call appears here and the validation layer (slice 2,
 * which can see holdings) is what clears it. Erring toward naming a leg is the safe direction: the
 * cost is a warning on a covered call, and the cost of the other error is a member reading
 * "max loss $420" on a position that has none.
 */
export function undefinedRiskLegs(draft: DraftOrder): readonly DraftLeg[] {
  return draft.legs.filter((leg) => {
    if (leg.action !== "sell" || leg.optionType !== "call") return false;
    return !draft.legs.some(
      (cap) =>
        cap.action === "buy" &&
        cap.optionType === "call" &&
        cap.underlying === leg.underlying &&
        cap.strike >= leg.strike &&
        cap.expiration >= leg.expiration &&
        cap.contracts >= leg.contracts,
    );
  });
}

/** The OCC symbols this draft would send, in leg order — the handoff shape slice 4 needs. */
export function draftSymbols(draft: DraftOrder): readonly string[] {
  return draft.legs.map((l) =>
    buildOccSymbol({
      underlying: l.underlying,
      expiration: l.expiration,
      type: l.optionType,
      strike: l.strike,
    }),
  );
}
