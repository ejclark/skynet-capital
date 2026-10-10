// Type surface for scripts/steer/reel.mjs (see scripts/moneypenny/index.d.mts).
export interface MergeRow {
  number: number;
  sha?: string;
  author?: string;
  mergedAt: string;
  subject: string;
  [k: string]: unknown;
}

export const HEADLINES: number;
export const STRIP_DAYS: number;
export function isResearch(row: Pick<MergeRow, "subject">): boolean;
export function isAppBuild(row: Pick<MergeRow, "subject" | "author">): boolean;
export function issueRefs(subject?: string): number[];
export function reelFrom(
  rows: MergeRow[],
  opts?: {
    since?: string;
    because?: Record<number, string>;
    shots?: Record<number, { path: string; url: string; sha?: string }[]>;
    max?: number;
  },
): {
  since: string;
  merged: number;
  research: number;
  builds: number;
  headlines: {
    number: number;
    subject: string;
    kind: string;
    shots: { path: string; url: string }[];
    because: string | null;
  }[];
  more: { total: number; byKind: Record<string, number> };
};
export function historyFrom(records?: Record<string, unknown>): {
  metas: { id: string; openedAt: string | null; doneAt: string | null; minutes: number }[];
  waits: number[];
  lastDoneAt: string | null;
};
export function stripFrom(
  rows: MergeRow[],
  opts: {
    now: string;
    needsYou?: number;
    unstated?: number;
    history?: { metas: { id: string; minutes: number }[]; waits: number[] };
  },
): {
  days: { date: string; day: number; night: number; late: number }[];
  perDay: number;
  perNight: number;
  needsYou: number;
  unstated: number;
  medianWaitDays: number | null;
  pages: { id: string; minutes: number }[];
};
