/** Types for `forward-test-pending.mjs` — the pure-text forward-test row reader (#2988, #2884). */

export interface UnscoredRow {
  /** The row's forward-test id, e.g. `FT-crwv-2026-11-10-print-2`. */
  readonly id: string;
  /** `YYYY-MM-DD`: the row's score-by date. */
  readonly scoreBy: string;
}

export function unscoredForwardTests(eventId: string, dir: string): UnscoredRow[];
export function pendingForwardTests(eventId: string, today: string, dir: string): UnscoredRow[];
export function dueForwardTests(eventId: string, today: string, dir: string): UnscoredRow[];
