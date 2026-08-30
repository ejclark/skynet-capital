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

// #500's one open question, resolved ADVISORY. An unregistered label is usually a real defect
// (#461 and #462 carried `idea` where they meant `handoff`, so two waiting handoffs appeared in no
// queue, no scan and no digest) — but members apply arbitrary labels through the GitHub UI, and
// failing a lint over one would tax exactly the reporter this linter must never tax.
describe("issue lint — the label advisory", () => {
  const capsule = [
    "**One-line ask.**",
    "",
    "| | |",
    "|---|---|",
    "| **Type** | bug |",
    "",
    "- A talking point.",
    "",
    "Picture: waived — a registry change has nothing to draw.",
  ].join("\n");

  const withLabels = (labels: string) => {
    const args = ["scripts/issue-lint.mjs", "--stdin", "--json", "--labels", labels];
    try {
      const out = execFileSync("node", args, { input: capsule, encoding: "utf8" });
      return { code: 0, ...JSON.parse(out) } as {
        code: number;
        problems: string[];
        notes: string[];
      };
    } catch (error) {
      const e = error as { status?: number; stdout?: Buffer };
      return {
        code: e.status ?? -1,
        ...JSON.parse(e.stdout?.toString() || '{"problems":[],"notes":[]}'),
      } as { code: number; problems: string[]; notes: string[] };
    }
  };

  it("notes an unregistered label without failing the gate", () => {
    const { code, problems, notes } = withLabels("bug,not-a-real-label");

    expect(notes.join("\n")).toContain("not-a-real-label");
    // The whole point of the resolution: it points, it never gates.
    expect(problems).toEqual([]);
    expect(code).toBe(0);
  });

  it("stays silent on labels the registry knows", () => {
    const { problems, notes } = withLabels("bug,feedback,idea,handoff,plan,ci-failure");
    expect(notes.join("\n")).not.toContain("unregistered label");
    expect(problems).toEqual([]);
  });

  it("does not check labels that were never supplied — absent is not clean", () => {
    // A body linted before filing carries no labels yet; that must read as "not checked", never
    // as "checked and passed".
    const { notes } = lint(capsule);
    expect(notes.join("\n")).not.toContain("unregistered label");
  });
});

// The decision-callout gate (docs/ISSUES.md rule 6 — Eric, 2026-08-30: a `needs-eric` decision was
// landing 3/4 of the way down an accordion instead of above the fold, next to the context).
describe("issue lint — the 'Needs from you' decision callout", () => {
  const lintWithLabels = (
    body: string,
    labels: string,
  ): { code: number; problems: string[]; notes: string[] } => {
    const args = ["scripts/issue-lint.mjs", "--stdin", "--json", "--labels", labels];
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

  const withoutCallout = [
    "**Decide the account-linking retry limit.**",
    "",
    "- A talking point.",
    "",
    "Picture: waived — a decision, nothing to draw.",
  ].join("\n");

  const withCallout = [
    "**Decide the account-linking retry limit.**",
    "",
    "- A talking point.",
    "",
    "> [!IMPORTANT]",
    "> **Needs from you**",
    "> 1. 3 retries or 5 — 5 costs one extra support ping per week, 3 costs one extra failed link.",
    "",
    "Picture: waived — a decision, nothing to draw.",
  ].join("\n");

  it("fails a needs-eric issue with no callout above the fold", () => {
    const { code, problems } = lintWithLabels(withoutCallout, "needs-eric");
    expect(code).toBe(1);
    expect(problems.join("\n")).toContain("Needs from you");
  });

  it("passes a needs-eric issue that carries the callout", () => {
    const { code, problems } = lintWithLabels(withCallout, "needs-eric");
    expect(problems).toEqual([]);
    expect(code).toBe(0);
  });

  it("does not require the callout on issues without the needs-eric label", () => {
    const { code, problems } = lintWithLabels(withoutCallout, "bug,feedback");
    expect(problems).toEqual([]);
    expect(code).toBe(0);
  });

  it("notes a callout present without the needs-eric label — a routing miss, not a defect", () => {
    const { problems, notes } = lintWithLabels(withCallout, "bug,feedback");
    expect(problems).toEqual([]);
    expect(notes.join("\n")).toContain("needs-eric");
  });

  it("fails a decision item that runs past one short line", () => {
    const wordy = [
      "**Decide the account-linking retry limit.**",
      "",
      "- A talking point.",
      "",
      "> [!IMPORTANT]",
      "> **Needs from you**",
      "> 1. Whether we should retry account-linking three times or five times before giving up entirely, and why that matters for support load.",
      "",
      "Picture: waived — a decision, nothing to draw.",
    ].join("\n");
    const { code, problems } = lintWithLabels(wordy, "needs-eric");
    expect(code).toBe(1);
    expect(problems.join("\n")).toContain('"Needs from you" item over');
  });
});
