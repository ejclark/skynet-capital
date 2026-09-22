import {
  FISCAL_YEAR_ENDS,
  fiscalQuarterFor,
  fiscalYearEndFor,
} from "../../src/domain/fiscal-calendar.js";

describe("fiscal calendar", () => {
  describe("fiscalYearEndFor", () => {
    it("finds NVDA's fiscal year-end on the seeded table", () => {
      expect(fiscalYearEndFor("NVDA")?.fiscalYearEndMonth).toBe(1);
    });

    it("returns undefined for a symbol with no fiscal record — the honest fallback", () => {
      expect(fiscalYearEndFor("MSFT")).toBeUndefined();
    });

    it("every seeded entry cites how it was confirmed", () => {
      for (const entry of FISCAL_YEAR_ENDS) {
        expect(entry.source).toMatch(/^IR:/);
      }
    });
  });

  describe("fiscalQuarterFor — NVDA's fiscal year ends in January (month 1)", () => {
    it("issue #1736's own worked case: August 2026 is Q3 FY27, Aug–Oct 2026", () => {
      expect(fiscalQuarterFor(2026, 8, 1)).toEqual({
        fiscalYear: 2027,
        quarter: 3,
        startMonth: 8,
        startYear: 2026,
        endMonth: 10,
        endYear: 2026,
      });
    });

    it("Q1 FY27 is Feb–Apr 2026", () => {
      expect(fiscalQuarterFor(2026, 2, 1)).toEqual({
        fiscalYear: 2027,
        quarter: 1,
        startMonth: 2,
        startYear: 2026,
        endMonth: 4,
        endYear: 2026,
      });
    });

    it("Q4 FY27 spans a calendar-year boundary: Nov 2026–Jan 2027", () => {
      expect(fiscalQuarterFor(2026, 11, 1)).toEqual({
        fiscalYear: 2027,
        quarter: 4,
        startMonth: 11,
        startYear: 2026,
        endMonth: 1,
        endYear: 2027,
      });
      // The fiscal year-end month itself (January) still reads as Q4 of the FY that just closed.
      expect(fiscalQuarterFor(2027, 1, 1)).toEqual({
        fiscalYear: 2027,
        quarter: 4,
        startMonth: 11,
        startYear: 2026,
        endMonth: 1,
        endYear: 2027,
      });
    });

    it("a December fiscal year-end (a calendar-year company) matches the calendar quarter", () => {
      expect(fiscalQuarterFor(2026, 9, 12)).toEqual({
        fiscalYear: 2026,
        quarter: 3,
        startMonth: 7,
        startYear: 2026,
        endMonth: 9,
        endYear: 2026,
      });
    });
  });
});
