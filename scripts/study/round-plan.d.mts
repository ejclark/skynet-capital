// Type surface for round-plan.mjs — same arrangement as metrics.d.mts (`allowJs` is off).

export const STEPS: string[];
export const BLIND_ROLES: string[];

export interface MatrixRow {
  member: string;
  world: string;
  viewer: string;
  viewports: ("phone" | "desktop")[];
  start: string;
  note?: string;
}

export interface CensusRow {
  world: string;
  viewer: string;
  routes?: string[];
  viewports?: ("phone" | "desktop")[];
  for: string[];
}

export interface AreaConfig {
  cutoff: string;
  tasksPer: number;
  runs: number;
  runsByWorld?: Record<string, number>;
  censusCap: number;
  concurrency: number;
  experts: number;
  matrix: MatrixRow[];
  pages: string[];
  census?: CensusRow[];
  thin: { member: string; world: string; viewport: string; task: number; expertRoute: string };
}

export interface RoundArgs {
  pin: string;
  out: string;
  sealed: string;
  profile: string;
  thin: boolean;
  dryRun: boolean;
  stub?: string;
  concurrency?: number;
  onlyWorld?: string;
  cap?: number;
  runs?: number;
  experts?: number;
  /** A control round: the main round whose frozen tasks it runs, its kind, the --expect file. */
  frozenFrom?: string;
  control?: "negative" | "positive";
  expect?: string;
  /** Set by round-control.mjs once the main round is read. */
  sourceFrozen?: string;
  expectIds?: string[];
}

export const CONTROL_KINDS: ("negative" | "positive")[];
export function isControl(opts: Partial<RoundArgs> | null | undefined): boolean;
export function runsOverride(opts: Partial<RoundArgs>): number | undefined;
export function expertCount(p: AreaConfig, opts: Partial<RoundArgs>): number;
export function reviewSkip(opts: Partial<RoundArgs>): "thin" | "control" | null;

export function roundArgs(
  argv: string[],
  defaults: { defaultStub: string; defaultProfile: string },
): RoundArgs;
export interface RoundMode {
  profile: string;
  profileSha: string;
  pin: string;
  sealed: string;
  thin: boolean;
  stub: string | null;
  onlyWorld: string | null;
  cap: number | null;
  runs: number | null;
  experts: number | null;
  control: {
    kind: "negative" | "positive";
    from: string;
    frozen: string | null;
    expect: string[] | null;
  } | null;
}
export function roundMode(
  opts: Partial<RoundArgs> & { profile: string; pin: string; sealed: string },
  profileSha: string,
): RoundMode;
export function modeChanges(
  recorded: Partial<RoundMode> | null | undefined,
  now: RoundMode,
): string[];
export function profileProblems(p: unknown): string[];
export function selectMatrix(
  p: AreaConfig,
  opts?: { thin?: boolean; onlyWorld?: string },
): MatrixRow[];
export function runsFor(p: AreaConfig, world: string): number;

export interface Unit {
  member: string;
  world: string;
  viewer: string;
  start: string;
  key: string;
}
export function taskUnits(matrix: MatrixRow[]): Unit[];

export interface PlannedSession {
  member: string;
  world: string;
  viewer: string;
  viewport: string;
  task: string;
  run: number;
  dir: string;
}
export function planSessions(args: {
  p: AreaConfig;
  matrix: MatrixRow[];
  tasksByUnit: Record<string, string[]>;
  thin?: boolean;
  runs?: number;
}): PlannedSession[];

export interface PlannedCensus {
  key: string;
  world: string;
  viewer: string;
  routes: string[];
  viewports: string[];
  for: string[];
}
export function censusPlan(
  p: AreaConfig,
  opts?: { thin?: boolean; onlyWorld?: string },
): PlannedCensus[];

export function lintFeedback(stdout: string | null | undefined): string[];
export function primingCounts(stdout: string | null | undefined): Record<string, number>;
export function canaryQuestion(markdown: string): string;
export function canaryVerdict(answer: unknown): { ok: boolean; why: string };

export interface Fact {
  viewer: string;
  id: string;
  label?: string;
  display?: string;
  answer: Record<string, unknown>;
  answerRegion: string[];
  world?: string;
  weak?: boolean;
}
export function resolveTasks(args: {
  drafts: { scenario: string; answer: string; answerRegion: string; outcome: string }[];
  facts: Fact[];
  unit: Unit;
  file: string;
}): { tasks: Record<string, unknown>[]; problems: string[] };
export function mergeFacts(sheets: { world: string; facts: Fact[]; dataNames?: string[] }[]): {
  worlds: string[];
  facts: Fact[];
  dataNames: string[];
};

/** After the last rewrite: keep tasks the lint no longer names; drop the rest (kinds only). */
export function keepClean<T extends { id: string }>(
  tasks: T[],
  feedback: string[],
): { kept: T[]; dropped: { item: number; kinds: string[] }[] };
