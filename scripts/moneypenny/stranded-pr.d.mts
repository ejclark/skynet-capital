import type { AuditIntent } from "./audit.mjs";

/** One green, unarmed PR as the audit gathers it. */
export interface StrandedPr {
  number: number;
  title: string;
  hours: number;
  headSha: string;
  /** The head's Pipeline run whose `arm auto-merge` job failed, or null. */
  armRunId: number | null;
  /** The head sha the newest re-arm marker on the PR names, or null. */
  rearmedSha: string | null;
}
export interface RearmIntent extends AuditIntent {
  kind: "rearm-stranded";
  prNumber: number;
  runId: number;
  headSha: string;
  hours: number;
  body: string;
}

export const REARM_MARKER: RegExp;
export function rearmIntents(candidates?: StrandedPr[]): RearmIntent[];
export function lastRearmSha(comments?: { body?: string }[]): string | null;
export function failedArmRun(
  runs?: { id: number; name?: string; event?: string; status?: string; created_at?: string }[],
  jobsOf?: (id: number) => { name: string; conclusion?: string | null }[],
): number | null;
export function gatherStranded(
  nowMs: number,
  opts?: { hours?: number; rest?: (path: string) => unknown },
): StrandedPr[];
export function strandedOrNone(
  nowMs: number,
  opts?: { hours?: number; rest?: (path: string) => unknown },
): StrandedPr[];
export function rearmStranded(
  i: RearmIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
