import { readFileSync } from "node:fs";
import { claimFeedbackReply } from "../../../scripts/moneypenny/index.mjs";
import { laneOf, replyResumeIntent } from "../../../scripts/moneypenny/reply-resume.mjs";

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

  it("refuses while a SECOND parking label is on — one reply answers one question", () => {
    const intent = replyResumeIntent(reply(["feedback", "ready", "needs-info", "needs-eric"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("parked by needs-eric");
  });

  it("refuses an issue already in flight", () => {
    const intent = replyResumeIntent(reply(["feedback", "ready", "needs-info", "in-progress"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("in-progress");
  });

  it("is no lane's without a lane label — a research ask has nobody waiting on it", () => {
    const intent = replyResumeIntent(reply(["bottleneck", "ready", "needs-eric"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("no lane is waiting");
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

// #3959 slice 2 (sub-issue #4301) — the same door for ANY blocked lane. The lane is derived from the
// issue's own labels and the answered question from which parking label is on; nothing is recorded.
describe("replyResumeIntent — any blocked lane", () => {
  it("resumes a `needs-eric` feedback issue, naming the label it answered", () => {
    const intent = replyResumeIntent(reply(["feedback", "ready", "needs-eric"], "yes, option B"));
    expect(intent.resume).toBe(true);
    expect(intent.lane).toBe("feedback");
    expect(intent.answered).toBe("needs-eric");
  });

  it("resumes a `needs-eric` plan issue — the plan lane is a lane too", () => {
    const intent = replyResumeIntent(reply(["plan", "ready", "needs-eric"], "go with the default"));
    expect(intent.resume).toBe(true);
    expect(intent.lane).toBe("plan");
    expect(intent.answered).toBe("needs-eric");
  });

  it("resumes a `needs-info` plan issue as well", () => {
    expect(replyResumeIntent(reply(["plan", "ready", "needs-info"])).lane).toBe("plan");
  });

  it("derives the lane from labels — `feedback` wins a dual-labelled issue, none gives none", () => {
    expect(laneOf({ labels: [{ name: "plan" }, { name: "feedback" }] })).toBe("feedback");
    expect(laneOf({ labels: [{ name: "plan" }] })).toBe("plan");
    expect(laneOf({ labels: [{ name: "enhancement" }] })).toBeNull();
    expect(laneOf(undefined)).toBeNull();
  });

  it.each(["needs-design", "hold-merge"])(
    "does NOT treat a reply as answering `%s` — a comment is not a design session or a merge click",
    (label) => {
      const intent = replyResumeIntent(reply(["plan", "ready", label]));
      expect(intent.resume).toBe(false);
      expect(intent.reason).toContain("none of");
    },
  );

  it("still refuses a plan issue already in flight", () => {
    const intent = replyResumeIntent(reply(["plan", "ready", "needs-eric", "in-progress"]));
    expect(intent.resume).toBe(false);
    expect(intent.reason).toContain("in-progress");
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

// The plan lane's door is an UNPARK, not a claim: the plan gate's own `unlabeled` path does the lease
// and the admission gate, so a reply must write the same two labels a human would and nothing else.
describe("claimFeedbackReply — a plan reply unparks and leaves the claim to the plan gate", () => {
  it("adds `ready`, removes the answered label, and takes no lease of its own", () => {
    const edits: [number, string[]][] = [];
    const result = claimFeedbackReply(
      reply(["plan", "ready", "needs-eric"], "go with B"),
      0,
      "sha",
      {
        edit: (n: number, args: string[]) => {
          edits.push([n, args]);
          return true;
        },
      },
    );
    expect(result.claimed).toBe(false);
    expect(result.unparked).toBe(true);
    expect(result.lane).toBe("plan");
    expect(edits).toEqual([
      [77, ["--add-label", "ready"]],
      [77, ["--remove-label", "needs-eric"]],
    ]);
  });

  it("writes nothing for a plan issue that is not parked", () => {
    const edits: [number, string[]][] = [];
    const result = claimFeedbackReply(reply(["plan", "ready"]), 0, "sha", {
      edit: (n: number, args: string[]) => {
        edits.push([n, args]);
        return true;
      },
    });
    expect(result.claimed).toBe(false);
    expect(result.unparked).toBeUndefined();
    expect(edits).toEqual([]);
  });
});
