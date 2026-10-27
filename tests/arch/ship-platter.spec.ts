import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";
import { run } from "../support/ship-run.js";

/**
 * The platter (#1343) — one held PR per cadence instead of one per protected change.
 *
 * Eric merges every `envelope.json`-protected change by hand; that boundary does not move. What the
 * platter changes is its cost: on 2026-09-04 seven protected changes cost seven separate merges,
 * and the hold was not even enumerable — `ship open --hold` set a local flag and applied no label,
 * so `hold-merge` sat on two closed diagnostic PRs and on none of the seven.
 *
 * The ledger is specced rather than the network mechanics because it is the artefact Eric actually
 * reads, and because it is a pure function of `git log` — a body assembled from a hand-maintained
 * file could drift from what is really boarded; this one cannot.
 */
describe("ship platter — the ledger is a pure function of the boarded commits", () => {
  let dir: string;
  let base: string;
  const SHIP = resolve("scripts/ship.sh");
  const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });

  const git = (args: string[], cwd = dir) =>
    execFileSync("git", args, { cwd, encoding: "utf8", env, stdio: "pipe" });
  const ledger = (args: string[]) =>
    execFileSync("bash", [SHIP, "platter", "ledger", ...args], {
      cwd: dir,
      encoding: "utf8",
      env,
      stdio: "pipe",
    });
  /** One boarded item, in exactly the commit shape `platter board` writes. */
  const board = (file: string, subject: string, trailers: string[]) => {
    writeFileSync(join(dir, file), `${file}\n`);
    git(["add", "-A"]);
    git(["commit", "-q", "-m", subject, "-m", trailers.join("\n")]);
  };

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-platter-"));
    git(["init", "-q", "-b", "main", "."]);
    git(["config", "user.email", "spec@example.com"]);
    git(["config", "user.name", "spec"]);
    writeFileSync(join(dir, "seed.txt"), "seed\n");
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "chore: seed"]);
    base = git(["rev-parse", "HEAD"]).trim();
    board("a.txt", "fix(ci): restore the npm cache key", [
      "Platter-Item: fix/cache",
      "Platter-Sha: 4c58a8a3ad4a",
      "Platter-Verify: verify green 2026-09-04T22:05Z",
      "Platter-Paths: .github/workflows/pipeline.yml",
      "Platter-Paths: fly.bots.toml",
    ]);
    board("b.txt", "feat(bots): widen the smoke | timeout", [
      "Platter-Item: feat/smoke",
      "Platter-Sha: 999888777666",
      "Platter-Verify: verify skipped (--no-verify)",
      "Platter-Paths: none",
    ]);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("gives every item its own row, in boarding order, with the sha that reverts it alone", () => {
    const rows = ledger(["--base", base]).trim().split("\n");
    expect(rows[0]).toContain("| # | item | why | verify evidence | revert |");
    expect(rows).toHaveLength(4); // header + separator + two items
    expect(rows[2]).toContain("`fix/cache`");
    expect(rows[2]).toContain("fix(ci): restore the npm cache key");
    expect(rows[3]).toContain("`feat/smoke`");
  });

  it("carries each item's verify evidence and the protected paths it touched", () => {
    const table = ledger(["--base", base]);
    expect(table).toContain("verify green 2026-09-04T22:05Z");
    expect(table).toContain("`.github/workflows/pipeline.yml`");
    expect(table).toContain("`fly.bots.toml`");
  });

  it("says so when an item boarded unverified, rather than implying evidence it has none of", () => {
    // An honest ledger is the whole point: 'verify skipped' must survive into the row Eric reads.
    expect(ledger(["--base", base])).toContain("verify skipped (--no-verify)");
  });

  it("escapes a pipe in a commit subject instead of splitting the row into extra columns", () => {
    const row = ledger(["--base", base]).trim().split("\n")[3] ?? "";
    expect(row).toContain("widen the smoke \\| timeout");
    expect(row.match(/(?<!\\)\|/g)).toHaveLength(6); // 5 cells → 6 unescaped delimiters
  });

  it("renders an explicit empty state rather than a headers-only table", () => {
    expect(ledger(["--base", "HEAD"])).toContain("nothing boarded yet");
  });

  // The body the platter actually PATCHes onto the PR, run through the repo's own format gate —
  // so the ledger can never become a picture the fridge rule would reject.
  it("composes a PR body that passes ship checkbody", () => {
    const file = join(dir, "body.md");
    writeFileSync(file, ledger(["--base", base, "--body"]));
    const { code, stdout } = run(["checkbody", file]);
    expect(code).toBe(0);
    expect(stdout).toContain("passes the picture/format contract");
  });

  it("tells Eric to merge with a merge commit — squashing is what loses per-item revert", () => {
    expect(ledger(["--base", base, "--body"])).toContain("never squash");
  });

  // #3754: the merge-method instruction was a Summary bullet and a paragraph below the fold, and it
  // failed on five of eleven landings. A `> [!WARNING]` is the one thing docs/PICTURES.md reserves
  // for an irreversible touch, and it sits above `## Summary` where the merge dialog is read.
  it("carries the merge method as a top-level WARNING, not only as a bullet", () => {
    const body = ledger(["--base", base, "--body"]);
    const warning = body.indexOf("> [!WARNING]");
    expect(warning).toBeGreaterThan(-1);
    expect(warning).toBeLessThan(body.indexOf("## Summary"));
    expect(body.slice(warning, warning + 400)).toMatch(/Create a merge commit/);
    expect(body.slice(warning, warning + 400)).not.toContain("<details>");
  });

  it("states the revert path that actually exists, for both ways this can land", () => {
    // An honest ledger names what the revert column is worth BEFORE the merge (branch-only),
    // after a merge commit (per item), and after a squash (the platter, whole or nothing).
    const body = ledger(["--base", base, "--body"]);
    expect(body).toContain("The revert path that actually exists");
    expect(body).toMatch(/whole platter or nothing/);
    expect(body).toContain("scripts/platter-merge-scan.mjs");
  });

  // #4562: a boarded item used to lose its `Closes #N`, so the platter's merge closed nothing and
  // 4 of 8 platters' issues were closed by hand. The trailers ride the item commit; the body turns
  // them into Summary bullets, so GitHub's own link closes them under either merge button.
  describe("carries each item's issue references into the Summary (#4562)", () => {
    let refsBase: string;
    beforeAll(() => {
      refsBase = git(["rev-parse", "HEAD"]).trim();
      board("c.txt", "feat(ci): finish the board wiring", [
        "Platter-Item: plan/3913",
        "Platter-Sha: 111122223333",
        "Platter-Verify: verify green 2026-10-04T10:00Z",
        "Platter-Paths: none",
        "Platter-Closes: #3913",
        "Platter-Closes: #4246",
        "Platter-Refs: #4393",
      ]);
      board("d.txt", "chore(ci): slice 4 of the envelope plan", [
        "Platter-Item: plan/4535",
        "Platter-Sha: 444455556666",
        "Platter-Verify: verify green 2026-10-04T11:00Z",
        "Platter-Paths: none",
        "Platter-Refs: #4535",
        "Platter-Refs: #4246",
      ]);
    });

    const summary = (body: string) =>
      body.slice(body.indexOf("## Summary"), body.indexOf("<details>", body.indexOf("## Summary")));

    it("puts one closing keyword per issue in the Summary, naming the row that boarded it", () => {
      const s = summary(ledger(["--base", base, "--body"]));
      expect(s).toContain("- Closes #3913 — boarded as item 3.");
      expect(s).toContain("- Closes #4246 — boarded as item 3."); // item 4 only refs it
      expect(s).toContain("- Part of #4393 — boarded as item 3.");
      expect(s).toContain("- Part of #4535 — boarded as item 4.");
      expect(s).not.toContain("Part of #4246"); // closed wins; checkbody refuses both
    });

    it("still passes ship checkbody — the keywords sit inside the Summary", () => {
      const file = join(dir, "refs-body.md");
      writeFileSync(file, ledger(["--base", base, "--body"]));
      const { code, stdout } = run(["checkbody", file]);
      expect(code).toBe(0);
      expect(stdout).toContain("passes the picture/format contract");
    });

    it("closes nothing for an item that is not boarded — a dropped item's trailer is gone", () => {
      // The body reads only <base>..HEAD, so an item off the platter contributes nothing: with
      // item 3 gone, #3913 is not named at all and #4246 falls back to item 4's `Part of`.
      const item3 =
        git(["rev-list", "--reverse", `${refsBase}..HEAD`])
          .trim()
          .split("\n")[0] ?? "";
      const s = summary(ledger(["--base", item3, "--body"]));
      expect(s).not.toContain("#3913");
      expect(s).not.toMatch(/closes #4246/i);
      expect(s).toContain("- Part of #4246 — boarded as item 1.");
    });

    it("leaves the ledger table and its revert column as they were — no new column", () => {
      const rows = ledger(["--base", base]).trim().split("\n");
      expect(rows[0]).toBe("| # | item | why | verify evidence | revert |");
      expect(rows[4]).toMatch(/^\| 3 \| `plan\/3913` \| .* \| `[0-9a-f]{7}` \|$/);
      expect(rows.join("\n")).not.toContain("Platter-Closes");
    });
  });
});

describe("ship platter — refusals that keep the platter an assembly point, not a workspace", () => {
  // This refusal depends on the CURRENT branch, so it runs in its own repo on `main`. Against
  // process.cwd() it went red the first time a platter was actually opened (2026-09-05): `platter
  // open` runs `npm run verify` on the staged union while HEAD *is* a platter branch, so the
  // refusal this test expects is exactly the one that cannot fire there.
  it("refuses to board while HEAD is not a platter branch", () => {
    const dir = mkdtempSync(join(tmpdir(), "ship-board-refusal-"));
    const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });
    const git = (args: string[]) =>
      execFileSync("git", args, { cwd: dir, encoding: "utf8", env, stdio: "pipe" });
    try {
      git(["init", "-q", "-b", "main", "."]);
      git(["config", "user.email", "spec@example.com"]);
      git(["config", "user.name", "spec"]);
      git(["commit", "-q", "--allow-empty", "-m", "chore: seed"]);
      let code = 0;
      let stderr = "";
      try {
        execFileSync("bash", [resolve("scripts/ship.sh"), "platter", "board", "feedback/1"], {
          cwd: dir,
          env,
          stdio: "pipe",
        });
      } catch (error) {
        const e = error as { status?: number; stderr?: Buffer };
        code = e.status ?? 1;
        stderr = e.stderr?.toString() ?? "";
      }
      expect(code).toBe(1);
      expect(stderr).toContain("not a platter branch");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // 2026-10-26, #5852: an item branch cut from today's main, boarded onto a platter cut a week
  // earlier, squashed the whole week of main into one "item" — 504 files under a two-file subject,
  // with a revert sha that would have reverted all of them.
  it("refuses an item based on a newer main than the platter, before squashing anything", () => {
    const root = mkdtempSync(join(tmpdir(), "ship-board-stale-"));
    const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });
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
      git(work, ["commit", "-q", "--allow-empty", "-m", "chore: an earlier item"]);
      git(work, ["checkout", "-q", "main"]);
      git(work, ["commit", "-q", "--allow-empty", "-m", "feat: a week of main"]);
      git(work, ["push", "-q", "origin", "main"]);
      git(work, ["checkout", "-q", "-b", "fix/item"]);
      git(work, ["commit", "-q", "--allow-empty", "-m", "fix: the item"]);
      git(work, ["push", "-q", "origin", "fix/item"]);
      git(work, ["checkout", "-q", "platter/2026-10-19"]);
      const before = git(work, ["rev-parse", "HEAD"]);

      let code = 0;
      let stderr = "";
      try {
        execFileSync("bash", [resolve("scripts/ship.sh"), "platter", "board", "fix/item"], {
          cwd: work,
          env,
          stdio: "pipe",
        });
      } catch (error) {
        const e = error as { status?: number; stderr?: Buffer };
        code = e.status ?? 1;
        stderr = e.stderr?.toString() ?? "";
      }
      expect(code).toBe(1);
      expect(stderr).toContain("newer main than the platter");
      expect(stderr).toContain("git merge origin/main --no-edit");
      expect(git(work, ["rev-parse", "HEAD"])).toBe(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // 2026-10-26, #5852 again: the refusal above merged at 10:57 and an item boarded past it at
  // 11:52, because `board` ran the platter's own checkout of this script, cut before the guard.
  it("refuses to board while the running ship.sh is not origin/main's copy", () => {
    const root = mkdtempSync(join(tmpdir(), "ship-board-stale-script-"));
    const env = hermeticGitEnv({ GH_TOKEN: "test-token-never-used" });
    const git = (cwd: string, args: string[]) =>
      execFileSync("git", args, { cwd, encoding: "utf8", env, stdio: "pipe" });
    const work = join(root, "work");
    try {
      git(root, ["init", "-q", "--bare", "-b", "main", "origin.git"]);
      git(root, ["clone", "-q", join(root, "origin.git"), "work"]);
      git(work, ["config", "user.email", "spec@example.com"]);
      git(work, ["config", "user.name", "spec"]);
      mkdirSync(join(work, "scripts"));
      writeFileSync(join(work, "scripts", "ship.sh"), "# main's newer copy\n");
      git(work, ["add", "."]);
      git(work, ["commit", "-q", "-m", "chore: seed"]);
      git(work, ["push", "-q", "origin", "main"]);
      git(work, ["checkout", "-q", "-b", "platter/2026-10-19"]);
      const before = git(work, ["rev-parse", "HEAD"]);

      let code = 0;
      let stderr = "";
      try {
        execFileSync("bash", [resolve("scripts/ship.sh"), "platter", "board", "fix/item"], {
          cwd: work,
          env,
          stdio: "pipe",
        });
      } catch (error) {
        const e = error as { status?: number; stderr?: Buffer };
        code = e.status ?? 1;
        stderr = e.stderr?.toString() ?? "";
      }
      expect(code).toBe(1);
      expect(stderr).toContain("not origin/main's");
      expect(stderr).toContain("git merge origin/main --no-edit");
      expect(git(work, ["rev-parse", "HEAD"])).toBe(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuses a platter name outside platter/ — the branch name is how the platter is found", () => {
    const { code, stderr } = run(["platter", "open", "feedback/1", "--name", "wip/whatever"]);
    expect(code).toBe(1);
    expect(stderr).toContain("platter/");
  });

  it("refuses to open a platter with no first item — a PR cannot open on an empty diff", () => {
    const { code, stderr } = run(["platter", "open"]);
    expect(code).toBe(1);
    expect(stderr).toContain("item branch is required");
  });

  it("names the three subcommands when handed an unknown one", () => {
    const { code, stderr } = run(["platter", "assemble"]);
    expect(code).toBe(1);
    expect(stderr).toMatch(/open .*board .*ledger/s);
  });
});

// #6253: a boarded item's own PR stayed open and held, so assignments.mjs kept it on Eric's list
// beside the platter — on 2026-10-26 two of his four held-PR assignments were items already boarded.
// A real board, run against a stub `curl` that plays GitHub, so the close is proven end to end.
describe("ship platter board — closes the item's own PR with a pointer (#6253)", () => {
  const STUB_CURL = `#!/usr/bin/env bash
method=GET; url=""; data=""
while [ $# -gt 0 ]; do case "$1" in
  -X) method="$2"; shift 2 ;;
  --data-binary) data="$(cat)"; shift 2 ;;
  -H|-w) shift 2 ;;
  http*) url="$1"; shift ;;
  *) shift ;;
esac; done
printf '%s %s %s\\n' "$method" "$url" "$data" >> "$CURL_LOG"
case "$method $url" in
  "GET "*"state=all"*) out='[{"number":42,"body":""}]'; code=200 ;;
  "GET "*"platter/"*) out='[{"number":7}]'; code=200 ;;
  "GET "*"fix/item"*) out="$ITEM_PRS"; code=200 ;;
  "POST "*) out='{}'; code=201 ;;
  *) out='{}'; code=200 ;;
esac
printf '%s\\n__SHIP_HTTP__%s' "$out" "$code"
`;

  const boardWith = (itemPrs: string) => {
    const root = mkdtempSync(join(tmpdir(), "ship-board-close-"));
    const bin = join(root, "bin");
    const log = join(root, "curl.log");
    mkdirSync(bin);
    writeFileSync(join(bin, "curl"), STUB_CURL, { mode: 0o755 });
    writeFileSync(join(bin, "npx"), "#!/usr/bin/env bash\nexit 0\n", { mode: 0o755 }); // commitlint
    writeFileSync(log, "");
    const env = hermeticGitEnv({
      GH_TOKEN: "test-token-never-used",
      PATH: `${bin}:${process.env.PATH ?? ""}`,
      CURL_LOG: log,
      ITEM_PRS: itemPrs,
    });
    const git = (cwd: string, args: string[]) =>
      execFileSync("git", args, { cwd, encoding: "utf8", env, stdio: "pipe" });
    const work = join(root, "work");
    git(root, ["init", "-q", "--bare", "-b", "main", "origin.git"]);
    git(root, ["clone", "-q", join(root, "origin.git"), "work"]);
    git(work, ["config", "user.email", "spec@example.com"]);
    git(work, ["config", "user.name", "spec"]);
    // main carries this ship.sh, so the stale-script refusal lets the board through, and the
    // envelope, which the ledger's protected-path column reads from the working tree.
    mkdirSync(join(work, "scripts"));
    writeFileSync(join(work, "scripts", "ship.sh"), readFileSync("scripts/ship.sh"));
    writeFileSync(join(work, "envelope.json"), readFileSync("envelope.json"));
    git(work, ["add", "."]);
    git(work, ["commit", "-q", "-m", "chore: seed"]);
    git(work, ["push", "-q", "origin", "main"]);
    git(work, ["checkout", "-q", "-b", "fix/item"]);
    writeFileSync(join(work, "item.txt"), "item\n");
    git(work, ["add", "."]);
    git(work, ["commit", "-q", "-m", "fix: the item"]);
    git(work, ["push", "-q", "origin", "fix/item"]);
    git(work, ["checkout", "-q", "-b", "platter/2026-10-19", "main"]);
    git(work, ["push", "-q", "origin", "platter/2026-10-19"]);
    try {
      const stdout = execFileSync(
        "bash",
        [resolve("scripts/ship.sh"), "platter", "board", "fix/item", "--no-verify"],
        { cwd: work, encoding: "utf8", env, stdio: "pipe" },
      );
      const sha = git(work, ["rev-parse", "--short", "HEAD"]).trim();
      const remote = git(work, ["rev-parse", "--short", "origin/platter/2026-10-19"]).trim();
      return { stdout, sha, remote, calls: readFileSync(log, "utf8").trim().split("\n") };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };

  it("posts the pointer, then closes the item PR, after the platter is pushed", () => {
    const { stdout, sha, remote, calls } = boardWith('[{"number":42}]');
    expect(remote).toBe(sha); // the sha the pointer names already exists on the remote
    const comment = calls.findIndex(
      (c) => c.startsWith("POST ") && c.includes("/issues/42/comments"),
    );
    const close = calls.findIndex((c) => c.startsWith("PATCH ") && c.includes("/pulls/42 "));
    expect(comment).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(comment);
    expect(calls[comment]).toContain(`Boarded onto #7 as \`${sha}\`; lands with it.`);
    expect(calls[close]).toContain('{"state":"closed"}');
    expect(stdout).toContain("closed #42");
  });

  it("signs the pointer with the Claude Code footer, so it does not wake claude.yml", () => {
    const { calls } = boardWith('[{"number":42}]');
    const comment = calls.find((c) => c.includes("/issues/42/comments")) ?? "";
    expect(comment).toContain("[Claude Code](https://claude");
  });

  it("closes nothing, and still succeeds, when the item has no open PR", () => {
    const { stdout, calls } = boardWith("[]");
    expect(stdout).toContain("has no open PR — nothing to close");
    expect(calls.some((c) => c.includes("/issues/42/comments"))).toBe(false);
    expect(calls.some((c) => c.startsWith("PATCH ") && c.includes("/pulls/42 "))).toBe(false);
  });
});

describe("ship platter — the source contract", () => {
  const source = readFileSync("scripts/ship.sh", "utf8");

  it("applies hold-merge on --hold, so a held PR is enumerable and the arm job skips it", () => {
    // The gap #1343 measured: --hold set a flag and printed a line, and nothing recorded WHICH PRs
    // were waiting on Eric. You cannot batch what you cannot list.
    expect(source).toMatch(/issues\/\$num\/labels/);
    expect(source).toMatch(/"labels":\["hold-merge"\]/);
  });

  it("verifies the union as each item boards, and un-boards the item on red", () => {
    expect(source).toMatch(/npm run verify >\/tmp\/ship-platter-verify\.log/);
    expect(source).toMatch(/un-boarded it; the platter is unchanged/);
  });

  it("opens the platter held — never armed, whatever else changes around it", () => {
    expect(source).toMatch(/--body-file "\$bodyfile" --hold --no-verify/);
  });
});

describe("ship automerge — the source contract behind that", () => {
  const source = readFileSync("scripts/ship.sh", "utf8");

  it("reads the PR back rather than trusting the mutation's silence", () => {
    // The mutation can be accepted and still not queue. Only the stored state proves an arm.
    expect(source).toMatch(/reads back unarmed/);
    expect(source).toMatch(/auto_merge/);
  });

  it("names an exhausted budget specifically, so the operator knows it is not armed", () => {
    expect(source).toMatch(/GraphQL budget is exhausted/);
    expect(source).toMatch(/is NOT armed/);
  });

  it("still falls through to a direct merge when the PR is merely already green", () => {
    expect(source).toMatch(/clean status\|already in clean/);
    expect(source).toMatch(/merging directly/);
  });
});
