import type { AuditIntent } from "./audit.mjs";

/** One lane PR red past the age limit, as the audit gathers it. */
export interface RedLanePr {
  number: number;
  title: string;
  /** The issue its lane branch is named for. */
  issue: number;
  branch: string;
  hours: number;
  /** The required check that failed, and a link to it. */
  failed: string;
  failedUrl: string;
  /** How many earlier red PRs were closed on this issue, from the marker on its comments. */
  priorCloses: number;
}
export interface RedLaneIntent extends AuditIntent {
  kind: "close-red-lane-pr";
  prNumber: number;
  issueNumber: number;
  branch: string;
  handToSession: boolean;
  prBody: string;
  issueBody: string;
}

export const RED_PR_HOURS: number;
export const RED_CLOSE_CAP: number;
export function redLaneIntents(candidates?: RedLanePr[]): RedLaneIntent[];
export function gatherRedLanePrs(
  nowMs: number,
  opts?: { hours?: number; rest?: (path: string) => unknown },
): RedLanePr[];
export function redLaneOrNone(
  nowMs: number,
  opts?: { hours?: number; rest?: (path: string) => unknown; log?: (line: string) => void },
): RedLanePr[];
export function closeRedLanePr(
  i: RedLaneIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
