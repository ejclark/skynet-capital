/** The compute tier a `*.instructions.md` chore declares for itself. */
export interface ChoreManifest {
  path: string;
  name: string | null;
  description: string | null;
  model: string | null;
  effort: string | null;
  isolation: string | null;
  outcomeCheck: string | null;
}

export interface ChoreScan {
  manifest: ChoreManifest | null;
  problems: string[];
}

/** The grind `args` object a caller pastes, with the chore's tier already filled in. */
export interface ChoreArgs {
  items: unknown[];
  steps: Record<string, unknown>[];
}

export const EFFORTS: string[];
export const MODELS: string[];
export const ISOLATIONS: string[];

/** Parse a chore file's front matter. `manifest` is null when the file has none. */
export function parseChoreManifest(source: string, file: string): ChoreScan;

/** True for a path this repo checks in as a reusable chore (`docs/grind/*.instructions.md`). */
export function isCheckedInChore(file: string): boolean;

/** Read and validate one chore file from disk. */
export function scanChoreFile(file: string): ChoreScan;

/** Every checked-in chore file, repo-relative and sorted. */
export function choreFiles(): string[];

/** Build the grind `args` object for one chore plus an item list. */
export function argsFor(manifest: ChoreManifest, items: unknown[]): ChoreArgs;
