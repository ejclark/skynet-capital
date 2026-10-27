// Type surface for scripts/instructions/scope.mjs (see scripts/moneypenny/index.d.mts for why
// scripts/ ships hand-written declarations instead of `allowJs`).

/** True when a repo-relative POSIX path is an instruction file. */
export function isInstructionFile(path: string): boolean;

/** The instruction files in a path list: filtered, de-duplicated, sorted. */
export function instructionFiles(paths: string[]): string[];

/** Why a path must never be hand-edited (generated, verbatim or append-only), or null. */
export function doNotEditReason(path: string): string | null;
