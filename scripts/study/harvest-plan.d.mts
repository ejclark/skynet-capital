// Type surface for harvest-plan.mjs (`allowJs` is off; same arrangement as lint.d.mts).

export const LONG_AT: number;
export const KINDS: readonly ["heading", "buttonOrLink", "label", "shortStatus", "longText"];
export type StringKind = (typeof KINDS)[number];

export interface TextUnit {
  kind: string;
  text: string;
}
export interface Walk {
  route: string;
  viewport: string;
  viewer?: string;
  controls: { name: string }[];
  offscreen?: { name: string }[];
  headings: string[];
  text: TextUnit[];
  revealed?: { via?: string; names: string[]; text: TextUnit[] }[];
}

export function labelLines(walks: Walk[]): string[];
export function stringKind(unit: TextUnit): StringKind;
export function groupStrings(walks: Walk[]): {
  counts: Record<StringKind, number>;
  routes: Record<string, Record<StringKind, { text: string; viewports: string[] }[]>>;
};
export function regionCoverage(
  facts: { id: string; viewer: string; answerRegion: string[] }[],
  walks: (Walk & { viewer: string })[],
): { judged: number; covered: number; missing: string[] };
