import { spawnSync } from "node:child_process";
import { NO_LIVE_GITHUB_ENV } from "../../rstest.config";

// #8289 slice 2: a test never reaches the real GitHub. In a signed-in session a spec that ran bare
// `gh` spent the one REST allowance every session shares (40 calls per `npm test`, 2026-11-24);
// rstest.config.ts runs every test signed out, the way CI's `verify` job already does. This spec
// fails if that env stops reaching the tests, or stops reaching what a test spawns.
describe("no live GitHub in a test", () => {
  it("runs every test with blank tokens and an empty gh config", () => {
    for (const [name, value] of Object.entries(NO_LIVE_GITHUB_ENV)) {
      expect(process.env[name] ?? "", name).toBe(value);
    }
  });

  it("leaves a spawned gh signed out, so it refuses before any request", () => {
    const r = spawnSync("gh", ["auth", "token"], { encoding: "utf8", env: process.env });
    // No gh on PATH at all reaches GitHub even less; anything else must be a refusal, never a token.
    if ((r.error as NodeJS.ErrnoException | undefined)?.code === "ENOENT") return;
    expect(r.status).not.toBe(0);
    expect(r.stdout.trim()).toBe("");
  });
});
