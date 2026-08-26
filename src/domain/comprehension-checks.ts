import type { ComprehensionCheck } from "./comprehension.js";
import { OPTION_CHECKS } from "./comprehension-checks-options.js";
import { STOCK_CHECKS } from "./comprehension-checks-stock.js";

/**
 * THE QUESTION BANK — one check per milestone that already exists in `domain/curriculum.ts`.
 * This module only composes; the content lives in the per-course data files beside it, so the
 * curriculum can grow a question, reword one, or gate a new milestone without a line of render
 * code changing.
 *
 * A milestone with NO entry here simply isn't gated: `checkFor` returns undefined and the
 * celebration fires exactly as it always did. That is what keeps this an additional gate on top
 * of the real-fill requirement rather than a curriculum rebuild.
 */
export const COMPREHENSION_CHECKS: readonly ComprehensionCheck[] = [
  ...STOCK_CHECKS,
  ...OPTION_CHECKS,
];

/** The check gating a milestone, or undefined when that milestone isn't gated. */
export function checkFor(milestoneId: string): ComprehensionCheck | undefined {
  return COMPREHENSION_CHECKS.find((c) => c.milestoneId === milestoneId);
}
