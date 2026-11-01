import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
import { hermeticGitEnv } from "../support/hermetic-git.js";

// THE ARM JOB'S SELF-EDIT HOLE (2026-11-01, #6470's study). pipeline.yml's `arm auto-merge` job
// checks out the PR's merge ref and asked THAT tree's envelope.json and envelope-scan.mjs whether
// the diff was protected — so a green PR that dropped a rule from the list, or taught --check to
// answer false, read as unprotected and armed its own merge. The step now takes both files from
// the base commit. This spec runs the step's real `run:` block, lifted from the YAML, against a
// temp repository that stages exactly that attack, and expects the step to refuse to arm. (Never
// tried live: the PR that would prove it is the hole.)
const PIPELINE = ".github/workflows/pipeline.yml";

/** The `run: |` block of the envelope step, with the two event expressions replaced by shell vars. */
function stepScript(): string {
  const text = readFileSync(PIPELINE, "utf8");
  const start = text.indexOf("name: Is the diff protected?");
  expect(start, `${PIPELINE} must still carry the envelope step`).toBeGreaterThan(-1);
  const step = text.slice(start, text.indexOf("\n      - name:", start + 1));
  const run = /\n {8}run: \|\n((?:(?: {10}[^\n]*)?\n)+)/.exec(step)?.[1];
  expect(run, "the envelope step must be a `run: |` block").toBeTruthy();
  return (run as string)
    .split("\n")
    .map((l) => l.replace(/^ {10}/, ""))
    .join("\n")
    .replaceAll("${{ github.event.pull_request.base.sha }}", "$BASE_SHA")
    .replaceAll("${{ github.event.pull_request.head.sha }}", "$HEAD_SHA");
}

describe("arm auto-merge reads the protected list and the scanner from the base sha", () => {
  let dir: string;
  let base: string;
  let attack: string;
  let honest: string;
  const env = hermeticGitEnv();
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "user.email=spec@example.com", "-c", "user.name=spec", ...args], {
      cwd: dir,
      encoding: "utf8",
      env,
    }).trim();

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "arm-base-"));
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, "secret"));
    mkdirSync(join(dir, "open"));
    git("init", "-q", "-b", "main");
    // The base: a manifest protecting secret/**, and the real scanner.
    writeFileSync(
      join(dir, "envelope.json"),
      JSON.stringify({ lanes: [], protected: [{ pattern: "secret/**", why: "the crown jewels" }] }),
    );
    writeFileSync(
      join(dir, "scripts/envelope-scan.mjs"),
      readFileSync("scripts/envelope-scan.mjs"),
    );
    writeFileSync(join(dir, "open/a.txt"), "open\n");
    git("add", "-A");
    git("commit", "-q", "-m", "base");
    base = git("rev-parse", "HEAD");
    // The attack: one commit that drops the rule, blinds --check, and touches the protected path.
    git("checkout", "-q", "-b", "attack");
    writeFileSync(join(dir, "envelope.json"), JSON.stringify({ lanes: [], protected: [] }));
    writeFileSync(
      join(dir, "scripts/envelope-scan.mjs"),
      "console.log(JSON.stringify(process.argv.slice(3).map((path) => ({ path, protected: false, blocking: false }))));\n",
    );
    writeFileSync(join(dir, "secret/key.txt"), "stolen\n");
    git("add", "-A");
    git("commit", "-q", "-m", "attack");
    attack = git("rev-parse", "HEAD");
    // An honest PR off the same base: touches only an open path.
    git("checkout", "-q", "-b", "honest", base);
    writeFileSync(join(dir, "open/a.txt"), "edited\n");
    git("add", "-A");
    git("commit", "-q", "-m", "honest");
    honest = git("rev-parse", "HEAD");
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  /** Run the step as the arm job would: the head checked out, bash -e, GITHUB_OUTPUT captured. */
  function armStep(head: string) {
    git("checkout", "-q", head);
    const runnerTemp = mkdtempSync(join(tmpdir(), "runner-temp-"));
    const output = join(runnerTemp, "output");
    writeFileSync(output, "");
    let stdout = "";
    let code = 0;
    try {
      stdout = execFileSync("bash", ["-e", "-c", stepScript()], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...env,
          BASE_SHA: base,
          HEAD_SHA: head,
          RUNNER_TEMP: runnerTemp,
          GITHUB_OUTPUT: output,
        },
        stdio: "pipe",
      });
    } catch (error) {
      const e = error as { status?: number; stdout?: Buffer };
      code = e.status ?? -1;
      stdout = e.stdout?.toString() ?? "";
    }
    const written = readFileSync(output, "utf8");
    rmSync(runnerTemp, { recursive: true, force: true });
    return { code, stdout, written };
  }

  it("refuses to arm a PR that drops the rule and blinds the scanner in its own tree", () => {
    const r = armStep(attack);
    expect(r.code).toBe(0);
    expect(r.written).toContain("blocking=true");
    expect(r.stdout).toContain("not arming");
    expect(r.stdout).toContain("secret/key.txt");
  });

  it("still arms an honest PR off the same base", () => {
    const r = armStep(honest);
    expect(r.code).toBe(0);
    expect(r.written).toContain("blocking=false");
  });

  it("names, in the step itself, what a base read cannot stop: an edit to the job's own workflow file", () => {
    const text = readFileSync(PIPELINE, "utf8");
    const step = text.slice(text.indexOf("name: Is the diff protected?"));
    expect(step.slice(0, step.indexOf("\n      - name:", 1))).toMatch(
      /WORKFLOW FILE from the merge commit/,
    );
  });
});
