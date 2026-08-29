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

/**
 * EVERY script that asks `gh` for JSON, not just the event router (#813, 2026-08-29).
 *
 * This gate was written for the 2026-08-22 outage and pointed at `scripts/moneypenny.mjs` (then
 * `scripts/postmaster.mjs`) alone.
 * `scripts/feedback-scan.mjs` asked for the same renamed field, was never covered, and had been
 * exiting non-zero on every run since — the lane's own scoreboard, blind, while
 * `feedback-build.md` told each build session to read it. A gate that checks one caller of a
 * repo-wide API is a gate with a hole the exact size of the next caller.
 */
const GH_JSON_SCRIPTS = ["scripts/moneypenny.mjs", "scripts/feedback-scan.mjs"];

describe("gh --json fields", () => {
  it.each(GH_JSON_SCRIPTS)("asks %s's issue queries only for fields gh knows", (file) => {
    const lists = jsonFieldLists(readFileSync(file, "utf8"));

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
    const source = codeOnly(readFileSync("scripts/moneypenny.mjs", "utf8"));

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

/**
 * THE BUCKET RULE (2026-08-26). `gh <thing> list --json` and `gh <thing> view --json` do not hit
 * REST — they compile to GraphQL, whose 10,000/hr ceiling is scored by query COST, not call count,
 * and which the GitHub MCP also spends. The postmaster rides EVERY push to main, so a hundred-issue
 * nested query there is the largest single draw in the repo. On 2026-08-26 it exhausted the bucket:
 * `route` began dying on "API rate limit already exceeded for user ID 3472134" before it could
 * dispatch the research or feedback jobs, and the tick driving the whole lane stopped — visible
 * nowhere except the run list.
 *
 * These cases hold the line that fix drew. They do not ban GraphQL — two queries legitimately
 * remain, both reading `closedByPullRequestsReferences`, which exists ONLY in GraphQL: the shipped
 * sweep's list, and the per-issue re-check behind it. That re-check is not an oversight; it is the
 * whole lesson of #475 (an under-reporting list query and a genuinely empty queue printed the same
 * sentence), and the REST stand-in for it — the timeline API — reports mentions rather than closing
 * links, so adopting it would risk auto-closing a member's issue that a PR merely referenced. A
 * bounded fallback is worth its cost; silently closing someone's feedback is not.
 *
 * So the rule is not "zero GraphQL". It is: no THIRD one appears without someone deciding to add
 * it, the unbounded per-PR read stays on REST, and the survivors stay behind the cheap REST
 * existence check that keeps a quiet push free.
 */
const GH_JSON_CALLS = /"(?:issue|pr)",\s*"(?:list|view)"/g;

describe("the GraphQL bucket the postmaster rides on", () => {
  it("keeps only the two queries whose field has no REST equivalent", () => {
    const source = codeOnly(readFileSync("scripts/moneypenny.mjs", "utf8"));

    // The shipped sweep's list, and its per-issue re-check. Both read
    // `closedByPullRequestsReferences`. A third hit means a per-push GraphQL query was added
    // where REST would have done — move it to `ghRest`.
    expect(source.match(GH_JSON_CALLS) ?? []).toHaveLength(2);
  });

  it("asks the cheap REST question before the expensive one", () => {
    const source = codeOnly(readFileSync("scripts/moneypenny.mjs", "utf8"));
    // Parameterized by label (2026-08-28: `feedback` and `event-research` share this one sweep) —
    // `labels=${label}`, not a literal label name.
    const restProbe = source.indexOf("issues?state=open&labels=");
    const graphqlSweep = source.search(GH_JSON_CALLS);

    expect(restProbe).toBeGreaterThan(-1);
    expect(graphqlSweep).toBeGreaterThan(-1);
    // Ordering IS the saving: most pushes have no open issue in the label and must pay nothing.
    expect(restProbe).toBeLessThan(graphqlSweep);
  });

  it("reads a pull request's merged state over REST, once per referenced PR", () => {
    const source = codeOnly(readFileSync("scripts/moneypenny-shipped.mjs", "utf8"));

    // This one runs per REFERENCED PR across every open feedback issue — unbounded, and the
    // reason a busy day drained the bucket fastest.
    expect(source).not.toMatch(/"pr",\s*"view"/);
    expect(source).toMatch(/ghRest\(/);
  });
});
