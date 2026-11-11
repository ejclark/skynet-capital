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

  it("a follow-up on such a filing still restarts its build, since the re-label opens nothing", async () => {
    const { calls, doFetch } = github(issueBody(member));

    expect(await followUp(doFetch)).toMatchObject({ ok: true, outcome: "restarted" });
    expect(calls.map((c) => c.method)).toEqual(["GET", "POST", "GET", "DELETE", "POST"]);
  });

  it("on an older filing whose body opens the lane, posts the comment but never cycles ready", async () => {
    const before = `${member.details}\n\n---\n_Submitted from the app by **Tony** (member \`abc\`)._`;
    expect(opensTheLane(before)).toBe(true);
    const { calls, doFetch } = github(before);

    expect(await followUp(doFetch)).toMatchObject({ ok: true, outcome: "unchanged" });
    expect(calls.some((c) => c.url.includes("/labels"))).toBe(false);
    expect(calls.some((c) => c.url.endsWith("/comments"))).toBe(true);
  });

  it("checks the lane's mention the way GitHub does, ignoring case", async () => {
    const shouted = `${String(mention).toUpperCase()} please\n\n---\n_Submitted from the app by a league member._`;
    const { calls, doFetch } = github(shouted);

    expect(await followUp(doFetch)).toMatchObject({ ok: true, outcome: "unchanged" });
    expect(calls.some((c) => c.url.includes("/labels"))).toBe(false);
  });
});
