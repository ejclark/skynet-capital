/** One row of the ticker directory (see `index.ts` for what the directory is and isn't). */
export interface TickerEntry {
  readonly symbol: string;
  readonly name: string;
  readonly sector: string;
}
