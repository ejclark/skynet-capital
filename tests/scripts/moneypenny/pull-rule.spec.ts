import {
  checkAdmission,
  nextAdmissible,
  pullQueue,
  readIssue,
  runCli,
} from "../../../scripts/moneypenny/admission.mjs";
import { notPullableReason, pullable } from "../../../scripts/moneypenny/labels.mjs";
import { feedbackReadyIntent, planReadyIntent } from "../../../scripts/moneypenny/plan-claim.mjs";

// ONE PULL RULE FOR EVERY PULLER (#4393 slice 3, criteria 3 and 10–12). `pullable` is the board's
// Ready column — open, `ready`, buildable, not `in-progress` — asked by both claim lanes, the retry
// sweep and `/work-issues`; the admission CLI is how a live burn-down asks the gate. All reads are
// injected: no `gh`, no network.

const issue = (number: number, labels: string[] = [], extra: Record<string, unknown> = {}) => ({
  number,
  state: "open",
  body: "",
  labels: labels.map((name) => ({ name })),
  ...extra,
});

const mode = (position: "halt" | "conserve" | "normal" | "surge", inFlightCap = 3) => ({
  position,
  caps: { inFlightCap },
});

describe("pullable — the board's Ready column, as one predicate", () => {
  it("admits an open, ready, buildable issue nobody is building", () => {
    expect(pullable(issue(1, ["ready", "feedback"]))).toBe(true);
    expect(notPullableReason(issue(1, ["ready"]))).toBeNull();
  });

  it("accepts plain label names and gh's upper-case OPEN state", () => {
    expect(pullable({ number: 1, state: "OPEN", labels: ["ready", "plan"] })).toBe(true);
  });

  it("treats a missing state as open, as the claim lanes always did", () => {
    expect(pullable({ number: 1, labels: ["ready"] })).toBe(true);
  });

  it("refuses a Backlog issue — no `ready` label (what /work-issues used to pull)", () => {
    expect(pullable(issue(2, ["feedback"]))).toBe(false);
    expect(notPullableReason(issue(2, ["plan"]))).toContain("Backlog");
  });

  it("refuses a closed issue, a parked one, and one already in progress — naming the rule", () => {
    expect(notPullableReason(issue(3, ["ready"], { state: "closed" }))).toContain("not open");
    expect(notPullableReason(issue(4, ["ready", "needs-eric"]))).toContain("parked by needs-eric");
    expect(notPullableReason(issue(5, ["ready", "in-progress"]))).toContain("in-progress");
  });

  it("keeps ready + next-slice pullable (a remainder pending is legal, labels.mjs)", () => {
    expect(pullable(issue(6, ["ready", "plan", "next-slice"]))).toBe(true);
  });

  // 2026-10-05: #4301 carried `ready` ahead of time behind an open `blocked-by` #4299, and the
  // sweep's rank-order pick dispatched it anyway.
  it("refuses an issue with an open blocker, and admits it once the blocker closes", () => {
    const blocked = (open: number) =>
      issue(7, ["ready", "plan"], {
        issue_dependencies_summary: { blocked_by: open, total_blocked_by: 1 },
      });
    expect(notPullableReason(blocked(1))).toBe(
      "#7 is blocked by 1 open issue — it starts when they close",
    );
    expect(pullable(blocked(0))).toBe(true);
  });

  it("reads a shape with no dependency summary as unblocked", () => {
    expect(pullable({ number: 8, labels: ["ready"] })).toBe(true);
  });

  it("refuses nothing at all", () => {
    expect(pullable(undefined)).toBe(false);
  });
});

describe("the claim lanes ask the same rule", () => {
  it("feedback: a bare payload without `ready` is refused (it is in Backlog)", () => {
    const intent = feedbackReadyIntent({ payload: { issue: issue(10, ["feedback"]) } });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("Backlog");
  });

  it("feedback: a `labeled: ready` event on an issue already in progress is refused", () => {
    const intent = feedbackReadyIntent({
      payload: {
        action: "labeled",
        label: { name: "ready" },
        issue: issue(11, ["feedback", "ready", "in-progress"]),
      },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("in-progress");
  });

  it("plan: a ready-flip comment IS the flip — no `ready` label needed", () => {
    const intent = planReadyIntent({
      payload: { issue: issue(12, ["plan"]), comment: { body: "ready" } },
    });
    expect(intent.ready).toBe(true);
  });

  it("plan: a ready-flip on a plan whose build is already in progress is refused", () => {
    const intent = planReadyIntent({
      payload: { issue: issue(13, ["plan", "in-progress"]), comment: { body: "go" } },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("in-progress");
  });

  it("plan: an unpark on an in-progress plan is refused", () => {
    const intent = planReadyIntent({
      payload: {
        action: "unlabeled",
        label: { name: "needs-eric" },
        issue: issue(14, ["plan", "ready", "in-progress"]),
      },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("in-progress");
  });
});

describe("pullQueue / nextAdmissible — the sweep pulls only what pullable allows", () => {
  it("drops non-ready, parked and in-progress issues, and keeps rank order", () => {
    const rows = [
      issue(1, ["feedback"]),
      issue(2, ["ready", "needs-info"]),
      issue(3, ["ready", "in-progress"]),
      issue(4, ["ready"], { createdAt: "2026-09-29T00:00:00Z" }),
      issue(5, ["ready", "bug"], { createdAt: "2026-09-30T00:00:00Z" }),
    ];
    expect(pullQueue(rows).map((i) => i.number)).toEqual([5, 4]);
  });

  it("steps past a blocked slice to the next pullable issue", () => {
    const rows = [
      issue(4301, ["ready", "plan"], {
        createdAt: "2026-09-30T00:00:00Z",
        issue_dependencies_summary: { blocked_by: 1 },
      }),
      issue(4400, ["ready", "feedback"], { createdAt: "2026-10-01T00:00:00Z" }),
    ];
    expect(nextAdmissible(rows, [], mode("normal"))?.number).toBe(4400);
  });

  it("never picks a Backlog issue, even with free capacity", () => {
    expect(nextAdmissible([issue(1, ["feedback"])], [], mode("normal"))).toBeNull();
  });
});

describe("checkAdmission — pullable first, then the gate", () => {
  it("refuses an unpullable issue before asking the gate", () => {
    const v = checkAdmission({ issue: issue(1, ["plan"]), inFlight: [], mode: mode("normal") });
    expect(v.admit).toBe(false);
    expect(v.reason).toMatch(/^not pullable: /);
  });

  // Criterion 3: the in-flight list is every open `in-progress` issue, however it got the label —
  // a live session's PR derives it (#4402), so a hand-started build fills a slot too.
  it("counts a live session's in-progress issue against the cap", () => {
    const live = [issue(7, ["in-progress"]), issue(8, ["in-progress"]), issue(9, ["in-progress"])];
    const v = checkAdmission({ issue: issue(1, ["ready"]), inFlight: live, mode: mode("normal") });
    expect(v).toEqual({ admit: false, reason: "queued: 3 of 3 in flight" });
  });

  it("admits a pullable issue under the cap", () => {
    const v = checkAdmission({ issue: issue(1, ["ready"]), inFlight: [], mode: mode("normal") });
    expect(v.admit).toBe(true);
  });
});

describe("readIssue — one issue over REST", () => {
  it("maps the REST row and refuses a PR number", () => {
    const row = { number: 4, title: "t", state: "open", body: "b", labels: [], created_at: "x" };
    expect(readIssue(4, () => JSON.stringify(row))).toMatchObject({ number: 4, createdAt: "x" });
    const blocked = {
      ...row,
      labels: [{ name: "ready" }],
      issue_dependencies_summary: { blocked_by: 1 },
    };
    const v = checkAdmission({
      issue: readIssue(4, () => JSON.stringify(blocked)),
      mode: mode("normal"),
    });
    expect(v.reason).toContain("blocked by 1 open issue");
    expect(() => readIssue(5, () => JSON.stringify({ number: 5, pull_request: {} }))).toThrow(
      /pull request/,
    );
  });
});

describe("runCli — the admission CLI /work-issues asks", () => {
  const setup = (over: Record<string, unknown> = {}) => {
    const out: string[] = [];
    const err: string[] = [];
    const io = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "x" }),
      readInFlight: () => [],
      readReady: () => [issue(4, ["ready", "feedback"]), issue(6, ["plan"])],
      readIssue: (n: number) => issue(n, ["ready", "feedback"]),
      readPlans: () => [],
      print: (l: string) => out.push(l),
      printErr: (l: string) => err.push(l),
      ...over,
    };
    return { io, out, err, json: () => JSON.parse(out[0] ?? "null") };
  };

  it("--check: exit 0 and {admit: true} for an admissible issue", () => {
    const s = setup();
    expect(runCli(["--check", "4"], s.io)).toBe(0);
    expect(s.json()).toMatchObject({ number: 4, admit: true });
  });

  it("--check: exit 3 at the cap, with the reason", () => {
    const full = [issue(1, []), issue(2, []), issue(3, [])];
    const s = setup({ readInFlight: () => full });
    expect(runCli(["--check", "4"], s.io)).toBe(3);
    expect(s.json()).toEqual({ number: 4, admit: false, reason: "queued: 3 of 3 in flight" });
  });

  it("--check: exit 3 with queuedBehind on a same-surface fence", () => {
    const body = "| | |\n|---|---|\n| **Surface** | Trade form |\n";
    const s = setup({
      readInFlight: () => [issue(9, ["in-progress"], { body })],
      readIssue: (n: number) => issue(n, ["ready"], { body }),
    });
    expect(runCli(["--check", "4"], s.io)).toBe(3);
    expect(s.json()).toMatchObject({ admit: false, queuedBehind: 9 });
  });

  it("--check: exit 3 on a Backlog issue", () => {
    const s = setup({ readIssue: (n: number) => issue(n, ["feedback"]) });
    expect(runCli(["--check", "4"], s.io)).toBe(3);
    expect(s.json().reason).toContain("not pullable");
  });

  it("fails closed (exit 3) when the in-flight list or the issue cannot be read", () => {
    const boom = () => {
      throw new Error("HTTP 502");
    };
    const a = setup({ readInFlight: boom });
    expect(runCli(["--check", "4"], a.io)).toBe(3);
    expect(a.json().reason).toContain("in-flight list could not be read");
    const b = setup({ readIssue: boom });
    expect(runCli(["--check", "4"], b.io)).toBe(3);
    expect(b.json().reason).toContain("#4 could not be read");
  });

  it("--next: names the sweep's pick, or exits 3 with nothing admissible", () => {
    const s = setup();
    expect(runCli(["--next"], s.io)).toBe(0);
    expect(s.json()).toMatchObject({ number: 4, admit: true });
    const none = setup({ readReady: () => [issue(6, ["plan"])] });
    expect(runCli(["--next"], none.io)).toBe(3);
    expect(none.json().reason).toContain("nothing admissible (0 pullable");
  });

  it("--queue: prints the Ready column only, exit 0", () => {
    const s = setup();
    expect(runCli(["--queue"], s.io)).toBe(0);
    expect(s.json()).toEqual([{ number: 4, title: "" }]);
  });

  it("exit 2 with usage on a missing or bad issue number", () => {
    const s = setup();
    expect(runCli([], s.io)).toBe(2);
    expect(runCli(["--check", "abc"], s.io)).toBe(2);
    expect(s.err[0]).toContain("usage");
  });
});
