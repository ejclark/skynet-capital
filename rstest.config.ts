import { defineConfig } from "@rstest/core";

// On a Mac, scripts/verify-locked.sh caps a verify's test workers through SKYNET_TEST_WORKERS
// (#6668; the measurement and the number sit beside it there). Unset, rstest starts one worker per
// core but one, which is 9 on the 10-core laptop and 9 more in app/'s runner beside this one.
const cap = Number.parseInt(process.env.SKYNET_TEST_WORKERS ?? "", 10);

export default defineConfig({
  globals: true,
  testEnvironment: "node",
  include: ["tests/**/*.spec.ts"],
  exclude: ["**/node_modules/**", "**/dist/**"],
  ...(cap > 0 ? { pool: { maxWorkers: cap } } : {}),
});
