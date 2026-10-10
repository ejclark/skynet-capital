import type { CheckWeekRows } from "../../src/autonomous/decision-db-week.js";
import {
  checkWeekView,
  checkWeekWindow,
  WEEK_BUCKET_MS,
} from "../../src/observatory/check-week-view.js";

/**
 * The Playbooks section's week on one clock (#5073 slice 2): the bot's checks as a strip, each
 * playbook's answers as a lane, both cut into the same half hours of this week's sessions. Instants
 * are UTC; comments say them in New York time (EDT, UTC−4, the week of Oct 5 2026).
 */

const NOW = new Date("2026-10-07T15:00:00Z"); // Wed 11:00 AM
const STALE = 2 * 60_000;
const at = (iso: string) => Date.parse(iso);

/** One check every `stepMs` in `[from, to)`. */
function every(from: string, to: string, stepMs = 60_000): number[] {
  const out: number[] = [];
  for (let t = at(from); t < at(to); t += stepMs) out.push(t);
  return out;
}

const rows = (over: Partial<CheckWeekRows> = {}): CheckWeekRows => ({
  checks: [],
  verdicts: [],
  trades: [],
  ...over,
});

describe("checkWeekWindow", () => {
  it("runs from this week's first open to its last close", () => {
    expect(checkWeekWindow(NOW)).toEqual({
      from: at("2026-10-05T13:30:00Z"),
      to: at("2026-10-09T20:00:00Z"),
    });
  });
});

describe("checkWeekView — the strip", () => {
  it("cuts each session into half hours, and leaves the ones not yet begun empty", () => {
    const view = checkWeekView(rows(), NOW, STALE);
    expect(view.sessions.map((s) => s.date)).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
    expect(view.checks.map((day) => day.length)).toEqual([13, 13, 13, 13, 13]);
    // Wed: 9:30, 10:00, 10:30 and the 11:00 half hour (begun at exactly now) have happened.
    expect(view.checks[2]?.slice(0, 5)).toEqual([0, 0, 0, 0, null]);
    expect(view.checks[3]?.every((c) => c === null)).toBe(true);
  });

  it("counts the checks in each half hour", () => {
    const view = checkWeekView(
      rows({ checks: every("2026-10-05T13:30:00Z", "2026-10-05T14:30:00Z", 15_000) }),
      NOW,
      STALE,
    );
    expect(view.checks[0]?.slice(0, 3)).toEqual([120, 120, 0]);
  });

  it("finds no gap in a week checked every minute, up to now", () => {
    const checks = [
      ...every("2026-10-05T13:30:30Z", "2026-10-05T20:00:00Z"),
      ...every("2026-10-06T13:30:30Z", "2026-10-06T20:00:00Z"),
      ...every("2026-10-07T13:30:30Z", "2026-10-07T15:00:00Z"),
    ];
    expect(checkWeekView(rows({ checks }), NOW, STALE).gaps).toEqual([]);
  });

  it("names an open-market span with no check longer than the stale window", () => {
    const checks = [
      ...every("2026-10-05T13:30:30Z", "2026-10-05T20:00:00Z"),
      // Tue: 11:00–11:40 AM goes quiet
      ...every("2026-10-06T13:30:30Z", "2026-10-06T15:00:30Z"),
      ...every("2026-10-06T15:40:30Z", "2026-10-06T20:00:00Z"),
      ...every("2026-10-07T13:30:30Z", "2026-10-07T15:00:00Z"),
    ];
    expect(checkWeekView(rows({ checks }), NOW, STALE).gaps).toEqual([
      { from: at("2026-10-06T14:59:30Z"), to: at("2026-10-06T15:40:30Z") },
    ]);
  });

  it("calls a whole session with no check one gap, and never counts the closed night", () => {
    const checks = [
      ...every("2026-10-05T13:30:30Z", "2026-10-05T20:00:00Z"),
      ...every("2026-10-07T13:30:30Z", "2026-10-07T15:00:00Z"),
    ];
    expect(checkWeekView(rows({ checks }), NOW, STALE).gaps).toEqual([
      { from: at("2026-10-06T13:30:00Z"), to: at("2026-10-06T20:00:00Z") },
    ]);
  });

  it("says the session under way has gone quiet once its newest check is past the window", () => {
    const checks = every("2026-10-05T13:30:30Z", "2026-10-05T20:00:00Z");
    const view = checkWeekView(rows({ checks }), new Date("2026-10-05T19:00:00Z"), STALE);
    expect(view.gaps).toEqual([]);
    const quiet = checkWeekView(
      rows({ checks: every("2026-10-05T13:30:30Z", "2026-10-05T18:00:00Z") }),
      new Date("2026-10-05T19:00:00Z"),
      STALE,
    );
    expect(quiet.gaps).toEqual([
      { from: at("2026-10-05T17:59:30Z"), to: at("2026-10-05T19:00:00Z") },
    ]);
  });
});

describe("checkWeekView — the lanes", () => {
  const bucket = (iso: string) => Math.floor(at(iso) / WEEK_BUCKET_MS);

  it("draws each playbook's most-given answer per half hour, in its own session column", () => {
    const view = checkWeekView(
      rows({
        verdicts: [
          {
            bucket: bucket("2026-10-05T13:30:00Z"),
            playbookId: "S1-NVDA",
            mode: "standard",
            state: "no-window",
            n: 100,
          },
          {
            bucket: bucket("2026-10-05T13:30:00Z"),
            playbookId: "S1-NVDA",
            mode: "standard",
            state: "long",
            n: 20,
          },
          {
            bucket: bucket("2026-10-06T14:00:00Z"),
            playbookId: "S1-NVDA",
            mode: "standard",
            state: "long",
            n: 120,
          },
        ],
      }),
      NOW,
      STALE,
    );
    expect(view.lanes).toHaveLength(1);
    const lane = view.lanes[0];
    expect(lane?.states[0]?.[0]).toBe("no-window");
    expect(lane?.states[0]?.[1]).toBeNull();
    expect(lane?.states[1]?.[1]).toBe("long");
  });

  it("keeps a playbook run in two modes as two lanes, and gives each its verdict line's slot", () => {
    const b = bucket("2026-10-05T13:30:00Z");
    const view = checkWeekView(
      rows({
        verdicts: [
          { bucket: b, playbookId: "CRWV-WHEEL", mode: "aggressive", state: "long", n: 9 },
          { bucket: b, playbookId: "CRWV-WHEEL", mode: "standard", state: "flat", n: 9 },
          { bucket: b, playbookId: "OLD-PLAY", mode: "standard", state: "flat", n: 9 },
        ],
      }),
      NOW,
      STALE,
      [
        { playbookId: "S1-NVDA", mode: "standard" },
        { playbookId: "CRWV-WHEEL", mode: "aggressive" },
      ],
    );
    expect(view.lanes.map((l) => [l.playbookId, l.mode, l.slot])).toEqual([
      ["CRWV-WHEEL", "aggressive", 1],
      ["CRWV-WHEEL", "standard", undefined],
      ["OLD-PLAY", "standard", undefined],
    ]);
  });

  it("keeps the trades placed inside this week's sessions", () => {
    const view = checkWeekView(
      rows({
        trades: [
          { at: at("2026-10-05T15:20:00Z"), symbol: "NVDA", side: "buy", playbookId: "S1-NVDA" },
          { at: at("2026-10-02T15:20:00Z"), symbol: "NVDA", side: "buy" }, // last Friday
        ],
      }),
      NOW,
      STALE,
    );
    expect(view.trades.map((t) => t.symbol)).toEqual(["NVDA"]);
    expect(view.trades[0]?.playbookId).toBe("S1-NVDA");
  });
});
