// Type surface for inputs.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface EdgarCompany {
  cik: number;
  eightKs: { date: string; items: string }[];
}

export function loadInput(name: string): Record<string, unknown>;
export function shiftDay(date: string, days: number): string;
export function shiftCalendar<T>(value: T, days: number): T;
export function edgarAnswer(input: {
  edgar?: Record<string, EdgarCompany>;
}): (url: string) => unknown;
export function vixAnswer(input: {
  vix?: { session: string; close: number };
}): (url: string) => { raw: string; contentType: string } | undefined;
export function worldNetwork(input: Record<string, unknown>): (url: string) => unknown;
