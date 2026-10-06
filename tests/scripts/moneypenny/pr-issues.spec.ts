import { describe, expect, it } from "@rstest/core";
import {
  branchIssueOf,
  derivePrIssues,
  laneClassOf,
  namesNoIssue,
} from "../../../scripts/moneypenny/pr-issues.mjs";

// #4393 slice 1 — "observe, don't remember". The board's Building-now column derives from the
// evidence a build already leaves: a PR that names `#n`. These are the rules for "names", each
// drawn from a real branch or title in the 2026-09-23 → 10-01 merged-PR sample (579 PRs).

describe("derivePrIssues: a closing keyword links the issue, as GitHub does", () => {
  it.each([
    ["Closes #4292", [4292]],
    ["fixes: #12", [12]],
    ["This resolved #77 and fixed #78.", [77, 78]],
    ["Close #1, close #2", [1, 2]],
  ])("%s", (body, want) => {
    expect(derivePrIssues({ body })).toEqual(want);
  });
});

describe("derivePrIssues: this repo's provenance phrases count, though GitHub ignores them", () => {
  it.each([
    ["Part of #4393", [4393]],
    ["slice of #3665", [3665]],
    ["slice 3 of #3665", [3665]],
    ["refs #3960", [3960]],
    ["Ref: #3960", [3960]],
  ])("%s", (body, want) => {
    expect(derivePrIssues({ body })).toEqual(want);
  });
});

describe("derivePrIssues: a bare #n names an issue in the title, never in the body", () => {
  it("reads the title's bare reference", () => {
    expect(
      derivePrIssues({ title: "feat(rank): report rank movement in the digest (#4064 slice 3)" }),
    ).toEqual([4064]);
  });

  it("ignores the body's related-issue citations — nobody is building those", () => {
    expect(derivePrIssues({ body: "Related: #3960 · #4320 · #4349." })).toEqual([]);
  });
});

describe("derivePrIssues: the branch name", () => {
  it.each([
    ["feat/4292-ci-burst-alarm", [4292]],
    ["feedback/3970", [3970]],
    ["feedback/3970-wording", [3970]],
    ["feat/research-scorecard-4061", [4061]],
    ["fix/e2e-baselines-since-4087", [4087]],
  ])("%s names its issue", (headRef, want) => {
    expect(derivePrIssues({ headRef })).toEqual(want);
  });

  it.each([
    ["claude/happy-turing-7l7uat", "a session's random suffix"],
    ["fix/repair-lane-in-flight-fix", "no number at all"],
    ["feat/cond-scout-2", "a short tail is a second attempt, not issue #2"],
    ["fix/rollover-2026-09-30", "a date's last field is not issue #30"],
    ["ccr-cf46d15b-vn87rb", "no prefix, no number"],
  ])("%s names nothing (%s)", (headRef) => {
    expect(derivePrIssues({ headRef })).toEqual([]);
  });

  it("takes nothing from a machine lane's branch — its tail is a date or a run id", () => {
    expect(branchIssueOf("research/pce-2026-09-30")).toBeNull();
    expect(branchIssueOf("moneypenny/screen-36803254764-1")).toBeNull();
    expect(branchIssueOf("dependabot/npm_and_yarn/vite-7.1.200")).toBeNull();
  });

  it("still reads a machine lane PR's own words", () => {
    expect(derivePrIssues({ headRef: "research/pce-2026-09-30", body: "refs #3407" })).toEqual([
      3407,
    ]);
  });
});

describe("derivePrIssues: what never counts as a reference", () => {
  it("another repo's issue", () => {
    expect(derivePrIssues({ body: "Closes octo/other#12", title: "x (octo/other#13)" })).toEqual(
      [],
    );
  });

  it("this repo's fully qualified reference does count", () => {
    expect(derivePrIssues({ body: "Closes ejclark/skynet-capital#12" })).toEqual([12]);
  });

  it("an HTML entity, a URL fragment or a word glued to the hash", () => {
    expect(
      derivePrIssues({ title: "a&#123; b/page#45 c#6", body: "see https://x.dev/#7 closes c#8" }),
    ).toEqual([]);
  });

  it("a word that merely contains a keyword", () => {
    expect(derivePrIssues({ body: "prefs #5 · prefixes #6 · unresolved #7" })).toEqual([]);
  });
});

describe("derivePrIssues: merges every source, ascending, once each", () => {
  it("de-duplicates across title, body and branch", () => {
    expect(
      derivePrIssues({
        title: "feat(x): the thing (#4393)",
        body: "Part of #4393. Closes #4401.",
        headRef: "feat/4393-derive",
      }),
    ).toEqual([4393, 4401]);
  });

  it("tolerates missing and null fields", () => {
    expect(derivePrIssues()).toEqual([]);
    expect(derivePrIssues({ title: null, body: null, headRef: null })).toEqual([]);
  });
});

describe("laneClassOf: machine lanes are classes of service, not cards", () => {
  it.each([
    ["research/ism-manufacturing-2026-10-01", "research"],
    ["moneypenny/screen-36803254764-1", "moneypenny"],
    ["dependabot/npm_and_yarn/vite-7.1.2", "dependabot"],
    ["platter/2026-10-01", "platter"],
    ["digest/2026-09-30", "digest"],
    ["docs/digest-2026-10-05", "digest"],
  ])("%s → %s", (ref, lane) => {
    expect(laneClassOf(ref)).toBe(lane);
  });

  it.each(["feat/4292-ci-burst-alarm", "claude/happy-turing-7l7uat", "researchy/x", "", undefined])(
    "%s is no lane",
    (ref) => {
      expect(laneClassOf(ref)).toBeNull();
    },
  );
});

// #4393 criterion 8 — the advisory check's question: does a PR leave no trace of what it builds?
// The 2026-10-06 sample of 100 merged PRs: 58 were lane PRs, 28 named an issue, 14 named nothing —
// ten of those a `chore/model-fit-*` grind fan-out that never filed an issue.
describe("namesNoIssue: a PR the board cannot see", () => {
  it("flags a fan-out branch with no issue anywhere", () => {
    expect(
      namesNoIssue({
        title: "chore(agents): fit the model",
        body: "Summary",
        headRef: "chore/model-fit-agents",
      }),
    ).toBe(true);
  });

  it.each([
    ["a title ref", { title: "fix(x): y (#3665 slice 3)", headRef: "fix/y" }],
    ["a closing keyword", { body: "Closes #4292", headRef: "claude/happy-turing-7l7uat" }],
    ["a branch number", { headRef: "feat/4292-ci-burst-alarm" }],
  ])("passes a PR with %s", (_why, pr) => {
    expect(namesNoIssue(pr)).toBe(false);
  });

  it("passes a lane PR with no issue — a class of service, not a card", () => {
    expect(
      namesNoIssue({ title: "docs(research): pce d-3", headRef: "research/pce-2026-10-02" }),
    ).toBe(false);
  });
});
