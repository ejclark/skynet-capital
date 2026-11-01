import { describe, expect, it } from "@rstest/core";
import {
  ciByTrigger,
  crossesRepeatedHour,
  iterationRow,
  localVerify,
  mainFailuresByJob,
  mergeMinutes,
  quantile,
  runLoop,
  startupFromTranscript,
  windowFromArgs,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter.mjs";

describe("the meter's window", () => {
  const now = Date.parse("2026-11-01T12:00:00Z");

  it("is a true rolling window: --days 1 is 24 hours, not since yesterday's date", () => {
    expect(windowFromArgs(["--days", "1"], now)).toMatchObject({
      sinceMs: now - 86400000,
      untilMs: now,
      hours: 24,
    });
  });

  it("takes --hours, and --since/--until as stated bounds", () => {
    expect(windowFromArgs(["--hours", "6"], now).sinceMs).toBe(now - 6 * 3600000);
    const w = windowFromArgs(
      ["--since", "2026-10-27T05:00:00Z", "--until", "2026-11-01T00:00:00Z"],
      now,
    );
    expect(w.sinceMs).toBe(Date.parse("2026-10-27T05:00:00Z"));
    expect(w.untilMs).toBe(Date.parse("2026-11-01T00:00:00Z"));
    expect(w.hours).toBe(115);
  });

  it("defaults to 7 days and refuses a window it cannot read", () => {
    expect(windowFromArgs([], now).hours).toBe(168);
    expect(() => windowFromArgs(["--hours", "soon"], now)).toThrow(/--hours/);
  });

  it("names the repeated hour of 2026-11-01 when the window crosses it", () => {
    expect(
      crossesRepeatedHour(Date.parse("2026-11-01T05:00:00Z"), Date.parse("2026-11-01T07:00:00Z")),
    ).toBe(true);
    expect(
      crossesRepeatedHour(Date.parse("2026-10-27T05:00:00Z"), Date.parse("2026-10-31T00:00:00Z")),
    ).toBe(false);
  });
});

describe("main failures by failing job", () => {
  it("names each failed main run by its job and step, so an outage reads as the job", () => {
    const out = mainFailuresByJob([
      { conclusion: "failure", failedJobs: [{ job: "release · deploy bots", step: "smoke" }] },
      { conclusion: "failure", failedJobs: [{ job: "release · deploy bots", step: "smoke" }] },
      { conclusion: "failure", failedJobs: [{ job: "verify", step: "test" }] },
      { conclusion: "success", failedJobs: [] },
      { conclusion: "cancelled", failedJobs: [] },
    ]);
    expect(out).toEqual({
      runs: 4,
      failed: 3,
      byJob: { "release · deploy bots › smoke": 2, "verify › test": 1 },
    });
  });

  it("reads a failed run whose jobs could not be read as unknown, never as a named job", () => {
    expect(mainFailuresByJob([{ conclusion: "failure", failedJobs: null }]).byJob).toEqual({
      "unknown (jobs not read)": 1,
    });
  });
});

describe("the iteration row", () => {
  it("writes the one fixed format a loop's Log takes", () => {
    expect(
      iterationRow({
        loop: "post-merge audit",
        before: 27,
        after: 19,
        tokens: 1234567,
        date: "2026-11-01",
      }),
    ).toBe("- 2026-11-01 · post-merge audit · iteration · 27 → 19 · 1.2M tokens");
    expect(
      iterationRow({
        loop: "x",
        before: 1,
        after: 1,
        tokens: 900,
        usd: 3.4,
        minutes: 12,
        date: "2026-11-01",
      }),
    ).toBe("- 2026-11-01 · x · iteration · 1 → 1 · 900 tokens · $3.40 · 12 min");
  });

  it("refuses a row with a number missing or not a number", () => {
    expect(() => iterationRow({ loop: "x", before: 1, tokens: 1, date: "2026-11-01" })).toThrow(
      /after/,
    );
    expect(() =>
      iterationRow({
        loop: "x",
        before: Number("twelve"),
        after: 1,
        tokens: 1,
        date: "2026-11-01",
      }),
    ).toThrow(/--before needs a number/);
  });
});

describe("agent meter", () => {
  it("keeps a main-only outage out of the PR failure rate", () => {
    const ci = ciByTrigger([
      { event: "pull_request", conclusion: "success" },
      { event: "pull_request", conclusion: "cancelled" },
      { event: "push", conclusion: "failure" },
      { event: "push", conclusion: "failure" },
    ]);
    expect(ci.pull_request).toEqual({ runs: 1, failed: 0 });
    expect(ci.push).toEqual({ runs: 2, failed: 2 });
  });

  it("times only merged feat and fix PRs inside the window", () => {
    const since = Date.parse("2026-10-01T00:00:00Z");
    const merge = mergeMinutes(
      [
        {
          title: "feat(a): x",
          createdAt: "2026-10-02T00:00:00Z",
          mergedAt: "2026-10-02T00:10:00Z",
        },
        { title: "fix: y", createdAt: "2026-10-02T00:00:00Z", mergedAt: "2026-10-02T00:30:00Z" },
        {
          title: "docs(research): z",
          createdAt: "2026-10-02T00:00:00Z",
          mergedAt: "2026-10-02T09:00:00Z",
        },
        { title: "fix: old", createdAt: "2026-09-02T00:00:00Z", mergedAt: "2026-09-02T09:00:00Z" },
      ],
      since,
    );
    expect(merge).toEqual({ n: 2, p50: 30, p90: 30 });
  });

  it("returns null rather than a number for an empty quantile", () => {
    expect(quantile([], 0.5)).toBeNull();
  });

  it("counts local verify failures in the window, by the step that failed", () => {
    const since = Date.parse("2026-10-01T00:00:00Z");
    expect(
      localVerify(
        [
          {
            at: "2026-10-02T00:00:00Z",
            ok: false,
            step: "typecheck:app",
            error: "x.ts: error TS2322",
          },
          { at: "2026-10-02T01:00:00Z", ok: true },
          { at: "2026-10-02T02:00:00Z", ok: false },
          { at: "2026-10-02T03:00:00Z", ok: false, step: "", error: "" },
          { at: "2026-09-02T00:00:00Z", ok: false },
        ],
        since,
      ),
    ).toEqual({
      runs: 4,
      failed: 3,
      bySteps: {
        "typecheck:app": 1,
        "unknown (row predates the step field)": 1,
        "unknown (no step named)": 1,
      },
    });
  });

  it("reports an unverified run as null time, never a partial", () => {
    expect(runLoop([{ kind: "attempt", at: "2026-10-02T00:00:00Z", verified: false }])).toEqual({
      attempts: 1,
      verified: false,
      minutesToVerified: null,
    });
    expect(
      runLoop([
        { kind: "note", at: "2026-10-02T00:00:00Z" },
        { kind: "attempt", at: "2026-10-02T00:00:00Z", verified: false },
        { kind: "attempt", at: "2026-10-02T00:20:00Z", verified: true },
      ]),
    ).toEqual({ attempts: 2, verified: true, minutesToVerified: 20 });
  });

  it("attributes startup from attachments and names the rest as unitemized", () => {
    const body = "x".repeat(400);
    const startup = startupFromTranscript([
      JSON.stringify({ attachment: { type: "skill_listing", content: body } }),
      JSON.stringify({ attachment: { type: "prompt_snapshot", content: body } }),
      "not json",
      JSON.stringify({
        type: "assistant",
        message: {
          usage: {
            input_tokens: 2,
            cache_creation_input_tokens: 998,
            cache_read_input_tokens: 1000,
          },
        },
      }),
      JSON.stringify({ attachment: { type: "late", content: body } }),
    ]);
    expect(startup.firstCall).toBe(2000);
    expect(Object.keys(startup.sources)).toEqual(["skill_listing"]);
    expect(startup.unitemized).toBe(2000 - startup.sources.skill_listing);
  });

  it("has no startup to report before the first answer", () => {
    expect(startupFromTranscript(["{}"])).toBeNull();
  });
});
