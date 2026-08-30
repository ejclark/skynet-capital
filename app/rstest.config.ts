import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rstest/core";

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
});
