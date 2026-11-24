import { execFileSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { ruleFour } from "../../scripts/alignment-graduation.mjs";
import { parseAsk } from "../../scripts/moneypenny/ask-card.mjs";
import { LABEL_NAMES, MANAGED_LABELS } from "../../scripts/moneypenny/labels.mjs";
import { PITCH_FIELDS, pitchField, pitchProblems } from "../../scripts/pitch-issue.mjs";

// #8201 (a slice of #8161): every ask that costs Eric money reaches him as a `pitch` issue in five
// lines, parked and assigned by `needs-eric`, and never graduates to decide-and-report.

const LINES = {
  who: "- **Who wants it:** the daily story loop (#8161 stage 3)",
  cost: "- **Monthly cost:** $0 out of pocket, uses the weekly quota already paid for",
  buys: "- **What it buys:** code PRs per week from 24 to 36, counted by the newsletter",
  free: "- **Free alternative first:** not tried, #4420 (batch screen commits) is still open",
  back: "- **Rolls back if:** code PRs per week stay under 36 by 2026-12-08, read by the newsletter",
};

const CALLOUT = [
  "> [!IMPORTANT]",
  "> **Needs from you**",
  "> 1. Let 5 builds run at once instead of 3, for four weeks? — the build slots are the constraint",
  ">    - A (predicted, medium): approve for stage 2's four weeks",
  ">    - B: try the free alternative first",
  ">    - Class: spend limits",
  ">    - On silence: nothing is spent; it stays assigned to you",
];

const pitchBody = (drop: (keyof typeof LINES)[] = [], callout = CALLOUT) =>
  [
    "**Let 5 builds run at once instead of 3, for four weeks.**",
    "",
    ...callout,
    "",
    ...Object.entries(LINES)
      .filter(([k]) => !drop.includes(k as keyof typeof LINES))
      .map(([, v]) => v),
    "",
    "Picture: waived — a five-line pitch.",
  ].join("\n");

const BOTH = ["pitch", "needs-eric"];

describe("pitchProblems — the five lines", () => {
  it("passes a complete pitch", () => {
    expect(pitchProblems(pitchBody(), BOTH)).toEqual([]);
  });

  it("reports one problem per missing line, naming it", () => {
    const problems = pitchProblems(pitchBody(["who", "buys", "back"]), BOTH);
    expect(problems).toHaveLength(3);
    for (const name of ["Who wants it", "What it buys", "Rolls back if"]) {
      expect(problems.filter((p) => p.includes(`**${name}:**`))).toHaveLength(1);
    }
  });

  it("treats a skeleton placeholder as a missing line", () => {
    const body = pitchBody(["who"]).replace(
      "\n\nPicture",
      "\n- **Who wants it:** <a seat>\n\nPicture",
    );
    expect(pitchField(body, "Who wants it")).toBeNull();
    expect(pitchProblems(body, BOTH).some((p) => p.includes("**Who wants it:**"))).toBe(true);
  });

  it("refuses a Monthly cost with no $ figure and a Rolls back line with no number", () => {
    const body = pitchBody()
      .replace(LINES.cost, "- **Monthly cost:** a little more")
      .replace(LINES.back, "- **Rolls back if:** it stops helping");
    const problems = pitchProblems(body, BOTH);
    expect(problems).toHaveLength(2);
    expect(
      problems.filter((p) => p.includes("**Monthly cost:**` carries no `$` figure")),
    ).toHaveLength(1);
    expect(
      problems.filter((p) => p.includes("**Rolls back if:**` carries no number")),
    ).toHaveLength(1);
  });

  it("never checks a body without the label", () => {
    expect(pitchProblems("no lines at all", ["needs-eric"])).toEqual([]);
    expect(pitchProblems("no lines at all", undefined)).toEqual([]);
  });

  it("names the five lines in the skeleton's order", () => {
    expect(PITCH_FIELDS.map((f) => f.name)).toEqual([
      "Who wants it",
      "Monthly cost",
      "What it buys",
      "Free alternative first",
      "Rolls back if",
    ]);
  });
});

describe("pitchProblems — a pitch waits on Eric and never graduates", () => {
  it("refuses `pitch` without `needs-eric`", () => {
    const problems = pitchProblems(pitchBody(), ["pitch"]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/without `needs-eric`/);
  });

  it("refuses a callout whose class is not spend limits", () => {
    const callout = CALLOUT.map((l) => l.replace("spend limits", "engineering gates"));
    const problems = pitchProblems(pitchBody([], callout), BOTH);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/Class: spend limits/);
  });

  it("parses into a card with options, prediction and silence line, in an irreversible class", () => {
    const [item] = parseAsk(pitchBody());
    if (!item) throw new Error("the pitch callout parsed to no item");
    expect(item.options.map((o) => o.key)).toEqual(["A", "B"]);
    expect(item.predicted).toBe("A");
    expect(item.confidence).toBe("medium");
    expect(item.onSilence).toBe("nothing is spent; it stays assigned to you");
    expect(item.cls).toBe("spend limits");
    expect(ruleFour(item.cls ?? "").verdict).toBe("irreversible");
  });
});

describe("the pitch label and the issue-lint CLI", () => {
  it("registers `pitch` as a managed label, so it exists before the first filing", () => {
    expect(LABEL_NAMES).toContain("pitch");
    expect(MANAGED_LABELS.map((l) => l.name)).toContain("pitch");
  });

  const lint = (body: string, labels: string) => {
    const args = ["scripts/issue-lint.mjs", "--stdin", "--json", "--labels", labels];
    try {
      return JSON.parse(execFileSync("node", args, { input: body, encoding: "utf8" }));
    } catch (error) {
      return JSON.parse((error as { stdout?: Buffer }).stdout?.toString() ?? "{}");
    }
  };

  it("exits clean on a complete pitch and reports the gaps on a thin one", () => {
    expect(lint(pitchBody(), "pitch,needs-eric").problems).toEqual([]);
    const thin = lint(pitchBody(["cost"]), "pitch,needs-eric").problems as string[];
    expect(thin.filter((p) => p.includes("**Monthly cost:**"))).toHaveLength(1);
  });

  it("does not count the five lines against the 2–4 talking-point note", () => {
    const notes = lint(pitchBody(), "pitch,needs-eric").notes as string[];
    expect(notes.filter((n) => n.includes("talking points above the fold"))).toEqual([]);
  });
});
