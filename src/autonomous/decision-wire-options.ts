import {
  OPTION_EFFECTS,
  OPTION_STRUCTURES,
  type OptionLegFill,
  type OptionLegIntent,
  type OptionOrderIntent,
  type OptionQuoteBand,
  type OptionSelection,
  SIDES,
} from "../domain/types.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";

/**
 * Pure, total parsers for the option half of a decision record crossing the bots↔app bridge —
 * beside `decision-wire-parts.ts`, in the same house style: anything malformed is `undefined`,
 * never a throw. Required fields fail the option closed (the caller then refuses the whole intent,
 * so a malformed option can never come back as a share order); OPTIONAL fields are dropped one by
 * one when malformed, because JSON turns a NaN into null and one bad number must not cost the
 * record. The shape rules themselves are `optionOrderProblems`, which the caller runs after this.
 */

/** OCC symbols are 15–21 characters; anything longer is not one. */
const MAX_OCC_LENGTH = 32;
const SELECTION_NUMBERS = [
  "spot",
  "dte",
  "targetDelta",
  "pickedDelta",
  "candidates",
  "towardNatural",
] as const;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function parseOptionLeg(value: unknown): OptionLegIntent | undefined {
  if (!isRecord(value)) return undefined;
  const occSymbol = boundedString(value.occSymbol, MAX_OCC_LENGTH);
  const side = SIDES.find((s) => s === value.side);
  if (!(occSymbol && side) || typeof value.ratio !== "number") return undefined;
  return { occSymbol, side, ratio: value.ratio };
}

function parseBand(value: unknown): OptionQuoteBand | undefined {
  if (!isRecord(value)) return undefined;
  const at = boundedString(value.at);
  return finite(value.low) && finite(value.high) && at
    ? { low: value.low, high: value.high, at }
    : undefined;
}

function parseSelection(value: unknown): OptionSelection | undefined {
  if (!isRecord(value)) return undefined;
  const rule = boundedString(value.rule);
  if (!rule) return undefined;
  const phase = boundedString(value.phase);
  const expiryBefore = boundedString(value.expiryBefore);
  const deltaSource =
    value.deltaSource === "feed" || value.deltaSource === "model" ? value.deltaSource : undefined;
  const numbers: Partial<Record<(typeof SELECTION_NUMBERS)[number], number>> = {};
  for (const key of SELECTION_NUMBERS) {
    const n = value[key];
    if (finite(n)) numbers[key] = n;
  }
  return {
    rule,
    ...(phase ? { phase } : {}),
    ...numbers,
    ...(deltaSource ? { deltaSource } : {}),
    ...(expiryBefore ? { expiryBefore } : {}),
  };
}

export function parseOptionOrderIntent(value: unknown): OptionOrderIntent | undefined {
  if (!isRecord(value)) return undefined;
  const effect = OPTION_EFFECTS.find((e) => e === value.effect);
  const structure = OPTION_STRUCTURES.find((s) => s === value.structure);
  if (!(effect && structure && Array.isArray(value.legs))) return undefined;
  const legs = value.legs.map(parseOptionLeg);
  if (legs.some((leg) => !leg) || typeof value.limitPrice !== "number") return undefined;
  const band = parseBand(value.band);
  const selection = parseSelection(value.selection);
  return {
    effect,
    structure,
    legs: legs as OptionLegIntent[],
    limitPrice: value.limitPrice,
    ...(band ? { band } : {}),
    ...(value.assignment === "intended" ? { assignment: "intended" as const } : {}),
    ...(selection ? { selection } : {}),
  };
}

export function parseLegFills(value: unknown): readonly OptionLegFill[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const fills: OptionLegFill[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const occSymbol = boundedString(entry.occSymbol, MAX_OCC_LENGTH);
    if (!(occSymbol && finite(entry.filledQuantity))) continue;
    // A spread leg's own order id — optional, so a malformed one costs only the join.
    const orderId = boundedString(entry.orderId);
    fills.push({
      occSymbol,
      filledQuantity: entry.filledQuantity,
      ...(finite(entry.filledPrice) ? { filledPrice: entry.filledPrice } : {}),
      ...(orderId ? { orderId } : {}),
    });
  }
  return fills;
}
