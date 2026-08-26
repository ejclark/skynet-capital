import {
  daysUntil,
  type EarningsPrint,
  nextPrint,
  PRINT_WINDOWS,
  printWithin,
  UPCOMING_PRINTS,
} from "../../src/domain/earnings-calendar.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { applyGuards } from "../../src/engine/guards.js";
import { S1_NVDA } from "../../src/playbooks/registry.js";
import { aContext, aPortfolio } from "../support/builders.js";

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

  /**
   * PRINT_WINDOWS is read by displays (the chain's earnings badge) but MIRRORS literals still
   * living inside envelope-protected trading code. These pins are what make the copy safe: each
   * asserts the constant against the behaviour it claims, so a guard retuned without updating
   * this table — or a table retuned to flatter a badge — goes red instead of drifting quietly.
   */
  describe("PRINT_WINDOWS pins the display to the discipline", () => {
    const D = "2026-08-26";
    // 15:00 UTC = 11:00 ET in August — past E1's open window, so only S2 is under test.
    const daysBeforeD = (n: number): string =>
      new Date(Date.parse(`${D}T15:00:00.000Z`) - n * 86_400_000).toISOString();
    const daysAfterD = (n: number): string => daysBeforeD(-n);
    const buy: OrderIntent = {
      symbol: "EEM",
      side: "buy",
      quantity: 10,
      type: "market",
      reason: "pin",
    };
    const guardCalendar: readonly EarningsPrint[] = [
      { symbol: "EEM", date: D, status: "estimate", source: "test" },
    ];
    const nvdaCalendar: readonly EarningsPrint[] = [
      { symbol: "NVDA", date: D, status: "confirmed", source: "IR: test" },
    ];
    // No printFlatDays override — the guard falls back to its own default, which is the number
    // `entryFlatDays` claims to be.
    const config = { maxPositionPct: 0.2, discipline: { calendar: guardCalendar } };
    const guardAt = (asOf: string): readonly OrderIntent[] =>
      applyGuards(
        [buy],
        aPortfolio({ cash: 10_000 }),
        aContext({ EEM: { last: 100 } }, asOf),
        config,
      );

    it("entryFlatDays is exactly where the S2 entry guard starts refusing buys", () => {
      expect(guardAt(daysBeforeD(PRINT_WINDOWS.entryFlatDays))).toEqual([]);
      expect(guardAt(daysBeforeD(PRINT_WINDOWS.entryFlatDays + 1))).toHaveLength(1);
    });

    it("postPrintFlatDays is exactly how long a playbook stays flat after a print", () => {
      const after = (n: number) => S1_NVDA.desiredState(daysAfterD(n), nvdaCalendar);
      expect(after(PRINT_WINDOWS.postPrintFlatDays)).toBe("flat");
      expect(after(PRINT_WINDOWS.postPrintFlatDays + 1)).not.toBe("flat");
    });

    it("deadZoneDays is exactly where S1's pre-print bid gives up and goes flat", () => {
      const before = (n: number) => S1_NVDA.desiredState(daysBeforeD(n), nvdaCalendar);
      expect(before(PRINT_WINDOWS.deadZoneDays)).toBe("flat");
      expect(before(PRINT_WINDOWS.deadZoneDays + 1)).toBe("long");
    });
  });

  describe("the seeded table", () => {
    it("every entry is well-formed, and confirmed status always cites an IR source", () => {
      expect(UPCOMING_PRINTS.length).toBeGreaterThan(0);
      for (const p of UPCOMING_PRINTS) {
        expect(["confirmed", "estimate"]).toContain(p.status);
        expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (p.status === "confirmed") {
          // The date policy's teeth: a confirmed flip must cite how (hand-verified IR, or an
          // automated CAL cross-reference) — see earnings-calendar.ts's header for the classes.
          expect(p.source).toMatch(/^(IR|CAL):/);
        }
      }
    });
  });
});
