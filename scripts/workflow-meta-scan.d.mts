/** Scan one workflow script's source for a registry-readable `export const meta`. Empty = clean. */
export function scanWorkflowMeta(source: string, file: string): string[];

/** Scan every `*.js` in a directory. */
export function scanWorkflowDir(dir: string): { files: string[]; problems: string[] };
