import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

/**
 * ship.sh's REST writes carry their JSON on stdin, never as one argv string (#6212).
 *
 * Linux caps a single argument at 128 KiB (MAX_ARG_STRLEN). On 2026-10-26 a platter ledger of
 * ~122 KB boarded and pushed, then the body sync died at `curl -d "$3"` with "Argument list too
 * long" — and that bare curl error was the run's last line. These specs drive the real sync path
 * against a stub `curl` with a body past the cap; under the old argv shape the exec itself fails.
 */
describe("ship api() — a body past the 128 KiB argv cap still sends", () => {
  let dir: string;
  const BIG = 200_000; // comfortably past 131,072
  let head: string;
  const env = (patchCode = "200", extra: Record<string, string> = {}) =>
    hermeticGitEnv({
      GH_TOKEN: "test-token-never-used",
      PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`,
      STUB_DIR: dir,
      STUB_PATCH_CODE: patchCode,
      STUB_PR_COMMITS: "1",
      STUB_PR_HEAD: head ?? "",
      PLATTER_SYNC_WAIT: "0",
      ...extra,
    });

  /** Source ship.sh, swap the ledger for a BIG-char body, and run the platter body sync. */
  const sync = (patchCode?: string, extra?: Record<string, string>) => {
    const script = `source "${resolve("scripts/ship.sh")}"
platter_body() { head -c ${BIG} /dev/zero | tr '\\0' x; }
platter_sync_body platter/2026-10-26`;
    try {
      const out = execFileSync("bash", ["-c", script], {
        cwd: dir,
        env: env(patchCode, extra),
        stdio: "pipe",
      });
      return { code: 0, stdout: out.toString(), stderr: "" };
    } catch (error) {
      const e = error as { status?: number; stderr?: Buffer; stdout?: Buffer };
      return {
        code: e.status ?? -1,
        stdout: e.stdout?.toString() ?? "",
        stderr: e.stderr?.toString() ?? "",
      };
    }
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-api-body-"));
    mkdirSync(join(dir, "bin"));
    // A curl that records its argv and whatever arrived on stdin, then answers like GitHub: the open
    // PR list for a GET of the list, the PR's head and commit count for a GET of the PR itself, and
    // STUB_PATCH_CODE for the PATCH.
    writeFileSync(
      join(dir, "bin", "curl"),
      `#!/bin/bash
printf '%s\\n' "$@" >> "$STUB_DIR/argv.log"
method=GET; prev=""
for a in "$@"; do [ "$prev" = "-X" ] && method="$a"; prev="$a"; done
case " $* " in *" --data-binary @- "*) cat > "$STUB_DIR/stdin.json" ;; esac
url="\${@: -1}"
if [ "$method" = GET ]; then case "$url" in
  */pulls/42) printf '{"commits":%s,"head":{"sha":"%s"}}\\n__SHIP_HTTP__200' "$STUB_PR_COMMITS" "$STUB_PR_HEAD" ;;
  *) printf '[{"number":42}]\\n__SHIP_HTTP__200' ;;
esac
else printf '{}\\n__SHIP_HTTP__%s' "$STUB_PATCH_CODE"; fi
`,
    );
    chmodSync(join(dir, "bin", "curl"), 0o755);
    const git = (args: string[]) =>
      execFileSync("git", args, { cwd: dir, env: env(), stdio: "pipe" });
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    git(["remote", "add", "origin", "https://github.com/acme/widgets.git"]);
    // main at the seed, the platter one commit ahead — the range GitHub's stub agrees with.
    git(["commit", "-q", "--allow-empty", "-m", "chore: seed"]);
    git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
    git(["commit", "-q", "--allow-empty", "-m", "fix: an item"]);
    head = git(["rev-parse", "HEAD"]).toString().trim();
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("PATCHes the whole body through stdin and reports the ledger refreshed", () => {
    const { code, stdout, stderr } = sync();
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(stdout).toContain("ledger refreshed on #42");
    const sent = JSON.parse(readFileSync(join(dir, "stdin.json"), "utf8")) as {
      body: string;
    };
    expect(sent.body).toHaveLength(BIG);
  });

  it("keeps the body off curl's argv entirely", () => {
    sync();
    const argv = readFileSync(join(dir, "argv.log"), "utf8");
    expect(argv).not.toContain("x".repeat(1000));
    expect(argv).toContain("--data-binary");
  });

  it("fails non-zero with the cause named when GitHub refuses the PATCH", () => {
    const { code, stderr } = sync("422");
    expect(code).toBe(1);
    expect(stderr).toContain("PATCH body returned HTTP 422");
    expect(stderr).toContain("refresh #42's ledger by hand");
  });
});

// #6252: from a shallow or stale origin/main, the range the ledger reads swallowed main's history —
// #5852's body listed 986 rows over 25 real commits. The sync now refuses to post a body whose
// range disagrees with GitHub's own count, so the stale ledger stays up rather than a wrong one.
describe("ship platter sync — the ledger's range must match the PR's own commits", () => {
  let dir: string;
  let head: string;
  const run = (extra: Record<string, string>) => {
    const env = hermeticGitEnv({
      GH_TOKEN: "test-token-never-used",
      PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`,
      STUB_DIR: dir,
      STUB_PATCH_CODE: "200",
      STUB_PR_COMMITS: "1",
      STUB_PR_HEAD: head,
      PLATTER_SYNC_WAIT: "0",
      ...extra,
    });
    const script = `source "${resolve("scripts/ship.sh")}"
platter_sync_body platter/2026-10-26`;
    try {
      execFileSync("bash", ["-c", script], { cwd: dir, env, stdio: "pipe" });
      return { code: 0, stderr: "" };
    } catch (error) {
      const e = error as { status?: number; stderr?: Buffer };
      return { code: e.status ?? -1, stderr: e.stderr?.toString() ?? "" };
    }
  };
  const patched = () => readFileSync(join(dir, "argv.log"), "utf8").includes("PATCH");

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-sync-range-"));
    mkdirSync(join(dir, "bin"));
    writeFileSync(
      join(dir, "bin", "curl"),
      `#!/bin/bash
printf '%s\\n' "$@" >> "$STUB_DIR/argv.log"
url="\${@: -1}"
case "$url" in
  */pulls/42) printf '{"commits":%s,"head":{"sha":"%s"}}\\n__SHIP_HTTP__200' "$STUB_PR_COMMITS" "$STUB_PR_HEAD" ;;
  *pulls\\?*) printf '[{"number":42}]\\n__SHIP_HTTP__200' ;;
  *) cat > /dev/null; printf '{}\\n__SHIP_HTTP__200' ;;
esac
`,
    );
    chmodSync(join(dir, "bin", "curl"), 0o755);
    const env = hermeticGitEnv({});
    const git = (args: string[]) =>
      execFileSync("git", args, { cwd: dir, env, stdio: "pipe" }).toString().trim();
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    git(["remote", "add", "origin", "https://github.com/acme/widgets.git"]);
    git(["commit", "-q", "--allow-empty", "-m", "chore: seed"]);
    git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
    git(["commit", "-q", "--allow-empty", "-m", "fix: an item"]);
    head = git(["rev-parse", "HEAD"]);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("posts when the range and GitHub agree", () => {
    expect(run({}).code).toBe(0);
    expect(patched()).toBe(true);
  });

  it("refuses, posting nothing, when GitHub counts a different number of commits", () => {
    const { code, stderr } = run({ STUB_PR_COMMITS: "25" });
    expect(code).toBe(1);
    expect(stderr).toContain("holds 1 commits, but GitHub says #42 has 25");
    expect(stderr).toContain("scripts/ship.sh platter sync");
    expect(patched()).toBe(false);
  });

  it("refuses, posting nothing, while GitHub has not yet seen the pushed head", () => {
    const { code, stderr } = run({ STUB_PR_HEAD: "0".repeat(40) });
    expect(code).toBe(1);
    expect(stderr).toContain("not the pushed");
    expect(patched()).toBe(false);
  });
});

describe("ship platter board — a failed body sync is red, not a bare curl error", () => {
  const source = readFileSync("scripts/ship.sh", "utf8");

  it("exits non-zero after a push whose ledger sync failed, and says the ledger is stale", () => {
    expect(source).toMatch(/platter_sync_body "\$branch" \|\| \{/);
    expect(source).toMatch(/boarded and pushed, but the PR body sync FAILED/);
  });

  it("never hands a request body to curl as an argument", () => {
    expect(source).not.toMatch(/-d "\$3"/);
    expect(source).toMatch(/--data-binary @-/);
  });
});
