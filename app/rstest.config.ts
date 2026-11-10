import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rstest/core";

// A verify's test-worker cap (scripts/verify-locked.sh sets it on a Mac, #6668), at half: this suite
// is about a third of the root's (111 s against 285 s at 3 workers each, measured 2026-11-02), so
// half the workers end it about when the root's runner ends. Never none; unset, rstest's default.
const cap = Number.parseInt(process.env.SKYNET_TEST_WORKERS ?? "", 10);

// The React shell's test config (issue #738's app package). Mirrors the root rstest.config.ts's
// shape (globals, include/exclude) but needs a DOM environment + the React plugin, which the
// root config has no reason to carry — this package is the only one rendering components.
export default defineConfig({
  plugins: [pluginReact()],
  globals: true,
  testEnvironment: "happy-dom",
  setupFiles: ["./rstest.setup.ts"],
  include: ["tests/**/*.spec.tsx", "tests/**/*.spec.ts"],
  exclude: ["**/node_modules/**", "**/dist/**"],
  ...(cap > 0 ? { pool: { maxWorkers: Math.max(1, Math.floor(cap / 2)) } } : {}),
});
