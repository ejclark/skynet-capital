// Type surface for cohesion-plan.mjs, the cohesion census's pure half — the same arrangement as
// coverage.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so the spec needs this.

export const HOMES: Record<string, string>;
export const OUTSIDE_THE_MODEL: string;
export function checkHomes(iaSrc: string): void;

export function normalizeName(text: string): string;
export function isName(text: string): boolean;

export interface ScannedLink {
  to: string;
  hash: string;
  keys: string[];
  values: Record<string, string>;
  keepsPrev: boolean;
  hasSearch: boolean;
  opaque: boolean;
  text: string | null;
  line: number;
}
export function scanLinks(src: string): ScannedLink[];
export function parseLabelRecord(src: string, name: string): Record<string, string>;
export function parsePlaces(src: string): { path: string; name: string }[];

export interface Name {
  word: string;
  raw: string;
  place: string;
  level: "page" | "screen";
  home?: string;
  source: string;
}
export function labelCollisions(names: Name[]): {
  oneWordManyPlaces: { word: string; homes: string[]; places: string[]; names: Name[] }[];
  onePlaceManyWords: { place: string; level: string; words: string[]; names: Name[] }[];
};

export function sectionOf(src: string, heading: string): string;
export function tableRows(block: string): string[][];
export function parseConcepts(iaSrc: string): { id: string; words: string; screens: string[] }[];
export function conceptHomes(
  concepts: { id: string; words: string; screens: string[] }[],
  homeOf: Map<string, string | undefined>,
): { id: string; words: string; screens: string[]; homes: string[] }[];

export const KEYED_ROUTES: Record<
  string,
  { keys: Record<string, string[]>; sections?: Record<string, string[]> }
>;
export function keyDrops(
  files: { file: string; src: string; links: ScannedLink[] }[],
  opts?: { appLevel?: Set<string> },
): { file: string; line: number; to: string; key: string; text: string | null }[];

export function importsOf(file: string, src: string, exists: (p: string) => boolean): string[];
export function placeParts(
  added: { file: string; scope: string }[],
  graph: Map<string, string[]>,
  iaSrc: string,
): { file: string; scope: string; status: "placed" | "homeless" | "not mounted"; via?: string }[];
export function apiPaths(src: string): string[];

export function ledgerRows(
  iaSrc: string,
): { id: string; root: string; status: string; open: boolean }[];

export const MEASURES: string[];
export function againstBudget(
  counts: Record<string, number>,
  budget: Record<string, number> | null,
): { measure: string; now: number; budget: number | null; rose: boolean }[];
export function lowered(
  counts: Record<string, number>,
  budget: Record<string, number> | null,
): Record<string, number>;
