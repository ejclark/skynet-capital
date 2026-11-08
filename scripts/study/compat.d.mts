// Type surface for compat.mjs — same arrangement as pin-plan.d.mts (`allowJs` is off).

export const FALLBACKS: string[];
export function pick<F extends (...args: never[]) => unknown>(
  mod: Record<string, unknown>,
  name: string,
  fallback: F,
  why: string,
  into?: string[],
): F;
export function settle(page: unknown): Promise<void>;
/** True when `metaUrl` is the entry script, by real path: scripts/is-main.mjs's, or the harness's copy on an older pin. */
export function isMain(metaUrl: string, argv1?: string): boolean;
