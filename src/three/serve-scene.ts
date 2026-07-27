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
