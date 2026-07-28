import { readFileSync } from "node:fs";

/**
 * App version, read from package.json at startup (semantic-release bumps it). Shown subtly on the
 * login page. The repo is private, so it stays plain text — no link to a changelog/release yet.
 */
export const APP_VERSION: string = (() => {
  try {
    const url = new URL("../../../package.json", import.meta.url);
    const parsed: unknown = JSON.parse(readFileSync(url, "utf8"));
    const v = (parsed as { version?: unknown }).version;
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
})();
