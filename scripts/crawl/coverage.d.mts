// Type surface for coverage.mjs's parsers and join — the same arrangement as ledger.d.mts: the
// scripts/ tree is plain ESM with `allowJs` off, so the spec that imports it needs this rather
// than a repo-wide loosening.

export interface RouteScreen {
  path: string;
  /** `routes/<file>` specifiers, no extension — two when `/x` and `/x/` collapse. */
  modules: string[];
}

export interface Section {
  id: string;
  label: string;
}

export interface Screen {
  key: string;
  path: string | null;
  section?: string;
  chapter?: string;
}

export interface TriageRow {
  screen: string;
  verdict: "keep" | "fold" | "retire" | "redirect-only" | "undecided";
  target?: string;
  mustBeSeenBy?: string;
}

export interface JourneyStep {
  id: string;
  goto: string;
  only?: string;
}

export interface JourneyFile {
  member: string;
  fixture?: { kind: string; participant?: string };
  viewports?: string[];
  journeys: { id: string; viewports?: string[]; steps: JourneyStep[] }[];
}

export interface CoverageRow {
  screen: string;
  key: string;
  verdict: string;
  target?: string;
  mustBeSeenBy?: string;
  living: boolean;
  docked: boolean;
  phone: string[];
  desktop: string[];
  status: "covered" | "gap" | "undecided" | "never a gap" | "unjudged" | "stale";
}

export interface CoverageResult {
  rows: CoverageRow[];
  headline: string;
  gaps: CoverageRow[];
  unjudged: CoverageRow[];
  stale: CoverageRow[];
}

export function parseRouteTree(src: string): RouteScreen[];
export function declaresSections(src: string): boolean;
export function parseSections(src: string): Section[];
export function parseChapters(src: string, name: string): string[];
export function sectionsOf(file: string, read: (path: string) => string | undefined): Section[];
export function screenKey(screen: string): string;
export function buildScreens(input: {
  routes: RouteScreen[];
  sections: Map<string, Section[]>;
  chapters: string[];
  serverPages: { screen: string }[];
}): Screen[];
export function matchRoute(pathname: string, routePaths: string[]): string | undefined;
export function landingOf(
  goto: string,
  ctx: {
    linked: boolean;
    routePaths: string[];
    sections: Map<string, Section[]>;
    triage: Map<string, TriageRow>;
  },
): string[];
export function indexTriage(rows: TriageRow[]): Map<string, TriageRow>;
export function coverage(input: {
  screens: Screen[];
  triageRows: TriageRow[];
  journeys: JourneyFile[];
  routePaths: string[];
  sections: Map<string, Section[]>;
}): CoverageResult;
export function renderMarkdown(result: CoverageResult): string;
