import {
  ASSIGNEE,
  alarmTitle,
  BURST_SIZE,
  type Capsule,
  decideAlarm,
  REPAIR_JOB,
  repairVerdict,
  workflowOf,
} from "../../../scripts/moneypenny/burst-alarm.mjs";

// THE BURST ALARM (#4292, #3818 slice 6, criterion 7). WHEN 3+ ci-failure capsules from one
// workflow land within an hour AND the repair job has not run, open ONE alarm issue — and never a
// second while one is open. The motivating shape is #3719–#3724: six capsules in 9s, 78 min after
// the break, with a repair lane that died in 3s on every dispatch and stayed dead for 37h.
// The clock is pinned throughout; nothing here reads the wall clock or touches GitHub.

const NOW = Date.parse("2026-10-01T12:00:00Z");
const WF = "Moneypenny Events (event-research automation)";
const minsAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();
const capsule = (number: number, m: number, workflow = WF, job = `job ${number}`): Capsule => ({
  number,
  title: `[ci] ${workflow} — ${job}`,
  createdAt: minsAgo(m),
});
/** Three capsules from WF, 40/30/20 minutes ago — a burst by any reading. */
const burst = [capsule(3719, 40), capsule(3720, 30), capsule(3721, 20)];
const failedRepair = { startedAt: minsAgo(35), ok: false };

beforeEach(() => {
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(NOW);
});
afterEach(() => {
  rstest.useRealTimers();
});

describe("burst alarm — a burst with a dead repair job", () => {
  it("opens one alarm, assigned to Eric, linking every capsule in the burst", () => {
    const d = decideAlarm({ workflow: WF, capsules: burst, repairs: [failedRepair] });

    expect(d.type).toBe("open-alarm");
    if (d.type !== "open-alarm") return;
    expect(d.title).toBe(alarmTitle(WF));
    expect(d.assignee).toBe(ASSIGNEE);
    expect(d.labels).toEqual(["ci-alarm"]);
    expect(d.capsules).toEqual([3719, 3720, 3721]);
    expect(d.body).toContain("#3719, #3720, #3721");
  });

  it("fires on silence too, once the oldest capsule has waited past the grace window", () => {
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs: [] }).type).toBe("open-alarm");
  });

  it("reads the clock itself when no `now` is passed — pinned here, never the wall clock", () => {
    rstest.setSystemTime(NOW + 2 * 60 * 60_000);
    // Two hours later the same three capsules are outside the window.
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs: [] }).type).toBe("quiet");
  });
});

describe("burst alarm — no burst", () => {
  it(`stays quiet under ${BURST_SIZE} capsules`, () => {
    const d = decideAlarm({ workflow: WF, capsules: burst.slice(0, 2), repairs: [failedRepair] });
    expect(d.type).toBe("quiet");
  });

  it("does not count a capsule older than an hour", () => {
    const spread = [capsule(1, 90), capsule(2, 30), capsule(3, 20)];
    expect(decideAlarm({ workflow: WF, capsules: spread, repairs: [failedRepair] }).type).toBe(
      "quiet",
    );
  });

  it("does not pool capsules across workflows", () => {
    const mixed = [capsule(1, 40), capsule(2, 30), capsule(3, 20, "Pipeline")];
    expect(decideAlarm({ workflow: WF, capsules: mixed, repairs: [failedRepair] }).type).toBe(
      "quiet",
    );
  });

  it("ignores issues that are not capsules, an alarm included", () => {
    const other = [
      capsule(1, 40),
      capsule(2, 30),
      { number: 9, title: alarmTitle(WF), createdAt: minsAgo(10) },
    ];
    expect(decideAlarm({ workflow: WF, capsules: other, repairs: [failedRepair] }).type).toBe(
      "quiet",
    );
  });
});

describe("burst alarm — the repair job ran", () => {
  it("stays quiet when a repair session ran since the burst began", () => {
    const repairs = [failedRepair, { startedAt: minsAgo(25), ok: true }];
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs })).toEqual({
      type: "quiet",
      reason: "a repair session ran",
    });
  });

  it("stays quiet while a repair job is still in flight", () => {
    const repairs = [{ startedAt: minsAgo(5), ok: null }];
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs }).type).toBe("quiet");
  });

  it("does not credit a success from before the burst began", () => {
    const repairs = [{ startedAt: minsAgo(55), ok: true }, failedRepair];
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs }).type).toBe("open-alarm");
  });

  it("waits out the grace window when one run filed the whole burst seconds ago", () => {
    const fresh = [capsule(1, 1), capsule(2, 1), capsule(3, 0)];
    expect(decideAlarm({ workflow: WF, capsules: fresh, repairs: [] })).toEqual({
      type: "quiet",
      reason: "too early to call the repair job dead",
    });
  });
});

describe("burst alarm — an alarm is already open", () => {
  it("never opens a second alarm for the same workflow", () => {
    const openAlarms = [{ number: 4400, title: alarmTitle(WF) }];
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs: [], openAlarms })).toEqual({
      type: "quiet",
      reason: "alarm #4400 already open",
    });
  });

  it("still alarms for a different workflow", () => {
    const openAlarms = [{ number: 4400, title: alarmTitle("Pipeline") }];
    expect(decideAlarm({ workflow: WF, capsules: burst, repairs: [], openAlarms }).type).toBe(
      "open-alarm",
    );
  });
});

describe("burst alarm — reading a repair job", () => {
  const job = (status: string, step?: string | null) => ({
    name: REPAIR_JOB,
    status,
    started_at: minsAgo(10),
    steps: [
      { name: "Run ./.github/actions/oauth-token-gate", conclusion: "success" },
      { name: "Run anthropics/claude-code-action@756cc22e", conclusion: step ?? null },
    ],
  });

  it("counts a session step that succeeded", () => {
    expect(repairVerdict(job("completed", "success")).ok).toBe(true);
  });

  it("does not count a job that went green only because the session step was skipped", () => {
    expect(repairVerdict(job("completed", "skipped")).ok).toBe(false);
  });

  it("counts the 3s allowed_bots death as a failure", () => {
    expect(repairVerdict(job("completed", "failure")).ok).toBe(false);
  });

  it("reads a queued or running job as in flight", () => {
    expect(repairVerdict(job("in_progress")).ok).toBeNull();
  });
});

describe("burst alarm — the capsule title", () => {
  it("parses the workflow out of a capsule signature", () => {
    expect(workflowOf("[ci] Pipeline — release · deploy")).toBe("Pipeline");
    expect(workflowOf(`[ci] ${WF} — build plan issue`)).toBe(WF);
  });

  it("returns null for anything that is not a capsule", () => {
    expect(workflowOf(alarmTitle(WF))).toBeNull();
    expect(workflowOf(undefined)).toBeNull();
  });
});
