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
