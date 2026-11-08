// Type surface for server.mjs — same arrangement as coverage.d.mts (`allowJs` is off).

export type CrawlMode = "open" | "session";

export const CRAWL_EMAIL: string;
export const CRAWL_SECRET: string;
export const DATA_STORE_ENV: Record<string, string>;

export function envFor(mode: string | undefined, fixturesDir: string): Record<string, string>;
export function offlineBootEnv(opts: {
  mode: CrawlMode;
  port: number;
  bridgePort: number;
  fixtures: string;
}): Record<string, string>;
export function bootServer(opts: {
  mode: CrawlMode;
  port: number;
  bridgePort: number;
  timeoutMs?: number;
}): Promise<{ origin: string; close: () => Promise<void> }>;
