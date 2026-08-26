// Type surface for the parts of ci-medic-logs.mjs that carry logic worth testing directly — the same
// arrangement postmaster.d.mts makes, and for the same reason: the scripts/ tree is plain ESM with
// `allowJs` off, so a spec that imports from it needs this rather than a repo-wide loosening.
/** How to ask `gh` for a job's log, best attempt first; the tail is the compatibility fallback. */
export function logArgVariants(jobId: number | string): string[][];
/** A raw Actions log made readable in a fold: no BOM, no escape sequences, no ISO timestamps. */
export function sanitizeLog(raw: unknown): string;
