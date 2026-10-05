import {
  type Candidate,
  CONTINUED_MODEL,
  continuationDecision,
  type Decision,
  executeStopContinuation,
  nextSubIssue,
  pickContinuation,
  postContinuationReceipt,
  routeContinuation,
  STALL_HOURS,
  STOP_CAP,
  stopComment,
} from "../../../scripts/moneypenny/continuation.mjs";
import { derivePrIssues } from "../../../scripts/moneypenny/pr-issues.mjs";
import {
  blockFingerprint,
  nextPickupOf,
  parseReceipt,
  receiptBody,
  receiptsOf,
  stateBlockOf,
} from "../../../scripts/moneypenny/state-block.mjs";

// CONTINUATION (#3818 slice 8, #4295 — criteria 9–10). A plan's slice merges; the build session
// removes `in-progress` and ends; the plan's lease outlives it, so the retry sweep steps past the
// plan for the lease's full 2h TTL and claims something else. These specs pin the two halves of the
// fix: WHEN a plan may continue (criterion 9 — pullable, nothing in flight, under the dial's daily
// cap, with a next pickup named), and WHEN it must stop instead (criterion 10 — the continued run
// failed, never reported, or left the state block unchanged).
//
// Nothing here touches GitHub or the clock: `continuationDecision` is pure over data, and the two
// write paths have their `gh` injected.

const NOW = Date.parse("2026-10-03T12:00:00Z");
const caps = { continuationsPerDay: 3 };

const block = (body = "**Next pickup:** slice 8 (#4295 — continuation).") => ({
  id: 1,
  body: `## State block — read this first\n\n${body}`,
  created_at: "2026-10-01T00:00:00Z",
});

const plan = (over: Record<string, unknown> = {}) => ({
  number: 3818,
  title: "Send decisions to Eric as GitHub assignments",
  state: "open",
  labels: [{ name: "plan" }, { name: "ready" }],
  ...over,
});

const candidate = (over: Partial<Candidate> = {}): Candidate =>
  ({
    plan: plan(),
    comments: [block()],
    subIssues: [],
    blockedBy: {},
    runs: {},
    ...over,
  }) as Candidate;

const decide = (over: Partial<Candidate> = {}): Decision =>
  continuationDecision(candidate(over), { caps, now: NOW });

/** A receipt comment for a dispatched continuation, as the lane would have left it. */
const receipt = (over: { run?: string; block?: string; at?: string; target?: number } = {}) => ({
  id: 2,
  created_at: over.at ?? "2026-10-03T11:50:00Z",
  body: receiptBody({
    pickup: "#4295 — continuation",
    target: over.target ?? 4295,
    runId: over.run ?? "900",
    fingerprint: over.block ?? blockFingerprint(block().body),
    model: CONTINUED_MODEL,
  }),
});

describe("the state block is the source, never the thread", () => {
  it("reads the newest comment headed `## State block`", () => {
    const comments = [
      { id: 1, body: "## State block\n\nfirst", created_at: "2026-10-01T00:00:00Z" },
      { id: 2, body: "unrelated chatter", created_at: "2026-10-02T00:00:00Z" },
      { id: 3, body: "## State block\n\nnewer", created_at: "2026-10-02T06:00:00Z" },
    ];

    expect(stateBlockOf(comments)?.id).toBe(3);
  });

  it("refuses to continue a plan with no state block", () => {
    const d = decide({ comments: [{ id: 9, body: "just a comment" }] });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("no state block");
  });

  it("pulls the next-pickup line out of the block, in both real shapes", () => {
    // the live shape: only the label is bold (#3818's own block)
    expect(nextPickupOf("**Next pickup:** slice 8 (#4295).\n\nmore prose")).toBe(
      "slice 8 (#4295).",
    );
    // docs/ISSUES.md's canonical shape: the bold spans the whole line
    expect(nextPickupOf("**Next pickup: slice 3, the list entry as data. One PR.**")).toBe(
      "slice 3, the list entry as data. One PR.",
    );
    expect(nextPickupOf("no pickup here")).toBeNull();
  });

  it("fingerprints the block's text, not its timestamp", () => {
    expect(blockFingerprint("same")).toBe(blockFingerprint("same\n"));
    expect(blockFingerprint("one")).not.toBe(blockFingerprint("two"));
    expect(blockFingerprint("")).toBe("");
  });
});

describe("criterion 9 — when a plan continues itself", () => {
  it("continues a ready plan whose block names a next pickup", () => {
    const d = decide();

    expect(d.action).toBe("continue");
    expect(d.number).toBe(3818);
    expect(d.target).toBe(3818);
    expect(d.pickup).toContain("slice 8");
  });

  it("prefers the next open, unblocked sub-issue over the block's line (#4056)", () => {
    const d = decide({
      subIssues: [
        { number: 4287, state: "closed" },
        { number: 4295, state: "open", title: "Continue the next slice" },
        { number: 4296, state: "open", title: "A later slice" },
      ],
      blockedBy: { 4295: [{ state: "closed" }], 4296: [{ state: "open" }] },
    });

    expect(d.action).toBe("continue");
    expect(d.target).toBe(4295);
  });

  it("skips a sub-issue whose blockers are still open", () => {
    const sub = nextSubIssue(
      [
        { number: 1, state: "open" },
        { number: 2, state: "open" },
      ],
      { 1: [{ state: "open" }], 2: [] },
    );

    expect(sub?.number).toBe(2);
  });

  it("never continues an issue that is not a plan — a merged PR names other issues too", () => {
    const d = decide({ plan: plan({ labels: [{ name: "feedback" }, { name: "ready" }] }) });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("`plan` label");
  });

  it("reads a pickup line that says none as nothing to build", () => {
    expect(nextPickupOf("**Next pickup:** none — this closes the issue.")).toBeNull();
    // but the LAST slice's line, which ends by saying it closes the issue, is still a slice
    expect(
      nextPickupOf("**Next pickup:** slice 8. **This slice closes this issue.**"),
    ).not.toBeNull();
  });

  it("refuses a sub-issue whose blockers were never read — unknown is not unblocked", () => {
    // the gather reads blockers for the first 10 open slices; an 11th has no entry at all
    expect(nextSubIssue([{ number: 99, state: "open" }], {})).toBeNull();
  });

  it("never continues a parked plan — the one pull rule decides", () => {
    const d = decide({ plan: plan({ labels: [{ name: "plan" }, { name: "needs-eric" }] }) });

    expect(d.action).toBe("skip");
  });

  it("never continues a plan already in-progress", () => {
    const d = decide({
      plan: plan({ labels: [{ name: "plan" }, { name: "ready" }, { name: "in-progress" }] }),
    });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("in-progress");
  });

  it("holds one slice in flight per plan — an open slice PR blocks it", () => {
    const d = decide({ openPlanPr: 4499 });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("#4499");
  });

  it("in flight is any open PR NAMING the plan, not just a plan/<n> branch", () => {
    // #4450's slice 1 shipped on `feat/playbook-roll-call` while the plan's own branch was idle —
    // a branch-only check would have read "nothing in flight" and dispatched a second slice.
    expect(
      derivePrIssues({ title: "feat(desk): roll call", body: "Part of #4450", headRef: "feat/x" }),
    ).toContain(4450);
  });

  it("stops at the dial's daily cap, counting only the last 24h", () => {
    const stale = { block: "stale0000000" }; // the block moved after each, so criterion 10 is clear
    const capped = decide({
      comments: [
        block(),
        receipt({ ...stale, at: "2026-10-03T01:00:00Z", run: "1" }),
        receipt({ ...stale, at: "2026-10-03T02:00:00Z", run: "2" }),
        receipt({ ...stale, at: "2026-10-03T03:00:00Z", run: "3" }),
      ],
      // the newest run succeeded, so only the cap can refuse this
      runs: { "3": { status: "completed", conclusion: "success", url: "u" } },
    });

    expect(capped.action).toBe("skip");
    expect(capped.reason).toContain("3 of 3");
  });

  it("halt and conserve reach continuation through the same key", () => {
    const halted = continuationDecision(candidate(), {
      caps: { continuationsPerDay: 0 },
      now: NOW,
    });

    expect(halted.action).toBe("skip");
    expect(halted.reason).toContain("0 of 0");
  });

  it("says nothing is left when the block names no pickup and no slice is open", () => {
    const d = decide({ comments: [block("All slices shipped.")] });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("no next pickup");
  });
});

describe("criterion 10 — when a continued slice stops the plan", () => {
  const judged = (run: Record<string, unknown>, over: Record<string, unknown> = {}) =>
    decide({ comments: [block(), receipt(over)], runs: { "900": run } });

  it("waits while the continued run is still going", () => {
    const d = judged({ status: "in_progress", conclusion: null });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("still going");
  });

  it("stops on a failed run and carries its link", () => {
    const d = judged({ status: "completed", conclusion: "failure", url: "https://run/900" });

    expect(d.action).toBe("stop");
    expect(d.reason).toContain("failure");
    expect(d.runUrl).toBe("https://run/900");
  });

  it("stops when the slice left the state block unchanged", () => {
    const d = judged({ status: "completed", conclusion: "success", url: "https://run/900" });

    expect(d.action).toBe("stop");
    expect(d.reason).toContain("unchanged");
  });

  it("continues when the run succeeded AND the block moved", () => {
    const d = decide({
      comments: [block(), receipt({ block: "stale0000000" })],
      runs: { "900": { status: "completed", conclusion: "success", url: "u" } },
    });

    expect(d.action).toBe("continue");
  });

  it("never stops a plan over a run it could not READ — only over one that failed", () => {
    const d = decide({
      comments: [block(), receipt({ at: "2026-10-03T04:00:00Z" })],
      runs: { "900": { status: "unreadable" } },
    });

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("could not be read");
  });

  it(`stops a run that never reported after ${STALL_HOURS}h`, () => {
    const d = decide({
      comments: [block(), receipt({ at: "2026-10-03T04:00:00Z" })],
      runs: {},
    });

    expect(d.action).toBe("stop");
    expect(d.reason).toContain("not reported");
  });

  it("but the day's budget survives the stop — unparking does not refill it", () => {
    const d = continuationDecision(
      candidate({
        comments: [
          block(),
          receipt({ at: "2026-10-03T01:00:00Z" }),
          { id: 3, created_at: "2026-10-03T02:00:00Z", body: stopComment({} as Decision) },
        ],
      }),
      { caps: { continuationsPerDay: 1 }, now: NOW },
    );

    expect(d.action).toBe("skip");
    expect(d.reason).toContain("1 of 1");
  });

  it("a stop ends that chain — an unparked plan starts fresh, never re-judged", () => {
    const d = decide({
      comments: [
        block(),
        receipt(),
        { id: 3, created_at: "2026-10-03T11:55:00Z", body: stopComment({} as Decision) },
      ],
      runs: { "900": { status: "completed", conclusion: "failure", url: "u" } },
    });

    expect(d.action).toBe("continue");
  });
});

describe("the receipt is the lane's whole memory", () => {
  it("round-trips the run, the fingerprint and the target", () => {
    const parsed = parseReceipt(
      receiptBody({ pickup: "#4295", target: 4295, runId: "900", fingerprint: "abc123" }),
    );

    expect(parsed).toEqual({ runId: "900", fingerprint: "abc123", target: 4295 });
  });

  it("names the model it downgraded to, so the receipt proves criterion 9", () => {
    const body = receiptBody({
      pickup: "#4295",
      target: 4295,
      runId: "900",
      fingerprint: "a",
      model: CONTINUED_MODEL,
    });

    expect(body).toContain(CONTINUED_MODEL);
  });

  // The receipt lands on ANY continued plan, but criteria 9 and 10 are #3818's — pointing a build
  // session at "this plan's criterion 9" sends it looking for a criterion its plan may not have.
  it("cites #3818 for the criteria it names, never the host plan's own numbering", () => {
    const body = receiptBody({
      pickup: "#4295",
      target: 4295,
      runId: "900",
      fingerprint: "a",
      model: CONTINUED_MODEL,
    });

    expect(body).not.toContain("this plan's criterion");
    expect(body).toContain("(#3818, criterion 9)");
    expect(body).toContain("(#3818, criterion 10)");
  });

  it("ignores a comment carrying no marker", () => {
    expect(parseReceipt("ordinary prose")).toBeNull();
    expect(receiptsOf([{ body: "ordinary prose", created_at: "2026-10-03T00:00:00Z" }])).toEqual(
      [],
    );
  });
});

describe("the writes", () => {
  it("routes a stop as one intent carrying the run link", () => {
    const intents = routeContinuation({
      continuations: {
        candidates: [
          candidate({
            comments: [block(), receipt()],
            runs: { "900": { status: "completed", conclusion: "failure", url: "https://run/900" } },
          }),
        ],
        caps,
      },
      now: NOW,
    });

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("stop-continuation");
    expect(intents[0]?.issueNumber).toBe(3818);
    expect(intents[0]?.body).toContain("https://run/900");
  });

  it(`stops at most ${STOP_CAP} plan(s) a tick — a wrong read costs one park, not the queue`, () => {
    const wedged = (number: number) =>
      candidate({
        plan: plan({ number }),
        comments: [block(), receipt()],
        runs: { "900": { status: "completed", conclusion: "failure", url: "u" } },
      });
    const intents = routeContinuation({
      continuations: { candidates: [wedged(1), wedged(2), wedged(3)], caps },
      now: NOW,
    });

    expect(intents).toHaveLength(STOP_CAP);
  });

  it("routes nothing at all without a gathered read (every non-push event)", () => {
    expect(routeContinuation({})).toEqual([]);
    expect(routeContinuation({ continuations: null })).toEqual([]);
  });

  it("parks the plan BEFORE assigning, so a racing scan cannot claim it", () => {
    const calls: string[][] = [];
    const assigned: unknown[] = [];
    executeStopContinuation(
      {
        kind: "stop-continuation",
        issueNumber: 3818,
        title: "a plan",
        reason: "the run failed",
        runUrl: "https://run/900",
        body: "body",
      },
      {
        run: (cmd, args) => {
          calls.push([cmd, ...args]);
          return "";
        },
        retry: (fn) => fn(),
        assign: (intent) => {
          assigned.push(intent);
          return "assigned";
        },
      },
    );

    expect(calls[0]).toEqual(["gh", "issue", "edit", "3818", "--add-label", "needs-eric"]);
    expect(assigned).toHaveLength(1);
  });

  it("posts the receipt on the plan, with the run id it was dispatched in", () => {
    const calls: string[][] = [];
    postContinuationReceipt({ number: 3818, target: 4295, pickup: "#4295" } as Decision, {
      run: (cmd, args) => {
        calls.push([cmd, ...args]);
        return "";
      },
      retry: <T>(fn: () => T) => fn(),
      runId: "12345",
    });

    expect(calls[0]?.slice(0, 4)).toEqual(["gh", "issue", "comment", "3818"]);
    expect(calls[0]?.[5]).toContain("12345");
  });

  it("picks only a continuation the admission gate would also admit", () => {
    const deps = {
      continuations: { candidates: [candidate()], caps },
      now: NOW,
      inFlight: [{ number: 1 }, { number: 2 }, { number: 3 }],
      mode: { position: "normal", caps: { inFlightCap: 3 } },
    };

    expect(pickContinuation(deps)).toBeNull();
    expect(
      pickContinuation({ ...deps, mode: { position: "normal", caps: { inFlightCap: 9 } } })?.number,
    ).toBe(3818);
  });
});
