// Type surface for platter-sweep-decide.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this (same arrangement as stuck-pr-decide.d.mts).

export const REQUIRED_CHECKS: string[];
export const HOLD_LABEL: string;
export const CONFLICT_LABEL: string;
export const DEPENDABOT: string;
export const TASTE_LABELS: string[];

export interface CheckRun {
  name: string;
  status?: string;
  conclusion?: string | null;
}
export interface PrFacts {
  number: number;
  title?: string;
  body?: string | null;
  state?: string;
  draft?: boolean;
  mergeable?: boolean | null;
  mergeable_state?: string;
  labels?: Array<{ name: string } | string>;
  user?: { login?: string };
  head?: { ref?: string; sha?: string; repo?: { full_name?: string } | null };
  base?: { ref?: string; repo?: { full_name?: string } | null };
}
export interface AdoptVerdict {
  number: number;
  branch: string;
  title: string;
  adopt: boolean;
  reason?: string;
  kind?: "held" | "dependabot";
  protected?: string[];
}
export interface RebuildVerdict {
  number: number;
  branch?: string;
  rebuild: boolean;
  reason: string;
}

export function isPlatterBranch(ref: unknown): boolean;
export function tasteHold(pr: PrFacts): string | null;
export function bumpLevel(title: unknown): "major" | "minor" | "patch" | null;
export function checksGreen(checkRuns?: CheckRun[]): { green: boolean; why: string };
export function judgeAdopt(args: {
  pr: PrFacts;
  files?: string[];
  isProtected: (path: string) => boolean;
  checkRuns?: CheckRun[];
}): AdoptVerdict;
export function judgeRebuild(pr: PrFacts): RebuildVerdict;
export function openPlatter(openPrs?: PrFacts[]): PrFacts | null;
export function adoptCandidates(openPrs?: PrFacts[]): PrFacts[];
