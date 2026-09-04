import { localSessionSuffix, marketIsOpen } from "../../src/live/market-hours";

// The client's market clock (handoff 2026-09-03) — the regular session, in ET, weekdays.
describe("marketIsOpen", () => {
  it("is open mid-session on a weekday", () => {
    expect(marketIsOpen(new Date("2026-09-03T15:00:00Z"))).toBe(true); // 11:00 ET, Thursday
  });
  it("is closed before the open, after the close, and all weekend", () => {
    expect(marketIsOpen(new Date("2026-09-03T13:00:00Z"))).toBe(false); // 9:00 ET
    expect(marketIsOpen(new Date("2026-09-03T20:30:00Z"))).toBe(false); // 16:30 ET
    expect(marketIsOpen(new Date("2026-09-05T15:00:00Z"))).toBe(false); // Saturday
  });
});

describe("localSessionSuffix", () => {
  it("says nothing to an Eastern viewer", () => {
    expect(localSessionSuffix(new Date("2026-09-03T15:00:00Z"), "America/New_York")).toBe("");
  });
  it("gives a Pacific viewer the session in their own zone", () => {
    expect(localSessionSuffix(new Date("2026-09-03T15:00:00Z"), "America/Los_Angeles")).toBe(
      " (6:30 AM–1:00 PM PDT)",
    );
  });
});
