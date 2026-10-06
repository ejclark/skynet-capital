// Type surface for budget-lib.mjs (scripts/ is plain ESM with `allowJs` off; see issues.d.mts).
export interface BudgetRow {
  path: string;
  status: number | string;
  ms: number;
  kb?: number;
  addMb?: number;
  peakMb?: number;
}
export interface BudgetPhase {
  name: string;
  note: string;
  rows: BudgetRow[];
  wallMs?: number;
  beforeMb?: number;
  peakMb?: number;
}
export interface Budgets {
  peakMb: number;
  pageMb: number;
  pulseMb: number;
  pulseMs: number;
}
export function flyEnv(toml: string): Record<string, string>;
export function flyCommand(toml: string): string;
export function accountsOpen(ownerId: string): string[];
export function accountsBurst(ownerId: string, participantIds: readonly string[]): string[];
export function commonGets(botId: string): string[];
export function procMemory(status: string): { rss: number; hwm: number; anon: number };
export function verdict(input: {
  phases: readonly BudgetPhase[];
  state: { running: boolean; oomKilled: boolean; exitCode: number };
  budgets: Budgets;
  bootPeakMb?: number;
}): { ok: boolean; peakMb: number; failures: string[] };
export function phaseTable(phase: BudgetPhase): string;
export function summary(report: {
  commit: string;
  days: number;
  participants: number;
  memory: string;
  seedMs: number;
  budgets: Budgets;
  seeded: {
    historyRows: number;
    historyRowsPerParticipant: number;
    activityRows: number;
    decisionCycles: number;
  };
  boot: { peakMb: number; settledMb: number; anonMb: number };
  phases: readonly BudgetPhase[];
  state: { running: boolean; oomKilled: boolean; exitCode: number };
  cgroupPeakMb?: number;
  verdict: { ok: boolean; peakMb: number; failures: string[] };
}): string;
