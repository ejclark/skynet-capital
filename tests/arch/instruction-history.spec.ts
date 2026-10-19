import { historyNotes, isRuleFile } from "../../scripts/instructions/history.mjs";

// History in a rule file: what the note fires on is scripts/instructions/history.mjs's header, and
// the writing rule it checks is docs/ENGINEERING.md → *Instruction files*. This is only the cheap,
// after-the-fact eye for it, so most cases below are about staying quiet on what the rule keeps.

describe("historyNotes — a PR or issue number told as a story", () => {
  it("fires on a rule line whose reference carries narrative", () => {
    const notes = historyNotes(
      "# Ship\n\nNever arm by hand (#1234: arming by hand let three PRs merge early).\n",
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ line: 3, kind: "pr-narrative" });
    expect(notes[0]?.detail).toContain("#1234");
  });

  it("stays quiet on a pointer to where a mechanism lives", () => {
    expect(historyNotes("The plan is #5143; its state block names the next slice.\n")).toEqual([]);
    expect(historyNotes("Read the gate's verdict (#4393 criterion 10) before building.\n")).toEqual(
      [],
    );
  });

  it("stays quiet on a quoted provenance line — Eric's dated words are the why", () => {
    expect(
      historyNotes('Ask first (Eric, 2026-09-04, after #1304 merged: "hold it for me").\n'),
    ).toEqual([]);
  });

  // Each quiet line below fires on its own (the control case proves it), so dropping any one
  // exclusion in history.mjs turns this red.
  const quietZones = [
    "---",
    "description: #1200 shipped the plan",
    "---",
    "```",
    "#1234 merged and broke the board",
    "```",
    "> Before: since #4074 the check was advisory.",
    "Cite it as `#3627 broke the board` when the old name matters.",
    'He wrote "#3627 broke the board" in the retro.',
    "He wrote “#3627 broke the board” in the retro.",
  ];

  it("stays quiet inside code fences, blockquote examples, inline code, quotes and frontmatter", () => {
    expect(historyNotes(quietZones.join("\n"))).toEqual([]);
  });

  it("fires on every one of those lines once it stands as plain prose", () => {
    const bare = (line: string) => line.replace(/^(description: |> )/, "").replace(/[`"“”]/g, "");
    const lines = quietZones.filter((l) => !/^(---|```)$/.test(l)).map(bare);
    for (const line of lines) expect(historyNotes(`${line}\n`), line).toHaveLength(1);
  });

  it('stays quiet on an imperative "let" beside a pointer, and fires on the past one', () => {
    expect(historyNotes("Read #5143 and let the lane build it.\n")).toEqual([]);
    expect(historyNotes("Let #5143 settle before you build.\n")).toEqual([]);
    expect(
      historyNotes("Never arm by hand (#4094: arming by hand let three PRs merge).\n"),
    ).toEqual([expect.objectContaining({ kind: "pr-narrative" })]);
  });

  it("ignores a hex colour, an anchor and a hash in a URL", () => {
    expect(
      historyNotes("Paint it #1a2b3c — see docs/X.md#123 and https://x.test/#456 (it broke).\n"),
    ).toEqual([]);
  });
});

describe("historyNotes — a rule measured against a version the reader never saw", () => {
  it('fires on "no longer"', () => {
    const notes = historyNotes("The job's checkout no longer persists that credential.\n");
    expect(notes).toEqual([expect.objectContaining({ line: 1, kind: "migration" })]);
    expect(notes[0]?.detail).toContain("no longer");
  });

  it('fires on "used to" and "is now"', () => {
    expect(historyNotes("The scan used to read 43 files.\n")).toHaveLength(1);
    expect(historyNotes("The cap is now advisory.\n")).toHaveLength(1);
  });

  it("stays quiet on the same words when they describe the run, not the rule's past", () => {
    const text = [
      "A shape change was used to answer a surface note.",
      "Cite an `npm run` script that no longer exists.",
      "Rephrase it so the scanner no longer reads it as a path.",
      'Report `skipped` with "no longer flagged".',
    ].join("\n");
    expect(historyNotes(text)).toEqual([]);
  });

  it("stays quiet on clean, present-tense text", () => {
    expect(
      historyNotes(
        "# Retro\n\nRun the check before you open the PR. A red is a real red: fix it, never re-run.\n",
      ),
    ).toEqual([]);
  });
});

describe("isRuleFile — the files the note reads", () => {
  it("takes skills, agents, lane prompts and grind chores", () => {
    expect(isRuleFile(".claude/skills/ship/SKILL.md")).toBe(true);
    expect(isRuleFile(".claude/agents/reviewer.md")).toBe(true);
    expect(isRuleFile(".github/prompts/plan-build.md")).toBe(true);
    expect(isRuleFile("docs/grind/instruction-drift.instructions.md")).toBe(true);
  });

  it("leaves out reference cards, docs, ledgers and the grind README", () => {
    expect(isRuleFile(".claude/skills/mermaid/reference/flowchart.md")).toBe(false);
    expect(isRuleFile("docs/ENGINEERING.md")).toBe(false);
    expect(isRuleFile("docs/LESSONS.md")).toBe(false);
    expect(isRuleFile("docs/grind/README.md")).toBe(false);
  });
});
