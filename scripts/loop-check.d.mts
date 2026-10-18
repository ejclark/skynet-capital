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
export function loopCheck(opts?: { post?: boolean; today?: string }): number;
