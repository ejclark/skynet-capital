import { describe, expect, it } from "@rstest/core";
import {
  ciByTrigger,
  localVerify,
  mergeMinutes,
  quantile,
  runLoop,
  startupFromTranscript,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter.mjs";

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

  it("counts local verify failures in the window", () => {
    const since = Date.parse("2026-10-01T00:00:00Z");
    expect(
      localVerify(
        [
          { at: "2026-10-02T00:00:00Z", ok: false },
          { at: "2026-10-02T01:00:00Z", ok: true },
          { at: "2026-09-02T00:00:00Z", ok: false },
        ],
        since,
      ),
    ).toEqual({ runs: 2, failed: 1 });
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
