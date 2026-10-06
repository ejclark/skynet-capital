// Type surface for release-lease-tags.mjs — same arrangement as fix-held.d.mts (scripts/ is plain
// ESM with `allowJs` off, so a spec importing it needs this).

export const LEASE_PREFIX: string;

export function leaseTags(tagList: string | null | undefined): string[];

export function dropLeaseTags(opts?: { cwd?: string; env?: NodeJS.ProcessEnv }): string[];

export function isSemanticReleaseProcess(argv1: string | null | undefined): boolean;

export function prepare(
  pluginConfig: unknown,
  context: { cwd?: string; env?: NodeJS.ProcessEnv; logger: { log: (message: string) => void } },
): void;
