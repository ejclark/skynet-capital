// Type surface for release.mjs: scripts/ is plain ESM.
import type { Status } from "./post.mjs";
import type { ReviewApi } from "./rest.mjs";

export interface Hold {
  pr: number;
  sha: string;
  state: string;
  updatedAt: string;
}
export interface Lift {
  pr: number;
  sha: string;
  ageMin: number;
  reason: string;
  status: Omit<Status, "state"> & { state: "success" };
}

export const HOLD_MS: number;
export const RESPOND_RUN: RegExp;
export function releasable(input?: {
  holds?: Hold[];
  running?: number[];
  now?: number;
  holdMs?: number;
}): Lift[];
export function runningResponses(
  runs?: { display_title?: string; name?: string; status?: string }[],
): number[];
export function gatherHolds(opts?: { api?: ReviewApi }): { holds: Hold[]; running: number[] };
export function applyRelease(lifts: Lift[], opts?: { api?: ReviewApi }): number;
