import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { hermeticGitEnv } from "../support/hermetic-git";
import { type Reply, runWorkflow } from "../support/run-workflow";

// #6682. Every audit agent used to deepen the one shared clone itself, so parallel triage agents raced
// for .git/shallow.lock. On 2026-11-02 the loser never saw #5852's commit, and the audit listed a
// merged PR as "not found on origin/main". These pin the repair: one deepen before the fan-out, the
// merged state read from GitHub, every "not found" naming its cause, a lens that could not find the
// change listed as unreviewed, and the commit picked by its subject alone.
const CLEARED = { found: true, dispatch: true, position: "normal", grindWidth: 200 };
const finding = { severity: "high", file: "x.ts", summary: "s", failure_scenario: "f" };

const replyWith =
  (over: { deepen?: unknown; triage?: unknown; review?: unknown } = {}): Reply =>
  (_prompt, { label }) => {
    if (label === "work-mode") return CLEARED;
    if (label === "dead agents") return { left: [] };
    if (label === "deepen")
      return "deepen" in over ? over.deepen : { fetched: true, shallow: true, missing: [] };
    if (label?.startsWith("triage"))
      return "triage" in over ? over.triage : { merged: true, files: ["x.ts"], protected: false };
    if (label?.startsWith("review"))
      return "review" in over ? over.review : { merged: true, findings: [finding] };
    return { refuted: false, evidence: "e" };
  };
const audit = (reply: Reply, prs = [6501]) => runWorkflow("post-merge-audit", { prs }, reply);
const perPr = (calls: { prompt: string; opts: { label?: string } }[]) =>
  calls.filter((c) => !["work-mode", "deepen", "dead agents"].includes(c.opts.label ?? ""));

describe("the post-merge audit's one deepen", () => {
  it("deepens once, after the dial and before any per-PR agent, as a cheap worker", async () => {
    const { calls } = await audit(replyWith(), [6501, 6502, 6503]);
    expect(calls.map((c) => c.opts.label).slice(0, 2)).toEqual(["work-mode", "deepen"]);
    expect(calls.filter((c) => c.opts.label === "deepen")).toHaveLength(1);
    expect(calls[1]?.opts).toMatchObject({ agentType: "worker", model: "sonnet", effort: "low" });
    for (const n of [6501, 6502, 6503]) expect(calls[1]?.prompt).toContain(`#${n}`);
  });

  // `--deepen` counts from the current boundary, so a 30-agent run fetched history 30 times.
  it("tells no per-PR agent to fetch, including the repro refuter in its shared-.git worktree", async () => {
    const { calls } = await audit(replyWith());
    const stages = perPr(calls);
    expect(stages.map((c) => c.opts.label?.split(" ")[0]).sort()).toEqual([
      "repro",
      "review",
      "trace",
      "triage",
    ]);
    for (const { prompt } of stages) {
      expect(prompt).not.toMatch(/`git fetch/);
      expect(prompt).toMatch(/never fetch/i);
    }
    expect(calls.filter((c) => c.prompt.includes("--deepen"))).toHaveLength(1);
  });

  // A date can shorten a clone that is already deeper; a count only adds history.
  it("deepens by count, never by date", async () => {
    const { calls } = await audit(replyWith());
    const deepen = calls.find((c) => c.opts.label === "deepen")?.prompt ?? "";
    expect(deepen).toContain("git fetch -q --deepen=");
    expect(deepen).not.toContain("--shallow-since");
  });

  it("logs a failed deepen and still runs the audit", async () => {
    const { calls, logs } = await audit(
      replyWith({ deepen: { fetched: false, shallow: true, error: "shallow.lock exists" } }),
    );
    expect(logs.join("\n")).toContain("shallow.lock exists");
    expect(perPr(calls).length).toBeGreaterThan(0);
  });
});

describe("why a merged PR comes back unreviewed", () => {
  // The bug itself: a fetch that failed read as "not found on origin/main".
  it("never reads a failed fetch as 'not found on origin/main'", async () => {
    for (const deepen of [{ fetched: false, shallow: true, error: "shallow.lock exists" }, null]) {
      const { result } = await audit(
        replyWith({ deepen, triage: { merged: false, files: [], protected: false } }),
      );
      const [row] = (result?.unreviewed ?? []) as { pr: number; why: string }[];
      expect(row?.why).not.toBe("not found on origin/main");
      expect(row?.why).toMatch(/fetch before the fan-out failed|did not come back/);
      expect(row?.why).toContain("re-run");
    }
  });

  it("names the cause the triage agent gave", async () => {
    for (const [missing, why] of [
      ["not merged into main", /not merged into main, per GitHub/],
      ["github unreadable", /GitHub could not be read: re-run/],
    ] as const) {
      const { result } = await audit(
        replyWith({ triage: { merged: false, missing, files: [], protected: false } }),
      );
      expect(result?.unreviewed).toEqual([{ pr: 6501, why: expect.stringMatching(why) }]);
    }
  });

  it("asks triage for GitHub's merged flag, so a short clone cannot make a merged PR unmerged", async () => {
    const { calls } = await audit(replyWith());
    const triage = calls.find((c) => c.opts.label?.startsWith("triage"));
    expect(triage?.prompt).toContain("repos/ejclark/skynet-capital/pulls/6501`");
    expect(triage?.prompt).toMatch(/merged=true only when its "merged" is true/);
    expect(triage?.prompt).toMatch(/still report merged=true/);
    expect(JSON.stringify(triage?.opts.schema)).toContain("github unreadable");
  });

  it("reviews a PR whose commit is past the shallow clone, from the diff GitHub holds", async () => {
    const { result } = await audit(
      replyWith({
        triage: { merged: true, missing: "shallow clone", files: ["x.ts"], protected: false },
      }),
    );
    expect(result?.unreviewed).toEqual([]);
    expect(result?.confirmed).toHaveLength(1);
  });
});

describe("FIND picks the commit by its subject", () => {
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", args, { cwd, env: hermeticGitEnv(), encoding: "utf8" });

  // Batch D's #6572: `git log --grep "(#6572)"` listed #6573's commit, whose body cites it, first.
  it("never takes a later commit that only cites the number in its body", async () => {
    const { calls } = await audit(replyWith(), [6572]);
    const triage = calls.find((c) => c.opts.label?.startsWith("triage"))?.prompt ?? "";
    const command = /`(git log origin\/main --format=[^`]+)`/.exec(triage)?.[1];
    expect(command).toBeDefined();
    expect(triage).not.toMatch(/`git log origin\/main[^`]*--grep/);

    const dir = mkdtempSync(join(tmpdir(), "audit-find-"));
    try {
      git(dir, "init", "-q", "-b", "main");
      git(
        dir,
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@t",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "fix(a): the change (#6572)",
      );
      const right = git(dir, "rev-parse", "HEAD").trim();
      git(
        dir,
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@t",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "fix(b): a follow-up (#6573)",
        "-m",
        "Builds on (#6572).",
      );
      git(
        dir,
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@t",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "fix(c): another (#165720)",
      );
      git(dir, "update-ref", "refs/remotes/origin/main", "HEAD");
      const found = execFileSync("bash", ["-c", command ?? "false"], {
        cwd: dir,
        env: hermeticGitEnv(),
        encoding: "utf8",
      });
      expect(found.trim().split("\n")).toEqual([`${right} fix(a): the change (#6572)`]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
