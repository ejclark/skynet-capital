// Type surface for print-dates-pr.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the
// spec that imports from it needs this.

export function refreshPrOpen(
  openPrs: readonly { head?: { ref?: string } }[],
  branch: string,
): boolean;
export function refreshPr(
  log: string,
  outcome: string,
  today: string,
): { title: string; body: string };
