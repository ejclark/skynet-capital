import {
  type EarningsPrint,
  nextPrintRisk,
  optionPrintBlackout,
  UPCOMING_PRINTS,
} from "../../src/domain/earnings-calendar.js";

// The days an option must not be open across: a print's whole window plus the session after it,
// because a print after the close moves the stock on the next session.
describe("optionPrintBlackout", () => {
  const crwv: EarningsPrint = {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-09", end: "2026-11-16" },
  };
  const confirmed: EarningsPrint = {
    symbol: "NVDA",
    date: "2026-11-18",
    status: "confirmed",
    source: "IR: test",
  };

  it("runs from an estimate's window start through the session after its window end", () => {
    expect(optionPrintBlackout("CRWV", "2026-10-07T15:00:00Z", [crwv])).toEqual({
      start: "2026-11-09",
      end: "2026-11-17",
      print: crwv,
    });
  });

  it("a confirmed print blacks out its day and the next session (a Wednesday print → Thursday)", () => {
    expect(optionPrintBlackout("NVDA", "2026-10-21T15:00:00Z", [confirmed])).toMatchObject({
      start: "2026-11-18",
      end: "2026-11-19",
    });
  });

  it("is still live on the session after — where nextPrintRisk has already let the print go", () => {
    const sessionAfter = "2026-11-17T15:00:00Z";
    expect(nextPrintRisk("CRWV", sessionAfter, [crwv])).toBeUndefined();
    expect(optionPrintBlackout("CRWV", sessionAfter, [crwv])?.end).toBe("2026-11-17");
    expect(optionPrintBlackout("CRWV", "2026-11-18T15:00:00Z", [crwv])).toBeUndefined();
  });

  it("reads today as the ET market day, not the UTC date", () => {
    // 22:00 ET on 11-17 is already 11-18 in UTC.
    expect(optionPrintBlackout("CRWV", "2026-11-18T03:00:00Z", [crwv])?.end).toBe("2026-11-17");
  });

  it("picks the earliest live blackout of several rows, and none for a symbol with no print on file", () => {
    const later: EarningsPrint = { ...crwv, date: "2027-03-02", window: undefined };
    expect(optionPrintBlackout("CRWV", "2026-10-07T15:00:00Z", [later, crwv])?.start).toBe(
      "2026-11-09",
    );
    expect(optionPrintBlackout("CRWV", "2026-11-20T15:00:00Z", [later, crwv])?.start).toBe(
      "2027-03-02",
    );
    expect(optionPrintBlackout("ZZZZ", "2026-10-07T15:00:00Z", [crwv])).toBeUndefined();
  });

  it("defaults to the house calendar: CRWV's checked-in window blacks out 11-09 through 11-17", () => {
    expect(UPCOMING_PRINTS.some((p) => p.symbol === "CRWV")).toBe(true);
    expect(optionPrintBlackout("CRWV", "2026-10-07T15:00:00Z")).toMatchObject({
      start: "2026-11-09",
      end: "2026-11-17",
    });
  });
});
