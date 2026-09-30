// Type surface for loop-list-decide.mjs — same arrangement as doctrine-decide.d.mts (scripts/ is
// plain ESM with `allowJs` off, so a spec importing it needs this).

export const LOOP_LIST_HEADING: string;

export interface LoopRow {
  loop: string;
  issue: string;
  state: string;
  nextCheck: string | null;
}

export function parseLoopList(md: string): LoopRow[] | null;

export function overdueLoops(state: {
  today: string;
  rows: LoopRow[] | null;
}): Array<LoopRow & { due: true; reason: "loop-check-overdue"; nextDueDate: string }>;
