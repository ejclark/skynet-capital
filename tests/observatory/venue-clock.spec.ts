import {
  type VenueStatus,
  venueBoard,
  WEEK_HOURS,
  weekSharePct,
} from "../../src/observatory/venue-clock.js";

const at = (iso: string): readonly VenueStatus[] => venueBoard(new Date(iso));
const equities = (iso: string): VenueStatus =>
  at(iso).find((v) => v.key === "us-equities") as VenueStatus;

describe("venue clock", () => {
  it("puts crypto first and always open, with no asterisk on the claim", () => {
    const board = at("2026-08-22T18:00:00Z");
    expect(board[0]?.key).toBe("crypto");
    expect(board[0]?.open).toBe(true);
    expect(board[0]?.certainty).toBe("certain");
    expect(board[0]?.hoursPerWeek).toBe(WEEK_HOURS);
  });

  it("calls a weekday session open, but only as SCHEDULED — a holiday could still close it", () => {
    const wed = equities("2026-08-26T14:00:00Z"); // Wed 10:00 ET
    expect(wed.open).toBe(true);
    expect(wed.certainty).toBe("scheduled");
    expect(wed.detail).toContain("holiday");
  });

  it("asserts CLOSED flatly, because no calendar makes 3am a session", () => {
    const sat = equities("2026-08-22T18:00:00Z"); // Sat 14:00 ET
    expect(sat.open).toBe(false);
    expect(sat.certainty).toBe("certain");
    expect(sat.detail).toContain("Mon 09:30 ET");
  });

  it("names the next scheduled open — later today before the bell, tomorrow after it", () => {
    expect(equities("2026-08-26T12:00:00Z").detail).toContain("Wed 09:30 ET"); // 08:00 ET
    expect(equities("2026-08-26T21:30:00Z").detail).toContain("Thu 09:30 ET"); // 17:30 ET
    expect(equities("2026-08-28T20:30:00Z").detail).toContain("Mon 09:30 ET"); // Fri 16:30 ET
  });

  it("tracks ET across the DST boundary rather than a fixed UTC offset", () => {
    expect(equities("2026-01-14T15:00:00Z").open).toBe(true); // Wed 10:00 EST
    expect(equities("2026-08-26T14:00:00Z").open).toBe(true); // Wed 10:00 EDT
  });

  it("measures the gap as a share of the week", () => {
    const board = at("2026-08-26T14:00:00Z");
    expect(weekSharePct(board[0] as VenueStatus)).toBe(100);
    expect(weekSharePct(equities("2026-08-26T14:00:00Z"))).toBeCloseTo(19.35, 2);
  });
});
