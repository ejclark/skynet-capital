import {
  nextSubIssue,
  nextUnheld,
  pickupHoldReason,
  readPickupHold,
} from "../../../scripts/moneypenny/pickup-hold.mjs";

// A PLAN WITH NOTHING TO BUILD IS NOT A PICK (#5707). 7 empty sessions on #4450, #4808 and #4535
// (2026-10-18 → 10-20): each plan sat `ready` while its state block said `Next pickup: none …`,
// and the retry sweep woke it every tick. These specs pin the hold and its fail-open edges. Every
// read is injected — no `gh`, no network.

const plan = (number = 4808, labels = ["ready", "plan"]) => ({
  number,
  labels: labels.map((name) => ({ name })),
});

const block = (pickup: string) => ({
  body: `## State block\n\n**Slice 3 — shipped.**\n\n${pickup}\n\n### Log\n- 10-18 slice 3`,
});

const NONE = "**Next pickup: none buildable now.** Slice 4 waits on decision 4.";

describe("pickupHoldReason — the continuation lane's rule, asked at the pick", () => {
  it("holds a plan whose block names no next pickup and has no open slice", () => {
    const why = pickupHoldReason({
      issue: plan(),
      comments: [block(NONE)],
      subIssues: [],
      blockedBy: {},
    });
    expect(why).toContain("names no next pickup");
  });

  it("does not hold a plan whose block names a slice", () => {
    const comments = [block("**Next pickup:** slice 4, board subtraction. One PR.")];
    expect(pickupHoldReason({ issue: plan(), comments, subIssues: [], blockedBy: {} })).toBeNull();
  });

  it("does not hold a plan with no state block — nothing says it is waiting", () => {
    expect(pickupHoldReason({ issue: plan(), comments: [{ body: "hello" }] })).toBeNull();
  });

  it("does not hold a block with no next-pickup line — a forgotten line is not a wait", () => {
    const comments = [{ body: "## State block\n\n**Slice 1 — in progress.**" }];
    expect(pickupHoldReason({ issue: plan(), comments, subIssues: [], blockedBy: {} })).toBeNull();
  });

  it("does not hold a non-plan, whatever its comments say", () => {
    const issue = plan(7, ["ready", "feedback"]);
    expect(pickupHoldReason({ issue, comments: [block(NONE)], subIssues: [] })).toBeNull();
  });

  it("does not hold a plan with an open, unblocked sub-issue (`!(sub || pickup)`)", () => {
    const subIssues = [{ number: 51, state: "open" }];
    const why = pickupHoldReason({
      issue: plan(),
      comments: [block(NONE)],
      subIssues,
      blockedBy: { 51: [{ state: "closed" }] },
    });
    expect(why).toBeNull();
  });

  it("holds when every open sub-issue is still blocked", () => {
    const why = pickupHoldReason({
      issue: plan(),
      comments: [block(NONE)],
      subIssues: [{ number: 51, state: "open" }],
      blockedBy: { 51: [{ state: "open" }] },
    });
    expect(why).not.toBeNull();
  });

  it("does not hold when a sub-issue's blockers were never read — unknown is pullable", () => {
    const why = pickupHoldReason({
      issue: plan(),
      comments: [block(NONE)],
      subIssues: [{ number: 51, state: "open" }],
      blockedBy: {},
    });
    expect(why).toBeNull();
  });

  it("reads the newest block, so editing it to name a slice is the wake", () => {
    const comments = [block(NONE), block("**Next pickup:** slice 4. One PR.")];
    expect(pickupHoldReason({ issue: plan(), comments, subIssues: [], blockedBy: {} })).toBeNull();
  });
});

describe("readPickupHold — the live read, fail-open", () => {
  const reads = (rows: Record<string, unknown>) => {
    const asked: string[] = [];
    const readAll = (path: string) => {
      asked.push(path);
      const v = rows[path];
      if (v instanceof Error) throw v;
      return (v ?? []) as unknown[];
    };
    const read = (path: string) => {
      asked.push(path);
      return rows[path] ?? [];
    };
    return { readAll, read, asked, log: (_: string) => undefined };
  };

  it("costs a non-plan nothing", () => {
    const r = reads({});
    expect(readPickupHold(plan(7, ["ready", "feedback"]), r)).toBeNull();
    expect(r.asked).toEqual([]);
  });

  it("stops at the comments read when the block names a slice", () => {
    const r = reads({ "issues/4808/comments": [block("**Next pickup:** slice 4.")] });
    expect(readPickupHold(plan(), r)).toBeNull();
    expect(r.asked).toEqual(["issues/4808/comments"]);
  });

  it("holds #4808's real shape: a none line and no sub-issues", () => {
    const r = reads({ "issues/4808/comments": [block(NONE)], "issues/4808/sub_issues": [] });
    expect(readPickupHold(plan(), r)).toContain("names no next pickup");
  });

  it("reads blockers only for open sub-issues", () => {
    const r = reads({
      "issues/4808/comments": [block(NONE)],
      "issues/4808/sub_issues": [
        { number: 50, state: "closed" },
        { number: 51, state: "open" },
      ],
      "issues/51/dependencies/blocked_by": [{ state: "open" }],
    });
    expect(readPickupHold(plan(), r)).not.toBeNull();
    expect(r.asked).toContain("issues/51/dependencies/blocked_by");
    expect(r.asked).not.toContain("issues/50/dependencies/blocked_by");
  });

  it("a failed read is pullable, with a warning", () => {
    const lines: string[] = [];
    const r = reads({ "issues/4808/comments": new Error("HTTP 502") });
    expect(readPickupHold(plan(), { ...r, log: (l) => lines.push(l) })).toBeNull();
    expect(lines[0]).toMatch(/^::warning::#4808's state block could not be read/);
  });
});

describe("nextUnheld — step past held picks, keep the rest", () => {
  const pool = [{ number: 1 }, { number: 2 }, { number: 3 }];
  const first = (rest: typeof pool) => rest[0] ?? null;

  it("returns the first pick no hold refuses, and drops the held ones from the pool", () => {
    const lines: string[] = [];
    const r = nextUnheld(pool, first, (p) => (p.number === 1 ? "waits" : null), {
      who: "retry sweep",
      log: (l) => lines.push(l),
    });
    expect(r.pick?.number).toBe(2);
    expect(r.pool.map((i) => i.number)).toEqual([2, 3]);
    expect(lines).toEqual(["::notice::retry sweep — skipping #1, waits"]);
  });

  it("returns no pick once every candidate is held", () => {
    const r = nextUnheld(pool, first, () => "waits", { log: () => undefined });
    expect(r).toEqual({ pick: null, pool: [] });
  });
});

describe("nextSubIssue — moved here from continuation.mjs, same rule", () => {
  it("takes the first open sub-issue whose blockers are all closed", () => {
    const subs = [
      { number: 1, state: "open" },
      { number: 2, state: "open" },
    ];
    const blockedBy = { 1: [{ state: "open" }], 2: [] };
    expect(nextSubIssue(subs, blockedBy)?.number).toBe(2);
  });
});
