// Type surface for worktree-lock-match.mjs — scripts/ is plain ESM with `allowJs` off, so a spec
// importing it needs this (same arrangement as bottleneck-baseline.d.mts).

export interface LockPackages {
  packages?: Record<
    string,
    {
      version?: string;
      resolved?: string;
      integrity?: string;
      optional?: boolean;
      devOptional?: boolean;
      link?: boolean;
    }
  >;
}
export function lockDrift(
  lock: LockPackages | null | undefined,
  installed: LockPackages | null | undefined,
): string[];
