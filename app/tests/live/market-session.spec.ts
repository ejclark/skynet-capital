import {
  calendarDays,
  type MarketClockView,
  marketClockView,
} from "../../../src/domain/market-clock";
import {
  formatCountdown,
  formatMinutes,
  halfDayLine,
  localSessionSuffix,
  marketSession,
  nextOpenLabel,
  sessionDays,
  sessionSentence,
  sessionWindowWords,
  sourceLine,
  statusLineCue,
  waitsForOpen,
} from "../../src/live/market-session";

// The topbar market clock (#3689 slice 1) — the regular session in ET, holidays and early
// closes from the exchange calendar. September 2026 is EDT (UTC−4).
describe("marketSession", () => {
  it("counts down to the 4:00 close mid-session", () => {
    const v = marketSession(new Date("2026-09-24T18:32:00Z")); // Thu 14:32 ET
    expect(v.state).toBe("open");
    expect(v.minutesLeft).toBe(88);
    expect(v.elapsed).toBeCloseTo(302 / 390, 5);
    expect(v.powerAt).toBeCloseTo(330 / 390, 5);
    expect(v.closeLabel).toBe("4:00");
  });

  it("calls the last hour power hour", () => {
    expect(marketSession(new Date("2026-09-24T19:15:00Z")).state).toBe("power"); // 15:15 ET
  });

  it("counts down to the open before 9:30", () => {
    const v = marketSession(new Date("2026-09-24T12:48:00Z")); // 8:48 ET
    expect(v.state).toBe("pre");
    expect(v.minutesLeft).toBe(42);
    expect(v.elapsed).toBe(0);
  });

  it("is closed after 4:00 with a full track and names the next open", () => {
    const v = marketSession(new Date("2026-09-25T21:00:00Z")); // Fri 17:00 ET
    expect(v.state).toBe("closed");
    expect(v.elapsed).toBe(1);
    expect(v.nextOpen).toBe("Mon 9:30");
  });

  it("is closed all weekend with an empty track", () => {
    const v = marketSession(new Date("2026-09-26T15:00:00Z")); // Saturday
    expect(v.state).toBe("closed");
    expect(v.elapsed).toBe(0);
    expect(v.nextOpen).toBe("Mon 9:30");
  });

  it("knows a holiday is closed and skips it for the next open", () => {
    const v = marketSession(new Date("2026-11-26T15:00:00Z")); // Thanksgiving
    expect(v.state).toBe("closed");
    expect(v.nextOpen).toBe("Fri 9:30");
    expect(marketSession(new Date("2026-09-04T21:00:00Z")).nextOpen).toBe("Tue 9:30"); // Labor Day
  });

  it("shortens an early-close day to 1:00", () => {
    const v = marketSession(new Date("2026-12-24T16:30:00Z")); // Christmas Eve 11:30 ET
    expect(v.state).toBe("open");
    expect(v.minutesLeft).toBe(90);
    expect(v.closeLabel).toBe("1:00");
    expect(marketSession(new Date("2026-12-24T17:30:00Z")).state).toBe("power"); // 12:30 ET
    expect(marketSession(new Date("2026-12-24T18:30:00Z")).state).toBe("closed"); // 13:30 ET
  });
});

describe("formatMinutes", () => {
  it("reads as the widget prints it", () => {
    expect(formatMinutes(88)).toBe("1h 28m");
    expect(formatMinutes(42)).toBe("42m");
    expect(formatMinutes(360)).toBe("6h");
  });
});

describe("sessionSentence", () => {
  it("says the state in words, so colour never carries it alone", () => {
    expect(sessionSentence(marketSession(new Date("2026-09-24T18:32:00Z")))).toBe(
      "Market open, 1h 28m left today",
    );
    expect(sessionSentence(marketSession(new Date("2026-09-26T15:00:00Z")))).toBe(
      "Market closed, opens Mon 9:30 ET",
    );
  });
});

describe("nextOpenLabel", () => {
  it("names the next session's day and date while one is running", () => {
    expect(nextOpenLabel(marketSession(new Date("2026-09-24T18:32:00Z")))).toBe(
      "Fri Sep 25 · 9:30 ET",
    );
  });

  it("is today before the open", () => {
    expect(nextOpenLabel(marketSession(new Date("2026-09-24T12:48:00Z")))).toBe("Today · 9:30 ET");
  });

  it("skips the weekend and the exchange's holidays", () => {
    expect(nextOpenLabel(marketSession(new Date("2026-09-26T15:00:00Z")))).toBe(
      "Mon Sep 28 · 9:30 ET",
    );
    expect(nextOpenLabel(marketSession(new Date("2026-11-25T21:00:00Z")))).toBe(
      "Fri Nov 27 · 9:30 ET",
    );
  });
});

// The market's one word beside a fleet alarm on a phone (#5064's review): the sentence steps
// aside, but no state may be left to a ring's colour — each keeps a word nothing else shares.
describe("statusLineCue", () => {
  const cue = (iso: string) => statusLineCue(marketSession(new Date(iso)));

  it("says open, in the last hour too", () => {
    expect(cue("2026-09-24T18:32:00Z")).toBe("Open"); // Thu 14:32 ET
    expect(cue("2026-09-24T19:15:00Z")).toBe("Open"); // 15:15 ET, power hour
  });

  it("names the open's time before the bell — one width, however early it is", () => {
    expect(cue("2026-09-24T12:48:00Z")).toBe("Opens 9:30"); // 8:48 ET
    expect(cue("2026-09-24T05:00:00Z")).toBe("Opens 9:30"); // 1:00 ET, 8h 30m out
  });

  it("says closed after the bell, at weekends and on holidays", () => {
    for (const iso of ["2026-09-24T21:00:00Z", "2026-09-26T15:00:00Z", "2026-11-26T15:00:00Z"]) {
      expect(cue(iso)).toBe("Closed");
    }
  });
});

// #6257: the open a ticket placed now waits for — undefined only while the session runs.
describe("waitsForOpen", () => {
  it("is undefined mid-session and in power hour", () => {
    expect(waitsForOpen(marketSession(new Date("2026-10-27T15:00:00Z")))).toBeUndefined();
    expect(waitsForOpen(marketSession(new Date("2026-10-27T19:30:00Z")))).toBeUndefined();
  });

  it("names today's open before the bell and the next session's after the close", () => {
    expect(waitsForOpen(marketSession(new Date("2026-10-27T12:00:00Z")))).toBe(
      "today's 9:30 ET open",
    );
    expect(waitsForOpen(marketSession(new Date("2026-10-27T00:00:00Z")))).toBe(
      "the Tue 9:30 ET open",
    );
    expect(waitsForOpen(marketSession(new Date("2026-10-31T16:00:00Z")))).toBe(
      "the Mon 9:30 ET open",
    );
  });
});

// #8248 PR 2: the days come from the broker's calendar, served by GET /api/market/clock.
type Row = readonly [date: string, open: string, close: string];

/** The route's answer at `asOf`, from a calendar body as Alpaca words it. */
function broker(asOf: string, rows: readonly Row[]): MarketClockView {
  const days = calendarDays(rows.map(([date, open, close]) => ({ date, open, close })));
  if (!days) throw new Error("fixture calendar did not parse");
  return marketClockView(days, new Date(asOf), "broker");
}

// Thanksgiving week 2026, as the broker lists it: Thursday absent, Friday closing at 1:00 PM.
const THANKSGIVING: readonly Row[] = [
  ["2026-11-23", "09:30", "16:00"],
  ["2026-11-24", "09:30", "16:00"],
  ["2026-11-25", "09:30", "16:00"],
  ["2026-11-27", "09:30", "13:00"],
  ["2026-11-30", "09:30", "16:00"],
  ["2026-12-01", "09:30", "16:00"],
];
const MON_8PM = "2026-11-24T01:00:00Z"; // Mon 2026-11-23, 8:00 PM ET — when the shell read it
const THU_10 = new Date("2026-11-26T15:00:00Z"); // Thanksgiving, 10:00 AM ET
const FRI_1230 = new Date("2026-11-27T17:30:00Z"); // the half day, 12:30 PM ET

describe("marketSession on the broker's calendar", () => {
  const clock = broker(MON_8PM, THANKSGIVING);

  it("reads Thanksgiving closed, names Friday's open and counts down to it", () => {
    const v = marketSession(THU_10, clock);
    expect(v.state).toBe("closed");
    expect(v.source).toBe("broker");
    expect(v.nextOpen).toBe("Fri 9:30");
    expect(v.minutesToOpen).toBe(23 * 60 + 30);
    expect(nextOpenLabel(v)).toBe("Fri Nov 27 · 9:30 ET");
    expect(waitsForOpen(v)).toBe("the Fri 9:30 ET open");
    expect(halfDayLine(v)).toBe("Half day Fri: closes 1:00 PM ET");
  });

  it("ends Friday's track at 1:00 and says the half day in words", () => {
    const v = marketSession(FRI_1230, clock);
    expect(v.state).toBe("power");
    expect(v.minutesLeft).toBe(30);
    expect(v.closeLabel).toBe("1:00");
    expect(v.elapsed).toBeCloseTo(180 / 210, 5);
    expect(halfDayLine(v)).toBe("Half day: closes 1:00 PM ET");
    expect(sessionSentence(v)).toBe("Market open, power hour, 30m left today");
  });

  it("lets the broker's date win where it and the table disagree", () => {
    // A closure the table doesn't list: the broker leaves Tuesday Dec 1 out.
    const drift = broker(MON_8PM, [
      ...THANKSGIVING.filter(([date]) => date !== "2026-12-01"),
      ["2026-12-02", "09:30", "16:00"],
    ]);
    expect(marketSession(new Date("2026-12-01T16:00:00Z"), drift).state).toBe("closed");
    // Past the broker's last listed day, the table answers again.
    expect(marketSession(new Date("2026-12-03T16:00:00Z"), drift).state).toBe("open");
  });

  it("reads past the end of the checked-in table, where the table alone would guess", () => {
    const asOf = "2027-12-28T14:00:00Z"; // the table's last row is 2027-12-24
    const late = broker(asOf, [
      ["2027-12-28", "09:30", "16:00"],
      ["2027-12-31", "09:30", "13:00"],
    ]);
    expect(marketSession(new Date("2027-12-29T16:00:00Z"), late).state).toBe("closed");
    expect(marketSession(new Date("2027-12-31T17:30:00Z"), late).closeLabel).toBe("1:00");
  });

  it("keeps today's session after its close, so a trading day never draws as a holiday", () => {
    const after = broker("2026-11-25T22:00:00Z", THANKSGIVING); // Wed 5:00 PM ET
    const v = marketSession(new Date("2026-11-25T22:00:00Z"), after);
    expect(v.state).toBe("closed");
    expect(v.elapsed).toBe(1);
    expect(sessionDays(new Date("2026-11-25T22:00:00Z"), after)[0]?.date).toBe("2026-11-25");
  });

  it("says when the table answered, and says nothing when the broker did", () => {
    expect(sourceLine(marketSession(THU_10))).toMatch(/exchange's published table/);
    expect(sourceLine(marketSession(THU_10, clock))).toBeUndefined();
  });
});

describe("the next open on the viewer's own clock", () => {
  const clock = broker(MON_8PM, THANKSGIVING);

  it("adds the local time beside ET for a viewer outside New York", () => {
    const v = marketSession(THU_10, clock, "America/Los_Angeles");
    expect(waitsForOpen(v)).toBe("the Fri 9:30 ET open (6:30 AM PST)");
  });

  it("names the day too when the open lands on another date there", () => {
    const v = marketSession(THU_10, clock, "Australia/Sydney");
    expect(waitsForOpen(v)).toBe("the Fri 9:30 ET open (Sat 1:30 AM GMT+11)");
  });

  it("adds nothing for a New York viewer", () => {
    expect(waitsForOpen(marketSession(THU_10, clock, "America/New_York"))).toBe(
      "the Fri 9:30 ET open",
    );
  });
});

describe("formatCountdown", () => {
  it("counts in days past a day", () => {
    expect(formatCountdown(42)).toBe("42m");
    expect(formatCountdown(23 * 60 + 30)).toBe("23h 30m");
    expect(formatCountdown(2 * 24 * 60 + 23 * 60 + 30)).toBe("2d 23h");
    expect(formatCountdown(3 * 24 * 60)).toBe("3d");
  });
});

describe("the first-trade note's session window", () => {
  const clock = broker(MON_8PM, THANKSGIVING);

  it("is the regular hours on a full day, with the viewer's own after them", () => {
    const v = marketSession(new Date("2026-11-24T15:00:00Z"), clock);
    expect(sessionWindowWords(v, "America/Los_Angeles")).toBe(
      "9:30 AM to 4:00 PM ET (6:30 AM–1:00 PM PST), Monday through Friday",
    );
    expect(sessionWindowWords(v, "America/New_York")).toBe(
      "9:30 AM to 4:00 PM ET, Monday through Friday",
    );
  });

  it("never says 4:00 PM on a half day", () => {
    const words = sessionWindowWords(marketSession(FRI_1230, clock), "America/Los_Angeles");
    expect(words).toBe("9:30 AM to 1:00 PM ET (6:30 AM–10:00 AM PST) today, a half day");
    expect(words).not.toContain("4:00");
  });

  it("gives a Pacific viewer a day's session in their own zone", () => {
    const [day] = sessionDays(new Date("2026-09-03T15:00:00Z"));
    if (!day) throw new Error("no session");
    expect(localSessionSuffix(day, "America/Los_Angeles")).toBe(" (6:30 AM–1:00 PM PDT)");
    expect(localSessionSuffix(day, "America/New_York")).toBe("");
  });
});
