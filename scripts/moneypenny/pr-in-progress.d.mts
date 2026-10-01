// Type surface for scripts/moneypenny/pr-in-progress.mjs — the one writer of `in-progress` for
// PR-backed work (#4393 slice 1). The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts).
export type PrIntent = "apply" | "release";

export function intentOf(event: string): PrIntent | null;

export interface PrIssueFacts {
  number: number;
  isOpenIssue?: boolean;
  hasLabel?: boolean;
  namedByOtherOpenPr?: boolean;
  leased?: boolean;
}

export interface PrInProgressRow {
  number: number;
  action: "add" | "remove" | "none";
  reason: string;
  written?: boolean;
}

export function planPrInProgress(input?: {
  event?: string;
  facts?: PrIssueFacts[];
}): PrInProgressRow[];

export interface RestPr {
  number?: number;
  title?: string | null;
  body?: string | null;
  head?: { ref?: string };
}

export interface RestIssue {
  state?: string;
  pull_request?: unknown;
  labels?: { name?: string }[];
}

export function syncPrInProgress(
  prNumber: number | string,
  event: string,
  deps?: {
    readPr?: (n: number | string) => RestPr;
    readIssueFn?: (n: number) => RestIssue;
    listOpenPrs?: () => RestPr[];
    isLeased?: (n: number) => boolean;
    setLabel?: (n: number, add: boolean) => boolean;
  },
): { pr: number; event: string; named: number[]; plan: PrInProgressRow[] };
