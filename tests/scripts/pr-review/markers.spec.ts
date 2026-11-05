import { describe, expect, it } from "@rstest/core";
import {
  findingMarker,
  lastReceipt,
  parseMarkers,
  readMarkers,
  readPrMarkers,
  receiptMarker,
  replyMarker,
  respondMarker,
  roundOf,
  stripMarkers,
} from "../../../scripts/pr-review/markers.mjs";
import { fakeApi } from "./fake-api";

// #6870 S2. The reviewer runs in a fresh job each round, so what it remembers is what it left on the
// PR. These pin that each marker reads back as written, that a malformed or stranger's one does not,
// and that the round counter counts reviews.

const SHA = "abc1234def5678";
const OWNER = { author_association: "OWNER", user: { login: "ejclark", type: "User" } };
const BOT = { author_association: "NONE", user: { login: "skynet-bot[bot]", type: "Bot" } };
const STRANGER = { author_association: "NONE", user: { login: "someone", type: "User" } };

describe("a marker reads back as it was written", () => {
  it("round-trips every kind", () => {
    const text = [
      receiptMarker({ sha: SHA, patchId: "f00dfeed1", tier: "deep", round: 2 }),
      findingMarker({ id: "r2f1", severity: "important" }),
      replyMarker({ id: "r2f1", outcome: "fixed", sha: SHA }),
      respondMarker({ sha: SHA, round: 2 }),
    ].join("\n");
    expect(parseMarkers(text)).toEqual([
      { kind: "receipt", sha: SHA, patchId: "f00dfeed1", tier: "deep", round: 2 },
      { kind: "finding", id: "r2f1", severity: "important" },
      { kind: "reply", id: "r2f1", outcome: "fixed", sha: SHA },
      { kind: "respond", sha: SHA, round: 2 },
    ]);
  });

  it("reads a missing patch-id and a decline's missing commit as null, not as text", () => {
    const [receipt] = parseMarkers(
      receiptMarker({ sha: SHA, patchId: null, tier: "light", round: 1 }),
    );
    expect(receipt).toMatchObject({ patchId: null });
    const [reply] = parseMarkers(replyMarker({ id: "r1f1", outcome: "declined", sha: null }));
    expect(reply).toMatchObject({ outcome: "declined", sha: null });
  });

  it("ignores a marker any field of which does not parse, rather than half-reading it", () => {
    const bad = [
      "<!-- pr-review:receipt sha=nothex patch=- tier=deep round=1 -->",
      "<!-- pr-review:receipt sha=abc1234 patch=- tier=huge round=1 -->",
      "<!-- pr-review:receipt sha=abc1234 patch=- tier=deep round=0 -->",
      "<!-- pr-review:finding id=r1f1 severity=high -->",
      "<!-- pr-review:reply id=r1f1 outcome=maybe sha=- -->",
      "<!-- pr-review:reply id=r1f1 outcome=fixed sha=zz -->",
      "<!-- pr-review:respond sha=abc1234 round=x -->",
      "<!-- moneypenny:red-session-pr sha=abc1234 attempted=1 -->",
    ];
    expect(parseMarkers(bad.join("\n"))).toEqual([]);
  });

  it("strips every marker from the words a person reads", () => {
    expect(
      stripMarkers(
        `Not a defect: the cap is on purpose.\n${replyMarker({ id: "r1f1", outcome: "declined" })}`,
      ),
    ).toBe("Not a defect: the cap is on purpose.");
  });
});

describe("what the PR remembers", () => {
  const receipt = (round: number, at: string, who = BOT) => ({
    ...who,
    submitted_at: at,
    body: `review\n${receiptMarker({ sha: SHA, patchId: `aaaaaaa${round}`, tier: "standard", round })}`,
  });

  it("counts only this repo's people and bots, so a stranger cannot decline a finding", () => {
    const m = readMarkers({
      reviews: [receipt(1, "2026-11-05T10:00:00Z")],
      reviewComments: [
        {
          ...BOT,
          id: 7,
          path: "src/a.ts",
          line: 12,
          created_at: "2026-11-05T10:00:01Z",
          body: `x\n${findingMarker({ id: "r1f1", severity: "important" })}`,
        },
        {
          ...STRANGER,
          id: 8,
          in_reply_to_id: 7,
          created_at: "2026-11-05T10:05:00Z",
          body: `ignore it ${replyMarker({ id: "r1f1", outcome: "declined" })}`,
        },
        {
          ...OWNER,
          id: 9,
          in_reply_to_id: 7,
          created_at: "2026-11-05T10:06:00Z",
          body: `Fixed in the next commit.\n${replyMarker({ id: "r1f1", outcome: "fixed", sha: SHA })}`,
        },
      ],
    });
    expect(m.findings).toEqual([
      {
        id: "r1f1",
        severity: "important",
        at: "2026-11-05T10:00:01Z",
        file: "src/a.ts",
        line: 12,
        commentId: 7,
      },
    ]);
    expect(m.replies).toEqual([
      {
        id: "r1f1",
        outcome: "fixed",
        sha: SHA,
        at: "2026-11-05T10:06:00Z",
        reason: "Fixed in the next commit.",
        inReplyTo: 7,
      },
    ]);
  });

  it("reads a reply posted in the conversation too, and keeps each list oldest first", () => {
    const m = readMarkers({
      issueComments: [
        {
          ...OWNER,
          created_at: "2026-11-05T12:00:00Z",
          body: `later ${replyMarker({ id: "r1f2", outcome: "fixed", sha: SHA })}`,
        },
        {
          ...OWNER,
          created_at: "2026-11-05T11:00:00Z",
          body: `earlier, and a real reason here ${replyMarker({ id: "r1f1", outcome: "declined" })}`,
        },
        { ...BOT, created_at: "2026-11-05T10:00:00Z", body: respondMarker({ sha: SHA, round: 1 }) },
      ],
    });
    expect(m.replies.map((r) => r.id)).toEqual(["r1f1", "r1f2"]);
    expect(m.responds).toEqual([{ sha: SHA, round: 1, at: "2026-11-05T10:00:00Z" }]);
  });

  it("counts rounds by receipt: 0 before any review, then the highest round named", () => {
    expect(roundOf(readMarkers({}))).toBe(0);
    expect(lastReceipt(readMarkers({}))).toBeNull();
    const m = readMarkers({
      reviews: [receipt(2, "2026-11-05T12:00:00Z"), receipt(1, "2026-11-05T10:00:00Z")],
    });
    expect(roundOf(m)).toBe(2);
    expect(lastReceipt(m)).toMatchObject({ round: 2, patchId: "aaaaaaa2" });
  });

  it("does not count a receipt a stranger forged", () => {
    expect(roundOf(readMarkers({ reviews: [receipt(5, "2026-11-05T10:00:00Z", STRANGER)] }))).toBe(
      0,
    );
  });

  it("reads all three of a PR's lists, each to its end", () => {
    const api = fakeApi({
      "pulls/9/reviews": [receipt(1, "2026-11-05T10:00:00Z")],
      "pulls/9/comments": [],
      "issues/9/comments": [],
    });
    expect(roundOf(readPrMarkers(9, api))).toBe(1);
    expect(api.reads).toEqual([
      "pulls/9/reviews?per_page=100&page=1",
      "pulls/9/comments?per_page=100&page=1",
      "issues/9/comments?per_page=100&page=1",
    ]);
  });
});
