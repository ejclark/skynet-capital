import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import { lockDrift } from "../../scripts/worktree-lock-match.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// #5548: WHEN a worktree is set up, the system SHALL share the primary checkout's install only if
// the lockfile matches what is on disk, SHALL never let the worktree's npm reach the primary's
// files, and SHALL otherwise run a real `npm ci`. Driven against a throwaway primary + worktree
// with a fake `npm` first on PATH, so no network and no real install is involved.
const SETUP = resolve("scripts/worktree-setup.sh");
const MATCH = resolve("scripts/worktree-lock-match.mjs");

const lockOf = (version: string) =>
  JSON.stringify({ lockfileVersion: 3, packages: { "": {}, "node_modules/foo": { version } } });

describe("lockDrift — is the install what the lock describes?", () => {
  const installed = (pkgs: Record<string, object>) => ({ packages: { "": {}, ...pkgs } });
  const lock = (pkgs: Record<string, object>) => ({ packages: { "": {}, ...pkgs } });

  it("matches when every installed package is in the lock at the same version", () => {
    expect(
      lockDrift(
        lock({ "node_modules/a": { version: "1.0.0" } }),
        installed({ "node_modules/a": { version: "1.0.0" } }),
      ),
    ).toEqual([]);
  });

  it("flags a version that moved", () => {
    const d = lockDrift(
      lock({ "node_modules/a": { version: "1.0.1" } }),
      installed({ "node_modules/a": { version: "1.0.0" } }),
    );
    expect(d).toEqual(["node_modules/a 1.0.0 installed, lock wants 1.0.1"]);
  });

  it("flags a package the lock added that the install lacks, but not an optional one (other platforms' binaries)", () => {
    const l = lock({
      "node_modules/new": { version: "1.0.0" },
      "node_modules/@biomejs/cli-darwin-arm64": { version: "2.0.0", optional: true },
    });
    expect(lockDrift(l, installed({}))).toEqual([
      "node_modules/new 1.0.0 is in the lock but not installed",
    ]);
  });

  it("flags a package installed that the lock dropped", () => {
    expect(lockDrift(lock({}), installed({ "node_modules/old": { version: "1.0.0" } }))).toEqual([
      "node_modules/old is installed but not in the lock",
    ]);
  });

  it("flags a different tarball or integrity at the same version", () => {
    const a = { version: "1.0.0", resolved: "https://r/a-1.tgz", integrity: "sha512-x" };
    expect(
      lockDrift(
        lock({ "node_modules/a": a }),
        installed({ "node_modules/a": { ...a, resolved: "https://r/other.tgz" } }),
      ),
    ).toHaveLength(1);
    expect(
      lockDrift(
        lock({ "node_modules/a": a }),
        installed({ "node_modules/a": { ...a, integrity: "sha512-y" } }),
      ),
    ).toHaveLength(1);
  });
});

describe("worktree-setup — share the install only when it is the right one", () => {
  let root: string;
  let primary: string;
  let bin: string;
  let npmLog: string;
  let n = 0;
  const env = (extra: Record<string, string> = {}) =>
    hermeticGitEnv({ PATH: `${bin}:${process.env.PATH}`, NPM_LOG: npmLog, ...extra });

  const git = (args: string[], cwd: string) => {
    const r = spawnSync("git", ["-c", "commit.gpgsign=false", ...args], {
      cwd,
      env: env(),
      encoding: "utf8",
    });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const put = (path: string, body: string, mode?: number) => {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
    if (mode) chmodSync(path, mode);
  };
  /** A finished install: the files, `.bin` shims that resolve, npm's hidden lockfile, a tool cache. */
  const install = (dir: string, version: string, marker: string) => {
    put(join(dir, "foo/index.js"), "module.exports = 1;\n");
    put(join(dir, "foo/bin.js"), "#!/bin/sh\n", 0o755);
    mkdirSync(join(dir, ".bin"), { recursive: true });
    for (const shim of ["biome", "rstest"]) symlinkSync("../foo/bin.js", join(dir, ".bin", shim));
    put(join(dir, marker), "ok\n");
    put(join(dir, ".package-lock.json"), lockOf(version));
    put(join(dir, ".cache/tool.json"), "{}");
  };
  const worktree = () => {
    const dir = join(root, `wt-${++n}`);
    git(["worktree", "add", "-q", "-b", `wt-${n}`, dir], primary);
    return dir;
  };
  const setup = (cwd: string) => {
    const r = spawnSync("bash", [SETUP], { cwd, env: env(), encoding: "utf8" });
    return { status: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
  };
  const npmCalls = () =>
    existsSync(npmLog) ? readFileSync(npmLog, "utf8").trim().split("\n").filter(Boolean) : [];

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "wt-setup-"));
    primary = join(root, "primary");
    bin = join(root, "bin");
    npmLog = join(root, "npm.log");
    // A fake npm: record the call, then do what `npm ci` ends up doing — leave an install behind.
    put(
      join(bin, "npm"),
      `#!/bin/sh
echo "CI=$CI $*" >> "$NPM_LOG"
dir=node_modules
case "$*" in *"--prefix app"*) dir=app/node_modules ;; esac
mkdir -p "$dir/foo" "$dir/.bin" "$dir/@testing-library"
printf '#!/bin/sh\\n' > "$dir/foo/bin.js"; chmod +x "$dir/foo/bin.js"
ln -sf ../foo/bin.js "$dir/.bin/biome"; ln -sf ../foo/bin.js "$dir/.bin/rstest"
`,
      0o755,
    );
    mkdirSync(primary, { recursive: true });
    git(["init", "-q", "-b", "main"], primary);
    git(["config", "user.email", "spec@example.com"], primary);
    git(["config", "user.name", "spec"], primary);
    put(join(primary, ".gitignore"), "node_modules/\n");
    put(join(primary, "package-lock.json"), lockOf("1.0.0"));
    put(join(primary, "app/package-lock.json"), lockOf("1.0.0"));
    mkdirSync(join(primary, "scripts"), { recursive: true });
    copyFileSync(MATCH, join(primary, "scripts/worktree-lock-match.mjs"));
    git(["add", "-A"], primary);
    git(["commit", "-q", "-m", "chore: seed"], primary);
    install(join(primary, "node_modules"), "1.0.0", "foo/PRIMARY");
    install(join(primary, "app/node_modules"), "1.0.0", "foo/PRIMARY");
    mkdirSync(join(primary, "app/node_modules/@testing-library"), { recursive: true });
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("hard-links the primary's install when the lockfile matches, and runs no npm", () => {
    const wt = worktree();
    const r = setup(wt);
    expect(r.status, r.out).toBe(0);
    expect(r.out).toMatch(/node_modules from .* \((hard-link|reflink); lockfile matches/);
    expect(npmCalls()).toEqual([]);
    const shared = join(wt, "node_modules/foo/index.js");
    expect(statSync(shared).ino).toBe(statSync(join(primary, "node_modules/foo/index.js")).ino);
    expect(statSync(join(wt, "app/node_modules/foo/index.js")).ino).toBe(
      statSync(join(primary, "app/node_modules/foo/index.js")).ino,
    );
    // Real directories, not links to the primary's.
    expect(lstatSync(join(wt, "node_modules")).isSymbolicLink()).toBe(false);
    // The shims resolve inside the worktree's own tree.
    expect(readlinkSync(join(wt, "node_modules/.bin/biome"))).toBe("../foo/bin.js");
    expect(existsSync(join(wt, "node_modules/.bin/rstest"))).toBe(true);
  });

  it("gives the worktree its own hidden lockfile and no tool cache", () => {
    const wt = worktree();
    expect(setup(wt).status).toBe(0);
    expect(statSync(join(wt, "node_modules/.package-lock.json")).ino).not.toBe(
      statSync(join(primary, "node_modules/.package-lock.json")).ino,
    );
    expect(readFileSync(join(wt, "node_modules/.package-lock.json"), "utf8")).toBe(lockOf("1.0.0"));
    expect(existsSync(join(wt, "node_modules/.cache"))).toBe(false);
    expect(existsSync(join(primary, "node_modules/.cache/tool.json"))).toBe(true);
  });

  it("deleting the worktree's install (what npm ci begins with) leaves the primary's whole", () => {
    const wt = worktree();
    expect(setup(wt).status).toBe(0);
    rmSync(join(wt, "node_modules"), { recursive: true, force: true });
    rmSync(join(wt, "app/node_modules"), { recursive: true, force: true });
    for (const f of [
      "node_modules/foo/index.js",
      "node_modules/.bin/biome",
      "app/node_modules/foo/PRIMARY",
    ]) {
      expect(existsSync(join(primary, f)), f).toBe(true);
    }
  });

  it("runs a real npm ci, never a copy, when the worktree's lockfile differs from the install", () => {
    const wt = worktree();
    writeFileSync(join(wt, "package-lock.json"), lockOf("2.0.0"));
    const r = setup(wt);
    expect(r.status, r.out).toBe(0);
    expect(r.out).toMatch(
      /package-lock\.json differs from the primary's install \(node_modules\/foo 1\.0\.0 installed, lock wants 2\.0\.0\)/,
    );
    // CI=1 keeps husky from rewriting the shared git config; the app tree still matches and is shared.
    expect(npmCalls().at(-1)).toBe("CI=1 ci --no-audit --no-fund");
    expect(existsSync(join(wt, "node_modules/foo/PRIMARY"))).toBe(false);
    expect(readFileSync(join(primary, "package-lock.json"), "utf8")).toBe(lockOf("1.0.0"));
    expect(statSync(join(wt, "app/node_modules/foo/index.js")).ino).toBe(
      statSync(join(primary, "app/node_modules/foo/index.js")).ino,
    );
  });

  it("converts an old symlinked node_modules to its own install without touching the target", () => {
    const wt = worktree();
    symlinkSync(join(primary, "node_modules"), join(wt, "node_modules"));
    const r = setup(wt);
    expect(r.status, r.out).toBe(0);
    expect(lstatSync(join(wt, "node_modules")).isSymbolicLink()).toBe(false);
    expect(existsSync(join(primary, "node_modules/foo/index.js"))).toBe(true);
  });

  it("leaves a real install it did not make alone", () => {
    const wt = worktree();
    put(join(wt, "node_modules/mine/index.js"), "x");
    put(join(wt, "node_modules/.bin/biome"), "#!/bin/sh\n", 0o755);
    put(join(wt, "node_modules/.bin/rstest"), "#!/bin/sh\n", 0o755);
    const r = setup(wt);
    expect(r.status, r.out).toBe(0);
    expect(existsSync(join(wt, "node_modules/mine/index.js"))).toBe(true);
    expect(existsSync(join(wt, "node_modules/foo"))).toBe(false);
  });

  it("is a no-op in the primary checkout", () => {
    const r = setup(primary);
    expect(r.status, r.out).toBe(0);
    expect(r.out).toContain("this is the primary checkout");
  });
});
