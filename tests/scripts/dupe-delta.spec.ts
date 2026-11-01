import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
// @ts-expect-error — plain .mjs helper, no types.
import { bodyOf, reuseDelta } from "../../scripts/dupe-delta.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// The reuse delta answers one question for one change: which copies did THIS change add? The whole-
// tree scan cannot, because it is red on standing debt on main. A name match alone was about half
// noise in the backtest (homonyms, moves, governed consolidations), so a row prints only when the
// bodies match; a same-named definition with a different body stays out of the printed list.
const SCAN = join(process.cwd(), "scripts/dupe-scan.mjs");
const repos: string[] = [];

function repo(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "dupe-delta-"));
  repos.push(dir);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: dir, env: hermeticGitEnv(), encoding: "utf8" });
  git("init", "-q");
  git("config", "user.email", "spec@example.com");
  git("config", "user.name", "spec");
  const write = (next: Record<string, string | null>) => {
    for (const [path, text] of Object.entries(next)) {
      const full = join(dir, path);
      if (text === null) {
        rmSync(full);
      } else {
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, text);
      }
    }
    git("add", "-A");
    git("commit", "-q", "-m", "x");
    return git("rev-parse", "HEAD").trim();
  };
  const base = write(files);
  return { dir, base, change: write, git };
}

afterAll(() => {
  for (const dir of repos) rmSync(dir, { recursive: true, force: true });
});

const BLANK =
  "export const blank = (value: string | undefined) => !value || value.trim() === '';\n";

describe("the bodies a delta compares", () => {
  it("ignores formatting, comments, types and export, so a real paste still matches", () => {
    const typed = "export const blank = (value: string) => !value; // a helper\n";
    const bare = "const blank = (value) =>\n  // pasted\n  !value;\n";
    expect(bodyOf(typed, "blank")).toBe(bodyOf(bare, "blank"));
  });

  it("tells apart two bodies that differ in what they do", () => {
    const fraction = "export const pct = (v: number) => (v * 100).toFixed(0);\n";
    const percent = "export const pct = (v: number) => v.toFixed(0);\n";
    expect(bodyOf(fraction, "pct")).not.toBe(bodyOf(percent, "pct"));
  });

  it("reads a multi-line function to its closing brace, past a return type and a template", () => {
    const text = [
      "export function page(a: { x: number }): { y: string } {",
      "  return {",
      "    y: `",
      "}",
      "`,",
      "  };",
      "}",
      "",
      "export const after = 1;",
      "",
    ].join("\n");
    expect(bodyOf(text, "page")).toContain("return");
    expect(bodyOf(text, "page")).not.toContain("after");
  });
});

describe("reuse delta", () => {
  it("names a pasted helper and its existing home, on either side of the app boundary", () => {
    const { dir, base, change } = repo({ "src/a/existing.ts": BLANK });
    const head = change({ "app/src/b/new.ts": BLANK });
    const { pastes } = reuseDelta({ cwd: dir, base, head });
    expect(pastes).toEqual([
      {
        name: "blank",
        added: [{ file: "app/src/b/new.ts", line: 1 }],
        existing: [{ file: "src/a/existing.ts", line: 1 }],
      },
    ]);
  });

  it("keeps a same-named definition with a different body out of the pastes", () => {
    const { dir, base, change } = repo({ "src/a.ts": "export const rankOf = (r) => r.rank;\n" });
    const head = change({ "src/b.ts": "export const rankOf = (m) => m.get('rank') ?? 0;\n" });
    const delta = reuseDelta({ cwd: dir, base, head });
    expect(delta.pastes).toEqual([]);
    expect(delta.sameName.map((row: { name: string }) => row.name)).toEqual(["rankOf"]);
  });

  it("does not call a moved helper a copy", () => {
    const { dir, base, change } = repo({ "src/a.ts": BLANK });
    const head = change({ "src/a.ts": null, "src/b.ts": BLANK });
    expect(reuseDelta({ cwd: dir, base, head }).pastes).toEqual([]);
  });

  // The dedupe cycle's whole job: one new home while some copies stay for a later cycle. That is a
  // consolidation, the opposite of a paste, and it fired on every governed cycle in the backtest.
  it("does not call a partial consolidation a copy", () => {
    const { dir, base, change } = repo({ "src/a.ts": BLANK, "src/b.ts": BLANK, "src/c.ts": BLANK });
    const head = change({ "src/a.ts": "export const other = 1;\n", "src/home.ts": BLANK });
    expect(reuseDelta({ cwd: dir, base, head }).pastes).toEqual([]);
  });

  it("does not fire on a definition the file already had", () => {
    const { dir, base, change } = repo({ "src/a.ts": BLANK, "src/b.ts": BLANK });
    const head = change({ "src/b.ts": `${BLANK}export const added = 1;\n` });
    expect(reuseDelta({ cwd: dir, base, head }).pastes).toEqual([]);
  });

  it("collapses one helper pasted into two new files to one row", () => {
    const { dir, base, change } = repo({ "src/keep.ts": "export const keep = 1;\n" });
    const head = change({ "src/x.ts": BLANK, "src/y.ts": BLANK });
    const { pastes } = reuseDelta({ cwd: dir, base, head });
    expect(pastes).toHaveLength(1);
    expect(pastes[0].added.map((a: { file: string }) => a.file)).toEqual(["src/x.ts", "src/y.ts"]);
  });

  it("leaves out specs, generated files and the names the scan already ignores", () => {
    const route = "export const Route = 1;\n";
    const { dir, base, change } = repo({ "app/src/r/a.tsx": route, "src/a.ts": BLANK });
    const head = change({
      "app/src/r/b.tsx": route,
      "src/a.spec.ts": BLANK,
      "src/b.gen.ts": BLANK,
      "src/c.d.ts": BLANK,
    });
    expect(reuseDelta({ cwd: dir, base, head }).pastes).toEqual([]);
  });
});

describe("ship open's reuse line", () => {
  const ship = readFileSync("scripts/ship.sh", "utf8");
  const open = ship.slice(ship.indexOf("cmd_open() {"), ship.indexOf("# checkarm —"));
  const line = 'node scripts/dupe-scan.mjs --diff "origin/$base" 2>/dev/null || true';

  it("asks about this change against the PR's own base, and can never stop the ship", () => {
    expect(open).toContain(line);
  });

  it("speaks before the push, while the fix is still one import", () => {
    expect(open.indexOf(line)).toBeLessThan(open.indexOf('cmd_push "$branch"'));
  });
});

describe("dupe-scan --diff", () => {
  const scan = (cwd: string, ...args: string[]) =>
    spawnSync("node", [SCAN, ...args], { cwd, env: hermeticGitEnv(), encoding: "utf8" });

  it("prints one line per paste and exits 0, advisory", () => {
    const { dir, base, change } = repo({ "src/a.ts": BLANK });
    change({ "src/b.ts": BLANK });
    const run = scan(dir, "--diff", base);
    expect(run.status).toBe(0);
    expect(run.stdout.trim().split("\n")).toEqual([
      expect.stringMatching(/blank.*src\/b\.ts:1.*src\/a\.ts:1/),
    ]);
  });

  it("stays silent on stdout when the change adds no copy, so ship prints nothing", () => {
    const { dir, base, change } = repo({ "src/a.ts": BLANK });
    change({ "src/b.ts": "export const blank = (v) => v === null;\n" });
    const run = scan(dir, "--diff", base);
    expect(run.status).toBe(0);
    expect(run.stdout).toBe("");
    expect(run.stderr).toContain("0 copies");
    expect(run.stderr).not.toContain("Warning");
  });

  it("lists same-named definitions only when asked", () => {
    const { dir, base, change } = repo({ "src/a.ts": BLANK });
    change({ "src/b.ts": "export const blank = (v) => v === null;\n" });
    const run = scan(dir, "--diff", base, "--names");
    expect(run.stdout).toMatch(/blank.*src\/b\.ts:1.*src\/a\.ts:1/);
    expect(run.stdout).not.toContain("copy");
  });

  it("says unknown, never clean, when it cannot read the base", () => {
    const { dir } = repo({ "src/a.ts": BLANK });
    const run = scan(dir, "--diff", "no-such-ref");
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("no-such-ref");
    expect(scan(dir, "--diff").status).toBe(2);
  });

  it("still runs the whole-tree report without the flag", () => {
    const { dir } = repo({ "src/a.ts": BLANK, "src/b.ts": BLANK });
    expect(scan(dir).stdout).toContain("Duplication scan");
  });
});
