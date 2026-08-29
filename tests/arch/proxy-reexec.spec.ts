import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

/**
 * Every script that fetches must honour `HTTPS_PROXY` (2026-08-29).
 *
 * Node's global `fetch` ignores it. Behind an agent proxy every request fails, and each caller's
 * own degrade path then turns that into something reassuring — `incident-scan` printed
 * "could not reach GitHub … skipping (offline no-op)" and exited 0, so the Learning Coach's gate
 * reported success because it could not see its subject. With the proxy honoured the same command
 * reads 46 runs.
 *
 * A scan that cannot reach its subject and exits 0 is worse than one that errors: the error gets
 * fixed, the green gets trusted. These cases stop the next fetching script from rediscovering that
 * the same way this one did.
 */

const SCRIPTS = readdirSync("scripts").filter((f) => f.endsWith(".mjs"));

/** Scripts that actually make network calls through the global fetch. */
const fetchers = SCRIPTS.filter((f) => {
  const src = readFileSync(`scripts/${f}`, "utf8").replace(/^\s*\/\/[^\n]*$/gm, "");
  return /\bawait fetch\(|=\s*fetch\(/.test(src);
});

describe("proxy-aware fetch", () => {
  it("finds the fetching scripts at all, so the rule below is not vacuous", () => {
    expect(fetchers.length).toBeGreaterThanOrEqual(4);
  });

  it.each(fetchers)("%s re-execs with the proxy before it fetches", (file) => {
    const src = readFileSync(`scripts/${file}`, "utf8");

    expect(src).toContain("reexecWithProxy");
  });

  it("keeps the mechanism in one place rather than pasted per caller", () => {
    // It was inline in issue-lint-audit.mjs, twice, while four other scripts went without.
    const inline = SCRIPTS.filter(
      (f) =>
        f !== "proxy-reexec.mjs" &&
        readFileSync(`scripts/${f}`, "utf8").includes("NODE_USE_ENV_PROXY"),
    );

    expect(inline).toEqual([]);
  });
});

describe("the re-exec itself", () => {
  const run = (env: NodeJS.ProcessEnv) =>
    execFileSync(
      process.execPath,
      [
        "-e",
        "import('./scripts/proxy-reexec.mjs').then(m=>{m.reexecWithProxy();console.log('continued')})",
      ],
      { cwd: process.cwd(), encoding: "utf8", env: { ...process.env, ...env } },
    );

  it("does nothing when there is no proxy — the common path spawns nothing", () => {
    expect(run({ HTTPS_PROXY: "", NODE_USE_ENV_PROXY: "" })).toContain("continued");
  });

  it("does nothing when it is already the re-executed child, so it cannot loop", () => {
    // The guard that matters: without it, a proxied environment forks forever.
    expect(run({ HTTPS_PROXY: "http://proxy.invalid:1", NODE_USE_ENV_PROXY: "1" })).toContain(
      "continued",
    );
  });
});
