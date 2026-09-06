// Type surface for scripts/moneypenny/gh.mjs — the retry helpers a spec exercises directly.
// The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts for the same reasoning).
export function sh(cmd: string, args: string[], opts?: Record<string, unknown>): string;
export function isTransientGhError(text: unknown): boolean;
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
