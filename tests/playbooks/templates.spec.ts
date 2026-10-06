import { type EarningsPrint, etTimeOf, recentPrint } from "../../src/domain/earnings-calendar.js";
import { TACO_TIMING, tacoWindow } from "../../src/news/taco-signal.js";
import {
  type Playbook,
  type PlaybookEvent,
  POST_PRINT_FLAT_DAYS,
  printSessionWindow,
  printWindow,
} from "../../src/playbooks/playbook.js";
import { G1_GOOG, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";
import { eventPlay, prePrintRunUp, prePrintState } from "../../src/playbooks/templates.js";

/**
 * THE REFERENCE: the hand-written `desiredState`s as they stood on main before #4469 slice 2b,
 * copied verbatim. The instances must make the same decision on every cell of the grid below
 * (criterion 7) — if one drifts, a live book would trade differently from the studied one.
 */
const mainS1 = (asOfIso: string, calendar: readonly EarningsPrint[]) => {
  if (recentPrint("NVDA", asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
    return "flat";
  }
  const w = printSessionWindow("NVDA", asOfIso, calendar);
  if (!w) {
    return "no-window";
  }
  if (w.sessions >= 6 && w.sessions <= 20) {
    return w.confirmed ? "long" : "no-window";
  }
  return w.sessions <= 5 ? "flat" : "no-window";
};

const mainG1 = (asOfIso: string, calendar: readonly EarningsPrint[]) => {
  if (recentPrint("GOOG", asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
    return "flat";
  }
  const w = printSessionWindow("GOOG", asOfIso, calendar);
  if (!w) {
    return "no-window";
  }
  if (w.sessions === 0) {
    return etTimeOf(asOfIso) >= "15:45" ? "flat" : w.confirmed ? "long" : "flat";
  }
  return w.sessions <= 20 && w.confirmed ? "long" : "no-window";
};

const mainTaco = (asOfIso: string, events: readonly PlaybookEvent[]) => {
  const own = events.filter((event) => event.symbol === "DJT");
  if (own.length === 0) {
    return "no-window";
  }
  const stillLive = own.some((event) => {
    const window = tacoWindow(event, asOfIso);
    return window === "enter" || window === "hold";
  });
  return stillLive ? "long" : "flat";
};

/** The authored play's pre-print state on main, calendar days. */
const mainAuthored = (
  symbol: string,
  enterDaysBefore: number,
  exitDaysBefore: number,
  asOfIso: string,
  calendar: readonly EarningsPrint[],
) => {
  if (recentPrint(symbol, asOfIso, POST_PRINT_FLAT_DAYS, calendar)) {
    return "flat";
  }
  const window = printWindow(symbol, asOfIso, calendar);
  if (!window) {
    return "no-window";
  }
  if (window.days > enterDaysBefore) {
    return "no-window";
  }
  if (window.days > exitDaysBefore) {
    return window.confirmed ? "long" : "no-window";
  }
  return "flat";
};

const DAY_MS = 86_400_000;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Every day from 45 days before a print to 6 after, at times that straddle GOOG's 15:45 ET cut. */
function gridAsOfs(printDate: string): string[] {
  const base = Date.parse(`${printDate}T00:00:00Z`);
  const times = ["13:00:00Z", "19:44:00Z", "19:45:00Z", "21:00:00Z"];
  const out: string[] = [];
  for (let offset = -45; offset <= 6; offset += 1) {
    for (const time of times) {
      out.push(`${isoDay(base + offset * DAY_MS)}T${time}`);
    }
  }
  return out;
}

// 2026-08-26 is a Wednesday; 2026-09-09 spans Labor Day (09-07), the weekend and a holiday inside
// one window; 2026-11-25 spans Thanksgiving.
const PRINT_DATES = ["2026-08-26", "2026-09-09", "2026-11-25"];
const STATUSES: EarningsPrint["status"][] = ["confirmed", "estimate"];

const calendars = (symbol: string): Array<{ label: string; calendar: EarningsPrint[] }> => [
  ...PRINT_DATES.flatMap((date) =>
    STATUSES.map((status) => ({
      label: `${symbol} ${date} ${status}`,
      calendar: [{ symbol, date, status, source: "test" }],
    })),
  ),
  {
    label: `${symbol} two prints`,
    calendar: [
      { symbol, date: "2026-08-26", status: "confirmed", source: "test" },
      { symbol, date: "2026-11-25", status: "estimate", source: "test" },
    ],
  },
  { label: "no print", calendar: [] },
  {
    label: "another symbol's print",
    calendar: [{ symbol: "AAPL", date: "2026-08-26", status: "confirmed", source: "test" }],
  },
];

describe("the pre-print run-up instances decide exactly as main's hand-written ones did", () => {
  it("S1-NVDA matches main on every cell of the grid", () => {
    let cells = 0;
    for (const { label, calendar } of calendars("NVDA")) {
      for (const asOf of PRINT_DATES.flatMap(gridAsOfs)) {
        expect(S1_NVDA.desiredState(asOf, calendar), `${label} @ ${asOf}`).toBe(
          mainS1(asOf, calendar),
        );
        cells += 1;
      }
    }
    expect(cells).toBeGreaterThan(1000);
  });

  it("G1-GOOG matches main on every cell of the grid, including each side of the 15:45 ET exit", () => {
    let cells = 0;
    for (const { label, calendar } of calendars("GOOG")) {
      for (const asOf of PRINT_DATES.flatMap(gridAsOfs)) {
        expect(G1_GOOG.desiredState(asOf, calendar), `${label} @ ${asOf}`).toBe(
          mainG1(asOf, calendar),
        );
        cells += 1;
      }
    }
    expect(cells).toBeGreaterThan(1000);
  });

  it("really exercises every decision the strategy can make", () => {
    const seen = (play: Playbook, symbol: string) => {
      const out = new Set<string>();
      for (const { calendar } of calendars(symbol)) {
        for (const asOf of PRINT_DATES.flatMap(gridAsOfs)) {
          out.add(play.desiredState(asOf, calendar));
        }
      }
      return [...out].sort();
    };
    expect(seen(S1_NVDA, "NVDA")).toEqual(["flat", "long", "no-window"]);
    expect(seen(G1_GOOG, "GOOG")).toEqual(["flat", "long", "no-window"]);
  });

  it("the member-authored window, now read through the same machine, matches main in calendar days", () => {
    for (const [enter, exit] of [
      [20, 5],
      [10, 0],
      [20, 1],
      [60, 30],
    ] as const) {
      const state = prePrintState("NVDA", {
        unit: "days",
        enter,
        exit: { kind: "before", count: exit },
      });
      for (const { label, calendar } of calendars("NVDA")) {
        for (const asOf of PRINT_DATES.flatMap(gridAsOfs)) {
          expect(state(asOf, calendar), `(${enter},${exit}) ${label} @ ${asOf}`).toBe(
            mainAuthored("NVDA", enter, exit, asOf, calendar),
          );
        }
      }
    }
  });
});

describe("the event instance decides exactly as main's TACO-DJT did", () => {
  const AT = "2026-08-28T14:00:00Z";
  const at = (minutes: number) => new Date(Date.parse(AT) + minutes * 60_000).toISOString();
  const eventSets: Array<{ label: string; events: PlaybookEvent[] }> = [
    { label: "none", events: [] },
    { label: "one DJT", events: [{ symbol: "DJT", detectedAt: AT }] },
    { label: "another symbol", events: [{ symbol: "AAPL", detectedAt: AT }] },
    { label: "future-dated", events: [{ symbol: "DJT", detectedAt: at(60) }] },
    { label: "unparseable", events: [{ symbol: "DJT", detectedAt: "not a date" }] },
    {
      label: "stale then fresh",
      events: [
        { symbol: "DJT", detectedAt: AT },
        { symbol: "DJT", detectedAt: at(80) },
      ],
    },
    {
      label: "mixed symbols",
      events: [
        { symbol: "AAPL", detectedAt: at(10) },
        { symbol: "DJT", detectedAt: at(-200) },
      ],
    },
  ];

  it("matches main at every minute around both timing boundaries", () => {
    const offsets = [-61, -1, 0, 1, 14, 15, 16, 45, 89, 90, 91, 100, 140, 200, 500];
    for (const { label, events } of eventSets) {
      for (const offset of offsets) {
        const now = at(offset);
        expect(TACO_DJT.desiredState(now, [], events), `${label} @ ${offset}m`).toBe(
          mainTaco(now, events),
        );
      }
    }
  });

  it("ignores the calendar entirely and treats omitted events as none", () => {
    expect(TACO_DJT.desiredState(AT, [])).toBe("no-window");
  });
});

describe("a template instance equals main's playbook field by field (criterion 7)", () => {
  const CHECKED = [
    "id",
    "symbols",
    "thesis",
    "evidence",
    "size",
    "keyedOn",
    "mixedSignals",
    "horizon",
    "options",
    "derivesFrom",
  ] as const;
  const pick = (play: Playbook) => Object.fromEntries(CHECKED.map((k) => [k, play[k]]));

  it("S1-NVDA", () => {
    expect(pick(S1_NVDA)).toEqual({
      id: "S1-NVDA",
      symbols: ["NVDA"],
      thesis: "pre-print positioning bid, exited before the dead final week",
      evidence:
        "docs/research/nvda-earnings-cycle.md F1-F2: +9.08% mean D-20→D-5 era, 14/14, P=0.004",
      size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
      keyedOn: "earnings",
      mixedSignals: { action: "observe" },
      horizon: undefined,
      options: undefined,
      derivesFrom: undefined,
    });
  });

  it("G1-GOOG", () => {
    expect(pick(G1_GOOG)).toEqual({
      id: "G1-GOOG",
      symbols: ["GOOG"],
      thesis: "pre-print run-up held to the close of print day, flat before the release",
      evidence:
        "docs/research/multi-symbol-sweep.md G1: pooled 37/43 positive, p=0.0008 at measured base; net-of-QQQ positive all eras",
      size: { conservative: 0.01, standard: 0.015, aggressive: 0.02 },
      keyedOn: "earnings",
      mixedSignals: undefined,
      horizon: undefined,
      options: undefined,
      derivesFrom: undefined,
    });
  });

  it("TACO-DJT", () => {
    expect(pick(TACO_DJT)).toEqual({
      id: "TACO-DJT",
      symbols: ["DJT"],
      thesis:
        `decisive entry within ${TACO_TIMING.entryMinutes}m of a Trump-linked pump story, ` +
        `decisive exit by ${TACO_TIMING.holdMinutes}m before the "no substance" reversion`,
      evidence: expect.stringContaining("unvalidated"),
      size: { conservative: 0.005, standard: 0.01, aggressive: 0.015 },
      keyedOn: "event",
      mixedSignals: undefined,
      horizon: undefined,
      options: undefined,
      derivesFrom: undefined,
    });
  });

  it("adds no field a template did not set, so nothing downstream sees a new key", () => {
    const keys = (play: Playbook) => Object.keys(play).sort();
    expect(keys(S1_NVDA)).toEqual([
      "desiredState",
      "evidence",
      "id",
      "keyedOn",
      "mixedSignals",
      "size",
      "symbols",
      "thesis",
    ]);
    expect(keys(G1_GOOG)).toEqual([
      "desiredState",
      "evidence",
      "id",
      "keyedOn",
      "size",
      "symbols",
      "thesis",
    ]);
    expect(keys(TACO_DJT)).toEqual(keys(G1_GOOG));
  });
});

describe("a template looks the id up and never builds one (criterion 8)", () => {
  const copy = {
    thesis: "t",
    evidence: "e",
    size: { conservative: 0.01, standard: 0.01, aggressive: 0.01 },
  };

  it("refuses a ticker with no pair-table row, naming what to add", () => {
    expect(() =>
      prePrintRunUp({
        ...copy,
        symbol: "AMZN",
        window: { unit: "sessions", enter: 20, exit: { kind: "before", count: 5 } },
      }),
    ).toThrow(/no pair-table row for pre-print-run-up × AMZN/);
    expect(() => eventPlay({ ...copy, symbol: "AMZN", holdMinutes: 90 })).toThrow(
      /no pair-table row for event × AMZN/,
    );
  });

  it("takes S1-NVDA's id from the table, not from the strategy and ticker", () => {
    expect(
      prePrintRunUp({
        ...copy,
        symbol: "nvda",
        window: { unit: "sessions", enter: 20, exit: { kind: "before", count: 5 } },
      }).id,
    ).toBe("S1-NVDA");
  });
});
