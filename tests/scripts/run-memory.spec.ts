import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

const SCRIPT = resolve("scripts/run-memory.mjs");

function cli(dir: string, ...args: string[]) {
  return spawnSync("node", [SCRIPT, ...args], {
    encoding: "utf8",
    env: { ...process.env, AGENT_RUNS_DIR: dir },
  });
}

function startRun(dir: string) {
  const res = cli(
    dir,
    "start",
    "bots",
    "--outcome",
    "o",
    "--scope",
    "s",
    "--keep",
    "k",
    "--evidence",
    "e",
    "--approval",
    "a",
  );
  expect(res.status).toBe(0);
  return res.stdout.trim();
}

function attempt(dir: string, run: string, changed?: string) {
  const args = ["attempt", run, "--class", "crash", "--action", "start", "--result", "fell over"];
  if (changed) args.push("--changed", changed);
  return cli(dir, ...args);
}

describe("run memory", () => {
  it("refuses to start a run that has not said what done means", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    expect(cli(dir, "start", "bots", "--outcome", "o").status).toBe(2);
  });

  it("refuses a retry that changes nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    expect(attempt(dir, run, "first image").status).toBe(0);
    expect(attempt(dir, run).status).toBe(4);
    expect(attempt(dir, run, "First Image ").status).toBe(4);
    expect(attempt(dir, run, "newer image").status).toBe(0);
  });

  it("stops a failure class at its budget, even with a new change each time", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    for (const changed of ["a", "b", "c"]) expect(attempt(dir, run, changed).status).toBe(0);
    const fourth = attempt(dir, run, "d");
    expect(fourth.status).toBe(3);
    expect(fourth.stderr).toContain("budget spent");
  });

  it("budgets each failure class apart", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    for (const changed of ["a", "b", "c"]) attempt(dir, run, changed);
    expect(cli(dir, "attempt", run, "--class", "host", "--action", "start").status).toBe(0);
  });

  it("gives a resuming session the contract and every attempt", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    attempt(dir, run, "first image");
    cli(dir, "note", run, "second stop has no cause yet");
    const out = cli(dir, "status", run).stdout;
    expect(out).toContain("**Outcome:** o");
    expect(out).toContain("changed: first image");
    expect(out).toContain("second stop has no cause yet");
  });

  it("gives each agent its own scratch pad", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const run = startRun(dir);
    const a = cli(dir, "scratch", run, "agent-a").stdout.trim();
    const b = cli(dir, "scratch", run, "agent-b").stdout.trim();
    expect(a).not.toBe(b);
    expect(existsSync(a) && existsSync(b)).toBe(true);
  });

  it("refuses the second of two writers working from the same read", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const target = join(dir, "shared.md");
    const [one, two] = [join(dir, "one.md"), join(dir, "two.md")];
    writeFileSync(target, "base\n");
    writeFileSync(one, "from one\n");
    writeFileSync(two, "from two\n");
    const readHash = cli(dir, "hash", target).stdout.trim();

    expect(cli(dir, "promote", one, target, "--read-hash", readHash).status).toBe(0);
    expect(cli(dir, "promote", two, target, "--read-hash", readHash).status).toBe(5);
    expect(readFileSync(target, "utf8")).toBe("from one\n");
  });

  it("lets a writer create a file that did not exist when it read", () => {
    const dir = mkdtempSync(join(tmpdir(), "runs-"));
    const source = join(dir, "new.md");
    const target = join(dir, "nested", "made.md");
    writeFileSync(source, "fresh\n");
    const readHash = cli(dir, "hash", target).stdout.trim();
    expect(cli(dir, "promote", source, target, "--read-hash", readHash).status).toBe(0);
    expect(readFileSync(target, "utf8")).toBe("fresh\n");
  });
});
