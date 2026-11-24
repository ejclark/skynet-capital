import { readFileSync } from "node:fs";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createFollowup } from "../../src/server/feedback-followup.js";
import { issueBody } from "../../src/server/feedback-issue.js";

// #7444. claude.yml starts an unrestricted session on an `issues` event (opened, or ANY label
// added) whose body mentions the lane and lacks the Claude Code link, when the sender is a User and
// the issue is OWNER-authored — and every app filing is, because the app files under the owner's
// token. So a member's filing that says "@claude …" opened the lane when it was filed, and again
// each time a follow-up cycled `ready` under that same token. The gate is read out of the workflow
// itself, so a change there fails these specs instead of quietly reopening the door.
const workflow = readFileSync(".github/workflows/claude.yml", "utf8");
const mention = /contains\(github\.event\.issue\.body,\s*'([^']+)'\)/.exec(workflow)?.[1];
const excluded = /!contains\(github\.event\.comment\.body[^,]*,\s*'([^']+)'\)/.exec(workflow)?.[1];

/** The gate's body test on an `issues` event, with GitHub's case-insensitive `contains`. */
const opensTheLane = (body: string): boolean =>
  body.toLowerCase().includes(String(mention).toLowerCase()) &&
  !body.toLowerCase().includes(String(excluded).toLowerCase());

describe("feedback filings and claude.yml's issues gate", () => {
  const ISSUE = "https://api.github.com/repos/x/y/issues/7";
  const member = {
    kind: "bug" as const,
    title: "Chart freezes",
    details: "@claude the chart freezes on the iPad, please fix it",
    submitterEmail: "member@example.com",
    submitterName: "Tony",
  };

  /** A fake GitHub holding one open, ready, unparked filing with `body`; records every call. */
  const github = (body: string) => {
    const calls: { method: string; url: string }[] = [];
    const doFetch = (method: string, url: string): Promise<JsonResponse> => {
      calls.push({ method, url });
      if (url.endsWith("/comments")) return Promise.resolve({ status: 201, body: {} });
      if (method === "GET" && url === ISSUE) {
        const labels = ["feedback", "bug", "ready"].map((name) => ({ name }));
        return Promise.resolve({ status: 200, body: { number: 7, state: "open", labels, body } });
      }
      return Promise.resolve({ status: 200, body: {} });
    };
    return { calls, doFetch };
  };
  const followUp = (doFetch: ReturnType<typeof github>["doFetch"]) =>
    createFollowup({ token: "t", repo: "x/y" }, doFetch)({ issueNumber: 7, body: "still frozen" });

  it("reads the gate's mention and its exclusion out of the workflow", () => {
    expect(mention).toBeTruthy();
    expect(excluded).toBeTruthy();
    expect(opensTheLane(`${String(mention)} fix it`)).toBe(true);
  });

  it("a filing that mentions the lane never opens it — the footer carries the excluded link", () => {
    expect(opensTheLane(issueBody(member))).toBe(false);
    expect(opensTheLane(issueBody({ ...member, submitterEmail: undefined }))).toBe(false);
  });

  // The hold takes `ready` off — an `unlabeled` event, which the gate never listens to — so it is
  // safe on any body. Only putting `ready` back (a `labeled` event) could open the lane.
  it("listens only to opened and labeled issue events, so taking ready off opens nothing", () => {
    expect(/issues:\s*\n\s*types:\s*\[([^\]]*)\]/.exec(workflow)?.[1]?.replace(/\s/g, "")).toBe(
      "opened,labeled",
    );
  });

  it("holds such a filing for the re-check, and never adds a label", async () => {
    const { calls, doFetch } = github(issueBody(member));

    expect(await followUp(doFetch)).toMatchObject({ ok: true, outcome: "rechecking" });
    expect(calls.map((c) => c.method)).toEqual(["GET", "DELETE", "POST"]);
  });

  /** A fake GitHub like `github`, whose comment POST fails after the hold. */
  const failing = (body: string) => {
    const calls: { method: string; url: string }[] = [];
    const doFetch = (method: string, url: string): Promise<JsonResponse> => {
      calls.push({ method, url });
      if (url.endsWith("/comments")) return Promise.resolve({ status: 502, body: {} });
      if (method === "GET") {
        const labels = ["feedback", "bug", "ready"].map((name) => ({ name }));
        return Promise.resolve({ status: 200, body: { number: 7, state: "open", labels, body } });
      }
      return Promise.resolve({ status: 200, body: {} });
    };
    return { calls, doFetch };
  };
  const readds = (calls: readonly { method: string; url: string }[]) =>
    calls.filter((c) => c.method === "POST" && c.url.endsWith("/labels"));

  it("puts ready back after a failed comment on a filing whose body opens nothing", async () => {
    const { calls, doFetch } = failing(issueBody(member));
    expect(await followUp(doFetch)).toMatchObject({ ok: false });
    expect(readds(calls)).toHaveLength(1);
  });

  it.each([
    [
      "an older filing whose body opens the lane",
      `${member.details}\n\n---\n_Submitted from the app by **Tony** (member \`abc\`)._`,
    ],
    [
      "a mention in another case (GitHub's contains ignores case)",
      "@CLAUDE please\n\n---\n_Submitted from the app by a league member._",
    ],
  ])("never puts ready back on %s", async (_case, body) => {
    expect(opensTheLane(body)).toBe(true);
    const { calls, doFetch } = failing(body);
    const warnings: string[] = [];

    const result = await createFollowup({ token: "t", repo: "x/y" }, doFetch, (l) =>
      warnings.push(l),
    )({ issueNumber: 7, body: "still frozen" });

    expect(result).toMatchObject({ ok: false });
    expect(readds(calls)).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});
