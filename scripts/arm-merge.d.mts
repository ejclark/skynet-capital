// Type surface for arm-merge.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the spec
// that imports from it needs this (same arrangement as stuck-pr-decide.d.mts).

export type ArmFailureKind =
  | "done"
  | "rate-limit"
  | "base-moved"
  | "already-green"
  | "transient"
  | "fatal";

export function classifyArmFailure(text: unknown): ArmFailureKind;
export const ATTEMPTS: number;

type Run = (cmd: string, args: string[]) => string;

export function rateLimitWaitSeconds(opts?: { run?: Run; now?: () => number }): number;

export interface RetryOpts {
  retryOn?: ArmFailureKind[];
  run?: Run;
  sleep?: (ms: number) => void;
  log?: (msg: string) => void;
  waitFor?: (opts: { run: Run }) => number;
}

export function runWithRetry(
  cmd: string,
  args: string[],
  opts?: RetryOpts,
): { kind: "ok" | "done"; out: string };

export function armPr(pr: string | number, opts?: RetryOpts): "armed" | "merged" | "done";
