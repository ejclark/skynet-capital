import { formatMinutes, marketSession, sessionSentence } from "../../src/live/market-session";

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
