import { collapseToFiscalPrints } from "../../scripts/research/market-data.mjs";

/**
 * #3183 — earningsDates() de-duplicated Item 2.02 filings by CALENDAR quarter
 * (`year, floor(month/3)`), which silently drops one print a year for any issuer whose fiscal Q4
 * lands in January (its January print and the following fiscal-Q1 print in March both fall in
 * calendar Q1 and collide on the same key). collapseToFiscalPrints() is the fixed collapse step,
 * grouped by day-gap against EDGAR's own reportDate instead.
 *
 * Fixtures below are `{filingDate, reportDate}` pairs taken verbatim from
 * data.sec.gov/submissions/CIK<cik>.json Item 2.02 8-K rows, fetched 2026-09-20:
 *   - KBH (CIK 0000795266, fiscal year end 1130 — a January-Q4 filer through FY2024)
 *   - LEN (CIK 0000920760, fiscal year end 1130 — a December-Q4 filer)
 *   - NVDA (CIK 0001045810, calendar-year filer)
 */

const hit = (filingDate: string, reportDate = filingDate) => ({ filingDate, reportDate });

describe("collapseToFiscalPrints", () => {
  it("recovers every fiscal print for a January-Q4 filer (KBH, 2023+)", () => {
    // The complete 2023+ EDGAR record: 15 Item 2.02 filings, one per fiscal quarter. The old
    // calendar-quarter key silently dropped 2023-03-22, 2024-03-20 and 2025-03-24 (each collides
    // with that year's January fiscal-Q4 print in calendar Q1).
    const hits = [
      hit("2023-01-11"),
      hit("2023-03-22"),
      hit("2023-06-21"),
      hit("2023-09-20"),
      hit("2024-01-10"),
      hit("2024-03-20"),
      hit("2024-06-18"),
      hit("2024-09-24"),
      hit("2025-01-13"),
      hit("2025-03-24"),
      hit("2025-06-23"),
      hit("2025-09-24"),
      hit("2025-12-18"),
      hit("2026-03-24"),
      hit("2026-06-23"),
    ];
    const { dates, discarded } = collapseToFiscalPrints(hits);
    expect(dates).toEqual(hits.map((h) => h.filingDate));
    expect(discarded).toEqual([]);
  });

  it("returns exactly 14 unchanged dates for a December-Q4 filer (LEN, 2023+)", () => {
    // LEN shares KBH's fiscal year end but prints Q4 in December, so it never collides under
    // the old calendar-quarter key either — the fix must be a no-op here.
    const hits = [
      hit("2023-03-14"),
      hit("2023-06-14"),
      hit("2023-09-14"),
      hit("2023-12-14"),
      hit("2024-03-13"),
      hit("2024-06-17"),
      hit("2024-09-19"),
      hit("2024-12-18"),
      hit("2025-03-20"),
      hit("2025-06-17", "2025-06-16"),
      hit("2025-09-19", "2025-09-18"),
      hit("2025-12-16"),
      hit("2026-03-12"),
      hit("2026-06-11"),
    ];
    const { dates, discarded } = collapseToFiscalPrints(hits);
    expect(dates).toHaveLength(14);
    expect(dates).toEqual(hits.map((h) => h.filingDate));
    expect(discarded).toEqual([]);
  });

  it("is behavior-preserving for a calendar-year filer (NVDA)", () => {
    // NVDA's four quarterly prints a year, ~90 days apart, plus one genuine same-quarter
    // re-issue (2022-08-08 guidance, re-filed 2022-08-24) that must still collapse to the first.
    const hits = [
      hit("2022-02-16"),
      hit("2022-05-25"),
      hit("2022-08-08"),
      hit("2022-08-24"),
      hit("2022-11-16"),
      hit("2023-02-22"),
    ];
    const { dates, discarded } = collapseToFiscalPrints(hits);
    expect(dates).toEqual(["2022-02-16", "2022-05-25", "2022-08-08", "2022-11-16", "2023-02-22"]);
    expect(discarded.map((d) => d.filingDate)).toEqual(["2022-08-24"]);
  });

  it("still collapses a genuine same-period re-issue (a guidance update days later)", () => {
    const hits = [hit("2024-05-01"), hit("2024-05-15"), hit("2024-08-01")];
    const { dates, discarded } = collapseToFiscalPrints(hits);
    expect(dates).toEqual(["2024-05-01", "2024-08-01"]);
    expect(discarded.map((d) => d.filingDate)).toEqual(["2024-05-15"]);
  });

  it("keeps two filings in the same calendar quarter when they're genuinely different fiscal periods", () => {
    // The exact January/March KBH-shaped collision, isolated: >45 days apart, must not collapse.
    const hits = [hit("2025-01-13"), hit("2025-03-24")];
    const { dates, discarded } = collapseToFiscalPrints(hits);
    expect(dates).toEqual(["2025-01-13", "2025-03-24"]);
    expect(discarded).toEqual([]);
  });

  it("falls back to filingDate when reportDate is missing", () => {
    const hits = [
      { filingDate: "2024-01-10", reportDate: undefined },
      { filingDate: "2024-01-20", reportDate: undefined },
      { filingDate: "2024-04-10", reportDate: undefined },
    ];
    const { dates, discarded } = collapseToFiscalPrints(hits);
    expect(dates).toEqual(["2024-01-10", "2024-04-10"]);
    expect(discarded.map((d) => d.filingDate)).toEqual(["2024-01-20"]);
  });
});
