// Type surface for scripts/moneypenny/decision-callout.mjs (see index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`).
export const ERIC: string;
export const NEEDS_ERIC: string;
export const CALLOUT_GAP_MARKER: string;

export interface CalloutIssue {
  labels?: string[];
  body?: string | null;
  author?: string;
}

export function missingDecisionCallout(issue?: CalloutIssue): boolean;

export function shouldPostCalloutGap(
  issue?: CalloutIssue & { comments?: (string | null)[] },
): boolean;

export function calloutGapComment(opts?: { actor?: string }): string;
