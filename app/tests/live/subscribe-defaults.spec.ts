import { DEFAULT_CAPITAL, defaultCheckOn, initialCapital } from "../../src/live/subscribe-defaults";

describe("a new subscription's defaults", () => {
  it("starts a new subscription at $50,000 and an edit at its own budget", () => {
    expect(DEFAULT_CAPITAL).toBe(50_000);
    expect(initialCapital()).toBe("50000");
    expect(initialCapital({ capitalAllocated: 75_000 })).toBe("75000");
    expect(initialCapital({})).toBe("");
  });

  it("checks a conviction about a quarter out", () => {
    // 2026-10-16 + 91 days = Fri 2027-01-15.
    expect(defaultCheckOn(new Date("2026-10-16T15:00:00Z"))).toBe("2027-01-15");
  });

  it("skips a weekend and an exchange holiday to the next session", () => {
    // 2026-10-17 + 91 = Sat 2027-01-16; Mon 01-18 is MLK Day, so Tue 01-19.
    expect(defaultCheckOn(new Date("2026-10-17T15:00:00Z"))).toBe("2027-01-19");
    expect(defaultCheckOn(new Date("2026-10-18T15:00:00Z"))).toBe("2027-01-19");
  });
});
