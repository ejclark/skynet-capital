import { learningLine } from "../../../scripts/digest-scan.mjs";
import { route } from "../../../scripts/moneypenny/index.mjs";
import {
  type DraftCapsule,
  type DraftFix,
  draftEntry,
  fixingPrNumber,
  insertEntry,
  jobOf,
  learnedIn,
  prBody,
  routeLessonDraft,
  runIdsFrom,
  sectionOf,
} from "../../../scripts/moneypenny/lesson-draft.mjs";

// THE CORRECTING STEP RUNS FROM AN EVENT (#4212, #4056 slice 7). WHEN a repair capsule closes, the
// system SHALL draft its LESSONS ledger entry. Fixtures are the real #4658 → #4659 closure
// (2026-10-05): the capsule, its one recurrence, the repair session's own comment that links an
// unrelated run, and the fix PR's Why. Nothing here touches GitHub.

const CAPSULE_TITLE = "[ci] Moneypenny Events (event-research automation) — route";
const RUN = "https://github.com/ejclark/skynet-capital/actions/runs";

const closedEvent = (issue: Record<string, unknown>) => ({
  eventName: "issues",
  action: "closed",
  payload: {
    issue: {
      number: 4658,
      title: CAPSULE_TITLE,
      state_reason: "completed",
      labels: [{ name: "ci-failure" }, { name: "in-progress" }],
      ...issue,
    },
  },
});

const capsule: DraftCapsule = {
  number: 4658,
  title: CAPSULE_TITLE,
  createdAt: "2026-10-05T21:30:17Z",
  closedAt: "2026-10-05T21:40:57Z",
};
const runs = [
  {
    id: "37375748219",
    sha: "ffa1cc291ac6",
    createdAt: "2026-10-05T21:25:21Z",
    url: `${RUN}/37375748219`,
  },
  { id: "37377107514", sha: "1b2ec2e1aaaa", createdAt: "2026-10-05T21:36:02Z" },
];
const fix: DraftFix = {
  number: 4659,
  title: "fix(research): let the spend breaker read past a cancelled job's missing log",
  mergeSha: "362d028cdc15891771f7163cbd86d5ff4b1e169e",
  specs: ["tests/arch/research-circuit-breaker.spec.ts"],
  body: [
    "## Summary",
    "",
    "- The spend breaker no longer stops every research tick.",
    "- Closes #4658.",
    "",
    "<details>",
    "<summary><strong>Why</strong></summary>",
    "",
    "### Why",
    "",
    "`gh run view <id> --log` fails for the whole run when any one job has no log, and a cancelled job",
    "has none.",
    "",
    "### Acceptance criteria (EARS)",
    "- not part of the root cause",
  ].join("\n"),
};

describe("lesson draft — which events draft a lesson", () => {
  it("drafts when a ci-failure capsule closes as completed", () => {
    expect(routeLessonDraft(closedEvent({}))).toEqual([
      { kind: "draft-lesson", issueNumber: 4658, title: CAPSULE_TITLE },
    ]);
  });

  it("reaches the drafter through the router's own route()", () => {
    expect(route(closedEvent({}))).toEqual(routeLessonDraft(closedEvent({})));
  });

  it("drafts nothing for a not-planned close — the matrix-fold duplicates #3913 retired", () => {
    expect(routeLessonDraft(closedEvent({ state_reason: "not_planned" }))).toEqual([]);
  });

  it("drafts nothing for an issue that is not a repair capsule", () => {
    expect(routeLessonDraft(closedEvent({ labels: [{ name: "feedback" }] }))).toEqual([]);
  });

  it("drafts nothing on a label or reopen event", () => {
    expect(routeLessonDraft({ ...closedEvent({}), action: "labeled" })).toEqual([]);
    expect(routeLessonDraft({ ...closedEvent({}), action: "reopened" })).toEqual([]);
  });
});

describe("lesson draft — reading the capsule", () => {
  const body = `| **Run** | [37375748219](${RUN}/37375748219) |\n\nlog tail mentions ${RUN}/1`;

  it("takes the body's run and each repair-lane recurrence, never other bot comments", () => {
    const comments = [
      // The repair session's root-cause note links a run from a DIFFERENT fault.
      {
        user: { login: "skynet-envoy[bot]" },
        body: `Root cause: run [37373634443](${RUN}/37373634443)`,
      },
      {
        user: { login: "github-actions[bot]" },
        body: `Failed again — run [37377107514](${RUN}/37377107514), job \`route\`.`,
      },
      // Public repo: a lookalike from anyone else is not evidence.
      { user: { login: "someone" }, body: `Failed again — run [999](${RUN}/999)` },
    ];
    expect(runIdsFrom(body, comments)).toEqual(["37375748219", "37377107514"]);
  });

  it("finds the PR that merged at the close, not an older cross-reference", () => {
    const xref = (number: number, merged_at: string | null) => ({
      event: "cross-referenced",
      source: { issue: { number, pull_request: { merged_at } } },
    });
    const timeline = [
      xref(4600, "2026-10-04T10:00:00Z"),
      xref(4659, "2026-10-05T21:40:55Z"),
      xref(4661, null),
      { event: "closed" },
    ];
    expect(fixingPrNumber(timeline, capsule.closedAt)).toBe(4659);
    expect(fixingPrNumber([xref(4600, "2026-10-04T10:00:00Z")], capsule.closedAt)).toBeNull();
  });

  it("reads one section of a PR body and stops at the next heading", () => {
    expect(sectionOf(fix.body, "Why")).toContain("cancelled job");
    expect(sectionOf(fix.body, "Why")).not.toContain("EARS");
    expect(jobOf(CAPSULE_TITLE)).toBe("route");
  });
});

describe("lesson draft — the entry", () => {
  it("writes every field incident-scan parses, covering each failing sha", () => {
    const draft = draftEntry({ capsule, runs, fix });
    expect(draft?.covered).toEqual(["ffa1cc2", "1b2ec2e"]);
    const entry = draft?.entry ?? "";
    expect(entry).toMatch(/^### `route` red on main: let the spend breaker read past/);
    for (const field of [
      "SHA",
      "DATE",
      "STATUS",
      "SIGNAL",
      "ROOT CAUSE",
      "PREVENTION",
      "SIDE QUESTS",
    ]) {
      expect(entry).toContain(`**${field}:**`);
    }
    expect(entry).toContain("**SHA:** 362d028   **DATE:** 2026-10-05   **STATUS:** closed");
    expect(entry).toContain("**COVERS:** ffa1cc2 1b2ec2e");
    expect(entry).toContain("closed 11m later by #4659");
    expect(entry).toContain("**ROOT CAUSE:** `gh run view <id> --log` fails for the whole run");
    expect(entry).toContain(
      "**PREVENTION:** spec — `tests/arch/research-circuit-breaker.spec.ts` (#4659).",
    );
    // The drafted ledger now marks the incident learned — the whole point of the draft.
    expect(learnedIn(entry, "ffa1cc2") && learnedIn(entry, "1b2ec2e")).toBe(true);
  });

  it("says ledger-only when the fix changed no spec, rather than guessing a gate", () => {
    expect(draftEntry({ capsule, runs, fix: { ...fix, specs: [] } })?.entry).toContain(
      "**PREVENTION:** ledger-only — #4659 changed no spec",
    );
  });

  it("falls back to the Summary without its closing keyword when there is no Why", () => {
    const entry = draftEntry({
      capsule,
      runs,
      fix: { ...fix, body: "## Summary\n\n- It works now.\n- Closes #4658." },
    })?.entry;
    expect(entry).toContain("**ROOT CAUSE:** It works now.");
    expect(entry).not.toContain("Closes #4658");
  });

  it("drops a fenced log block from the Why instead of flattening it into the line", () => {
    const body = "### Why\n\nFly closed the socket:\n```text\nError: EOF\n```\nNo retry ran.";
    const entry = draftEntry({ capsule, runs, fix: { ...fix, body } })?.entry ?? "";
    expect(entry).toContain("**ROOT CAUSE:** Fly closed the socket: No retry ran.");
    expect(entry).not.toContain("```");
  });

  it("leaves out shas the ledger already names, and drafts nothing when none are left", () => {
    const ledger =
      "- **SHA:** abc1234   **DATE:** 2026-10-05   **STATUS:** closed\n- **COVERS:** ffa1cc2\n";
    expect(draftEntry({ capsule, runs, fix, ledger })?.covered).toEqual(["1b2ec2e"]);
    expect(draftEntry({ capsule, runs, fix, ledger: `${ledger.trimEnd()} 1b2ec2e\n` })).toBeNull();
  });

  it("marks a hand-closed capsule as not recorded, never inventing a cause", () => {
    const entry = draftEntry({ capsule, runs, fix: null })?.entry ?? "";
    expect(entry).toContain("**SHA:** n/a");
    expect(entry).toContain("later by hand");
    expect(entry).toContain("**ROOT CAUSE:** not recorded — closed by hand");
    expect(entry).toContain("**PREVENTION:** not recorded");
  });
});

describe("lesson draft — landing it", () => {
  const ledger = [
    "# Lessons ledger",
    "",
    "```",
    "### <short title>",
    "```",
    "",
    "---",
    "",
    "### The newest existing entry",
    "- **SHA:** n/a",
  ].join("\n");

  it("goes above the newest entry, never inside the fenced format block", () => {
    const out = insertEntry(ledger, "### Drafted\n- **SHA:** 362d028");
    expect(out.indexOf("### <short title>")).toBeLessThan(out.indexOf("### Drafted"));
    expect(out.indexOf("### Drafted")).toBeLessThan(out.indexOf("### The newest existing entry"));
    expect(out).toContain("- **SHA:** 362d028\n\n---\n\n### The newest existing entry");
  });

  it("opens with the picture waiver and never names the capsule beside a closing keyword", () => {
    const body = prBody({ capsule, fix, covered: ["ffa1cc2", "1b2ec2e"] });
    expect(body.startsWith("## The picture\n\nPicture: waived — ")).toBe(true);
    expect(body).not.toMatch(/(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#4658/i);
  });
});

describe("digest — the learning line sits outside Needs you", () => {
  it("counts unlearned runs and open entries on one Noise-absorbed line", () => {
    const line = learningLine({
      days: 14,
      openEntries: ["The arm job refused"],
      unlearnedRuns: 10,
    });
    expect(line).toMatch(/^- Learning: 10 failed run\(s\) on main in 14d not yet in LESSONS/);
    expect(line).toContain('1 entry(ies) still STATUS: open ("The arm job refused")');
  });

  it("says unknown, never zero, when the scan could not reach GitHub", () => {
    expect(learningLine({ unlearnedRuns: null })).toContain("unknown");
  });

  it("says plainly when there is nothing to learn", () => {
    expect(learningLine({ days: 14, openEntries: [], unlearnedRuns: 0 })).toBe(
      "- Learning: every failed run on main in 14d has a lesson; no open entries.",
    );
  });
});
