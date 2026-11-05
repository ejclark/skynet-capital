// Type surface for loop-list-decide.mjs — same arrangement as doctrine-decide.d.mts (scripts/ is
// plain ESM with `allowJs` off, so a spec importing it needs this).

export const LOOP_LIST_HEADING: string;

export interface LoopRow {
  loop: string;
  issue: string;
  state: string;
  nextCheck: string | null;
  /** The row's question cell — loop-check.mjs reads the `npm run <x>` it names. */
  question?: string;
  /** The whole Next check cell: the date and the falsifier it is judged against. */
  nextCheckText?: string;
  /** What a person decides for this loop, or "—" — the newsletter's asks (#6872). */
  humanStep?: string;
  /** How often that step falls due: Weekly · Every two weeks · Monthly. */
  cadence?: string;
}

export function parseLoopList(md: string): LoopRow[] | null;

export function overdueLoops(state: {
  today: string;
  rows: LoopRow[] | null;
}): Array<LoopRow & { due: true; reason: "loop-check-overdue"; nextDueDate: string }>;

/** Running rows whose Next check cell carries a date it does not lead with — never scheduled. */
export function buriedDates(rows: LoopRow[] | null): Array<{ loop: string; date: string }>;
