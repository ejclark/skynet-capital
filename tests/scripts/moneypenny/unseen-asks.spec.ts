import { describe, expect, it } from "@rstest/core";
import {
  gatherUnseen,
  protectedTest,
  unseenAsks,
  unseenLine,
} from "../../../scripts/moneypenny/unseen-asks.mjs";

// #6953 slice 4: the "unseen" line SHALL name every item matching the four cases — a needs-eric
// with no body callout, a callout only in a comment, a protected-path PR with neither hold-merge
// nor auto-merge, a platter/* branch with no PR. Shaped on the 2026-11-06 map's own examples.
const callout = (d: string) => `**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. ${d}`;
const needsEric = [{ name: "needs-eric" }];
const isProtected = protectedTest();

describe("unseenAsks — the four cases no list can see", () => {
  const rows = unseenAsks({
    issues: [
      { number: 1, title: "has its callout", body: callout("decide"), labels: needsEric },
      { number: 2, title: "label, no callout", body: "prose only", labels: needsEric },
      { number: 3, title: "closed", body: "x", labels: needsEric, state: "closed" },
      { number: 6771, title: "callout in a comment", body: "prose", labels: needsEric },
    ],
    commentCallouts: [{ number: 6771, title: "callout in a comment" }],
    prs: [
      { number: 6768, title: "bump", labels: [], files: [".github/workflows/pipeline.yml"] },
      { number: 10, title: "held", labels: [{ name: "hold-merge" }], files: ["envelope.json"] },
      {
        number: 11,
        title: "armed",
        auto_merge: { merge_method: "squash" },
        files: ["envelope.json"],
      },
      { number: 12, title: "plain", labels: [], files: ["scripts/digest-scan.mjs"] },
    ],
    platters: [
      { branch: "platter/night-chain-end-build", prs: 0 },
      { branch: "platter/2026-11-07", prs: 1 },
    ],
    isProtected,
  });

  it("names exactly the four shapes, once each, the most specific case winning", () => {
    expect(rows.map((r) => [r.case, r.number ?? r.branch])).toEqual([
      ["comment-only", 6771],
      ["no-callout", 2],
      ["protected-pr", 6768],
      ["platter-branch", "platter/night-chain-end-build"],
    ]);
  });

  it("says which protected file a PR touches, read from envelope.json", () => {
    expect(rows.find((r) => r.number === 6768)?.why).toMatch(/\.github\/workflows\/pipeline\.yml/);
  });
});

describe("unseenAsks — what is not unseen", () => {
  const NOW = Date.parse("2026-11-07T12:00:00Z");
  it("skips what Needs you already lists, and a protected PR still inside its first hour of CI", () => {
    const rows = unseenAsks({
      issues: [{ number: 20, title: "held PR with the label", body: "", labels: needsEric }],
      prs: [
        { number: 30, labels: [], files: ["envelope.json"], created_at: "2026-11-07T11:30:00Z" },
        { number: 31, labels: [], files: ["envelope.json"], created_at: "2026-11-07T10:00:00Z" },
      ],
      isProtected,
      listed: [20],
      now: NOW,
    });
    expect(rows.map((r) => r.number)).toEqual([31]);
  });
});

describe("unseenLine", () => {
  it("lists each item, says plainly when there is none, and never reads a failed scan as none", () => {
    expect(unseenLine([])).toBe("- Unseen: every open ask is on a list.");
    expect(
      unseenLine([
        { case: "no-callout", number: 2, why: "needs-eric with no callout in the body" },
        { case: "platter-branch", branch: "platter/x", why: "a platter branch with no PR" },
      ]),
    ).toBe(
      "- Unseen: 2 asks no list shows you — #2 needs-eric with no callout in the body; `platter/x` a platter branch with no PR.",
    );
    expect(unseenLine(null, "search refused")).toBe("- Unseen: unknown — search refused.");
  });
});

describe("gatherUnseen — the reads", () => {
  const comments: Record<string, unknown[]> = {
    "issues/6771/comments": [
      { author_association: "NONE", body: callout("a stranger's ask"), user: { type: "User" } },
      { author_association: "OWNER", body: callout("ticker fit bar"), html_url: "u" },
    ],
    "issues/5056/comments": [{ author_association: "OWNER", body: "prose: Needs from you" }],
  };
  const calls: string[] = [];
  const rest = (path: string): unknown[] => {
    calls.push(path);
    if (path in comments) return comments[path] ?? [];
    if (path.startsWith("pulls/6768/files")) return [{ filename: ".github/workflows/x.yml" }];
    if (path.startsWith("git/matching-refs"))
      return ["a", "closed", "merged"].map((b) => ({ ref: `refs/heads/platter/${b}` }));
    if (path.startsWith("pulls?state=all&head=ejclark:platter%2Fclosed"))
      return [{ state: "closed", merged_at: null }];
    if (path.startsWith("pulls?state=all&head=ejclark:platter%2Fmerged"))
      return [{ state: "closed", merged_at: "2026-11-01T00:00:00Z" }];
    if (path.startsWith("pulls?state=all")) return [];
    throw new Error(`unexpected read ${path}`);
  };
  const read = () => ({
    total_count: 3,
    items: [
      { number: 6771, title: "fit bar", body: "prose" },
      { number: 5056, title: "steering", body: "prose" },
      { number: 6953, title: "has it", body: callout("resume") },
    ],
  });
  const rows = gatherUnseen({
    rest,
    read,
    issues: [],
    prs: [
      { number: 6768, title: "bump", labels: [], head: { ref: "dependabot/x" } },
      { number: 7, title: "armed", auto_merge: {}, labels: [], head: { ref: "feat/y" } },
    ],
    isProtected,
  });

  it("counts only a trusted comment's real callout, and reads files only for unarmed, unheld PRs", () => {
    // A platter PR closed unmerged strands its branch like no PR at all; a merged one does not.
    expect(rows.map((r) => r.number ?? r.branch)).toEqual([
      6771,
      6768,
      "platter/a",
      "platter/closed",
    ]);
    expect(calls).not.toContain("issues/6953/comments");
    expect(calls.some((c) => c.startsWith("pulls/7/files"))).toBe(false);
  });

  it("refuses a search past one page rather than read part of it as all", () => {
    expect(() =>
      gatherUnseen({ rest, read: () => ({ total_count: 101, items: [] }), issues: [], prs: [] }),
    ).toThrow(/past one page/);
  });
});
