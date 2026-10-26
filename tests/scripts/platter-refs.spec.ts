import { describe, expect, it } from "@rstest/core";
import {
  itemRefs,
  parseBoarded,
  parseIssueList,
  summaryBullets,
  trailerLines,
} from "../../scripts/platter-refs.mjs";

// #4562 — a boarded item used to lose its `Closes #N`: the platter body is regenerated from git on
// every board, and a platter branch names no issue. Each item now carries Platter-Closes /
// Platter-Refs trailers and the body turns them into Summary bullets, so the platter's one merge
// closes the issues behind it. The one rule that must never slip: a number read off a branch or a
// subject is only ever `Part of` — `plan/4535` boarded slice 4 of a plan whose steps were still open.

describe("platter-refs: what one item closes", () => {
  it("takes the flags as the whole answer when the boarding session passes them", () => {
    expect(
      itemRefs({
        item: "plan/3913",
        closes: [4246, 3913],
        partOf: [3913, 4393],
        prBody: "Closes #1",
      }),
    ).toEqual({ closes: [3913, 4246], refs: [4393] });
  });

  it("reads the item's own PR body otherwise — #4494's Summary closed #4246 and #3913", () => {
    const prBody = [
      "## Summary",
      "- Closes #4246",
      "- Closes #3913",
      "- Part of #4393",
      "",
      "Related: #3960",
    ].join("\n");
    expect(itemRefs({ item: "plan/3913", subject: "feat(x): y", prBody })).toEqual({
      closes: [3913, 4246],
      refs: [4393],
    });
  });

  it("never turns a branch or subject number into a close — only ever a ref", () => {
    expect(itemRefs({ item: "feat/4535-ci-pins", subject: "chore(ci): slice 4 (#4535)" })).toEqual({
      closes: [],
      refs: [4535],
    });
  });

  // #6191 — #5837's last item boarded #5852 as `feedback/5837` with no PR and no flag, so the
  // platter's merge would have left it open, and the sweep rebuilt it three times meanwhile.
  it("refuses a claim lane's build that does not say whether it finishes its issue", () => {
    for (const item of ["feedback/5837", "plan/4535"]) {
      const n = item.split("/")[1];
      expect(() => itemRefs({ item, subject: "chore(deps): y" })).toThrow(
        `pass --closes ${n} if it is the issue's last work, or --part-of ${n} if work remains`,
      );
    }
    // a PR body that names some other issue still says nothing about this one
    expect(() => itemRefs({ item: "feedback/5837", prBody: "Closes #12" })).toThrow(/#5837/);
  });

  it("boards a claim lane's build once a flag or its PR body says what it does to its issue", () => {
    expect(itemRefs({ item: "feedback/5837", closes: [5837] })).toEqual({
      closes: [5837],
      refs: [],
    });
    expect(itemRefs({ item: "plan/4535", partOf: [4535] })).toEqual({ closes: [], refs: [4535] });
    expect(itemRefs({ item: "plan/4535", prBody: "- Part of #4535" })).toEqual({
      closes: [],
      refs: [4535],
    });
    expect(itemRefs({ item: "feedback/5837", prBody: "- Closes #5837" }).closes).toEqual([5837]);
  });

  it("ignores a keyword quoted in code — GitHub links neither", () => {
    const prBody = "Use `Closes #12` in a Summary.\n\n```\nCloses #13\n```\n";
    expect(itemRefs({ item: "fix/x", prBody }).closes).toEqual([]);
  });

  it("ignores another repo's reference", () => {
    expect(itemRefs({ item: "fix/x", prBody: "Closes other/repo#12" }).closes).toEqual([]);
  });

  it("parses a flag list and refuses anything that is not an issue number", () => {
    expect(parseIssueList("4246, #3913")).toEqual([3913, 4246]);
    expect(parseIssueList("")).toEqual([]);
    expect(() => parseIssueList("4246,next")).toThrow(/not an issue number/);
  });

  it("writes one trailer line per issue, closes first", () => {
    expect(trailerLines({ closes: [12], refs: [7, 9] })).toEqual([
      "Platter-Closes: #12",
      "Platter-Refs: #7",
      "Platter-Refs: #9",
    ]);
  });
});

describe("platter-refs: the Summary bullets, from the boarded commits", () => {
  const record = (subject: string, trailers: string[]) =>
    `\n${"a".repeat(40)}\x00${subject}\x00${trailers.join("\n")}\n\x1e`;

  it("reads each commit's trailers in boarding order, and none from an item that carried none", () => {
    const log =
      record("fix: a", ["Platter-Item: fix/a", "Platter-Closes: #12", "Platter-Refs: #7"]) +
      record("feat: b", ["Platter-Item: feat/b", "Platter-Paths: none"]);
    expect(parseBoarded(log)).toEqual([
      { closes: [12], refs: [7] },
      { closes: [], refs: [] },
    ]);
  });

  it("names each issue once with the ledger row that boarded it", () => {
    expect(
      summaryBullets([
        { closes: [12], refs: [7] },
        { closes: [], refs: [] },
        { closes: [12, 30], refs: [] },
      ]),
    ).toEqual([
      "- Closes #12 — boarded as items 1, 3.",
      "- Closes #30 — boarded as item 3.",
      "- Part of #7 — boarded as item 1.",
    ]);
  });

  it("prints an issue one item closes and another refs once, as closed", () => {
    expect(
      summaryBullets([
        { closes: [], refs: [12] },
        { closes: [12], refs: [] },
      ]),
    ).toEqual(["- Closes #12 — boarded as item 2."]);
  });

  it("prints nothing when no item names an issue", () => {
    expect(summaryBullets([{ closes: [], refs: [] }])).toEqual([]);
  });
});
