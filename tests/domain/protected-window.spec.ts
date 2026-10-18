import {
  type EarningsPrint,
  optionPrintBlackout,
  printSpan,
  UPCOMING_PRINTS,
} from "../../src/domain/earnings-calendar.js";
import { isSession } from "../../src/domain/market-calendar.js";
import { printProtectedWindow, protectedWindowOn } from "../../src/domain/protected-window.js";
import { SYMBOL_FACTS, type SymbolFacts } from "../../src/domain/symbol-facts.js";
import { outlookOf } from "../../src/research/symbol-outlook.js";

/**
 * The protected window (#4807 slice 5): one span per print, read by the summary's ■ Protected
 * strip, the S2 entry guard and the wheel. The last spec is the one that keeps them one thing: the
 * summary says protected on exactly the days the guard refuses.
 */

const print = (overrides: Partial<EarningsPrint> = {}): EarningsPrint => ({
  symbol: "ACME",
  date: "2026-10-28", // Wed
  status: "confirmed",
  source: "IR: newsroom",
  ...overrides,
});

const widened: SymbolFacts = {
  symbol: "ACME",
  printReaction: { sessionsAfter: 3, fact: "t", source: "t", falsifier: "t" },
};

const shiftDays = (date: string, days: number): string => {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
};

describe("printProtectedWindow", () => {
  it("runs from two calendar days before the print through the session after it", () => {
    expect(printProtectedWindow(print())).toMatchObject({
      start: "2026-10-26",
      end: "2026-10-29",
      sessionsAfter: 1,
    });
  });

  it("an estimate counts its whole researched window", () => {
    const est = print({
      status: "estimate",
      date: "2026-11-10",
      window: { start: "2026-11-09", end: "2026-11-16" },
    });
    expect(printProtectedWindow(est)).toMatchObject({ start: "2026-11-07", end: "2026-11-17" });
  });

  it("the tail skips weekends and holidays: a Friday print's session after is Monday", () => {
    expect(printProtectedWindow(print({ date: "2026-10-30" })).end).toBe("2026-11-02");
  });

  it("a facts file widens the tail, and can never narrow it below one session", () => {
    expect(printProtectedWindow(print(), widened).end).toBe("2026-11-02"); // Thu, Fri, Mon
    const narrow: SymbolFacts = {
      symbol: "ACME",
      printReaction: { sessionsAfter: 0, fact: "t", source: "t", falsifier: "t" },
    };
    expect(printProtectedWindow(print(), narrow).end).toBe("2026-10-29");
  });

  it("always covers the option print blackout it replaced (window + the session after)", () => {
    for (const p of UPCOMING_PRINTS) {
      const w = printProtectedWindow(p, SYMBOL_FACTS.get(p.symbol));
      const blackout = optionPrintBlackout(p.symbol, `${printSpan(p).start}T15:00:00Z`, [p]);
      expect(blackout).toBeDefined();
      expect(w.start <= (blackout?.start ?? "")).toBe(true);
      expect(w.end >= (blackout?.end ?? "")).toBe(true);
      expect(isSession(w.end)).toBe(true);
    }
  });
});

describe("protectedWindowOn", () => {
  const calendar = [print()];

  it("names the window on a protected day and nothing on an open one", () => {
    expect(protectedWindowOn("ACME", "2026-10-25T15:00:00Z", calendar)).toBeUndefined();
    expect(protectedWindowOn("ACME", "2026-10-26T15:00:00Z", calendar)?.print.date).toBe(
      "2026-10-28",
    );
    expect(protectedWindowOn("ACME", "2026-10-29T15:00:00Z", calendar)).toBeDefined();
    expect(protectedWindowOn("ACME", "2026-10-30T15:00:00Z", calendar)).toBeUndefined();
  });

  it("keys on the ET market day, not the UTC date", () => {
    // 21:30 ET on Oct 25 is already Oct 26 in UTC; the market day is still the 25th.
    expect(protectedWindowOn("ACME", "2026-10-26T01:30:00Z", calendar)).toBeUndefined();
  });

  it("reads only the symbol asked about", () => {
    expect(protectedWindowOn("OTHER", "2026-10-28T15:00:00Z", calendar)).toBeUndefined();
  });
});

describe("the summary and the guard agree", () => {
  it("■ Protected on today's strip exactly when protectedWindowOn says so, every day, every symbol", () => {
    const symbols = [...new Set(UPCOMING_PRINTS.map((p) => p.symbol))];
    for (const symbol of symbols) {
      const facts = SYMBOL_FACTS.get(symbol);
      for (let day = "2026-08-01"; day <= "2027-03-31"; day = shiftDays(day, 1)) {
        const now = `${day}T15:00:00Z`;
        const today = outlookOf({
          symbol,
          now,
          prints: UPCOMING_PRINTS,
          events: [],
          ...(facts ? { facts } : {}),
        }).windows[0];
        const guarded = protectedWindowOn(symbol, now, UPCOMING_PRINTS, facts) !== undefined;
        expect({ symbol, day, protected: today?.state === "protected" }).toEqual({
          symbol,
          day,
          protected: guarded,
        });
      }
    }
  });
});
