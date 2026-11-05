import { describe, expect, it } from "@rstest/core";
import {
  findingMarker,
  readMarkers,
  receiptMarker,
  replyMarker,
  respondMarker,
} from "../../../scripts/pr-review/markers.mjs";
import { gatherReeval, MIN_REASON_CHARS, reevaluate } from "../../../scripts/pr-review/reeval.mjs";
import { fakeApi } from "./fake-api";

// #6870 S2. Plain code lifts the hold once each Important thread is fixed by a commit or declined
// with a reason, and after 2 rounds lifts it anyway. Every way an answer counts or does not is here.

const OWNER = { author_association: "OWNER", user: { login: "ejclark", type: "User" } };
const BOT = { author_association: "NONE", user: { login: "skynet-bot[bot]", type: "Bot" } };
const C1 = "1111111aaaaaaa"; // the head the round-1 review read
const C2 = "2222222bbbbbbb"; // a later commit
const C0 = "0000000ccccccc"; // an earlier commit
const REASON = "Not a defect: the cap is deliberate, see the header.";

const receipt = (round: number, sha: string) => ({
  ...BOT,
  submitted_at: `2026-11-05T1${round}:00:00Z`,
  body: receiptMarker({ sha, patchId: null, tier: "standard", round }),
});
const findingAt = (id: string, severity = "important", path = "src/a.ts") => ({
  ...BOT,
  id: 100,
  path,
  line: 12,
  created_at: "2026-11-05T10:00:01Z",
  body: `x\n${findingMarker({ id, severity })}`,
});
const reply = (
  id: string,
  outcome: string,
  sha: string | null,
  words = "",
  who = OWNER,
  at = "2026-11-05T10:30:00Z",
) => ({
  ...who,
  in_reply_to_id: 100,
  created_at: at,
  body: `${words}\n${replyMarker({ id, outcome, sha })}`,
});
const judge = (
  replies: Record<string, unknown>[],
  {
    findings = [findingAt("r1f1")],
    receipts = [receipt(1, C1)],
    commitFiles = {} as Record<string, string[]>,
  } = {},
) =>
  reevaluate({
    markers: readMarkers({ reviews: receipts, reviewComments: [...findings, ...replies] }),
    commits: [C0, C1, C2],
    commitFiles,
  });

describe("an Important thread is answered", () => {
  it("by a commit on the PR, after the head the review read, that touches the file", () => {
    const v = judge([reply("r1f1", "fixed", C2.slice(0, 7))], {
      commitFiles: { [C2]: ["src/a.ts"] },
    });
    expect(v).toMatchObject({
      state: "success",
      description: "every Important thread answered (1)",
    });
    expect(v.outcomes).toEqual([
      { id: "r1f1", outcome: "fixed", sha: C2.slice(0, 7), reason: undefined },
    ]);
  });

  it("by a decline that gives a reason", () => {
    const v = judge([reply("r1f1", "declined", null, REASON)]);
    expect(v.state).toBe("success");
    expect(v.threads[0]).toMatchObject({ outcome: "declined", reason: REASON });
  });

  it("by its newest answer, so a decline can become a fix", () => {
    const v = judge([
      reply("r1f1", "declined", null, "no", OWNER, "2026-11-05T10:10:00Z"),
      reply("r1f1", "fixed", C2, "", OWNER, "2026-11-05T10:20:00Z"),
    ]);
    expect(v.threads[0]?.outcome).toBe("fixed");
  });
});

describe("an answer that does not count", () => {
  const cases: [
    string,
    Record<string, unknown>[],
    { commitFiles?: Record<string, string[]> },
    RegExp,
  ][] = [
    ["no answer at all", [], {}, /no answer yet/],
    [
      "a decline without a reason",
      [reply("r1f1", "declined", null, "nope")],
      {},
      /without a reason/,
    ],
    [
      "a fix naming a commit not on the PR",
      [reply("r1f1", "fixed", "9999999")],
      {},
      /not a commit on this PR/,
    ],
    ["a fix naming the head the review read", [reply("r1f1", "fixed", C1)], {}, /already read/],
    ["a fix naming an earlier commit", [reply("r1f1", "fixed", C0)], {}, /already read/],
    [
      "a fix whose commit does not touch the file",
      [reply("r1f1", "fixed", C2)],
      { commitFiles: { [C2]: ["src/b.ts"] } },
      /does not touch `src\/a.ts`/,
    ],
    [
      "a stranger's answer",
      [
        reply("r1f1", "declined", null, REASON, {
          author_association: "NONE",
          user: { login: "x", type: "User" },
        }),
      ],
      {},
      /no answer yet/,
    ],
  ];
  for (const [name, replies, opts, why] of cases) {
    it(`leaves the thread open on ${name}`, () => {
      const v = judge(replies, opts);
      expect(v.state).toBe("failure");
      expect(v.threads[0]).toMatchObject({ outcome: "open", why: expect.stringMatching(why) });
      expect(v.outcomes).toEqual([]);
    });
  }

  it("needs at least MIN_REASON_CHARS characters to call a decline reasoned", () => {
    expect(MIN_REASON_CHARS).toBe(20);
    expect(judge([reply("r1f1", "declined", null, "x".repeat(19))]).state).toBe("failure");
    expect(judge([reply("r1f1", "declined", null, "x".repeat(20))]).state).toBe("success");
  });
});

describe("the rounds", () => {
  it("passes a PR with no Important finding, and ignores Nits", () => {
    expect(judge([], { findings: [findingAt("r1f1", "nit")] })).toMatchObject({
      state: "success",
      description: "no Important finding to answer",
    });
  });

  it("keeps the hold while rounds remain, and counts what is still open", () => {
    const v = judge([reply("r1f1", "fixed", C2)], {
      findings: [findingAt("r1f1"), { ...findingAt("r1f2"), id: 101 }],
    });
    expect(v).toMatchObject({
      state: "failure",
      description: "1 of 2 Important thread(s) still open",
      released: false,
    });
  });

  it("keeps the hold at round 2 until that round's response session was sent", () => {
    const v = judge([], { receipts: [receipt(1, C0), receipt(2, C1)] });
    expect(v).toMatchObject({ state: "failure", released: false, round: 2 });
  });

  it("lifts the hold after round 2's answer and records each still-open finding as open", () => {
    const v = reevaluate({
      markers: readMarkers({
        reviews: [receipt(1, C0), receipt(2, C1)],
        reviewComments: [findingAt("r1f1")],
        issueComments: [
          {
            ...BOT,
            created_at: "2026-11-05T13:00:00Z",
            body: respondMarker({ sha: C1, round: 2 }),
          },
        ],
      }),
      commits: [C0, C1, C2],
    });
    expect(v).toMatchObject({ state: "success", released: true, round: 2 });
    expect(v.description).toBe("released after 2 rounds: 1 Important still open");
    expect(v.outcomes).toEqual([
      { id: "r1f1", outcome: "open", sha: undefined, reason: "no answer yet" },
    ]);
  });
});

describe("gathering one PR", () => {
  it("reads the markers and commits, and the files of each claimed fix only", () => {
    const api = fakeApi({
      "pulls/3": { head: { sha: C2 } },
      "pulls/3/reviews": [receipt(1, C1)],
      "pulls/3/comments": [findingAt("r1f1"), reply("r1f1", "fixed", C2.slice(0, 7))],
      "issues/3/comments": [],
      "pulls/3/commits": [{ sha: C0 }, { sha: C1 }, { sha: C2 }],
      [`commits/${C2}`]: { files: [{ filename: "src/a.ts" }] },
    });
    const got = gatherReeval(3, { api });
    expect(got).toMatchObject({
      commits: [C0, C1, C2],
      commitFiles: { [C2]: ["src/a.ts"] },
      head: C2,
    });
    expect(reevaluate(got).state).toBe("success");
    expect(api.reads.filter((r) => r.startsWith("commits/"))).toEqual([`commits/${C2}`]);
  });
});
