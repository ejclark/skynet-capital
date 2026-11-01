// Type surface for scripts/moneypenny/decision-callout.mjs (see index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
export const ERIC: string;
export const NEEDS_ERIC: string;
export const CALLOUT_GAP_MARKER: string;

export interface CalloutIssue {
  labels?: string[];
  body?: string | null;
}

export function missingDecisionCallout(issue?: CalloutIssue): boolean;

export function shouldPostCalloutGap(
  issue?: CalloutIssue & { comments?: (string | null)[] },
): boolean;

export function withLaneAsk(body: string | null | undefined, ask: string, url?: string): string;
export function withoutLaneAsk(body: string | null | undefined): string;
export function askFromComments(
  comments?: readonly unknown[],
  opts?: { actor?: string; now?: number },
): { line: string; url?: string } | null;
export function writeIssueBody(
  number: number | string,
  body: string,
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    retry?: <T>(fn: () => T) => T;
  },
): void;
export function calloutGapComment(opts?: { actor?: string }): string;
