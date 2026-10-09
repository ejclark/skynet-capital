// Type surface for inputs.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface EdgarCompany {
  cik: number;
  eightKs: { date: string; items: string }[];
}

export function loadInput(name: string): Record<string, unknown>;
export function edgarAnswer(input: {
  edgar?: Record<string, EdgarCompany>;
}): (url: string) => unknown;
