// Type surface for day-change.mjs (`allowJs` is off; same arrangement as ../lint.d.mts).

export interface DayChangeBook {
  participants: {
    id: string;
    equity: number;
    /** A broker read that failed (production's degraded row): no header to hold to its rows. */
    error?: string;
    positions: { quantity: number; marketValue: number; lastdayPrice: number }[];
  }[];
  lastEquity?: Record<string, number>;
  closedToday?: Record<string, number>;
}

export interface DayChangeRow {
  id: string;
  header: number;
  rows: number;
  declared: number;
  gap: number;
}

export const DAY_CHANGE_SLACK: number;
export function dayChangeRows(book: DayChangeBook): DayChangeRow[];
export function dayChangeGaps(book: DayChangeBook): DayChangeRow[];
export function describeGap(row: DayChangeRow): string;
