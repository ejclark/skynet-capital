import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * App version, read from package.json at startup (semantic-release bumps it). Shown subtly on the
 * login page. The repo is private, so it stays plain text — no link to a changelog/release yet.
 *
 * Resolved off `process.cwd()` (the repo root / the image's WORKDIR), never `import.meta.url`:
 * production runs an esbuild bundle at dist/serve.mjs, where a source-relative path points
 * nowhere — the same convention src/domain/market-events-data.ts documents.
 */
export const APP_VERSION: string = (() => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    const v = (parsed as { version?: unknown }).version;
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
})();
