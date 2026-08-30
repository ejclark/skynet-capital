/**
 * THE COMPANION'S MODEL DIAL — split out of `companion-limits.ts` (#928), mirroring
 * `feedback-coach-model.ts`'s seam exactly. Same model the coach already pays for, so this
 * introduces no new per-token price point — see `companion-limits.ts`'s header for why.
 */

/** Same model the coach already pays for — see `companion-limits.ts`'s header for why this isn't
 *  a new dial. */
export const COMPANION_MODEL = "claude-haiku-4-5";
