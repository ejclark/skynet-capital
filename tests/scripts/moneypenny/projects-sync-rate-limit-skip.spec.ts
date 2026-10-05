import { describe, expect, it } from "@rstest/core";
import {
  boardSyncSkip,
  explainMaskedOwnerFailure,
  explainRateLimitExhausted,
  explainThrottled,
} from "../../../scripts/moneypenny/projects.mjs";

// #4438 — run 36808329767 (sha 3c72dc5) went red on `sync project status` because the GraphQL hour
// was spent. The board is a display and the lane is level-based, so the CLI now skips with a
// `::warning::` on a rate limit and stays red on everything else. These specs drive the split from
// the probe's own words, so it is pinned rather than pattern-matched by eye.

// Verbatim from the failing run's log.
const PROBE_TEXT = "gh: API rate limit already exceeded for user ID 3472134.";
const NOW = Date.parse("2026-10-01T02:58:24Z");
const RESET = Math.floor(Date.parse("2026-10-01T03:30:00Z") / 1000);

describe("moneypenny projects-sync: a rate limit skips the board sync, anything else fails (#4438)", () => {
  it("names a rate-limited probe as a rate limit, not a bad credential, even worded with HTTP 403", () => {
    for (const text of [PROBE_TEXT, `${PROBE_TEXT} (HTTP 403)`]) {
      const out = explainMaskedOwnerFailure({ ok: false, text });
      expect(out).toMatch(/rate limit/);
      expect(out).not.toMatch(/PROJECTS_PAT/);
    }
  });

  it("skips with a one-line warning naming the reset time when the masked failure's probe was rate-limited", () => {
    const error = new Error(explainMaskedOwnerFailure({ ok: false, text: PROBE_TEXT }));
    const out = boardSyncSkip({ issueNumber: 3960, error, budget: { reset: RESET }, now: NOW });
    expect(out).toMatch(/^::warning title=Board sync skipped \(rate limit\)::issue #3960/);
    expect(out).toMatch(/resets at 2026-10-01T03:30:00Z \(32 min\)/);
    expect(out).toContain(PROBE_TEXT);
    expect(out).not.toMatch(/\n/);
  });

  it("skips for a spent hour and a burst that never cleared — both explainers keep the phrase", () => {
    const spent = new Error(explainRateLimitExhausted({ remaining: 0, reset: RESET, now: NOW }));
    const throttled = new Error(explainThrottled({ remaining: 4000 }));
    for (const error of [spent, throttled]) {
      expect(boardSyncSkip({ issueNumber: 1, error, budget: { reset: RESET }, now: NOW })).toMatch(
        /^::warning/,
      );
    }
  });

  it("reads gh's raw stderr too, not just the message", () => {
    const error = Object.assign(new Error("Command failed: gh project item-list"), {
      stderr: "GraphQL: API rate limit exceeded for user ID 3472134",
    });
    expect(boardSyncSkip({ issueNumber: 1, error, now: NOW })).toMatch(/^::warning/);
  });

  it("still says when the board catches up if GitHub gave no reset time", () => {
    const error = new Error(PROBE_TEXT);
    expect(boardSyncSkip({ issueNumber: 1, error, budget: {}, now: NOW })).toMatch(
      /did not report a reset time/,
    );
  });

  it("returns null — re-throw, job stays red — for every failure that is not a rate limit", () => {
    const fatal = [
      new Error(explainMaskedOwnerFailure({ ok: false, text: "gh: Bad credentials (HTTP 401)" })),
      new Error(explainMaskedOwnerFailure({ ok: true })),
      new Error("Could not resolve to a ProjectV2 with the number 2."),
      new Error('Status field has no option named "Doing"'),
      Object.assign(new Error("Command failed"), { stderr: "HTTP 502 Bad Gateway" }),
      undefined,
    ];
    for (const error of fatal)
      expect(boardSyncSkip({ issueNumber: 1, error, now: NOW })).toBeNull();
  });
});
