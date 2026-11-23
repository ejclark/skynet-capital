import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";
import { run } from "../support/ship-run.js";

/**
 * `ship platter rebuild` (#7939) — rule 2's "if it conflicts, the platter is re-opened", as a command.
 *
 * Platter #7424 sat `conflict-flagged` on 2026-11-22, so the one tap that should clear every
 * protected change could not be taken. The rebuild cuts a fresh platter from main and re-boards the
 * old one's items in order. An item that conflicts, or adds nothing, is LEFT OFF and named — nothing
 * is ever fixed on a platter — and an amendment rides along only beside its own item. This drives
 * the replay half (platter_replay) on a throwaway repo, with verify off; the network half (open,
 * comment, close) is the same REST code `platter open` and `board` already run.
 */
const SCRIPTS = resolve("scripts");
const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });
// The real temp folder: macOS's tmpdir() is a symlink, which defeats a script's direct-run check
// (ship-platter.spec.ts, 2026-11-07).
const TMP = realpathSync(tmpdir());

describe("ship platter rebuild — the replay re-boards what applies and names what does not", () => {
  let dir: string;
  let old: string;
  let drops: string;
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8", env, stdio: "pipe" });
  const write = (file: string, text: string) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  };
  const commit = (subject: string, trailers: string[] = []) => {
    git(["add", "-A"]);
    git([
      "commit",
      "-q",
      "--allow-empty",
      "-m",
      subject,
      ...(trailers.length ? ["-m", trailers.join("\n")] : []),
    ]);
  };
  const item = (name: string, refs: string[]) => [
    `Platter-Item: ${name}`,
    "Platter-Sha: 0123456789ab",
    "Platter-Verify: verify green 2026-11-11T07:46Z",
    "Platter-Paths: none",
    ...refs,
  ];
  // Sourced with $0 naming the real scripts/ dir (so its helpers resolve) but spelled differently
  // from BASH_SOURCE, so the file stops at its definitions instead of dispatching.
  const ship = (body: string) =>
    execFileSync("bash", ["-c", `source "${SCRIPTS}/ship.sh"\n${body}`, `${SCRIPTS}/./ship.sh`], {
      cwd: dir,
      encoding: "utf8",
      env,
      stdio: "pipe",
    });
  const ledger = (args: string[]) =>
    execFileSync("bash", [`${SCRIPTS}/ship.sh`, "platter", "ledger", ...args], {
      cwd: dir,
      encoding: "utf8",
      env,
      stdio: "pipe",
    });

  beforeAll(() => {
    dir = mkdtempSync(join(TMP, "ship-platter-rebuild-"));
    drops = join(dir, "..", `${dir.split("/").pop()}-drops.tsv`);
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    write("lessons.md", "# Lessons\n");
    // envelope-scan reads the manifest from the cwd; the replay recomputes Platter-Paths with it.
    write("envelope.json", readFileSync(resolve("envelope.json"), "utf8"));
    commit("chore: seed");

    // The old platter, cut from the seed: four items and two amendments, #7424's shape.
    git(["checkout", "-q", "-b", "platter/2026-11-11"]);
    write("lessons.md", "# Lessons\n\n- the item's lesson\n");
    commit(
      "fix(deploy): give a refused push a retry budget",
      item("fix/one", ["Platter-Closes: #11"]),
    );
    write(".github/workflows/print-dates.yml", "on: push\n");
    commit("ci(calendar): refresh on a weekday clock", item("ci/two", ["Platter-Refs: #12"]));
    write("same.txt", "already on main\n");
    commit("docs: a line main also took", item("docs/three", []));
    commit("chore(platter): amend the issue refs of a boarded item", [
      "Platter-Amends: fix/one",
      "Platter-Closes: #13",
    ]);
    commit("chore(platter): amend the issue refs of a boarded item", [
      "Platter-Amends: ci/two",
      "Platter-Refs: #14",
    ]);
    write("four.txt", "four\n");
    commit(
      "fix(feedback): re-check a follow-up",
      item("feedback/7548", ["Platter-Closes: #7548", "Platter-Closes: #11"]),
    );
    old = git(["rev-parse", "HEAD"]).trim();

    // Main moves on: the same lessons spot (item one now conflicts) and the same file item three adds.
    git(["checkout", "-q", "main"]);
    write("lessons.md", "# Lessons\n\n- main's own lesson\n");
    write("same.txt", "already on main\n");
    commit("docs(lessons): main's lesson");

    git(["checkout", "-q", "-b", "platter/2026-11-22"]);
    ship(`PLATTER_BASE=main\nplatter_replay ${old} 0 7424 "${drops}"`);
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    rmSync(drops, { force: true });
  });

  it("re-boards the items that apply, in their old order, each still its own revertable commit", () => {
    const rows = ledger(["--base", "main"])
      .split("\n")
      .filter((l) => /^\| \d+ \|/.test(l));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("`ci/two`");
    expect(rows[1]).toContain("`feedback/7548`");
  });

  it("leaves off a conflicting item and one that adds nothing, and says why for each", () => {
    const lines = readFileSync(drops, "utf8").split("\n").filter(Boolean);
    expect(lines).toEqual([
      "fix/one\t" + lines[0]?.split("\t")[1] + "\tconflicts with main\t11",
      "docs/three\t" + lines[1]?.split("\t")[1] + "\tadds nothing on main\t",
    ]);
    // Nothing was fixed: main's side of the conflict is what the new platter holds.
    expect(readFileSync(join(dir, "lessons.md"), "utf8")).toContain("main's own lesson");
    expect(git(["status", "--porcelain"]).trim()).toBe("");
  });

  it("recomputes the protected paths and keeps the original sha and issue refs", () => {
    const body = git(["log", "--format=%b", "-1", "HEAD~2"]);
    expect(body).toContain("Platter-Paths: .github/workflows/print-dates.yml");
    expect(body).toContain("Platter-Sha: 0123456789ab");
    expect(body).toContain("Platter-Refs: #12");
    expect(body).toContain("Platter-Verify: verify skipped (--no-verify)");
    expect(body).toMatch(/Platter-Rebuilt-From: pr 7424 [0-9a-f]{12}/);
  });

  it("carries an amendment beside its item, and drops one whose item was left off", () => {
    const body = ledger(["--base", "main", "--body"]);
    expect(body).toContain("- Part of #12 — boarded as item 1.");
    expect(body).toContain("- Part of #14 — boarded as item 1.");
    expect(body).toContain("- Closes #7548 — boarded as item 2.");
    expect(body).not.toContain("#13");
  });

  it("keeps open an issue a left-off item also worked on: a later Closes becomes Part of", () => {
    const body = ledger(["--base", "main", "--body"]);
    expect(body).toContain("- Part of #11 — boarded as item 2.");
    expect(body).not.toContain("Closes #11");
  });

  it("lists the left-off items in the body, and the body still passes ship checkbody", () => {
    git([
      "commit",
      "-q",
      "--allow-empty",
      "-m",
      "chore(platter): record the items a rebuild left off",
      "-m",
      "Platter-Rebuilt-From: pr 7424\nPlatter-Dropped: fix/one 0123456789ab conflicts with main",
    ]);
    const body = ledger(["--base", "main", "--body"]);
    expect(body).toContain("**Dropped in the rebuild**");
    expect(body).toContain(
      "- `fix/one` (`012345678`) — dropped: needs catch-up on its own branch (conflicts with main).",
    );
    const file = join(dir, "body.md");
    writeFileSync(file, body);
    expect(run(["checkbody", file]).code).toBe(0);
  });
});

describe("ship platter rebuild / adopt — refusals before anything moves", () => {
  it("asks for a PR number", () => {
    expect(run(["platter", "rebuild"]).stderr).toContain(
      "usage: scripts/ship.sh platter rebuild <pr>",
    );
    expect(run(["platter", "adopt", "x"]).stderr).toContain(
      "usage: scripts/ship.sh platter adopt <pr>",
    );
  });
});
