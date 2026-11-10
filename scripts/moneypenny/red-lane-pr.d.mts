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
  /** The issue's newest state block, to correct: a feedback issue or an older plan has none. */
  block?: { id: number; body: string } | null;
}
export interface RedLaneIntent extends AuditIntent {
  kind: "close-red-lane-pr";
  prNumber: number;
  issueNumber: number;
  branch: string;
  handToSession: boolean;
  /** The block's corrected text, and the issue comment's line for whether that edit landed. */
  blockEdit: { commentId: number; body: string; said: string; saidIfFailed: string } | null;
  prBody: string;
  issueBody: string;
}

/** The head's newest failed check of those that hold it, and its age in hours, or null. Pure. */
export function redCheck(
  checkRuns: { name: string; status?: string; conclusion?: string | null; html_url?: string }[],
  nowMs: number,
): { run: { name: string; html_url?: string }; hours: number } | null;
export const RED_PR_HOURS: number;
export const RED_CLOSE_CAP: number;
/** The block with its next-pickup line naming the closed PR's work first. Pure. */
export function blockAfterClose(body: string, prNumber: number): string;
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
  opts?: { run?: (cmd: string, args: string[]) => string; log?: (line: string) => void },
): string;
