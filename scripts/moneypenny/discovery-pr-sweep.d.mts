import type { AuditIntent } from "./audit.mjs";

/** One lane `discovery/<slug>` PR untouched past the window, as the audit gathers it. */
export interface DiscoveryPr {
  number: number;
  title: string;
  slug: string;
  branch: string;
  /** Whole hours since anything last moved on the PR. */
  hours: number;
  headSha: string;
  /** The newest failed check that holds it, or null. */
  red: { name: string; url?: string } | null;
  /** GitHub calls it conflicting with `main` (read only when it is not red). */
  conflicting: boolean;
  /** Earlier PRs on the same branch that closed unmerged (read only when it is stale). */
  priorCloses: number;
  /** The head sha the newest flag on the PR names, or null. */
  flaggedSha: string | null;
}
export interface CloseStaleDiscoveryIntent extends AuditIntent {
  kind: "close-stale-discovery";
  prNumber: number;
  branch: string;
  slug: string;
  body: string;
}
export interface FlagStaleDiscoveryIntent extends AuditIntent {
  kind: "flag-stale-discovery";
  prNumber: number;
  headSha: string;
  body: string;
}
type RestOpts = { hours?: number; rest?: (path: string) => unknown };
type RunOpts = { run?: (cmd: string, args: string[]) => string };

export const DISCOVERY_PR_HOURS: number;
export const DISCOVERY_RETAKE_CAP: number;
export const DISCOVERY_FLAG_MARKER: RegExp;
export function lastFlagSha(comments?: { body?: string }[]): string | null;
export function discoverySweepIntents(
  candidates?: DiscoveryPr[],
): (CloseStaleDiscoveryIntent | FlagStaleDiscoveryIntent)[];
export function discoverySweep(
  candidates: DiscoveryPr[] | null | undefined,
  halted?: boolean,
): (CloseStaleDiscoveryIntent | FlagStaleDiscoveryIntent)[];
export function gatherDiscoveryPrs(nowMs: number, opts?: RestOpts): DiscoveryPr[];
export function discoveryPrsOrNone(
  nowMs: number,
  opts?: RestOpts & { log?: (line: string) => void },
): DiscoveryPr[] | null;
export function closeStaleDiscovery(i: CloseStaleDiscoveryIntent, opts?: RunOpts): string;
export function flagStaleDiscovery(i: FlagStaleDiscoveryIntent, opts?: RunOpts): string;
