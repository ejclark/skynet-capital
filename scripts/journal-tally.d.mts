// Type surface for journal-tally.mjs — same arrangement as code-lines.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

/** One New York day of a bot placing paper orders. */
export interface TallyDay {
  day: string;
  proposed: number;
  placed: number;
  explained: number;
}

export interface Tally {
  tally: 1;
  bots: { id: string; sessions: TallyDay[] }[];
}

/** How many sessions placing paper orders a bot is judged over. */
export const TALLY_SESSIONS: number;

/** One journal line's contribution, or null when it is not a record of a bot placing paper orders. */
export function tallyLine(text: string): TallyDay | null;

/** A bot's files, newest first: the active file, then its archives by stamp, a plain twin dropped. */
export function journalsOf(names: readonly string[], id: string): string[];

/** Every bot's last five live days, newest first. Bots with no live day are left out. */
export function tallyJournals(dir: string): Promise<Tally>;
