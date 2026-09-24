import { regularSessionOpen } from "../../src/domain/market-session.js";

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
