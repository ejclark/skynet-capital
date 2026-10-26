// Type surface for loop-check.mjs (scripts/ is plain ESM with `allowJs` off).
import type { LoopRow } from "./loop-list-decide.mjs";

export interface DueCheck extends LoopRow {
  due: true;
  reason: "loop-check-overdue";
  nextDueDate: string;
  command: string | null;
  marker: string;
}

export function markerOf(loop: string, date: string): string;
export function commandOf(question: unknown): string | null;
export function trackerOf(md: unknown): number | null;
export function dueChecks(state: {
  today: string;
  rows: LoopRow[] | null;
  posted?: readonly string[];
}): DueCheck[];
export function checkBody(check: DueCheck, result: { ok: boolean; output: string } | null): string;
export function loopCheck(opts?: { post?: boolean; today?: string; registry?: string }): number;

export const UNMOVED_DAYS: number;
export const UNMOVED_MARKER: string;
export interface UnmovedCheck extends DueCheck {
  postedOn: string;
  waited: number;
  url: string | null;
}
export type UnmovedRow = Omit<UnmovedCheck, "command" | "marker">;
export function unmovedChecks(state: {
  today: string;
  rows: LoopRow[] | null;
  comments?: ReadonlyArray<{ body: string; createdAt: string; url?: string }>;
  days?: number;
}): UnmovedRow[];
export function unmovedIssue(state: { checks: readonly UnmovedRow[]; tracker: number | null }): {
  title: string;
  labels: string[];
  body: string;
};
