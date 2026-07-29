import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The standalone Babylon.js 3D scene page (login-hero exploration), served live at `/tower` so we can
 * iterate on the real deployment before committing to a bundled integration. It loads Babylon from the
 * CDN — fine here because the dashboard server sets no CSP. Read once from the sibling `scene.html` and
 * cached; the HTML is self-contained (no interpolation), so there's nothing to escape.
 */
let cached: string | undefined;

export function threeScenePage(): string {
  if (cached === undefined) {
    // cwd is the repo root in dev/tests and /app in the Fly container (Dockerfile WORKDIR), and the
    // file ships via `COPY . .` — so a cwd-relative path resolves in every runtime (unlike
    // import.meta.url, which the test bundler rewrites).
    cached = readFileSync(join(process.cwd(), "src/three/scene.html"), "utf8");
  }
  return cached;
}

/**
 * Read one of the scene's static assets (the esbuild bundle, the IBL .env) from `public/three`.
 * Returns undefined when it's missing so the caller can fall through to a 404 rather than throw —
 * a missing bundle should degrade to "scene doesn't start", never crash the server.
 * Cached per path: these are immutable per deploy.
 */
const assetCache = new Map<string, Buffer | undefined>();
export function readSceneAsset(name: string): Buffer | undefined {
  if (!/^[a-z0-9._-]+$/i.test(name)) return undefined; // no traversal
  if (assetCache.has(name)) return assetCache.get(name);
  let data: Buffer | undefined;
  try {
    data = readFileSync(join(process.cwd(), "public", "three", name));
  } catch {
    data = undefined;
  }
  assetCache.set(name, data);
  return data;
}
