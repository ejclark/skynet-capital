import { isRecord } from "../storage/parse-guards.js";

/**
 * A MEMBER'S TARGET SPLIT (#4607 slice 1) — where they want their money to sit, in the same three
 * buckets `desk-allocation.ts` measures (shares, options, cash; whole percents that add to 100),
 * plus one tolerance for the whole book: how many percentage points a slice may drift before the
 * money row calls it over or under (slice 2).
 *
 * The member's own input, never a default: nothing here picks a split for them (the same rule
 * `GuidanceStake.goal` holds — "unset until the member picks one"). It is book data, not a display
 * preference, so it lives on the server per member (`target-split-store.ts`) and follows them to
 * every device, unlike `app/src/shell/prefs.ts`, which is deliberately one browser's.
 *
 * Field names mirror `DeskAllocation`'s `sharesPct` / `optionsPct` / `cashPct`, so the comparison in
 * slice 2 reads slice against slice with no translation.
 */
export interface TargetSplitInput {
  readonly sharesPct: number;
  readonly optionsPct: number;
  readonly cashPct: number;
  /** Percentage points either side of each target before a slice reads as over or under. */
  readonly tolerancePct: number;
}

export interface TargetSplit extends TargetSplitInput {
  readonly updatedAt: string;
}

/** What the form starts at when no target exists yet — a suggestion the member edits, never saved
 *  until they press Save. */
export const DEFAULT_TOLERANCE_PCT = 5;
/** Past a quarter of the book either side, "over" and "under" stop meaning anything. */
export const MAX_TOLERANCE_PCT = 25;

const wholePct = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/**
 * Judge a submitted split. Returns the clean input, or the sentence the member sees: the server's
 * refusal is rendered verbatim, so every branch names what to change.
 */
export function judgeTargetSplit(raw: unknown): TargetSplitInput | string {
  if (!isRecord(raw)) return "Send the split as shares, options and cash percentages.";
  const { sharesPct, optionsPct, cashPct, tolerancePct } = raw;
  if (!(wholePct(sharesPct, 0, 100) && wholePct(optionsPct, 0, 100) && wholePct(cashPct, 0, 100))) {
    return "Each slice is a whole percent from 0 to 100.";
  }
  const sum = sharesPct + optionsPct + cashPct;
  if (sum !== 100) {
    return `The three slices add to ${sum}% — they need to add to 100%.`;
  }
  if (!wholePct(tolerancePct, 1, MAX_TOLERANCE_PCT)) {
    return `The tolerance is a whole number of points from 1 to ${MAX_TOLERANCE_PCT}.`;
  }
  return { sharesPct, optionsPct, cashPct, tolerancePct };
}

/** A stored record, or undefined when any field fails the same rules a save does. */
export function parseTargetSplit(raw: unknown): TargetSplit | undefined {
  if (!isRecord(raw)) return undefined;
  const judged = judgeTargetSplit(raw);
  if (typeof judged === "string") return undefined;
  const { updatedAt } = raw;
  if (typeof updatedAt !== "string" || updatedAt.length === 0 || updatedAt.length > 40) {
    return undefined;
  }
  return { ...judged, updatedAt };
}
