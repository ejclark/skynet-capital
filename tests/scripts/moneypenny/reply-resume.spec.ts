import { readFileSync } from "node:fs";
import { claimFeedbackReply } from "../../../scripts/moneypenny/index.mjs";
import { replyResumeIntent } from "../../../scripts/moneypenny/reply-resume.mjs";

// #3959 slice 1 (sub-issue #4299) — the second door into the feedback lane: not "this was readied"
// but "the question we asked got answered". Fixture-shaped payloads, no network and no clock; the
// workflow's `author_association` gate has already decided WHO may speak by the time this runs.

const fixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/events/${name}.json`, "utf8")) as Parameters<
    typeof replyResumeIntent
  >[0];

const reply = (labels: string[], body = "the weekly one", state = "open") => ({
  payload: {
    action: "created",
    issue: { number: 77, state, labels: labels.map((name) => ({ name })), body: "an ask" },
    comment: { id: 1, body },
  },
});

describe("replyResumeIntent — an authorized reply on a blocked feedback issue", () => {
  it("resumes a `needs-info` feedback issue, and names the label it answered", () => {
    const intent = replyResumeIntent(fixture("feedback-reply-resume"));
    expect(intent.resume).toBe(true);
    expect(intent.issue?.number).toBe(4299);
    expect(intent.answered).toBe("needs-info");
  });

  it("resumes whatever the reply says — no ready-flip signal shape is demanded", () => {
    expect(replyResumeIntent(reply(["feedback", "ready", "needs-info"], "not ready")).resume).toBe(
      true,
    );
    expect(
      replyResumeIntent(reply(["feedback", "ready", "needs-info"], "can you clarify?")).resume,
    ).toBe(true);
  });

  it("resumes a `needs-info` issue that never carried `ready` — the reply is the flip", () => {
    expect(replyResumeIntent(reply(["feedback", "needs-info"])).resume).toBe(true);
  });

  it("refuses an issue carrying no question of ours", () => {
    const intent = replyResumeIntent(reply(["feedback", "ready"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("needs-info");
  });

  it("refuses a second parking label — `needs-eric` is slice 2's, and still blocks", () => {
    const intent = replyResumeIntent(reply(["feedback", "ready", "needs-info", "needs-eric"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("parked by needs-eric");
  });

  it("refuses an issue already in flight", () => {
    const intent = replyResumeIntent(reply(["feedback", "ready", "needs-info", "in-progress"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("in-progress");
  });

  it("is not this lane's without the feedback label", () => {
    const intent = replyResumeIntent(reply(["plan", "ready", "needs-info"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("not a feedback issue");
  });

  it("refuses a closed issue", () => {
    const intent = replyResumeIntent(reply(["feedback", "needs-info"], "the weekly one", "closed"));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("not open");
  });

  it("refuses an empty reply", () => {
    const intent = replyResumeIntent(reply(["feedback", "needs-info"], "   \n "));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("answers nothing");
  });

  it("refuses a PR comment — `issue_comment` fires for those under the same `issue` key", () => {
    const ctx = reply(["feedback", "ready", "needs-info"]);
    const intent = replyResumeIntent({
      payload: { ...ctx.payload, issue: { ...ctx.payload.issue, pull_request: { url: "…" } } },
    });
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("pull request");
  });

  it("refuses a payload missing its issue or its comment", () => {
    expect(replyResumeIntent({ payload: { comment: { body: "hi" } } }).resume).toBe(false);
    const noComment = reply(["feedback", "needs-info"]);
    expect(
      replyResumeIntent({ payload: { ...noComment.payload, comment: undefined } }).resume,
    ).toBe(false);
  });
});

// THE LOOP GUARD. Criterion 3 of #3959 makes a resumed lane's first visible act a comment on the
// very issue whose comments wake it, so the lane's own footer must never read as a reply.
describe("replyResumeIntent — the loop guard", () => {
  it("never resumes on the lane's own comment, even from an OWNER-associated token", () => {
    const intent = replyResumeIntent(fixture("feedback-reply-lane-own-comment"));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("loop guard");
  });
});

describe("claimFeedbackReply — refuses before touching the lease", () => {
  it("takes no lease when the reply answers no question of ours", () => {
    const result = claimFeedbackReply(reply(["feedback", "ready"]));
    expect(result.claimed).toBe(false);
    expect(result.reason).toContain("needs-info");
  });

  it("takes no lease on the lane's own comment", () => {
    const result = claimFeedbackReply(fixture("feedback-reply-lane-own-comment"));
    expect(result.claimed).toBe(false);
    expect(result.reason).toContain("loop guard");
  });
});

// The admission gate's contract (#3960) is that a refused claim leaves its issue `ready` and
// lease-free for a later tick. On this path that takes an UNPARK: the retry sweep only pulls what
// the board shows in Ready, so a refusal that left `needs-info` on would strand the answer behind a
// queue note promising a retry that could never fire.
describe("claimFeedbackReply — a refused resume still leaves the answer pullable", () => {
  const halted = (edits: [number, string[]][]) => ({
    readMode: () => ({ position: "halt" as const, caps: { inFlightCap: 0 } }),
    readInFlight: () => [],
    comments: () => [],
    comment: () => undefined,
    log: () => undefined,
    edit: (n: number, args: string[]) => {
      edits.push([n, args]);
      return true;
    },
  });

  it("unparks the issue and leaves no lease when the work spigot refuses it", () => {
    const edits: [number, string[]][] = [];
    const result = claimFeedbackReply(
      fixture("feedback-reply-resume"),
      Date.now(),
      "sha",
      halted(edits),
    );
    expect(result.claimed).toBe(false);
    expect(result.reason).toContain("halt");
    expect(edits).toEqual([
      [4299, ["--add-label", "ready"]],
      [4299, ["--remove-label", "needs-info"]],
    ]);
  });
});
