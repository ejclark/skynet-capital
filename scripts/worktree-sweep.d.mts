// Type surface for worktree-sweep.mjs — scripts/ is plain ESM with `allowJs` off, so a spec
// importing it needs this (same arrangement as bottleneck-baseline.d.mts).

export interface WorktreeEntry {
  path: string;
  head: string;
  branch: string | null;
  detached: boolean;
  /** The lock reason; "" when locked without one; null when not locked. */
  locked: string | null;
  prunable: boolean;
}
export function parseWorktrees(porcelain: string): WorktreeEntry[];
export function lockPid(reason: string | null | undefined): number | null;

export interface WorktreeFacts {
  primary: boolean;
  current: boolean;
  lock: { pid: number | null; alive: boolean } | null;
  released: boolean;
  dirty: number;
  ageMinutes: number | null;
  inMain: boolean;
  onRemote: boolean;
  patchApplied: boolean;
  mergedPr: boolean;
}
export interface Verdict {
  remove: boolean;
  unlock: boolean;
  reason: string;
  via?: string;
}
export function decide(w: WorktreeFacts, opts?: { minAgeMinutes?: number }): Verdict;
