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

/** Source with comments removed — a rule about CODE must not be tripped by prose describing it. */
const codeOnly = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/[^\n]*$/gm, "");

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

  // THE SECOND HALF OF THE SAME LESSON (2026-08-22, #494). Asking `gh` for a field it knows is
  // necessary but not sufficient — you also have to use the SHAPE it hands back. Every
  // `closedByPullRequestsReferences` element is exactly `{id, number, repository, url}`; there is
  // no state. The sweep filtered on `.state === "MERGED"` for its whole life, comparing
  // `undefined === "MERGED"` every time, and so could never close anything. A wrong field NAME
  // fails loudly on the first call; a wrong field READ is silent forever, which is worse.
  it("never reads a state off a closing reference — gh does not return one", () => {
    const source = codeOnly(readFileSync("scripts/postmaster.mjs", "utf8"));

    // The literal shape of the dead filter, and any near-relative of it. Prose is stripped first,
    // so the comments explaining the bug do not themselves fail the rule.
    expect(source).not.toMatch(/closedByPullRequestsReferences[\s\S]{0,200}?\.state\s*===/);
  });

  it("rejects the exact typo that broke main", () => {
    const unknown = jsonFieldLists('"--json",\n  "number,title,closedByPullRequests",')
      .flat()
      .filter((f) => !ISSUE_FIELDS.has(f));

    expect(unknown).toEqual(["closedByPullRequests"]);
  });
});
