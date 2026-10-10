import {
  lastClosedSessionOpen,
  regularSessionOpen,
  sessionBounds,
  sessionWeek,
} from "../../src/domain/market-session.js";

// The open of the last session that has finished — what the heartbeat measures a closed market's
// silence against (#4949). Instants are UTC; the comments say them in New York time.
describe("lastClosedSessionOpen", () => {
  const open = (iso: string) => lastClosedSessionOpen(new Date(iso)).toISOString();
  it("is today's open once today's session has closed (EDT)", () => {
    expect(open("2026-09-24T21:00:00Z")).toBe("2026-09-24T13:30:00.000Z"); // Thu 5:00 PM
  });
  it("is the previous trading day's open before and during today's session", () => {
    expect(open("2026-09-24T12:00:00Z")).toBe("2026-09-23T13:30:00.000Z"); // Thu 8:00 AM
    expect(open("2026-09-24T15:00:00Z")).toBe("2026-09-23T13:30:00.000Z"); // Thu 11:00 AM
  });
  it("skips the weekend and a full holiday, and follows the clock change (EST)", () => {
    expect(open("2026-09-28T12:00:00Z")).toBe("2026-09-25T13:30:00.000Z"); // Mon 8:00 AM → Fri
    expect(open("2026-11-26T17:00:00Z")).toBe("2026-11-25T14:30:00.000Z"); // Thanksgiving → Wed
  });
  it("counts an early-close day as closed from 1:00 PM", () => {
    expect(open("2026-11-27T18:30:00Z")).toBe("2026-11-27T14:30:00.000Z"); // Fri 1:30 PM
  });
});

// The regular session as a pure clock, judged in New York time — what Moneypenny's "open right
// now" steer rests on. The desk's own gate still asks the broker before any order.
describe("regularSessionOpen", () => {
  it("is open mid-session on a weekday", () => {
    expect(regularSessionOpen(new Date("2026-09-03T15:00:00Z"))).toBe(true); // 11:00 ET, Thursday
  });
  it("is closed before the open, after the close, and on the weekend", () => {
    expect(regularSessionOpen(new Date("2026-09-03T13:29:00Z"))).toBe(false); // 9:29 ET
    expect(regularSessionOpen(new Date("2026-09-03T20:00:00Z"))).toBe(false); // 16:00 ET
    expect(regularSessionOpen(new Date("2026-09-05T15:00:00Z"))).toBe(false); // Saturday
  });
});

describe("regularSessionOpen — the exchange calendar", () => {
  it("is closed all day on a full holiday", () => {
    expect(regularSessionOpen(new Date("2026-11-26T16:00:00Z"))).toBe(false); // Thanksgiving, 11:00 ET
  });

  it("closes at 1:00 PM ET on an early-close day", () => {
    expect(regularSessionOpen(new Date("2026-11-27T17:00:00Z"))).toBe(true); // 12:00 ET
    expect(regularSessionOpen(new Date("2026-11-27T18:30:00Z"))).toBe(false); // 13:30 ET
  });
});

// The Playbooks strip's clock (#5073 slice 2): one column per session this week, each as long as
// that session ran.
describe("sessionBounds", () => {
  const bounds = (date: string) => {
    const { openAt, closeAt } = sessionBounds(date);
    return [new Date(openAt).toISOString(), new Date(closeAt).toISOString()];
  };
  it("opens at 9:30 and closes at 4:00 New York time, either side of the clock change", () => {
    expect(bounds("2026-10-09")).toEqual(["2026-10-09T13:30:00.000Z", "2026-10-09T20:00:00.000Z"]);
    expect(bounds("2026-11-10")).toEqual(["2026-11-10T14:30:00.000Z", "2026-11-10T21:00:00.000Z"]);
  });
  it("closes at 1:00 PM on an early-close day", () => {
    expect(bounds("2026-11-27")[1]).toBe("2026-11-27T18:00:00.000Z");
  });
});

describe("sessionWeek", () => {
  const week = (iso: string) => sessionWeek(new Date(iso));
  it("is Monday to Friday of the week the instant falls in, on New York's calendar", () => {
    const days = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];
    expect(week("2026-10-07T15:00:00Z")).toEqual(days); // Wed 11:00 AM
    // Thu 11:30 PM in New York is already Friday in UTC — still the same week.
    expect(week("2026-10-09T03:30:00Z")).toEqual(days);
  });
  it("is the week just ended on a Saturday or a Sunday", () => {
    expect(week("2026-10-10T16:00:00Z")).toHaveLength(5);
    expect(week("2026-10-10T16:00:00Z")[0]).toBe("2026-10-05");
    expect(week("2026-10-11T16:00:00Z")[4]).toBe("2026-10-09");
  });
  it("leaves a full holiday out and keeps an early close", () => {
    expect(week("2026-11-25T15:00:00Z")).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-27",
    ]);
  });
});
