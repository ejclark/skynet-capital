import { execFileSync } from "node:child_process";

// Feedback-to-shipped latency (#896) — driven through the real entrypoint via `--explain`, same
// pattern as deploy-lag.spec.ts: the state goes in as JSON on stdin instead of hitting GitHub, so
// this runs offline and exercises the argument plumbing along with the pure math.
const run = (state: unknown, ...flags: string[]): string =>
  execFileSync("node", ["scripts/latency-scan.mjs", "--explain", "--today=2026-08-29", ...flags], {
    input: JSON.stringify(state),
    encoding: "utf8",
  });

const json = (state: unknown): Record<string, unknown> => JSON.parse(run(state, "--json"));

/** Non-null accessor for the first row of an array the fixture always populates. */
function first<T>(xs: T[]): T {
  const x = xs[0];
  if (x === undefined) throw new Error("expected at least one row");
  return x;
}

const readyPlan = {
  number: 823,
  title: "Ready-comment lane",
  state: "closed",
  createdAt: "2026-08-21T22:39:57Z",
  closedAt: "2026-08-29T14:35:40Z",
  comments: [
    { body: "still scoping this out", createdAt: "2026-08-22T10:00:00Z" },
    { body: "Ready, go ahead.", createdAt: "2026-08-23T09:00:00Z" },
  ],
};

const silentPlan = {
  number: 852,
  title: "No ready comment, closed anyway",
  state: "closed",
  createdAt: "2026-08-29T12:38:19Z",
  closedAt: "2026-08-29T17:15:58Z",
  comments: [{ body: "narrow slice shipped as #884", createdAt: "2026-08-29T15:28:15Z" }],
};

const openPlan = {
  number: 894,
  title: "Still open",
  state: "open",
  createdAt: "2026-08-29T18:58:30Z",
  closedAt: null,
  comments: [],
};

const closedFeedback = {
  number: 838,
  title: "A feedback issue",
  state: "closed",
  createdAt: "2026-08-29T12:07:13Z",
  closedAt: "2026-08-29T12:29:14Z",
};

const openFeedback = {
  number: 809,
  title: "Still open feedback",
  state: "open",
  createdAt: "2026-08-29T05:23:08Z",
  closedAt: null,
};

describe("latency-scan: duration math", () => {
  it("measures a plan issue's full open→ready→closed breakdown", () => {
    const { planRows } = json({ planIssues: [readyPlan], feedbackIssues: [] }) as {
      planRows: Record<string, unknown>[];
    };
    const row = first(planRows);
    expect(row.readyAt).toBe("2026-08-23T09:00:00Z");
    expect(row.openToReadyDays).toBeCloseTo(1.4, 1);
    expect(row.readyToClosedDays).toBeCloseTo(6.2, 1);
    expect(row.openToClosedDays).toBeCloseTo(7.7, 1);
  });

  it("never picks a ready-looking comment that precedes the issue's own open time", () => {
    // A comment timestamped before createdAt cannot be this issue's ready-flip — guards the
    // afterIso filter in firstReadyCommentAt against a malformed or reordered fixture.
    const backdated = {
      ...readyPlan,
      comments: [{ body: "ready", createdAt: "2020-01-01T00:00:00Z" }],
    };
    const { planRows } = json({ planIssues: [backdated], feedbackIssues: [] }) as {
      planRows: Record<string, unknown>[];
    };
    expect(first(planRows).readyAt).toBeNull();
  });

  it("reports null, not zero, for a plan issue with no detectable ready-flip", () => {
    const { planRows } = json({ planIssues: [silentPlan], feedbackIssues: [] }) as {
      planRows: Record<string, unknown>[];
    };
    const row = first(planRows);
    expect(row.readyAt).toBeNull();
    expect(row.openToReadyDays).toBeNull();
    expect(row.readyToClosedDays).toBeNull();
    // The open→closed span is still measurable even without a ready-flip.
    expect(row.openToClosedDays).toBeCloseTo(0.2, 1);
  });

  it("reports null durations for an issue still open, never a false zero", () => {
    const { planRows, feedbackRows } = json({
      planIssues: [openPlan],
      feedbackIssues: [openFeedback],
    }) as {
      planRows: Record<string, unknown>[];
      feedbackRows: Record<string, unknown>[];
    };
    expect(first(planRows).openToClosedDays).toBeNull();
    expect(first(feedbackRows).openToClosedDays).toBeNull();
  });

  it("measures a feedback issue as a single open→closed span", () => {
    const { feedbackRows } = json({ planIssues: [], feedbackIssues: [closedFeedback] }) as {
      feedbackRows: Record<string, unknown>[];
    };
    expect(first(feedbackRows).openToClosedDays).toBeCloseTo(0.02, 1);
  });
});

describe("latency-scan: summary", () => {
  it("counts open vs closed and only medians the closed ones", () => {
    const { summary } = json({
      planIssues: [readyPlan, silentPlan, openPlan],
      feedbackIssues: [closedFeedback, openFeedback],
    }) as { summary: { plans: Record<string, unknown>; feedback: Record<string, unknown> } };

    expect(summary.plans.total).toBe(3);
    expect(summary.plans.closed).toBe(2);
    expect(summary.plans.open).toBe(1);
    expect(summary.plans.withReadySignal).toBe(1);
    expect(summary.feedback.total).toBe(2);
    expect(summary.feedback.closed).toBe(1);
    expect(summary.feedback.open).toBe(1);
  });

  it("reports null summary durations when nothing closed in the window, not zero", () => {
    const { summary } = json({ planIssues: [openPlan], feedbackIssues: [openFeedback] }) as {
      summary: { plans: Record<string, unknown>; feedback: Record<string, unknown> };
    };
    expect(summary.plans.medianOpenToClosedDays).toBeNull();
    expect(summary.feedback.medianOpenToClosedDays).toBeNull();
  });
});

describe("latency-scan: CLI surface", () => {
  it("prints a human report by default, naming the window", () => {
    const text = run({ planIssues: [readyPlan], feedbackIssues: [closedFeedback] });
    expect(text).toContain("Feedback-to-shipped latency");
    expect(text).toContain("since 2026-07-15");
    expect(text).toContain("plans:");
    expect(text).toContain("feedback:");
  });

  it("renders a markdown table with one row per issue", () => {
    const text = run({ planIssues: [readyPlan], feedbackIssues: [closedFeedback] }, "--table");
    expect(text).toContain("| #823 | plan |");
    expect(text).toContain("| #838 | feedback |");
  });

  it("rejects a malformed --today", () => {
    expect(() =>
      execFileSync("node", ["scripts/latency-scan.mjs", "--explain", "--today=not-a-date"], {
        input: "{}",
        stdio: "pipe",
      }),
    ).toThrow();
  });
});
