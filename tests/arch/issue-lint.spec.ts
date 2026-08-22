import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// The capsule contract gate (docs/ISSUES.md). Scoped the same way `ship.sh checkbody` is scoped:
// EXISTENCE and HONESTY are gated (is there a fold, is a paragraph pasted twice, does a mermaid
// type render), taste never is. The 2026-08-21 corpus is the reason it exists — 1/71 issues carried
// a fold while the templated-and-gated PR surface ran at 100%.
const lint = (body: string, title = ""): { code: number; problems: string[]; notes: string[] } => {
  const args = [
    "scripts/issue-lint.mjs",
    "--stdin",
    "--json",
    ...(title ? ["--title", title] : []),
  ];
  try {
    const out = execFileSync("node", args, { input: body, encoding: "utf8" });
    return { code: 0, ...JSON.parse(out) };
  } catch (error) {
    const e = error as { status?: number; stdout?: Buffer };
    return {
      code: e.status ?? -1,
      ...JSON.parse(e.stdout?.toString() || '{"problems":[],"notes":[]}'),
    };
  }
};

const wall = (n: number) => `Some context sentence about the work. `.repeat(n);

describe("issue lint — the capsule contract", () => {
  it("passes the house skeleton docs/ISSUES.md tells authors to copy", () => {
    // Doc and gate cannot drift: the published skeleton is linted as a spec case.
    const doc = readFileSync("docs/ISSUES.md", "utf8");
    const skeleton = /```markdown\n([\s\S]*?)```/.exec(doc)?.[1];
    expect(skeleton).toBeTruthy();
    const { code, problems } = lint(skeleton as string, "shape every filed issue as a capsule");
    expect(problems).toEqual([]);
    expect(code).toBe(0);
  });

  it("fails the wall — a long body with no fold, the defect the corpus is made of", () => {
    const { code, problems } = lint(wall(60));
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("no fold");
  });

  it("fails a long body that folds too late — the fold has to come before the scroll", () => {
    const { code, problems } = lint(`${wall(60)}\n\n<details><summary>brief</summary>x</details>`);
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("above the fold");
  });

  it("fails a talking point that runs past one short line", () => {
    const { code, problems } = lint(`**The ask.**\n\n- ${"a".repeat(130)}\n`);
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("talking point over 120 chars");
  });

  it("catches the paste accident that shipped #455's whole note twice", () => {
    const block =
      "I would like the feedback categories seeded by research so they match what members actually intend to say.";
    const { code, problems } = lint(`**The ask.**\n\n${block}\n\n${block}\n`);
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("appears twice");
  });

  it("rejects a beta mermaid type — a syntax error renders as the issue's opening frame", () => {
    const { code, problems } = lint("**The ask.**\n\n```mermaid\nxychart-beta\n  title x\n```\n");
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("xychart-beta");
  });

  it("rejects a raw URL pinned to a branch — those 404 the day the branch deletes", () => {
    const url =
      "https://raw.githubusercontent.com/ejclark/skynet-capital/some-branch/docs/shots/a.jpg";
    const { code, problems } = lint(`**The ask.**\n\n![shot](${url})\n`);
    expect(code).toBe(1);
    expect(problems.join(" ")).toContain("SHA-pinned");
  });

  it("rejects an empty-calorie title but keeps machine slug titles legal", () => {
    expect(lint("**The ask.**\n", "Fix bug").problems.join(" ")).toContain("says nothing");
    expect(lint("**The ask.**\n", "[event-research] opex-2026-12-18").problems).toEqual([]);
  });

  it("keeps taste advisory — a pictureless short issue notes, never fails", () => {
    const { code, problems, notes } = lint("**Add a star toggle to the playbook rows.**\n");
    expect(code).toBe(0);
    expect(problems).toEqual([]);
    expect(notes.join(" ")).toContain("no picture");
  });
});

const audit = (fixture: string, ...flags: string[]): string =>
  execFileSync(
    "node",
    [
      "scripts/issue-lint.mjs",
      "--audit",
      "--repo",
      "o/r",
      "--fixture",
      `tests/fixtures/issues/${fixture}`,
      ...flags,
    ],
    { encoding: "utf8" },
  );

describe("issue lint — the audit report", () => {
  // The audit is the instrument used to triage the issue corpus. An instrument that counts 14
  // failures and names 8 with no remainder line reads as "that was all of them" — the silent
  // truncation CLAUDE.md rules out ("No silent caps: log() what was dropped"). Same for showing
  // problems[0] and never saying an issue carried twenty more.
  const named = (out: string) => out.match(/^ {4}#\d+ —/gm) ?? [];

  it("names every failing issue it counted, or says how many it did not", () => {
    const out = audit("twelve-walls.json");
    expect(out).toContain("12/12 human-facing issues fail");
    expect(named(out)).toHaveLength(8);
    expect(out).toContain(
      "… and 4 more failing issues not listed — re-run with --all to name them.",
    );
  });

  it("drops the remainder line when the list is already complete", () => {
    const out = audit("mixed.json");
    expect(out).toContain("1/2 human-facing issues fail");
    expect(named(out)).toHaveLength(1);
    expect(out).not.toContain("not listed");
  });

  it("lifts the cap so --all names the whole corpus", () => {
    const out = audit("twelve-walls.json", "--all");
    expect(named(out)).toHaveLength(12);
    expect(out).not.toContain("not listed");
  });

  it("says how many problems an issue carries beyond the one it shows", () => {
    // #466 carried 22 problems and reported one. The count is what makes the row honest.
    const out = audit("multi-problem.json");
    expect(out).toMatch(/#7 — .+ \(\+\d+ more on this issue\)/);
  });

  it("exempts the machine lane from the human-facing denominator", () => {
    const out = audit("machine-lane.json");
    expect(out).toContain("2 issues on o/r (1 human-facing)");
    expect(out).toContain("0/1 human-facing issues fail");
  });
});
