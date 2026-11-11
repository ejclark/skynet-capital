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

/** The three slices, in the order the money row names them. */
export const SPLIT_SLICES = [
  { key: "sharesPct", label: "Shares", kind: "shares" },
  { key: "optionsPct", label: "Options", kind: "options" },
  { key: "cashPct", label: "Cash", kind: "cash" },
] as const;

export type SplitSliceKey = (typeof SPLIT_SLICES)[number]["key"];

/** Where the book sits now: `DeskAllocation`'s three percents (of long shares + long options +
 *  cash) and the dollar total they are percents of. */
export interface ActualSplit {
  readonly sharesPct: number;
  readonly optionsPct: number;
  readonly cashPct: number;
  readonly total: number;
}

/** One slice measured against its target (#4607 slice 2). */
export interface SliceGap {
  readonly key: SplitSliceKey;
  readonly label: string;
  readonly kind: string;
  readonly actualPct: number;
  readonly targetPct: number;
  /** Actual minus target, in percentage points: positive is over. */
  readonly gapPct: number;
  /** The same gap in whole dollars of the total: positive is what to trim, negative what to add. */
  readonly gapDollars: number;
  /** Outside the member's tolerance either side, or within it. */
  readonly status: "over" | "under" | "within";
}

export interface SplitComparison {
  readonly slices: readonly SliceGap[];
  /** True when any slice sits outside the tolerance: only then does the row name moves. */
  readonly outside: boolean;
}

/**
 * Measure the book against the member's target. Pure arithmetic on the member's own numbers: the
 * gap in points is actual − target, and in dollars that share of the same total the percents are
 * of, so trimming every over slice by its dollars and adding them to the under slices lands the
 * book on the target. A slice is over or under only past the tolerance; inside it, it is within.
 *
 * Returns undefined for a book with nothing in it (total ≤ 0 or not a number): there is no split
 * to compare, and a gap computed from it would be a fiction.
 */
export function compareSplit(
  actual: ActualSplit,
  target: TargetSplitInput,
): SplitComparison | undefined {
  if (!(Number.isFinite(actual.total) && actual.total > 0)) return undefined;
  const slices = SPLIT_SLICES.map(({ key, label, kind }): SliceGap => {
    const gapPct = actual[key] - target[key];
    const status =
      gapPct > target.tolerancePct ? "over" : gapPct < -target.tolerancePct ? "under" : "within";
    return {
      key,
      label,
      kind,
      actualPct: actual[key],
      targetPct: target[key],
      gapPct,
      gapDollars: Math.round((gapPct / 100) * actual.total),
      status,
    };
  });
  return { slices, outside: slices.some((s) => s.status !== "within") };
}
