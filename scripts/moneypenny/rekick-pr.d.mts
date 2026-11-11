/** The body edit that starts CI on a lane PR the job token opened (#5936). */
export interface RekickIntent {
  prNumber: number;
  title?: string;
  headSha: string;
  body: string;
}

export const REKICK_MARKER: RegExp;
export function laneBranch(slug: string): string | null;
export function rekickIntent(input: {
  pr: {
    number: number;
    title?: string;
    body?: string | null;
    draft?: boolean;
    mergeable_state?: string;
    head?: { sha?: string; ref?: string };
  } | null;
  checkRuns?: {
    name: string;
    status?: string;
    conclusion?: string | null;
    completed_at?: string | null;
    started_at?: string | null;
  }[];
  suites?: {
    app?: { slug?: string };
    status?: string;
    conclusion?: string | null;
    latest_check_runs_count?: number;
  }[];
  runUrl?: string;
}): RekickIntent | null;
export function rekickPr(
  slug: string,
  opts?: {
    rest?: (path: string) => unknown;
    run?: (cmd: string, args: string[]) => string;
    log?: (line: string) => void;
    runUrl?: string;
  },
): string;
