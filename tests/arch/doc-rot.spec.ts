import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// Doc-rot fitness gate — runs the real scanner (scripts/doc-rot-scan.mjs) so docs that no longer
// describe reality can't accumulate silently. Contract: docs/plans/doc-rot-gate.md. The budget
// check below is advisory since 2026-08-29 (Eric) — see tests/support/advisory-scan.ts. The
// scanner-behavior specs further down are ordinary unit tests of the tool itself and stay blocking.
const SCRIPT = join(process.cwd(), "scripts/doc-rot-scan.mjs");

/**
 * Run the scanner in a seeded fixture repo; return {status, stdout+stderr}. The scanner reads
 * TRACKED files, so the seed is staged in a fresh git index unless `git: false` (no checkout at all).
 */
function scanFixture(
  seed: (root: string) => void,
  { git = true, args = [] }: { git?: boolean; args?: string[] } = {},
): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "doc-rot-fixture-"));
  try {
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { verify: "true" } }));
    seed(root);
    if (git) {
      execFileSync("git", ["init", "-q"], { cwd: root, env: hermeticGitEnv() });
      execFileSync("git", ["add", "-A"], { cwd: root, env: hermeticGitEnv() });
    }
    try {
      // The scanner shells out to git too — under `.husky/pre-push` an inherited GIT_DIR would point
      // it at the real repository instead of this fixture (see tests/support/hermetic-git.ts).
      const out = execFileSync("node", [SCRIPT, ...args], {
        cwd: root,
        encoding: "utf8",
        env: hermeticGitEnv(),
      });
      return { status: 0, out };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/** git in a fixture, with an identity, so a seed can build history (commits, deletions). */
function fixtureGit(root: string) {
  return (...args: string[]) =>
    execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
      cwd: root,
      env: hermeticGitEnv(),
      encoding: "utf8",
    }).trim();
}

describe("doc-rot budget (advisory)", () => {
  it("reports doc-rot findings without blocking CI", () => {
    advisoryScan(SCRIPT);
  });
});

// Structural-graph staleness is advisory too since 2026-09-30 (#4074): it measured an ambient
// property of `main`, not the diff, so it turned unrelated PRs red almost daily — see
// scripts/doc-rot-scan.mjs's header. Still printed on every run.
describe("structural graph freshness (advisory)", () => {
  it("reports docs/STRUCTURE-graph.md staleness without blocking CI", () => {
    advisoryScan(SCRIPT);
  });
});

// Check ③ degrades honestly (#3769 slice 1): an unreachable built-from commit is UNKNOWN (exit 3),
// never a silent pass, and a map more than STALE_COMMITS behind HEAD is stale (exit 2) however
// recent its date. Both run in seeded git repos, so the real repo's state never leaks in.
describe("structural graph freshness — honest degradation (seeded fixtures)", () => {
  const graphDoc = (sha: string) => `# Structural map\n\n- Built from commit: \`${sha}\`\n`;

  it("reports UNKNOWN with exit 3 when the built-from commit is not reachable", () => {
    const { status, out } = scanFixture((root) => {
      execFileSync("git", ["init", "-q"], { cwd: root, env: hermeticGitEnv() });
      writeFileSync(join(root, "docs", "STRUCTURE-graph.md"), graphDoc("deadbeef"));
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(3);
    expect(out).toContain("UNKNOWN");
  });

  it("fails with exit 2 on the commit count alone, however recent the map's date", () => {
    const { status, out } = scanFixture((root) => {
      const env = hermeticGitEnv();
      const git = (...args: string[]) =>
        execFileSync(
          "git",
          ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args],
          { cwd: root, env, encoding: "utf8" },
        ).trim();
      git("init", "-q");
      git("commit", "-q", "--allow-empty", "-m", "graph built here");
      const sha = git("rev-parse", "--short", "HEAD");
      writeFileSync(join(root, "docs", "STRUCTURE-graph.md"), graphDoc(sha));
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
      for (let i = 0; i < 51; i += 1) git("commit", "-q", "--allow-empty", "-m", `c${i}`);
    });
    expect(status).toBe(2);
    expect(out).toContain("51 commits");
  });

  it("measures from the commit that landed the snapshot when a squash orphaned the stamp", () => {
    const { status, out } = scanFixture((root) => {
      const env = hermeticGitEnv();
      const git = (...args: string[]) =>
        execFileSync(
          "git",
          ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args],
          { cwd: root, env, encoding: "utf8" },
        ).trim();
      git("init", "-q");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
      writeFileSync(join(root, "docs", "STRUCTURE-graph.md"), graphDoc("deadbeef"));
      git("add", "-A");
      git("commit", "-q", "-m", "squash-merged refresh");
      for (let i = 0; i < 51; i += 1) git("commit", "-q", "--allow-empty", "-m", `c${i}`);
    });
    expect(status).toBe(2);
    expect(out).toContain("51 commits");
    expect(out).toContain("landed in");
  });

  it("passes a map whose commit is reachable and within both thresholds", () => {
    const { status, out } = scanFixture((root) => {
      const env = hermeticGitEnv();
      const git = (...args: string[]) =>
        execFileSync(
          "git",
          ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args],
          { cwd: root, env, encoding: "utf8" },
        ).trim();
      git("init", "-q");
      git("commit", "-q", "--allow-empty", "-m", "graph built here");
      writeFileSync(
        join(root, "docs", "STRUCTURE-graph.md"),
        graphDoc(git("rev-parse", "--short", "HEAD")),
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
      git("commit", "-q", "--allow-empty", "-m", "one later commit");
    });
    expect(status).toBe(0);
    expect(out).toContain("structural graph is fresh");
  });
});

describe("doc-rot scanner behavior (seeded fixtures)", () => {
  it("flags a doc referencing a repo file that does not exist", () => {
    const { status, out } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "GUIDE.md"), "See `src/missing/thing.ts` for details.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("src/missing/thing.ts");
  });

  it("accepts references that resolve from the repo root or the doc's own directory", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "REAL.md"), "# real");
      writeFileSync(join(root, "docs", "GUIDE.md"), "See [the doc](REAL.md) and `docs/REAL.md`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("accepts bare-basename prose shorthand for a file living in docs/", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "IDEAS.md"), "# ideas");
      writeFileSync(join(root, "CLAUDE.md"), "Log the worthy ones to `IDEAS.md`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("flags docs naming npm scripts that package.json does not define", () => {
    const { status, out } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "GUIDE.md"), "Run `npm run does-not-exist` to verify.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("npm run does-not-exist");
  });

  it("treats git-ignored refs as declared local artifacts, not rot (CI parity)", () => {
    // The class that broke CI parity: a doc referencing a runtime/local file (settings.local.json,
    // data logs) that exists on a dev machine but never in a fresh checkout. The committed ignore
    // rules — identical in both environments — are the arbiter, not the file's presence.
    const { status } = scanFixture((root) => {
      execFileSync("git", ["init", "-q"], { cwd: root, env: hermeticGitEnv() });
      writeFileSync(join(root, ".gitignore"), "docs/local-settings.json\n");
      writeFileSync(join(root, "docs", "GUIDE.md"), "Saved to `docs/local-settings.json`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("ignores URLs, globs, and placeholder tokens", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(
        join(root, "docs", "GUIDE.md"),
        "See https://example.com/x.md and `src/**/*.ts` and `<your-file>.md` and `$HOME/x.md`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("reads npm scripts from the package a command targets (`--prefix app`, `cd app &&`)", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "app"));
      writeFileSync(join(root, "app", "package.json"), JSON.stringify({ scripts: { build: "x" } }));
      writeFileSync(
        join(root, "docs", "GUIDE.md"),
        "`npm run build --prefix app` · `cd app && npm ci && npm run build` · `npm --prefix app run gone`",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("npm run gone (in app/)");
    expect(out).not.toContain("npm run build");
  });

  it("fails only when rot exceeds the committed budget (grandfathering holds)", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(join(root, "docs", "GUIDE.md"), "See `src/gone.ts`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 1 }));
    });
    expect(status).toBe(0);
  });
});

// The widened surface: every tracked instruction file, wherever it lives, minus the ledgers that
// describe their own moment.
describe("doc-rot scan surface", () => {
  it("reads instruction files under .claude/**", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, ".claude", "skills", "steer"), { recursive: true });
      writeFileSync(
        join(root, ".claude", "skills", "steer", "SKILL.md"),
        "Run `scripts/gone.mjs`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain(".claude/skills/steer/SKILL.md → scripts/gone.mjs");
  });

  it("skips the ledgers — research, LESSONS.md — which describe their own moment", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "docs", "research"));
      writeFileSync(join(root, "docs", "research", "nvda.md"), "Built from `src/retired.ts`.");
      writeFileSync(join(root, "docs", "LESSONS.md"), "It lived in `scripts/retired.mjs`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
    expect(out).toContain("findings: 0 across 0 instruction files");
  });

  it("skips numbered ADRs and dated records but reads every template, even inside a ledger", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "docs", "adr"));
      mkdirSync(join(root, "docs", "digests"));
      writeFileSync(join(root, "docs", "adr", "0008-fitness.md"), "Proposed `docs/ROADMAP.md`.");
      writeFileSync(join(root, "docs", "GAMEBOARD-PLAN.md"), "Verified at `src/gone.ts`.");
      writeFileSync(join(root, "docs", "adr", "0000-template.md"), "Link `docs/adr-gone.md`.");
      writeFileSync(join(root, "docs", "digests", "TEMPLATE.md"), "Run `scripts/gone.mjs`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("docs/adr/0000-template.md → docs/adr-gone.md");
    expect(out).toContain("docs/digests/TEMPLATE.md → scripts/gone.mjs");
    expect(out).not.toContain("ROADMAP");
    expect(out).not.toContain("src/gone.ts");
    expect(out).toContain("findings: 2 across 2 instruction files");
  });

  it("lists every finding on the bare command — the form the harness pre-approves", () => {
    const { out } = scanFixture((root) => {
      const cites = Array.from({ length: 20 }, (_, i) => `\`src/gone-${i}.ts\``).join(" ");
      writeFileSync(join(root, "docs", "GUIDE.md"), cites);
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(out).toContain("src/gone-19.ts");
    expect(out).not.toContain("more");
  });

  it("reports UNKNOWN (exit 3), never a pass on zero files, outside a git checkout", () => {
    const { status, out } = scanFixture(
      (root) => {
        writeFileSync(join(root, "docs", "GUIDE.md"), "See `src/gone.ts`.");
        writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
      },
      { git: false },
    );
    expect(status).toBe(3);
    expect(out).toContain("not a git checkout");
  });
});

describe("doc-rot bare names and placeholders", () => {
  it("resolves a bare basename against the citing file's own directory", () => {
    const { status } = scanFixture((root) => {
      mkdirSync(join(root, ".claude", "agents"), { recursive: true });
      writeFileSync(join(root, ".claude", "agents", "mortician.md"), "# mortician");
      writeFileSync(
        join(root, ".claude", "agents", "decomposer.md"),
        "Hand off to `mortician.md`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("resolves a bare basename against any tracked file of that name", () => {
    const { status } = scanFixture((root) => {
      mkdirSync(join(root, "docs", "art"));
      writeFileSync(join(root, "docs", "art", "EYE.md"), "# eye");
      mkdirSync(join(root, ".claude", "agents"), { recursive: true });
      writeFileSync(join(root, ".claude", "agents", "piece-wright.md"), "Read `EYE.md` first.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("still flags a bare basename no tracked file carries", () => {
    const { status, out } = scanFixture((root) => {
      writeFileSync(join(root, "CLAUDE.md"), "Read `ORPHAN.md` first.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("CLAUDE.md → ORPHAN.md");
  });

  it("flags a bare name a deleted file carried, but not a name this repo never had", () => {
    const { status, out } = scanFixture((root) => {
      const git = fixtureGit(root);
      git("init", "-q");
      mkdirSync(join(root, "app"));
      writeFileSync(join(root, "app", "decision-pager.tsx"), "export {};\n");
      git("add", "-A");
      git("commit", "-q", "-m", "add the pager");
      git("rm", "-q", "app/decision-pager.tsx");
      git("commit", "-q", "-m", "retire the pager");
      writeFileSync(
        join(root, "docs", "IA.md"),
        "Unrendered since `decision-pager.tsx:11`; lint with `biome.json`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("docs/IA.md → decision-pager.tsx");
    expect(out).not.toContain("biome.json");
  });

  it("names a shallow clone instead of undercounting — and refuses to --update from one", () => {
    const seed = (root: string) => {
      const git = fixtureGit(root);
      git("init", "-q");
      mkdirSync(join(root, "app"));
      writeFileSync(join(root, "app", "decision-pager.tsx"), "export {};\n");
      git("add", "-A");
      git("commit", "-q", "-m", "add the pager");
      git("rm", "-q", "app/decision-pager.tsx");
      git("commit", "-q", "-m", "retire the pager");
      // A shallow clone is a repository with a graft file: history behind HEAD is cut.
      writeFileSync(join(root, ".git", "shallow"), `${git("rev-parse", "HEAD")}\n`);
      writeFileSync(join(root, "docs", "IA.md"), "Unrendered since `decision-pager.tsx:11`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    };
    const scan = scanFixture(seed);
    expect(scan.status).toBe(0);
    expect(scan.out).not.toContain("→ decision-pager.tsx");
    expect(scan.out).toContain("shallow clone");
    const update = scanFixture(seed, { args: ["--update"] });
    expect(update.status).toBe(3);
    expect(update.out).toContain("shallow clone");
  });

  it("never reports a placeholder name — a digit template or a metasyntactic word", () => {
    const { status } = scanFixture((root) => {
      mkdirSync(join(root, "docs", "adr"));
      writeFileSync(
        join(root, "docs", "adr", "README.md"),
        "Copy the template to `NNNN-short-title.md`; promote it to `scripts/foo.mjs`; see `example.md`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });

  it("reads a code span that labels a link as the link's text, not a citation", () => {
    const { status } = scanFixture((root) => {
      writeFileSync(
        join(root, "docs", "GUIDE.md"),
        "Evidence: [`synthesis.md`](https://github.com/o/r/blob/abc/docs/synthesis.md).",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });
});

describe("doc-rot line cites", () => {
  const threeLines = "one\ntwo\nthree\n";

  it("flags a `path:N` cite past the end of a file that exists", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "src"));
      writeFileSync(join(root, "src", "reduce.ts"), threeLines);
      writeFileSync(join(root, "docs", "GUIDE.md"), "The reducer drops it (`src/reduce.ts:73`).");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("dead-line");
    expect(out).toContain("src/reduce.ts:73 (src/reduce.ts has 3 lines)");
  });

  it("flags a range whose end runs past the file, and a bare name that resolves uniquely", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "src"));
      writeFileSync(join(root, "src", "reduce.ts"), threeLines);
      writeFileSync(join(root, "docs", "GUIDE.md"), "See `reduce.ts:2-9`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("reduce.ts:2-9 (src/reduce.ts has 3 lines)");
  });

  it("checks a TanStack route file whose name carries a `$` param — it is not an env ref", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "app", "src", "routes"), { recursive: true });
      writeFileSync(join(root, "app", "src", "routes", "u.$id.thesis.tsx"), threeLines);
      writeFileSync(
        join(root, "docs", "IA.md"),
        "Drawn at `u.$id.thesis.tsx:38` and `app/src/routes/u.$id.gone.tsx`; saved under `$HOME/x.md`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("u.$id.thesis.tsx:38 (app/src/routes/u.$id.thesis.tsx has 3 lines)");
    expect(out).toContain("docs/IA.md → app/src/routes/u.$id.gone.tsx");
    expect(out).not.toContain("$HOME");
  });

  it("passes a `path:N` cite inside the file, and a line:column cite", () => {
    const { status } = scanFixture((root) => {
      mkdirSync(join(root, "src"));
      writeFileSync(join(root, "src", "reduce.ts"), threeLines);
      writeFileSync(
        join(root, "docs", "GUIDE.md"),
        "See `src/reduce.ts:3` and `src/reduce.ts:2:40`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(0);
  });
});

// Model IDs are judged against the IDs the code itself runs (src/, scripts/, .github/workflows/) —
// no hand-kept list. The IDs below are invented so they can never collide with a real one.
describe("doc-rot model IDs", () => {
  it("flags a model ID nothing runs and passes the one a script calls", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "scripts"));
      writeFileSync(join(root, "scripts", "lane.mjs"), 'const model = "claude-sonnet-90-1";\n');
      writeFileSync(
        join(root, "CLAUDE.md"),
        "Lanes run `claude-sonnet-90-1`; the coach still says `claude-opus-80-2`.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("stale-model");
    expect(out).toContain("claude-opus-80-2");
    expect(out).not.toContain("claude-sonnet-90-1 —");
  });

  it("reads only the version-shaped part of an ID — a word after it is never part of it", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "scripts"));
      writeFileSync(join(root, "scripts", "lane.mjs"), 'const model = "claude-sonnet-90-1";\n');
      writeFileSync(
        join(root, "CLAUDE.md"),
        "Use `claude-sonnet-90-1-class` models; see claude-sonnet-90-1-and-claude-opus-80-2.",
      );
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("CLAUDE.md → claude-opus-80-2 —");
    expect(out).not.toContain("class");
    expect(out).not.toContain("claude-sonnet-90-1-and");
    expect(out).toContain("findings: 1 across");
  });

  it("ignores IDs that only a spec or a doc names when deciding what is in use", () => {
    const { status, out } = scanFixture((root) => {
      mkdirSync(join(root, "tests"));
      writeFileSync(join(root, "tests", "lane.spec.ts"), 'expect("claude-haiku-70-3")\n');
      writeFileSync(join(root, "README.md"), "Cheap work runs on `claude-haiku-70-3`.");
      writeFileSync(join(root, "doc-rot-budget.json"), JSON.stringify({ findings: 0 }));
    });
    expect(status).toBe(1);
    expect(out).toContain("README.md → claude-haiku-70-3");
  });
});
