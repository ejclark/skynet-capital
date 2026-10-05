import {
  isOccSymbol,
  type OptionContractParts,
  parseOccSymbol,
} from "../trading/option-symbols.js";
import {
  OPTION_EFFECTS,
  OPTION_STRUCTURES,
  type OptionEffect,
  type OptionOrderIntent,
  type OrderIntent,
  SIDES,
  type Side,
} from "./types.js";

/**
 * What a well-formed bot option order looks like. ONE rule shared by the builder, the guard and the
 * wire parser — so the parser accepts exactly what the writer can emit, and a shape the guard would
 * refuse can never arrive on the dashboard reading as something else.
 *
 * An option order is an ordinary `OrderIntent` on the UNDERLYING plus an `option` field: the
 * contracts live in `option.legs`, and `symbol` stays the ticker every per-symbol rule keys on.
 */

/** Alpaca's `client_order_id` alphabet, bounded to its 128-character limit. */
export const CLIENT_ORDER_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
/** No per-share option price comes near this — it bounds a corrupted number, not a real one. */
const MAX_ABS_LIMIT = 100_000;
const SINGLE_LEG_OPENS = new Map([
  ["cash-secured-put", "put"],
  ["covered-call", "call"],
]);

export function isOptionOrder(
  intent: OrderIntent,
): intent is OrderIntent & { readonly option: OptionOrderIntent } {
  return intent.option !== undefined;
}

/** A share-shaped order whose `symbol` names a contract — never a way a bot may trade one. A contract
 *  only ever trades as a priced limit through `option`. */
export function isBareContractOrder(intent: OrderIntent): boolean {
  return intent.option === undefined && isOccSymbol(intent.symbol);
}

/** Alpaca's per-leg `position_intent`. */
export function positionIntentOf(
  effect: OptionEffect,
  side: Side,
): "buy_to_open" | "sell_to_open" | "buy_to_close" | "sell_to_close" {
  return `${side}_to_${effect}`;
}

/** What the decision store's outcome match must ALSO agree on: shares, or exactly which contracts. */
export function instrumentKey(intent: OrderIntent): string {
  return intent.option
    ? `option:${intent.option.effect}:${intent.option.legs.map((l) => `${l.side}:${l.occSymbol}`).join("+")}`
    : "shares";
}

interface ParsedLeg {
  readonly side: Side;
  readonly parts: OptionContractParts;
}

/** Each leg's own rules; the parsed legs come back only when every one of them holds. */
function legProblems(
  intent: OrderIntent,
  option: OptionOrderIntent,
): { readonly problems: string[]; readonly legs?: readonly ParsedLeg[] } {
  if (!Array.isArray(option.legs) || option.legs.length < 1 || option.legs.length > 2) {
    return { problems: ["an option order has one or two legs"] };
  }
  const problems: string[] = [];
  const legs: ParsedLeg[] = [];
  for (const [i, leg] of option.legs.entries()) {
    const parts =
      typeof leg.occSymbol === "string" && leg.occSymbol === leg.occSymbol.trim().toUpperCase()
        ? parseOccSymbol(leg.occSymbol)
        : undefined;
    if (parts?.underlying !== intent.symbol) {
      problems.push(`leg ${i + 1} is not a contract on ${intent.symbol}`);
    }
    if (!SIDES.includes(leg.side)) problems.push(`leg ${i + 1} has no side`);
    if (leg.ratio !== 1) problems.push(`leg ${i + 1} ratio must be 1`);
    if (parts) legs.push({ side: leg.side, parts });
  }
  return problems.length > 0 ? { problems } : { problems, legs };
}

function bandAndAssignmentProblems(option: OptionOrderIntent): string[] {
  const problems: string[] = [];
  const band = option.band;
  if (
    band &&
    !(
      Number.isFinite(band.low) &&
      Number.isFinite(band.high) &&
      band.low <= band.high &&
      typeof band.at === "string" &&
      !Number.isNaN(Date.parse(band.at))
    )
  ) {
    problems.push("the quote band must be a finite low ≤ high with a parseable time");
  }
  if (
    option.assignment !== undefined &&
    !(option.assignment === "intended" && SINGLE_LEG_OPENS.has(option.structure))
  ) {
    problems.push("only a sold put or covered call may intend assignment");
  }
  return problems;
}

function singleLegOpenProblems(
  intent: OrderIntent,
  option: OptionOrderIntent,
  legs: readonly ParsedLeg[],
  type: string,
): string[] {
  const [leg] = legs;
  const ok =
    option.effect === "open" &&
    legs.length === 1 &&
    leg?.parts.type === type &&
    leg.side === "sell" &&
    intent.side === "sell" &&
    option.limitPrice > 0;
  return ok ? [] : [`${option.structure} is one sold ${type}, opened for a credit`];
}

function debitSpreadProblems(
  intent: OrderIntent,
  option: OptionOrderIntent,
  legs: readonly ParsedLeg[],
): string[] {
  const [long, short] = legs;
  const ok =
    option.effect === "open" &&
    long !== undefined &&
    short !== undefined &&
    long.parts.type === "call" &&
    short.parts.type === "call" &&
    long.parts.expiration === short.parts.expiration &&
    long.side === "buy" &&
    short.side === "sell" &&
    long.parts.strike < short.parts.strike &&
    option.limitPrice > 0 &&
    intent.side === "buy";
  return ok ? [] : ["a call debit spread buys the lower call and sells the higher, for a debit"];
}

function closeProblems(
  intent: OrderIntent,
  option: OptionOrderIntent,
  legs: readonly ParsedLeg[],
): string[] {
  if (option.effect !== "close") return ["a close must have effect close"];
  const [a, b] = legs;
  if (a && !b) {
    return intent.side === a.side && option.limitPrice > 0
      ? []
      : ["a one-leg close trades that leg's side at a positive limit"];
  }
  const ok =
    a !== undefined &&
    b !== undefined &&
    a.parts.type === b.parts.type &&
    a.parts.expiration === b.parts.expiration &&
    a.side !== b.side &&
    a.parts.strike !== b.parts.strike &&
    option.limitPrice !== 0 &&
    intent.side === (option.limitPrice > 0 ? "buy" : "sell");
  return ok ? [] : ["a vertical close is two opposite legs of one expiry, signed by its net"];
}

function structureProblems(
  intent: OrderIntent,
  option: OptionOrderIntent,
  legs: readonly ParsedLeg[],
): string[] {
  const singleLegType = SINGLE_LEG_OPENS.get(option.structure);
  if (singleLegType) return singleLegOpenProblems(intent, option, legs, singleLegType);
  if (option.structure === "call-debit-spread") return debitSpreadProblems(intent, option, legs);
  return closeProblems(intent, option, legs);
}

/** Empty = well-formed. Every problem is a short plain sentence, for a log line or a spec. */
export function optionOrderProblems(intent: OrderIntent): readonly string[] {
  const option = intent.option;
  if (!option) return ["not an option order"];
  const problems: string[] = [];
  if (intent.type !== "limit") problems.push("an option order is a limit order");
  if (!(Number.isInteger(intent.quantity) && intent.quantity >= 1)) {
    problems.push("quantity must be a whole number of at least 1");
  }
  const shapeKnown =
    OPTION_EFFECTS.includes(option.effect) && OPTION_STRUCTURES.includes(option.structure);
  if (!shapeKnown) problems.push("unknown option effect or structure");
  if (!(Number.isFinite(option.limitPrice) && Math.abs(option.limitPrice) < MAX_ABS_LIMIT)) {
    problems.push("the limit price must be a finite per-share price");
  }
  const legs = legProblems(intent, option);
  problems.push(...legs.problems, ...bandAndAssignmentProblems(option));
  if (shapeKnown && legs.legs) problems.push(...structureProblems(intent, option, legs.legs));
  return problems;
}
