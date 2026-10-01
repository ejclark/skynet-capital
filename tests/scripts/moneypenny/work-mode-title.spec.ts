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

const caps = { inFlightCap: 3, researchPerTick: 6, governorDispatches: 4, grindWidth: 200 };
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

  it("never retitles on a fail-closed read — the warning is that state's signal", () => {
    const unreadable = state("Work mode: NORMAL", {
      position: "conserve",
      reason: "fail-closed: the tracking issue could not be read",
      warning: "work-mode: could not read issue #4153 (HTTP 502) — acting as conserve",
    });
    expect(workModeRetitle(unreadable)).toBeNull();
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
