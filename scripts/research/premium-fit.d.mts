// Types for the one export a spec or script consumes (declared per file, not a repo-wide loosening).
// The finding is deliberately `unknown`: its readers (src/playbooks/claim-verdicts.ts) check the
// fields they use, so a change to the finding's shape leaves a claim unstudied rather than wrong.
export function premiumFit(
  symbol: string,
  options?: { refresh?: boolean; today?: string },
): Promise<unknown>;
