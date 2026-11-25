import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@rstest/core";

// NO LIVE GITHUB IN A TEST (#8289 slice 2). CI's `verify` job has no GitHub token, so a spec that
// reaches the real `gh` fails quietly there and nobody notices. In a signed-in session, the cloud
// build sessions of a surge, the same spec spent the one 5,000/hr REST allowance every session
// shares: `fitness-live-silent.spec.ts` ran `fitness.mjs`, which spawned `deploy-lag.mjs` on bare
// `gh`, 5 REST calls a run and 40 per `npm test` (measured 2026-11-24 with a logging `gh` on PATH).
// Blank tokens and an empty gh config give every test, and every process a test spawns, CI's
// signed-out `gh`: it refuses before any request. A spec that needs GitHub stubs `gh` itself.
// tests/arch/no-live-github.spec.ts holds this in place.
const noGithubConfig = join(tmpdir(), "rstest-no-github");
mkdirSync(noGithubConfig, { recursive: true });
export const NO_LIVE_GITHUB_ENV = {
  GH_TOKEN: "",
  GITHUB_TOKEN: "",
  GH_ENTERPRISE_TOKEN: "",
  GITHUB_ENTERPRISE_TOKEN: "",
  GH_CONFIG_DIR: noGithubConfig,
};

// On a Mac, scripts/verify-locked.sh caps a verify's test workers through SKYNET_TEST_WORKERS
// (#6668; the measurement and the number sit beside it there). Unset, rstest starts one worker per
// core but one, which is 9 on the 10-core laptop and 9 more in app/'s runner beside this one.
const cap = Number.parseInt(process.env.SKYNET_TEST_WORKERS ?? "", 10);

export default defineConfig({
  globals: true,
  testEnvironment: "node",
  include: ["tests/**/*.spec.ts"],
  exclude: ["**/node_modules/**", "**/dist/**"],
  env: NO_LIVE_GITHUB_ENV,
  ...(cap > 0 ? { pool: { maxWorkers: cap } } : {}),
});
