import type { AuditIntent } from "./audit.mjs";

/** One open PR whose head never got a required check run, as the audit gathers it (#7112). */
export interface HeadlessPr {
  number: number;
  title: string;
  hours: number;
  /** judgePr's own sentence for why it is headless; the marker comment quotes it. */
  why: string;
  headSha: string;
  /** The branch, which the empty commit moves when update-branch has nothing to merge. */
  headRef: string;
  /** The heads already acted on, from the marker on the PR's comments. */
  triedShas: string[];
}
export interface NudgeHeadlessIntent extends AuditIntent {
  kind: "nudge-headless";
  prNumber: number;
  headSha: string;
  headRef: string;
  hours: number;
  body: string;
}

export const NUDGE_CAP: number;
export const NUDGE_MARKER: RegExp;
export function nudgeIntents(candidates?: HeadlessPr[]): NudgeHeadlessIntent[];
export function triedHeads(comments?: { body?: string }[]): string[];
export function gatherHeadless(
  nowMs: number,
  opts?: { rest?: (path: string) => unknown },
): HeadlessPr[];
export function headlessOrNone(
  nowMs: number,
  opts?: { rest?: (path: string) => unknown; log?: (line: string) => void },
): HeadlessPr[];
export function nudgeHeadless(
  i: NudgeHeadlessIntent,
  opts?: { run?: (cmd: string, args: string[]) => string; log?: (line: string) => void },
): string;
