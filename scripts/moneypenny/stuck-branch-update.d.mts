import type { AuditIntent } from "./audit.mjs";

/** One green, armed PR held `blocked` with a cancelled suite on its head, as the audit gathers it. */
export interface StuckBranch {
  number: number;
  title: string;
  hours: number;
  headSha: string;
  /** The branch, which the empty commit on a dependabot PR moves. */
  headRef: string;
  /** Dependabot's own PR takes an empty commit it may rebase over, not a merge commit. */
  dependabot: boolean;
  /** The heads already tried, from the marker on the PR's comments. */
  triedShas: string[];
}
export interface UpdateStuckIntent extends AuditIntent {
  kind: "update-stuck-branch";
  prNumber: number;
  headSha: string;
  headRef: string;
  hours: number;
  dependabot: boolean;
  body: string;
}
export interface GatherOpts {
  hours?: number;
  rest?: (path: string) => unknown;
  /** True once an hour across runners (`claimHandoff`); the pass stops at the list when false. */
  takeHourlyLease?: (nowMs: number) => boolean;
}

export const UPDATE_CAP: number;
export function updateIntents(candidates?: StuckBranch[]): UpdateStuckIntent[];
export function gatherStuckBranches(nowMs: number, opts?: GatherOpts): StuckBranch[];
export function stuckBranchesOrNone(
  nowMs: number,
  opts?: GatherOpts & { log?: (line: string) => void },
): StuckBranch[];
/** A same-tree commit on top of the head, the branch moved onto it without force. */
export function emptyCommitOnHead(
  i: { headSha: string; headRef: string },
  run: (cmd: string, args: string[]) => string,
  message?: string,
): void;
export function updateStuckBranch(
  i: UpdateStuckIntent,
  opts?: { run?: (cmd: string, args: string[]) => string; log?: (line: string) => void },
): string;
