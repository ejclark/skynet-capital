// Type surface for scripts/moneypenny/gh.mjs — the retry helpers a spec exercises directly.
// The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts for the same reasoning).
export function sh(cmd: string, args: string[], opts?: Record<string, unknown>): string;
export function isTransientGhError(text: unknown): boolean;
export function sleepSync(ms: number): "ok" | "not-equal" | "timed-out";
export function withRetry<T>(
  fn: () => T,
  opts?: {
    attempts?: number;
    baseMs?: number;
    isTransient?: (text: string) => boolean;
    sleep?: (ms: number) => void;
  },
): T;
export function ghRest(path: string, opts?: { token?: string }): unknown;
/** Fill GH_TOKEN from `gh auth token` when no token is set (a live session's CLIs, #5056). */
export function ensureGhToken(opts?: { run?: (cmd: string, args: string[]) => string }): void;

export interface RateLimitBucket {
  limit?: number;
  remaining?: number;
  reset?: number;
}

export function ghGraphqlBudget(opts?: {
  run?: (cmd: string, args: string[]) => string;
}): RateLimitBucket;

export function ghRateLimit(opts?: {
  token?: string;
  readRest?: (path: string, opts?: { token?: string }) => unknown;
  readGraphql?: () => RateLimitBucket;
}): Record<string, RateLimitBucket>;
