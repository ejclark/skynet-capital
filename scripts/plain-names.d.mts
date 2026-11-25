// Type surface for plain-names.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the spec
// that imports from it needs this (same arrangement as arm-merge.d.mts).

export interface PlainName {
  term: string;
  plain: string;
  match?: string[];
  date: string;
  said: string;
  source: string;
}

export interface PlainNameHit {
  term: string;
  plain: string;
  date: string;
  found: string;
  index: number;
}

export const PLAIN_NAMES: PlainName[];
export function proseOnly(text: string): string;
export function plainNameHits(text: string): PlainNameHit[];
export function plainNameMessage(hit: PlainNameHit, where?: string): string;
export function plainNameProblems(text: string, where?: string): string[];
