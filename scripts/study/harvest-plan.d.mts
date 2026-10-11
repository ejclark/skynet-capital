// Type surface for harvest-plan.mjs (`allowJs` is off; same arrangement as lint.d.mts).

export const LONG_AT: number;
export const KINDS: readonly ["heading", "buttonOrLink", "label", "shortStatus", "longText"];
export type StringKind = (typeof KINDS)[number];

export interface TextUnit {
  kind: string;
  text: string;
  groups?: number[];
}
export interface Walk {
  route: string;
  viewport: string;
  viewer?: string;
  controls: { name: string }[];
  clipped?: { name: string }[];
  offscreen?: { name: string }[];
  headings: string[];
  treeHeadings?: string[];
  text: TextUnit[];
  revealed?: { via?: string; names: string[]; treeNames?: string[]; text: TextUnit[] }[];
}
export interface LabelSheet {
  banned: string[];
  unseen: string[];
  setAside: { text: string; why: "no words" | "data" | "facts sheet" | "short" }[];
}
export interface LabelOpts {
  dataNames?: string[];
  vocabulary?: string[];
}

export function factWords(facts: { label: string }[]): string[];
export function setAsideWhy(
  text: string,
  opts?: LabelOpts,
): LabelSheet["setAside"][number]["why"] | null;
export function labelSheet(walks: Walk[], opts?: LabelOpts): LabelSheet;
export function labelsText(sheet: LabelSheet): string;
export function stringKind(unit: TextUnit): StringKind;
export function groupStrings(walks: Walk[]): {
  counts: Record<StringKind, number>;
  routes: Record<string, Record<StringKind, { text: string; viewports: string[] }[]>>;
};
export function regionCoverage(
  facts: { id: string; viewer: string; world?: string; answerRegion: string[] }[],
  walks: (Walk & { viewer: string; world?: string })[],
): { judged: number; covered: number; missing: string[]; seen: string[] };
export function factKey(fact: { id: string; viewer: string; world?: string }): string;
