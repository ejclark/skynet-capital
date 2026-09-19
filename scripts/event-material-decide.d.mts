// Type surface for the part of event-material-decide.mjs worth testing directly — same arrangement
// as open-screen-pr.d.mts/plan-closure-scan.d.mts: the scripts/ tree is plain ESM with `allowJs`
// off, so a spec that imports from it needs this rather than a repo-wide loosening.

/** `**Last assessed:**` + an optional `<!-- probe-ref: {...} -->` line, reading the LAST occurrence
 *  of each in the file (2026-09-19 — applyScreen appends rather than rewrites in place). */
export function parseLedgerHeader(text: string): {
  lastAssessed: string | null;
  probeRef: Record<string, unknown> | null;
};
