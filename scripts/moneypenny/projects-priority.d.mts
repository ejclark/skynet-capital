// Type surface for scripts/moneypenny/projects-priority.mjs — the board's priority both ways
// (#6871 slice B1), pure. The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts).
export { SYNCED_PRIORITY } from "./projects.d.mts";

export interface PriorityIssue {
  number?: number;
  state?: string;
  labels?: ({ name?: string } | string)[];
  issue_dependencies_summary?: { blocking?: number } | null;
  pull_request?: unknown;
}

export type PriorityPlan =
  | { action: "none" }
  | { action: "write"; value: string; from: string | null }
  | { action: "record"; value: string }
  | { action: "drag"; lane: string; from: string; add: string[]; remove: string[] }
  | { action: "foreign"; value: string };

export function wantedPriorityOf(issue: PriorityIssue): string;

export function planPriority(input?: {
  current?: string | null;
  synced?: string | null;
  wanted?: string;
  labels?: ({ name?: string } | string)[];
}): PriorityPlan;

export function describePriority(number: number | string, plan?: PriorityPlan): string;

export const PRIORITY_WRITES_PER_SWEEP: number;

export function planPriorityDrift<
  Item extends { priority?: string; syncedPriority?: string },
>(input?: {
  items?: Item[];
  openIssues?: (PriorityIssue & { number: number })[];
  numberOf: (item: Item) => number | null;
  cap?: number;
}): { drift: { number: number; plan: PriorityPlan }[]; deferred: number };
