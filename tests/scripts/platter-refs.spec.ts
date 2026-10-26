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
    expect(itemRefs({ item: "plan/4535", subject: "chore(ci): slice 4 (#4535)" })).toEqual({
      closes: [],
      refs: [4535],
    });
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
