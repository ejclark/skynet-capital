import { describe, expect, it } from "@rstest/core";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import {
  failedArmRun,
  lastRearmSha,
  REARM_MARKER,
  rearmIntents,
  rearmStranded,
} from "../../../scripts/moneypenny/stranded-pr.mjs";

// 2026-10-26: #6093 sat green and unarmed 9h, #6019 13h, #5940 four days — each head's Pipeline run
// had a FAILED `arm auto-merge` job ("Base branch was modified" / a GraphQL 5xx on
// `gh pr merge --auto`), and a green PR emits no further event to retry it. The act stage re-runs
// that job — the pipeline's own arm path, which re-checks hold-merge and the envelope — once per head.

const stranded = (over: Record<string, unknown> = {}) => ({
  number: 6093,
  title: "fix(deploy): hold a bots commit",
  hours: 9,
  headSha: "6fb021f5",
  armRunId: 40338129725,
  rearmedSha: null,
  ...over,
});

describe("rearmIntents — once per head sha", () => {
  it("WHEN the head's arm job failed and no marker names this head, re-runs it with a marker", () => {
    const [i] = rearmIntents([stranded()]);
    expect(i?.kind).toBe("rearm-stranded");
    expect(i?.prNumber).toBe(6093);
    expect(i?.runId).toBe(40338129725);
    const m = REARM_MARKER.exec(i?.body ?? "");
    expect(m?.[1]).toBe("6fb021f5");
    expect(m?.[2]).toBe("40338129725");
  });

  it("WHEN a marker already names this head, does nothing — a second failure is real", () => {
    expect(rearmIntents([stranded({ rearmedSha: "6fb021f5" })])).toEqual([]);
  });

  it("WHEN the head moved since the last re-arm, re-runs for the new head", () => {
    expect(rearmIntents([stranded({ rearmedSha: "oldsha" })])).toHaveLength(1);
  });

  it("WHEN no failed arm job is on the head, does nothing — never arms directly", () => {
    expect(rearmIntents([stranded({ armRunId: null })])).toEqual([]);
  });
});

describe("failedArmRun — the newest Pipeline run's arm job", () => {
  const run = (id: number, created: string, name = "Pipeline") => ({
    id,
    name,
    event: "pull_request",
    status: "completed",
    created_at: created,
  });
  const jobs: Record<number, { name: string; conclusion: string }[]> = {
    1: [{ name: "arm auto-merge", conclusion: "failure" }],
    2: [{ name: "arm auto-merge", conclusion: "success" }],
    3: [{ name: "arm auto-merge", conclusion: "skipped" }],
  };
  const jobsOf = (id: number) => jobs[id] ?? [];

  it("returns the run id when its arm job failed", () => {
    expect(failedArmRun([run(1, "2026-10-26T10:00:00Z")], jobsOf)).toBe(1);
  });

  it("reads only the newest Pipeline run, ignoring other workflows", () => {
    const runs = [
      run(1, "2026-10-26T10:00:00Z"),
      run(2, "2026-10-26T11:00:00Z"),
      run(9, "2026-10-26T12:00:00Z", "Board sync"),
    ];
    expect(failedArmRun(runs, jobsOf)).toBeNull();
  });

  it("does not treat a skipped arm job (held, draft) as failed", () => {
    expect(failedArmRun([run(3, "2026-10-26T10:00:00Z")], jobsOf)).toBeNull();
  });
});

describe("lastRearmSha", () => {
  it("reads the newest marker, null when none", () => {
    const body = (sha: string) => `x <!-- moneypenny:rearm sha=${sha} run=1 --> y`;
    expect(lastRearmSha([{ body: body("a") }, { body: "chatter" }, { body: body("b") }])).toBe("b");
    expect(lastRearmSha([{ body: "chatter" }])).toBeNull();
  });
});

describe("rearmStranded — comment first, then the pipeline's own re-run", () => {
  it("posts the marker comment, then POSTs rerun-failed-jobs for that run", () => {
    const calls: string[][] = [];
    const [i] = rearmIntents([stranded()]);
    if (!i) throw new Error("expected a rearm intent");
    rearmStranded(i, {
      run: (_cmd: string, args: string[]) => {
        calls.push(args);
        return "";
      },
    });
    expect(calls[0]?.slice(0, 2)).toEqual(["pr", "comment"]);
    expect(calls[1]).toContain("POST");
    expect(calls[1]?.at(-1)).toMatch(/actions\/runs\/40338129725\/rerun-failed-jobs$/);
  });
});

describe("audit — the stranded deps feed the intent list", () => {
  it("emits rearm-stranded from deps.stranded", () => {
    const intents = audit({ stranded: [stranded()] });
    expect(intents.map((i: { kind: string }) => i.kind)).toContain("rearm-stranded");
  });

  it("emits nothing while the work spigot is at halt", () => {
    // Only `position` matters here; the rest of the dial's shape is the work-mode spec's business.
    const workMode = { trackingIssue: 1, title: null, mode: { position: "halt" } };
    const intents = audit({ stranded: [stranded()], workMode } as unknown as Parameters<
      typeof audit
    >[0]);
    expect(intents.map((i: { kind: string }) => i.kind)).not.toContain("rearm-stranded");
  });
});
