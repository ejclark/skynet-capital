import { readFileSync } from "node:fs";

// Every `--json` field this repo asks `gh` for must be one `gh` actually knows.
//
// PROVENANCE (2026-08-22): `gh issue list --json number,title,closedByPullRequests` exits 1 with
// "Unknown JSON field" and prints the allow-list. The real name is `closedByPullRequestsReferences`.
// That one wrong word took down EVERY push run of the postmaster — the router that carries the
// feedback lane, event research and the stall audit — and nothing caught it, because a `gh` call
// only fails on a runner with a token. This spec is the offline stand-in: it reads the field names
// out of the source and checks them against the list `gh` itself printed in that failure.
//
// The list below is `gh issue list`'s allow-list verbatim. Extend it deliberately when a newer
// `gh` adds a field, never to make a red spec go quiet.
const ISSUE_FIELDS = new Set([
  "assignees",
  "author",
  "blockedBy",
  "blocking",
  "body",
  "closed",
  "closedAt",
  "closedByPullRequestsReferences",
  "comments",
  "createdAt",
  "id",
  "isPinned",
  "issueType",
  "labels",
  "milestone",
  "number",
  "parent",
  "projectCards",
  "projectItems",
  "reactionGroups",
  "state",
  "stateReason",
  "subIssues",
  "subIssuesSummary",
  "title",
  "updatedAt",
  "url",
]);

/** Every `"--json"` argument list in a script that shells out to `gh issue list`. */
const jsonFieldLists = (source: string): string[][] =>
  [...source.matchAll(/"--json",\s*(?:\/\/[^\n]*\n\s*)*"([^"]+)"/g)].map((m) =>
    (m[1] ?? "").split(",").map((f) => f.trim()),
  );

describe("gh --json fields", () => {
  it("asks postmaster's issue queries only for fields gh knows", () => {
    const source = readFileSync("scripts/postmaster.mjs", "utf8");
    const lists = jsonFieldLists(source);

    expect(lists.length).toBeGreaterThan(0);
    const unknown = lists.flat().filter((f) => f && !ISSUE_FIELDS.has(f));
    expect(unknown).toEqual([]);
  });

  it("rejects the exact typo that broke main", () => {
    const unknown = jsonFieldLists('"--json",\n  "number,title,closedByPullRequests",')
      .flat()
      .filter((f) => !ISSUE_FIELDS.has(f));

    expect(unknown).toEqual(["closedByPullRequests"]);
  });
});
