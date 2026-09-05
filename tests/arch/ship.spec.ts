import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// Ship contract gate — the eval Eric asked for after three PRs shipped with a literal "{}"
// description (docs/LESSONS.md 2026-08-15): a PR is a document, and ship.sh must refuse to open
// one without a real body. The refusal fires before verify/push, so exercising it here has no
// side effects. If someone re-introduces a silent body default, this goes red the same day.
const run = (args: string[], env: NodeJS.ProcessEnv = {}) => {
  try {
    const out = execFileSync("bash", ["scripts/ship.sh", ...args], {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, GH_TOKEN: "test-token-never-used", ...env },
    });
    return { code: 0, stderr: "", stdout: out.toString() };
  } catch (error) {
    const e = error as { status?: number; stderr?: Buffer; stdout?: Buffer };
    return {
      code: e.status ?? -1,
      stderr: e.stderr?.toString() ?? "",
      stdout: e.stdout?.toString() ?? "",
    };
  }
};

describe("ship open — the PR-description contract", () => {
  it("refuses to open a PR with no --body-file", () => {
    const { code, stderr } = run(["open", "test: no body"]);
    expect(code).toBe(1);
    expect(stderr).toContain("--body-file is required");
  });

  it("refuses an EMPTY body file — a blank document is no document", () => {
    const dir = mkdtempSync(join(tmpdir(), "ship-spec-"));
    const empty = join(dir, "empty.md");
    writeFileSync(empty, "");
    const { code, stderr } = run(["open", "test: empty body", "--body-file", empty]);
    rmSync(dir, { recursive: true, force: true });
    expect(code).toBe(1);
    expect(stderr).toContain("--body-file is required");
  });
});

// The picture/format contract (2026-08-20 hat-team research): comment-only format rules decay
// (fridge rule: 4/126 bodies), machine-checked ones hold. `checkbody` is the pure linter cmd_open
// runs before verify/push — existence and honesty gated, taste left to docs/PICTURES.md. The
// waiver line is first-class: an honest skip beats a decorative diagram on a typo fix.
describe("ship checkbody — the picture/format contract", () => {
  let dir: string;
  const body = (content: string) => {
    const f = join(dir, `${Math.random().toString(36).slice(2)}.md`);
    writeFileSync(f, content);
    return f;
  };
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ship-checkbody-"));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const PIC_MERMAID = [
    "## The picture",
    "",
    "```mermaid",
    "flowchart LR",
    "    a[form] --> b[issue]",
    "```",
    "",
    "_Caption — feedback flow, from the routing design_",
    "",
  ].join("\n");

  it("passes a captioned stable-type mermaid picture", () => {
    const { code } = run(["checkbody", body(`${PIC_MERMAID}\n## Summary\n\n- adds the thing\n`)]);
    expect(code).toBe(0);
  });

  // A pipe into `grep -q` is a trap under `set -o pipefail`: grep exits the instant it matches,
  // the writer takes SIGPIPE, and the pipeline reports 141 — so a body that DID match gets failed,
  // with a message accusing it of the opposite. It only bites once the picture section exceeds the
  // ~64KB pipe buffer, which is why it survived hundreds of small-fixture runs. The fix is a
  // here-string (no pipeline, nothing to signal); this pins it at a size that reproduced 5/5.
  it("passes a long picture section — no SIGPIPE false-negative on a body over the pipe buffer", () => {
    const filler = Array.from(
      { length: 2000 },
      (_, i) => `Filler line ${i} that pushes the picture section past the pipe buffer.`,
    ).join("\n");
    const long = `${PIC_MERMAID}${filler}\n\n## Summary\n\n- adds the thing\n`;
    expect(long.length).toBeGreaterThan(65536);
    const { code, stderr } = run(["checkbody", body(long)]);
    expect(stderr).not.toContain("neither media nor a waiver");
    expect(code).toBe(0);
  });

  it("passes an explicit waiver — trivial PRs stay cheap, skips stay visible", () => {
    const { code } = run([
      "checkbody",
      body(
        "## The picture\n\nPicture: waived — pure docs, no behavior change\n\n## Summary\n\n- fixes a typo\n",
      ),
    ]);
    expect(code).toBe(0);
  });

  it("refuses a body with no '## The picture' section", () => {
    const { code, stderr } = run(["checkbody", body("## Summary\n\n- does stuff\n")]);
    expect(code).toBe(1);
    expect(stderr).toContain("The picture");
  });

  it("accepts a captioned before/after table — the picture PICTURES.md prescribes for config", () => {
    // The gate used to demand an image or a mermaid, so a config change with the right picture had
    // to add a decorative diagram to pass. That is the waiver doctrine inverted (2026-08-22).
    const table = [
      "## The picture",
      "",
      "| | before | after |",
      "|---|---|---|",
      "| `workflows:` filter | absent | names + paths |",
      "",
      "_Caption — the trigger block, before and after this change._",
      "",
      "## Summary",
      "",
      "- restores the filter",
      "",
    ].join("\n");

    const { code } = run(["checkbody", body(table)]);
    expect(code).toBe(0);
  });

  it("refuses a picture section with neither media nor waiver", () => {
    const { code, stderr } = run([
      "checkbody",
      body("## The picture\n\nwords about a picture\n\n## Summary\n\n- does stuff\n"),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("waived");
  });

  it("refuses media without a filled caption — the template placeholder does not count", () => {
    const noCaption = PIC_MERMAID.replace(
      "_Caption — feedback flow, from the routing design_",
      "_Caption —_",
    );
    const { code, stderr } = run([
      "checkbody",
      body(`${noCaption}\n## Summary\n\n- adds the thing\n`),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("caption");
  });

  it("refuses mermaid types off the stable allowlist (journey is a UX chart)", () => {
    const { code, stderr } = run([
      "checkbody",
      body(
        "## The picture\n\n```mermaid\njourney\n    title day\n```\n\n_Caption — a chart_\n\n## Summary\n\n- x\n",
      ),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("journey");
  });

  it("refuses branch-form raw.githubusercontent URLs — they 404 at squash-merge (PR #446)", () => {
    const { code, stderr } = run([
      "checkbody",
      body(
        '## The picture\n\n<img src="https://raw.githubusercontent.com/o/r/my-branch/docs/shots/pr-9/x.jpg">\n\n_Caption — before/after of /login_\n\n## Summary\n\n- x\n',
      ),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("SHA-pinned");
  });

  it("accepts SHA-pinned raw URLs", () => {
    const sha = "a".repeat(40);
    const { code } = run([
      "checkbody",
      body(
        `## The picture\n\n<img src="https://raw.githubusercontent.com/o/r/${sha}/docs/shots/pr-9/x.jpg">\n\n_Caption — before/after of /login, npm run shoot:login_\n\n## Summary\n\n- x\n`,
      ),
    ]);
    expect(code).toBe(0);
  });

  it("refuses Summary bullets over 120 chars — one short line each (Eric, 2026-08-19)", () => {
    const long = `- ${"narrates every mechanical step ".repeat(5)}`;
    const { code, stderr } = run([
      "checkbody",
      body(`## The picture\n\nPicture: waived — chore\n\n## Summary\n\n${long}\n`),
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain("120");
  });
});

/**
 * `checkarm` — the merge-policy carve-out as an exit code rather than as a thing to remember.
 *
 * On 2026-08-26 a session read ship.sh's own carve-out header, ran `envelope-scan --check`, saw
 * `option-ticket.ts` come back protected, and armed auto-merge anyway by reasoning from the prose
 * class names ("workflow files, credentials, spend, outward-facing") instead of the answer it had
 * just been handed. Every ingredient of the correct decision was present and the decision was
 * still wrong, which is what makes a prose rule the wrong instrument here.
 */
describe("ship checkarm — the irreversible class never auto-merges", () => {
  it("refuses a diff touching a protected path, and names the path and the reason", () => {
    const { code, stderr } = run(["checkarm", "src/server/account-identity-gate.ts"]);

    expect(code).toBe(5);
    expect(stderr).toContain("REFUSED");
    expect(stderr).toContain("src/server/account-identity-gate.ts");
    expect(stderr).toContain("usable client");
  });

  it("still refuses when the protected path is buried among unprotected ones", () => {
    // The realistic shape: one line moved in a protected file, inside a large clean diff.
    const { code } = run([
      "checkarm",
      "src/trading/draft-order.ts",
      "tests/trading/draft-order.spec.ts",
      "src/server/account-identity-gate.ts",
      "docs/LESSONS.md",
    ]);

    expect(code).toBe(5);
  });

  it("clears a diff with nothing protected in it", () => {
    const { code, stdout } = run([
      "checkarm",
      "src/trading/draft-order.ts",
      "tests/trading/draft-order.spec.ts",
    ]);

    expect(code).toBe(0);
    expect(stdout).toContain("auto-merge may arm");
  });

  it("refuses to answer at all with no paths, rather than clearing an empty question", () => {
    // An empty argument list must never read as "nothing protected".
    expect(run(["checkarm"]).code).toBe(1);
  });
});

/**
 * ARMING MUST NOT LIE (2026-08-26).
 *
 * `cmd_automerge` decided success by the ABSENCE of an `"errors"` array. GitHub has two failure
 * shapes: a GraphQL-level one carrying `errors`, and an HTTP-level one — rate limit, bad token,
 * abuse block — carrying a bare `{"message": ...}` and no `errors` key at all. The second sailed
 * through, so the script printed "auto-merge armed on #N" over a PR that was never armed.
 *
 * Caught live on #659: `ship.sh automerge` reported success, and the PR read back `auto_merge:
 * null` seconds later. Same defect class as the rest of that day's findings — a check validating
 * the wrong artefact reports success forever — and the most expensive one, because a falsely-armed
 * PR looks handled and simply never merges.
 */
const classify = (body: string): string =>
  execFileSync(
    "bash",
    [
      "-c",
      // The predicate verbatim from cmd_automerge, so the spec cannot drift from the script.
      'gql="$1"; if grep -q \'"errors"\' <<<"$gql" || grep -q \'"message"\' <<<"$gql"; then echo failure; else echo success; fi',
      "_",
      body,
    ],
    { encoding: "utf8" },
  ).trim();

describe("ship automerge — an arm that failed never reports success", () => {
  it("treats a rate-limited arm as a failure, not a silent pass", () => {
    expect(
      classify(
        '{"message":"API rate limit exceeded for user ID 3472134.","documentation_url":"x"}',
      ),
    ).toBe("failure");
  });

  it("still catches the GraphQL-level shape it always caught", () => {
    expect(classify('{"errors":[{"message":"Pull request is in clean status"}]}')).toBe("failure");
  });

  it("lets a real success through", () => {
    expect(classify('{"data":{"enablePullRequestAutoMerge":{"pullRequest":{"number":659}}}}')).toBe(
      "success",
    );
  });
});

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
