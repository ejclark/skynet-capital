import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { pathLiterals, resolutions, scan } from "../../scripts/ignored-fixture-scan.mjs";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// On 2026-11-01 a spec read a `.log` fixture that `*.log` kept out of every commit: green on the
// laptop, red in CI on a missing file (#6470). This pins the check that would have caught it first.

/** A scratch repo holding these files, committed except for what .gitignore keeps out. */
function repoWith(files: Record<string, string>, force: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), "ignored-fixture-"));
  const env = hermeticGitEnv({});
  const git = (args: string[]) => execFileSync("git", args, { cwd: root, env, stdio: "pipe" });
  git(["init", "-q", "-b", "main", "."]);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  git(["add", "."]);
  if (force.length) git(["add", "-f", ...force]);
  return { root, env, done: () => rmSync(root, { recursive: true, force: true }) };
}

describe("ignored-fixture-scan: the repo", () => {
  it("has no spec naming a fixture git would leave out of a commit", () => {
    const findings = scan();
    expect(findings.map((f) => `${f.file}:${f.line} ${f.path} (${f.rule})`)).toEqual([]);
  });
});

describe("ignored-fixture-scan: the 2026-11-01 incident, replayed", () => {
  const SPEC = `import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const realLog = readFileSync(
  resolve("tests/fixtures/circuit-breaker/run-38985010210-opex-leg.log"),
  "utf8",
);
`;

  it("names the spec, the fixture and the rule that hid it", () => {
    const { root, env, done } = repoWith({
      ".gitignore": "*.log\n",
      "tests/arch/research-circuit-breaker.spec.ts": SPEC,
      "tests/fixtures/circuit-breaker/run-38985010210-opex-leg.log": "##[notice]cost usd=1\n",
    });
    try {
      expect(scan({ cwd: root, env })).toEqual([
        {
          file: "tests/arch/research-circuit-breaker.spec.ts",
          line: 4,
          literal: "tests/fixtures/circuit-breaker/run-38985010210-opex-leg.log",
          path: "tests/fixtures/circuit-breaker/run-38985010210-opex-leg.log",
          rule: ".gitignore:1:*.log",
        },
      ]);
    } finally {
      done();
    }
  });

  it("fires before the fixture exists, on the name alone", () => {
    const { root, env, done } = repoWith({ ".gitignore": "*.log\n", "tests/a.spec.ts": SPEC });
    try {
      expect(scan({ cwd: root, env })).toHaveLength(1);
    } finally {
      done();
    }
  });

  it("passes once the fixture is renamed out of the rule, as the fix did", () => {
    const { root, env, done } = repoWith({
      ".gitignore": "*.log\n",
      "tests/a.spec.ts": SPEC.replace(".log", ".txt"),
      "tests/fixtures/circuit-breaker/run-38985010210-opex-leg.txt": "x\n",
    });
    try {
      expect(scan({ cwd: root, env })).toEqual([]);
    } finally {
      done();
    }
  });

  it("passes a fixture that matches a rule but is tracked anyway", () => {
    const fixture = "tests/fixtures/circuit-breaker/run-38985010210-opex-leg.log";
    const { root, env, done } = repoWith(
      { ".gitignore": "*.log\n", "tests/a.spec.ts": SPEC, [fixture]: "x\n" },
      [fixture],
    );
    try {
      expect(scan({ cwd: root, env })).toEqual([]);
    } finally {
      done();
    }
  });

  it("catches a folder rule reaching into the spec tree, from a path relative to the spec", () => {
    const { root, env, done } = repoWith({
      ".gitignore": "data/\n",
      "tests/b.spec.ts": 'const u = new URL("./fixtures/data/prices.json", import.meta.url);\n',
    });
    try {
      expect(scan({ cwd: root, env }).map((f) => [f.path, f.rule])).toEqual([
        ["tests/fixtures/data/prices.json", ".gitignore:1:data/"],
      ]);
    } finally {
      done();
    }
  });
  it("passes a fixture a later `!` rule un-ignores", () => {
    const { root, env, done } = repoWith({
      ".gitignore": ".env.*\n!.env.example\n",
      "tests/c.spec.ts": 'readFileSync("tests/fixtures/.env.example")\n',
    });
    try {
      expect(scan({ cwd: root, env })).toEqual([]);
    } finally {
      done();
    }
  });
});

describe("ignored-fixture-scan: which literals count", () => {
  it("reads quoted paths, and skips interpolation, URLs, specifiers and absolute paths", () => {
    const source = [
      'readFileSync("tests/fixtures/a.json")',
      // An interpolated path, written with \u0024 so the source holds no template placeholder.
      "readFileSync(`tests/\u0024{name}.log`)",
      'fetch("https://example.com/a.log")',
      'import x from "node:fs"',
      'import y from "@rstest/core"',
      'writeFileSync("/tmp/out.log", "")',
      "join(here, 'fixtures/b.log')",
    ].join("\n");
    expect(pathLiterals(source)).toEqual([
      { literal: "tests/fixtures/a.json", line: 1 },
      { literal: "fixtures/b.log", line: 7 },
    ]);
  });

  it("resolves only a fixture's shapes, and only inside a spec tree", () => {
    const spec = "tests/scripts/x.spec.ts";
    expect(resolutions(spec, "tests/fixtures/a.log")).toEqual(["tests/fixtures/a.log"]);
    expect(resolutions(spec, "./fixtures/a.log")).toEqual(["tests/scripts/fixtures/a.log"]);
    expect(resolutions(spec, "../fixtures/a.log")).toEqual(["tests/fixtures/a.log"]);
    expect(resolutions(spec, "fixtures/a.log")).toEqual(["tests/scripts/fixtures/a.log"]);
    // What a spec writes into its own temp folder, and the expected values it asserts.
    expect(resolutions(spec, "curl.log")).toEqual([]);
    expect(resolutions(spec, "data/allowlist.json")).toEqual([]);
    // Out of the spec trees altogether.
    expect(resolutions(spec, "../../data/a.json")).toEqual([]);
    // An app spec runs from app/, so its root-relative paths start there.
    expect(resolutions("app/tests/y.spec.ts", "tests/fixtures/a.log")).toEqual([
      "app/tests/fixtures/a.log",
    ]);
  });
});
