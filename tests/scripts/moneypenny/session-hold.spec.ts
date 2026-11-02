import { continuationDecision } from "../../../scripts/moneypenny/continuation.mjs";
import {
  continuationLeaseVerdict,
  holderLine,
  holderOf,
  LANE_HOLDER,
  lastActivityMs,
  SESSION_HOLDER,
} from "../../../scripts/moneypenny/session-hold.mjs";

// A LIVE SESSION HOLDS ITS PLAN THROUGH ITS OWN MERGES (#6065). On 2026-10-26 a `/work-issues`
// session took #5482 at 11:30 with a label only; its slice PR merged at 11:57, the label came off,
// continuation claimed the plan at 12:00, and both the lane (#6055) and the session (#6058) built
// the same contract piece. These specs replay that timeline against the lease verdict
// `continueNext` asks, plus the two ways a hold ends. Pure — no `gh`, no clock.

const TTL = 2 * 60 * 60 * 1000;
const at = (hhmm: string) => Date.parse(`2026-10-26T${hhmm}:00Z`);
const session = (hhmm: string) => ({ takenMs: at(hhmm), holder: SESSION_HOLDER });
const lane = (hhmm: string) => ({ takenMs: at(hhmm), holder: LANE_HOLDER });

describe("the holder rides in the lease's own tag message", () => {
  it("names a session hold, and reads it back", () => {
    const message = `lease taken 2026-10-26T11:30:00.000Z${holderLine(SESSION_HOLDER)}`;
    expect(holderOf(message)).toBe(SESSION_HOLDER);
  });

  it("leaves a lane lease's message exactly as it was before #6065", () => {
    expect(holderLine(LANE_HOLDER)).toBe("");
    expect(holderLine(undefined)).toBe("");
  });

  it("reads a lease with no holder line (every lease before #6065) as the lane's", () => {
    expect(holderOf("lease taken 2026-10-26T11:30:00.000Z")).toBe(LANE_HOLDER);
    expect(holderOf(undefined)).toBe(LANE_HOLDER);
  });
});

describe("criterion 1 — continuation leaves a live session's plan alone after its merge", () => {
  it("replays #5482: a session lease from 11:30, its slice merged 11:57, the sweep at 12:00", () => {
    const v = continuationLeaseVerdict(
      session("11:30"),
      { mergedMs: at("11:57") },
      at("12:00"),
      TTL,
    );
    expect(v.action).toBe("leave");
    expect(v.reason).toMatch(/live session/);
  });

  it("outlives the TTL from its first claim while it keeps merging (the brief's open question)", () => {
    const v = continuationLeaseVerdict(
      session("08:00"),
      { mergedMs: at("11:57") },
      at("12:00"),
      TTL,
    );
    expect(v.action).toBe("leave");
  });

  it("counts a state-block edit as activity too", () => {
    const v = continuationLeaseVerdict(
      session("08:00"),
      { mergedMs: at("08:30"), blockEditedMs: at("11:00") },
      at("12:00"),
      TTL,
    );
    expect(v.action).toBe("leave");
  });
});

describe("criteria 2 and 3 — a hold ends, and the plan continues", () => {
  it("continues once the session released its own lease (nothing held)", () => {
    expect(continuationLeaseVerdict(null, { mergedMs: at("11:57") }, at("12:00"), TTL).action).toBe(
      "release",
    );
  });

  it("treats a session quiet for the TTL as released, so a crash never parks the plan", () => {
    const v = continuationLeaseVerdict(
      session("08:00"),
      { mergedMs: at("08:30"), blockEditedMs: at("09:00") },
      at("11:01"),
      TTL,
    );
    expect(v.action).toBe("release");
    expect(v.reason).toMatch(/quiet 121m ago/);
  });
});

describe("a lane run's lease keeps the release-on-merge rule it had before #6065", () => {
  it("releases a lane lease that predates the merge — that run has finished", () => {
    expect(
      continuationLeaseVerdict(lane("11:30"), { mergedMs: at("11:57") }, at("12:00"), TTL).action,
    ).toBe("release");
  });

  it("leaves a lane lease stamped after the merge — a claim taken since the snapshot", () => {
    const v = continuationLeaseVerdict(lane("11:58"), { mergedMs: at("11:57") }, at("12:00"), TTL);
    expect(v.action).toBe("leave");
  });
});

describe("lastActivityMs", () => {
  it("is the newest of the stamp and every finite activity time", () => {
    expect(lastActivityMs(1, [undefined, 5, Number.NaN, 3])).toBe(5);
    expect(lastActivityMs(9, [])).toBe(9);
  });
});

describe("continuation hands the state block's last edit to the lease verdict", () => {
  it("carries the block comment's updated_at as blockEditedMs on a continue", () => {
    const d = continuationDecision(
      {
        plan: {
          number: 5482,
          title: "p",
          state: "open",
          labels: [{ name: "plan" }, { name: "ready" }],
        },
        comments: [
          {
            id: 1,
            body: "## State block — read this first\n\n**Next pickup:** slice 4 (the contract).",
            created_at: "2026-10-26T09:00:00Z",
            updated_at: "2026-10-26T11:50:00Z",
          },
        ],
        subIssues: [],
        blockedBy: {},
        runs: {},
        mergedMs: at("11:57"),
      },
      { caps: { continuationsPerDay: 3 }, now: at("12:00") },
    );
    expect(d.action).toBe("continue");
    expect(d.blockEditedMs).toBe(at("11:50"));
  });
});
