import type { WorkMode } from "../../../scripts/moneypenny/work-mode.d.mts";
import { workModeRetitle, workModeTitle } from "../../../scripts/moneypenny/work-mode-title.mjs";

// THE DIAL'S DASHBOARD (#3960 slice 4 — criterion 4's write half). The read half shipped in slice
// 1: an expired position already resolves to `normal`, so no lane over-throttles. The write was
// missing, so the tracking issue's title could read CONSERVE for days after every lane had gone
// back to normal — a dashboard that lies. These specs pin the three things that matter:
//   - the title format is the plan's own ("Work mode: CONSERVE until 2026-09-29");
//   - a title already right produces NO intent, which is what makes this safe to run every push;
//   - a fail-closed READ (a `warning`) never retitles — a GitHub blip must not post a dashboard
//     saying the repo is throttled when nobody throttled it.

const caps = {
  inFlightCap: 3,
  researchPerTick: 6,
  governorDispatches: 4,
  grindWidth: 200,
  continuationsPerDay: 3,
  startedPlanCap: 4,
};
const mode = (over: Partial<WorkMode> = {}): WorkMode => ({
  position: "normal",
  until: null,
  caps,
  reason: "set to normal",
  ...over,
});

describe("workModeTitle — the plan's status-at-a-glance format", () => {
  it.each([
    [mode(), "Work mode: NORMAL"],
    [mode({ position: "conserve", until: "2026-09-29" }), "Work mode: CONSERVE until 2026-09-29"],
    [mode({ position: "surge", until: "2026-10-06" }), "Work mode: SURGE until 2026-10-06"],
    [mode({ position: "halt", until: null }), "Work mode: HALT"],
  ])("renders %#", (m, expected) => {
    expect(workModeTitle(m)).toBe(expected);
  });
});

describe("the pace suffix, derived from the published reading", () => {
  const READ_AT = Date.parse("2026-11-01T13:40:00Z");
  const reading = {
    used: 34,
    at: READ_AT,
    resetsAt: Date.parse("2026-11-03T05:00:00Z"),
    source: "get_usage",
  };

  it("adds the reading to the title, and leaves it off with none", () => {
    expect(workModeTitle(mode({ reading }), READ_AT + 60_000)).toBe(
      "Work mode: NORMAL · pace: week 34% used, 77% gone, behind pace by 43, resets 11-03 05:00Z",
    );
    expect(workModeTitle(mode({ reading: null }), READ_AT)).toBe("Work mode: NORMAL");
  });

  it("keeps the suffix through the tick: a title already carrying it is left alone", () => {
    const m = mode({ reading });
    const state = { trackingIssue: 4153, mode: m, now: READ_AT + 3_600_000 };
    const title = workModeTitle(m, state.now);
    expect(workModeRetitle({ ...state, title })).toBeNull();
  });

  it("does not rewrite the title as the clock moves within a fresh reading", () => {
    const m = mode({ reading });
    const early = workModeTitle(m, READ_AT + 60_000);
    expect(workModeTitle(m, READ_AT + 11 * 3_600_000)).toBe(early);
  });

  it("restores a suffix a person or an old title dropped", () => {
    const intent = workModeRetitle({
      trackingIssue: 4153,
      title: "Work mode: NORMAL",
      mode: mode({ reading }),
      now: READ_AT,
    });
    expect(intent?.newTitle).toContain("week 34% used");
  });

  it("prints a reading older than 12 hours as stale, never as fresh", () => {
    const title = workModeTitle(mode({ reading }), READ_AT + 12 * 3_600_000 + 60_000);
    expect(title).toBe("Work mode: NORMAL · pace: STALE, 34% used when read 11-01 13:40Z");
    expect(title).not.toContain("behind pace");
  });

  it("carries the position and its end beside the reading", () => {
    expect(
      workModeTitle(mode({ position: "conserve", until: "2026-11-03", reading }), READ_AT),
    ).toMatch(/^Work mode: CONSERVE until 2026-11-03 · pace: week 34% used/);
  });
});

describe("workModeRetitle — only when the dashboard is actually stale", () => {
  const state = (title: string | null, over: Partial<WorkMode> = {}) => ({
    trackingIssue: 4153,
    title,
    mode: mode(over),
  });

  it("rewrites the title once a position has expired — criterion 4's own case", () => {
    const expired = state("Work mode: CONSERVE until 2026-09-29", {
      reason: "conserve expired at the end of 2026-09-29 (UTC)",
    });
    expect(workModeRetitle(expired)).toEqual({
      kind: "retitle-work-mode",
      issueNumber: 4153,
      title: "Work mode: CONSERVE until 2026-09-29",
      newTitle: "Work mode: NORMAL",
      position: "normal",
      reason: "conserve expired at the end of 2026-09-29 (UTC)",
    });
  });

  it("also catches a label flipped without a title edit — one rule, not a second code path", () => {
    const flipped = state("Work mode: NORMAL", {
      position: "conserve",
      until: "2026-10-06",
      reason: "set to conserve until 2026-10-06",
    });
    expect(workModeRetitle(flipped)?.newTitle).toBe("Work mode: CONSERVE until 2026-10-06");
  });

  it("is silent when the title already matches — so this can ride every push", () => {
    expect(workModeRetitle(state("Work mode: NORMAL"))).toBeNull();
  });

  it("ignores surrounding whitespace rather than rewriting the same title", () => {
    expect(workModeRetitle(state("  Work mode: NORMAL  "))).toBeNull();
  });

  it("never retitles when the tracking issue could not be read — that conserve is a fallback", () => {
    const unreadable = state("Work mode: NORMAL", {
      position: "conserve",
      unreadable: true,
      reason: "fail-closed: the tracking issue could not be read",
      warning: "work-mode: could not read issue #4153 (HTTP 502) — acting as conserve",
    });
    expect(workModeRetitle(unreadable)).toBeNull();
  });

  // The first version of this rule keyed on `warning` and so skipped exactly the states where the
  // title goes stale and nothing else ever corrects it: the dial was READ fine, it is just
  // misconfigured. A warning is not a failed read — only `unreadable` is.
  it("still retitles a position that was read fine but warned — a forgotten `until` comment", () => {
    const forgotten = state("Work mode: CONSERVE until 2026-09-29", {
      position: "normal",
      reason: "conserve carries no expiry, so it is treated as expired",
      warning: 'work-mode: conserve has no "until <YYYY-MM-DD>" comment — acting as normal',
    });
    expect(workModeRetitle(forgotten)?.newTitle).toBe("Work mode: NORMAL");
  });

  it("still retitles when the dial carries two labels at once — the lanes act on conserve", () => {
    const ambiguous = state("Work mode: SURGE until 2026-10-06", {
      position: "conserve",
      reason: "fail-closed: the dial is not set to exactly one position",
      warning: "work-mode: 2 (work-mode:normal, work-mode:surge) work-mode:* labels",
    });
    expect(workModeRetitle(ambiguous)?.newTitle).toBe("Work mode: CONSERVE");
  });

  it.each([
    ["no state at all", null],
    ["no mode", { trackingIssue: 4153, title: "Work mode: NORMAL" }],
    ["no tracking issue", { title: "Work mode: HALT", mode: mode() }],
    ["no current title to compare", { trackingIssue: 4153, title: null, mode: mode() }],
    ["an empty current title", { trackingIssue: 4153, title: "   ", mode: mode() }],
  ])("is silent with %s", (_what, input) => {
    expect(workModeRetitle(input)).toBeNull();
  });
});
