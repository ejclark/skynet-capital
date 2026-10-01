import { cycleOfExpiration, expirationCycleOf } from "../../src/trading/expiration-cycle.js";

/**
 * #3665 slice 5 — "cycle type" is the OCC listing cycle a contract expired on. The dates asserted
 * here are not invented for the test: they are the same expirations this repo's own opex research
 * ledgers already graded as SUPPORTED against the exchange convention (`docs/research/events/
 * opex-2026-09-18.md`, `-2026-10-16.md`, `-2026-12-18.md`, `-2027-03-19.md`), so a drift in this
 * classifier shows up as a disagreement with a dated primary-source read, not just a red test.
 *
 * Falsifier for the whole module: any expiration date that this repo's opex ledgers grade as a
 * monthly or a witching but `cycleOfExpiration` calls a weekly.
 */
describe("cycleOfExpiration", () => {
  it("reads the third Friday of an ordinary month as the standard monthly", () => {
    expect(cycleOfExpiration("2026-10-16")).toBe("monthly");
    expect(cycleOfExpiration("2026-11-20")).toBe("monthly");
  });

  it("reads the third Friday of a quarter-ending month as the quarterly witching", () => {
    expect(cycleOfExpiration("2026-09-18")).toBe("quarterly");
    expect(cycleOfExpiration("2026-12-18")).toBe("quarterly");
    expect(cycleOfExpiration("2027-03-19")).toBe("quarterly");
  });

  it("reads every other expiration date as a weekly", () => {
    // Fridays of the same month that are not the third one.
    expect(cycleOfExpiration("2026-10-09")).toBe("weekly");
    expect(cycleOfExpiration("2026-10-23")).toBe("weekly");
    // A mid-week expiration, as index products list.
    expect(cycleOfExpiration("2026-10-14")).toBe("weekly");
  });

  it("follows the standard monthly back to Thursday when the third Friday is a full closure", () => {
    const shut = (date: string): boolean => date === "2026-10-16";
    expect(cycleOfExpiration("2026-10-15", shut)).toBe("monthly");
    // The shift applies only to the day immediately before, never two days back.
    expect(cycleOfExpiration("2026-10-14", shut)).toBe("weekly");
  });

  it("leaves the shifted date a weekly when the third Friday is a normal session", () => {
    expect(cycleOfExpiration("2026-10-15")).toBe("weekly");
  });

  it("calls an unparseable date a weekly rather than throwing on it", () => {
    expect(cycleOfExpiration("not-a-date")).toBe("weekly");
  });
});

describe("expirationCycleOf", () => {
  it("classifies a contract from its OCC symbol", () => {
    expect(expirationCycleOf("MSFT260918P00420000")).toBe("quarterly");
    expect(expirationCycleOf("NVDA261016C00120000")).toBe("monthly");
    expect(expirationCycleOf("NVDA261009C00120000")).toBe("weekly");
  });

  it("returns undefined for a share of stock — it has no expiration cycle to report", () => {
    expect(expirationCycleOf("AAPL")).toBeUndefined();
  });
});
