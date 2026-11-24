// Type surface for cohesion.mjs's history half (#8065) — the same arrangement as
// cohesion-plan.d.mts: scripts/ is plain ESM with `allowJs` off, so the spec needs this.

/** Parts added since the study, each with the scope of the commit that added it. */
export function addedParts(cwd?: string): { file: string; scope: string }[];
/** The `/api/…` paths src/server's history adds since the study. */
export function serverAdditions(cwd?: string): string[];
/** Why rows 4b and 4c may undercount in this clone, or null when history reaches the study. */
export function historyNote(cwd?: string): string | null;
