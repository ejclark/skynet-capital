import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { caseDigest, casesFor, runsFor } from "../../../scripts/intent-replay.mjs";
import { IDS, kase, SET } from "./fixtures";

describe("the command line", () => {
  const dir = mkdtempSync(join(tmpdir(), "intent-replay-"));
  const setFile = join(dir, "set.json");
  writeFileSync(setFile, JSON.stringify(SET));
  const cli = (...args: string[]) =>
    spawnSync("node", ["scripts/intent-replay.mjs", ...args], { encoding: "utf8" });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("prints the cases as JSON a workflow can read back", () => {
    const run = cli("cases", "--n", "4", "--set", setFile);
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toMatchObject({
      ids: IDS,
      caseDigests: casesFor(SET).caseDigests,
      price: { agents: 11 },
    });
  });

  it("refuses an N that confounds order with the arm, before anything is spent", () => {
    const run = cli("cases", "--n", "1", "--set", setFile);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("both orders");
    expect(run.stdout).toBe("");
  });

  describe("a set that fails the safety rule, at every command", () => {
    const bad = join(dir, "unsafe.json");
    writeFileSync(bad, JSON.stringify({ header: {}, cases: [kase("C1", { said: "Priya" })] }));
    const results = join(dir, "unsafe-results.json");
    writeFileSync(
      results,
      JSON.stringify({
        caseIds: ["C1"],
        caseDigests: [caseDigest(kase("C1", { said: "Priya" }))],
        runs: runsFor(2).map((r: object) => ({ ...r, answers: [] })),
        verdicts: [],
      }),
    );
    const commands: [string, string[]][] = [
      ["cases", ["cases"]],
      ["an answerer's prompt", ["prompt", "--arm", "without", "--order", "forward"]],
      ["the page arm's prompt", ["prompt", "--arm", "with", "--order", "backward"]],
      ["the judge's prompt", ["prompt", "--judge"]],
      ["score", ["score", "--results", results]],
    ];
    for (const [name, args] of commands) {
      it(`refuses ${name}, printing none of it`, () => {
        const run = cli(...args, "--set", bad);
        expect(run.status).toBe(2);
        expect(run.stderr).toContain("Priya");
        expect(run.stderr).toContain("UNKNOWN");
        expect(run.stdout).toBe("");
      });
    }
  });

  describe("a READERS.md whose sections are bare headings", () => {
    const bare = join(dir, "bare.md");
    writeFileSync(
      bare,
      "### How he writes\n\n### What breaks his flow\n\n### How he reads\n\n| Fact |\n",
    );

    it("stops the page arm's prompt, which would otherwise equal the other arm's", () => {
      const run = cli(
        "prompt",
        "--arm",
        "with",
        "--order",
        "forward",
        "--set",
        setFile,
        "--page",
        bare,
      );
      expect(run.status).toBe(2);
      expect(run.stderr).toContain("How he writes");
      expect(run.stdout).toBe("");
    });

    it("stops the lookup too, so the arm without the page is not paid for first", () => {
      expect(cli("cases", "--set", setFile, "--page", bare).status).toBe(2);
    });

    it("does not stop the arm without the page, which never reads it", () => {
      const args = ["--arm", "without", "--order", "forward", "--set", setFile, "--page", bare];
      expect(cli("prompt", ...args).status).toBe(0);
    });
  });

  it("prints an answerer's prompt and the judge's, from the real page", () => {
    const answer = cli("prompt", "--arm", "with", "--order", "backward", "--set", setFile);
    expect(answer.status).toBe(0);
    expect(answer.stdout).toContain("He writes");
    const judge = cli("prompt", "--judge", "--set", setFile);
    expect(judge.status).toBe(0);
    expect(judge.stdout).toContain("THE-MUST-DO of C1");
  });

  const answered = () =>
    runsFor(2).map((r: object) => ({
      ...r,
      answers: IDS.map((id) => ({ id, route: "act-now", ask: "may-ask", firstMove: "m" })),
    }));
  const resultsFile = (name: string, verdicts: unknown[]) => {
    const file = join(dir, name);
    writeFileSync(
      file,
      JSON.stringify({
        caseIds: IDS,
        caseDigests: casesFor(SET).caseDigests,
        runs: answered(),
        verdicts,
      }),
    );
    return file;
  };
  const everySlot = (pass: unknown) =>
    IDS.flatMap((id) => [0, 1, 2, 3].map((slot) => ({ id, slot, pass, why: "w" })));

  it("scores a workflow's return value read from a file", () => {
    const results = resultsFile("results.json", []);
    const run = cli("score", "--results", results, "--set", setFile, "--json");
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout).verdict).toBe("unknown");
    const line = cli("score", "--results", results, "--set", setFile);
    expect(line.stdout).toContain("unknown");
    expect(line.stdout).toContain("of 6");
  });

  it("prints a verdict once every answer is judged", () => {
    const results = resultsFile("judged.json", everySlot(true));
    const line = cli("score", "--results", results, "--set", setFile);
    expect(line.stdout).toContain("judged 6 of 6");
    expect(line.stdout).toContain("verdict: page not above");
  });

  it("says a score with unjudged rows is unknown, how many, and prints no verdict over them", () => {
    const results = resultsFile("strings.json", everySlot("true"));
    const line = cli("score", "--results", results, "--set", setFile);
    expect(line.status).toBe(0);
    expect(line.stdout).toContain("verdict: unknown");
    expect(line.stdout.match(/6 not judged/g)).toHaveLength(2);
    expect(line.stdout).not.toMatch(/page above|page not above/);
    expect(line.stdout).not.toMatch(/^differ:/m);
  });

  it("says how many never came back, when an answerer died", () => {
    const rows = answered();
    rows[3].answers = null;
    const file = join(dir, "dead.json");
    writeFileSync(
      file,
      JSON.stringify({
        caseIds: IDS,
        caseDigests: casesFor(SET).caseDigests,
        runs: rows,
        verdicts: everySlot(true),
      }),
    );
    const line = cli("score", "--results", file, "--set", setFile);
    expect(line.stdout).toContain("verdict: unknown");
    expect(line.stdout).toContain("3 never answered");
    expect(line.stdout).not.toMatch(/page above|page not above/);
  });

  it("refuses results from a set rewritten since, before printing any score", () => {
    const results = resultsFile("old.json", everySlot(true));
    const rewritten = join(dir, "rewritten.json");
    writeFileSync(
      rewritten,
      JSON.stringify({ ...SET, cases: [kase("C1", { said: "new words" }), ...SET.cases.slice(1)] }),
    );
    const run = cli("score", "--results", results, "--set", rewritten);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("C1");
    expect(run.stdout).toBe("");
  });

  it("says unknown, with a non-zero exit, when it cannot read its inputs", () => {
    const missing = cli("score", "--results", join(dir, "absent.json"), "--set", setFile);
    expect(missing.status).toBe(2);
    expect(missing.stderr).toContain("UNKNOWN");
    const bad = join(dir, "bad.json");
    writeFileSync(bad, JSON.stringify({ header: {}, cases: [kase("C1", { said: "Priya" })] }));
    expect(cli("cases", "--set", bad).status).toBe(2);
  });
});
