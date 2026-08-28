import { existsSync, readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

/**
 * `/app` — the React observatory shell (#738 phase 1), served as static files from `app/dist`
 * BEHIND the same auth gate as every board view (the caller wires this after `gateRequest`).
 *
 * Two honesty rules:
 *  - **Traversal is refused structurally, not by pattern.** The resolved path must stay inside
 *    the dist root or the request 404s — no denylist of `..` spellings to outrun.
 *  - **A missing build says so.** When `app/dist` doesn't exist (the shell wasn't built in this
 *    deployment), the route answers 404 with a plain sentence instead of pretending the shell
 *    doesn't exist as a concept — an operator reading the response knows exactly what to run.
 */

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

export interface AppShellConfig {
  /** Absolute (or cwd-relative) path to the built shell, default `app/dist`. */
  readonly distDir?: string;
}

/** True when `path` is the shell's namespace. The caller routes on this. */
export function isAppShellPath(path: string): boolean {
  return path === "/app" || path.startsWith("/app/");
}

/**
 * Serve one shell request. Hashed static assets get long-lived caching; every non-file path under
 * `/app` gets `index.html` (the SPA owns its own routing), uncached so a deploy lands on reload.
 */
export function serveAppShell(
  res: ServerResponse,
  path: string,
  config: AppShellConfig = {},
): void {
  const root = resolve(config.distDir ?? "app/dist");
  if (!existsSync(join(root, "index.html"))) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "React shell not built in this deployment — run `npm run build` in app/ to create app/dist.",
    );
    return;
  }

  const rel = normalize(path.replace(/^\/app\/?/, "")).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = resolve(root, rel);
  const inside = candidate === root || candidate.startsWith(root + sep);

  const type = CONTENT_TYPES[extname(candidate)];
  if (inside && rel !== "" && type && existsSync(candidate)) {
    // Rsbuild content-hashes every asset filename, so far-future caching is safe by construction.
    res.writeHead(200, {
      "content-type": type,
      "cache-control": path.includes("/static/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    res.end(readFileSync(candidate));
    return;
  }

  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(readFileSync(join(root, "index.html")));
}
