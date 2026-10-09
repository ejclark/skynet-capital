// Type surface for instant.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export const INSTANT: string;
export function dayFrom(days: number): string;
export function resolveToken<T>(value: T): T | string;
export function resolveTokens<T>(value: T): T;
export function msOf(token: string): number;
export function pinProcessClock(): () => void;
