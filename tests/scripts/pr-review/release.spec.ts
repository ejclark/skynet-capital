import { describe, expect, it } from "@rstest/core";
import { LEDGER_BRANCH } from "../../../scripts/pr-review/ledger.mjs";
import {
  applyRelease,
  gatherHolds,
  HOLD_MS,
  type Hold,
  releasable,
  runningResponses,
} from "../../../scripts/pr-review/release.mjs";
import { fakeApi, unb64 } from "./fake-api";

// #6870 S2. The reviewer may slow a merge, never strand one: a hold nobody is answering lifts after
// 2 hours, and so does a review that crashed mid-round. A hold with a session still answering stays.

const NOW = Date.parse("2026-11-05T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const hold = (pr: number, state: string, age: number): Hold => ({
  pr,
  sha: `abc${pr}def`,
  state,
  updatedAt: ago(age),
});
const OVER = HOLD_MS + 60_000;

describe("which holds lift", () => {
  it("lifts a failure older than 2 hours with no response running", () => {
    expect(releasable({ holds: [hold(1, "failure", OVER)], now: NOW })).toEqual([
      {
        pr: 1,
        sha: "abc1def",
        ageMin: 121,
        reason: "no response in 2h",
        status: {
          state: "success",
          context: "pr-review",
          description: "released: no response in 2h",
        },
      },
    ]);
  });

  it("leaves a failure whose response session is still running", () => {
    expect(releasable({ holds: [hold(1, "failure", OVER)], running: [1], now: NOW })).toEqual([]);
  });

  it("leaves a hold younger than 2 hours", () => {
    expect(
      releasable({
        holds: [hold(1, "failure", HOLD_MS - 60_000), hold(2, "pending", HOLD_MS)],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it("lifts a review that never finished, running or not, because a crash must not hold a merge", () => {
    const lifts = releasable({ holds: [hold(2, "pending", OVER)], running: [2], now: NOW });
    expect(lifts.map((l) => l.reason)).toEqual(["the review never finished in 2h"]);
  });

  it("ignores any other state, and a status with no readable time", () => {
    expect(
      releasable({
        holds: [hold(3, "error", OVER), { ...hold(4, "failure", 0), updatedAt: "" }],
        now: NOW,
      }),
    ).toEqual([]);
  });
});

describe("what counts as a response running", () => {
  it("is a queued or in-progress run titled for the PR", () => {
    expect(
      runningResponses([
        { display_title: "pr-review respond #12", status: "in_progress" },
        { display_title: "pr-review respond #13", status: "queued" },
        { display_title: "pr-review respond #14", status: "completed" },
        { display_title: "Pipeline", status: "in_progress" },
        { name: "pr-review respond #15 (rerun)", status: "waiting" },
      ]),
    ).toEqual([12, 13, 15]);
  });
});

describe("reading and lifting", () => {
  it("reads each open PR's pr-review status and the running respond runs", () => {
    const api = fakeApi({
      "pulls?state=open&base=main": [
        { number: 1, head: { sha: "s1" } },
        { number: 2, head: { sha: "s2" } },
        { number: 3, head: { sha: "s3" } },
      ],
      "commits/s1/status": {
        statuses: [{ context: "pr-review", state: "failure", updated_at: "t1" }],
      },
      "commits/s2/status": {
        statuses: [{ context: "pr-review", state: "success", updated_at: "t2" }],
      },
      "commits/s3/status": {
        statuses: [{ context: "verify", state: "failure", updated_at: "t3" }],
      },
      "actions/runs?status=in_progress&per_page=100": {
        workflow_runs: [{ display_title: "pr-review respond #1", status: "in_progress" }],
      },
      "actions/runs?status=queued&per_page=100": { workflow_runs: [] },
    });
    expect(gatherHolds({ api })).toEqual({
      holds: [{ pr: 1, sha: "s1", state: "failure", updatedAt: "t1" }],
      running: [1],
    });
  });

  it("sets the status, says so on the PR, and writes one released row per hold", () => {
    const api = fakeApi({}, (s) => (s.path.startsWith("git/") ? { sha: "g" } : {}));
    const lifts = releasable({ holds: [hold(1, "failure", OVER)], now: NOW });
    expect(applyRelease(lifts, { api })).toBe(1);
    expect(api.sent[0]).toMatchObject({
      method: "POST",
      path: "statuses/abc1def",
      body: { state: "success", context: "pr-review" },
    });
    expect(api.sent[1]).toMatchObject({
      path: "issues/1/comments",
      body: {
        body: expect.stringMatching(/is lifted:\*\* no response in 2h\. The merge goes ahead/),
      },
    });
    const put = api.sent.find((s) => s.method === "PUT");
    expect(put?.body.branch).toBe(LEDGER_BRANCH);
    expect(JSON.parse(unb64(put?.body.content))).toMatchObject({
      kind: "outcome",
      pr: 1,
      id: "hold",
      outcome: "released",
      sha: "abc1def",
    });
  });

  it("writes nothing when nothing lifts", () => {
    const api = fakeApi();
    expect(applyRelease([], { api })).toBe(0);
    expect(api.sent).toEqual([]);
  });
});
