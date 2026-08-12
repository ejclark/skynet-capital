import {
  daysUntil,
  type EarningsPrint,
  nextPrint,
  printWithin,
  UPCOMING_PRINTS,
} from "../../src/domain/earnings-calendar.js";

const prints: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "estimate", source: "test" },
  { symbol: "NVDA", date: "2026-11-25", status: "estimate", source: "test" },
  { symbol: "MSFT", date: "2026-10-27", status: "confirmed", source: "test" },
];

describe("earnings calendar", () => {
  describe("daysUntil", () => {
    it("counts whole calendar days from the asOf date", () => {
      expect(daysUntil("2026-08-24T14:30:00Z", "2026-08-26")).toBe(2);
    });

    it("is negative for a past date — how stale entries age out", () => {
      expect(daysUntil("2026-08-27T00:00:00Z", "2026-08-26")).toBe(-1);
    });
  });

  describe("nextPrint", () => {
    it("returns the SOONEST upcoming print, not just any", () => {
      expect(nextPrint("NVDA", "2026-08-01T00:00:00Z", prints)?.date).toBe("2026-08-26");
    });

    it("skips past prints — a stale table entry cannot trigger anything", () => {
      expect(nextPrint("NVDA", "2026-09-01T00:00:00Z", prints)?.date).toBe("2026-11-25");
    });

    it("counts the print DAY itself as upcoming — the release is after the close", () => {
      expect(nextPrint("NVDA", "2026-08-26T14:00:00Z", prints)?.date).toBe("2026-08-26");
    });

    it("returns undefined for a symbol with no scheduled print", () => {
      expect(nextPrint("XYZ", "2026-08-01T00:00:00Z", prints)).toBeUndefined();
    });
  });

  describe("printWithin — the S2 question", () => {
    it("finds a print inside the window", () => {
      expect(printWithin("NVDA", "2026-08-25T14:00:00Z", 2, prints)?.date).toBe("2026-08-26");
    });

    it("ignores a print beyond the window", () => {
      expect(printWithin("NVDA", "2026-08-20T14:00:00Z", 2, prints)).toBeUndefined();
    });

    it("counts an estimate — estimates widen safety windows, per the date policy", () => {
      const hit = printWithin("NVDA", "2026-08-25T14:00:00Z", 2, prints);
      expect(hit?.status).toBe("estimate");
    });
  });

  describe("the seeded table", () => {
    it("every entry is well-formed, and confirmed status always cites an IR source", () => {
      expect(UPCOMING_PRINTS.length).toBeGreaterThan(0);
      for (const p of UPCOMING_PRINTS) {
        expect(["confirmed", "estimate"]).toContain(p.status);
        expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (p.status === "confirmed") {
          // The date policy's teeth: a confirmed flip must carry its IR provenance.
          expect(p.source).toMatch(/^IR:/);
        }
      }
    });
  });
});
