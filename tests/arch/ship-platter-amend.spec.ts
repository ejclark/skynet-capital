import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";
import { run } from "../support/ship-run.js";

/**
 * `ship platter amend` (#4616) — issue refs for an item that boarded without them.
 *
 * #5852's items 9 and 10 boarded before #6144 and carried no `Platter-Closes` trailer. The body is
 * rebuilt from the commits on every board, so a `Closes #4616` typed into it by hand vanished at the
 * next board, the pickup hold stopped seeing the issue as boarded, and the retry sweep woke a session
 * to re-type it — four times. An amendment is an empty commit carrying `Platter-Amends: <item>` and
 * the usual trailers: the Summary picks it up on every rebuild, and the ledger never gives it a row.
 */
const SHIP = resolve("scripts/ship.sh");
const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });

describe("ship platter amend — the Summary carries an amended item's refs on every rebuild", () => {
  let dir: string;
  let seed: string;
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8", env, stdio: "pipe" });
  const ledger = (args: string[]) =>
    execFileSync("bash", [SHIP, "platter", "ledger", ...args], {
      cwd: dir,
      encoding: "utf8",
      env,
      stdio: "pipe",
    });
  const commit = (subject: string, trailers: string[], file?: string) => {
    if (file) {
      writeFileSync(join(dir, file), `${file}\n`);
      git(["add", "-A"]);
    }
    git(["commit", "-q", "--allow-empty", "-m", subject, "-m", trailers.join("\n")]);
  };
  const summary = (body: string) =>
    body.slice(body.indexOf("## Summary"), body.indexOf("<details>", body.indexOf("## Summary")));

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-platter-amend-"));
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    commit("chore: seed", ["seed"], "seed.txt");
    seed = git(["rev-parse", "HEAD"]).trim();
    // #5852's shape: the same item boarded twice (a hand revert between), neither with a trailer.
    commit(
      "ci(deploy): skip restarts",
      ["Platter-Item: claude/issue-4616", "Platter-Paths: none"],
      "a.txt",
    );
    commit("fix(ci): another item", ["Platter-Item: fix/other", "Platter-Refs: #9"], "b.txt");
    commit(
      "ci(deploy): skip restarts",
      ["Platter-Item: claude/issue-4616", "Platter-Paths: none"],
      "c.txt",
    );
    commit("chore(platter): amend the issue refs of a boarded item", [
      "Platter-Amends: claude/issue-4616",
      "Platter-Closes: #4616",
    ]);
    commit("chore(platter): amend the issue refs of a boarded item", [
      "Platter-Amends: fix/never-boarded",
      "Platter-Closes: #77",
    ]);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("closes the issue against every row the amended item boarded as", () => {
    const s = summary(ledger(["--base", seed, "--body"]));
    expect(s).toContain("- Closes #4616 — boarded as items 1, 3.");
    expect(s).toContain("- Part of #9 — boarded as item 2.");
  });

  it("adds nothing for an item that is not on the platter", () => {
    expect(ledger(["--base", seed, "--body"])).not.toContain("#77");
  });

  it("never gives an amendment a ledger row, and counts it among the non-items", () => {
    const table = ledger(["--base", seed]);
    expect(table.split("\n").filter((l) => /^\| \d+ \|/.test(l))).toHaveLength(3);
    expect(table).not.toContain("amend the issue refs");
    expect(table).toContain("not items: 2 commit(s)");
  });

  it("still composes a body that passes ship checkbody", () => {
    const file = join(dir, "body.md");
    writeFileSync(file, ledger(["--base", seed, "--body"]));
    expect(run(["checkbody", file]).code).toBe(0);
  });
});

describe("ship platter amend — refusals", () => {
  const amend = (cwd: string, args: string[]) => {
    try {
      execFileSync("bash", [SHIP, "platter", "amend", ...args], { cwd, env, stdio: "pipe" });
      return { code: 0, stderr: "" };
    } catch (error) {
      const e = error as { status?: number; stderr?: Buffer };
      return { code: e.status ?? 1, stderr: e.stderr?.toString() ?? "" };
    }
  };

  it("refuses an amendment that names no issue", () => {
    const { code, stderr } = run(["platter", "amend", "feedback/1"]);
    expect(code).toBe(1);
    expect(stderr).toContain("--closes N and/or --part-of N");
  });

  it("refuses an item that is not boarded, and leaves the platter as it was", () => {
    const root = mkdtempSync(join(tmpdir(), "ship-platter-amend-refuse-"));
    const git = (cwd: string, args: string[]) =>
      execFileSync("git", args, { cwd, encoding: "utf8", env, stdio: "pipe" });
    const work = join(root, "work");
    try {
      git(root, ["init", "-q", "--bare", "-b", "main", "origin.git"]);
      git(root, ["clone", "-q", join(root, "origin.git"), "work"]);
      git(work, ["config", "user.email", "spec@example.com"]);
      git(work, ["config", "user.name", "spec"]);
      git(work, ["commit", "-q", "--allow-empty", "-m", "chore: seed"]);
      git(work, ["push", "-q", "origin", "main"]);
      git(work, ["checkout", "-q", "-b", "platter/2026-10-19"]);
      git(work, ["commit", "-q", "--allow-empty", "-m", "fix: one", "-m", "Platter-Item: fix/one"]);
      const before = git(work, ["rev-parse", "HEAD"]);

      const { code, stderr } = amend(work, ["fix/two", "--closes", "5"]);
      expect(code).toBe(1);
      expect(stderr).toContain("no item 'fix/two' is boarded");
      expect(git(work, ["rev-parse", "HEAD"])).toBe(before);

      git(work, ["checkout", "-q", "main"]);
      expect(amend(work, ["fix/one", "--closes", "5"]).stderr).toContain("not a platter branch");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
