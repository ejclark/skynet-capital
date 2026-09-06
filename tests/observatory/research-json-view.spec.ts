import { researchShelfJson } from "../../src/observatory/research-json-view.js";
import type { EventCall } from "../../src/server/research-event-calls.js";

/** The shelf's JSON twin: calls verbatim with their receipts, symbols with their next dates,
 *  docs as links only — the shell never re-renders prose. */

const doc = (slug: string, title: string, lastAssessed: string | null = null) => ({
  slug,
  title,
  lastAssessed,
});

describe("researchShelfJson", () => {
  it("leads with the calls exactly as authored, each linking to its ledger", () => {
    const calls = new Map<string, EventCall>([
      [
        "nvda-2026-08-26-print",
        { call: "hold through the print", horizon: "Today", confidence: "high" },
      ],
    ]);
    const view = researchShelfJson({ studies: [], ledgers: [] }, [], calls);
    expect(view.calls[0]).toEqual({
      eventId: "nvda-2026-08-26-print",
      call: "hold through the print",
      horizon: "Today",
      confidence: "high",
      href: "/research/events/nvda-2026-08-26-print",
    });
  });

  it("carries every horizon row the ledger states, so the shell can read the board by lens", () => {
    const today: EventCall = { call: "Stand aside", horizon: "Today", confidence: "High" };
    const view = researchShelfJson(
      { studies: [], ledgers: [] },
      [],
      new Map([["boj-2026-09-18", today]]),
      [],
      new Map([
        [
          "boj-2026-09-18",
          {
            horizons: {
              today,
              week: { call: "Watch CPI", horizon: "This week", confidence: "Medium" },
            },
            tldr: "Stand aside; the week's fork is CPI.",
            adjacent: ["cpi-2026-09-11"],
          },
        ],
      ]),
    );
    expect(view.calls[0]?.horizons?.week).toEqual({
      call: "Watch CPI",
      horizon: "This week",
      confidence: "Medium",
    });
    expect(view.calls[0]?.tldr).toBe("Stand aside; the week's fork is CPI.");
    expect(view.calls[0]?.adjacent).toEqual(["cpi-2026-09-11"]);
    // A payload without horizons carries no key at all — older readers see the old shape.
    expect(
      researchShelfJson({ studies: [], ledgers: [] }, [], new Map([["x", today]])).calls[0],
    ).not.toHaveProperty("horizons");
  });

  it("carries the exchange closures it is handed, and an empty list when handed none", () => {
    const laborDay = { date: "2026-09-07", reason: "Labor Day", early: false };
    const view = researchShelfJson({ studies: [], ledgers: [] }, [], new Map(), [], new Map(), [
      laborDay,
    ]);
    expect(view.closures).toEqual([laborDay]);
    expect(researchShelfJson({ studies: [], ledgers: [] }, [], new Map()).closures).toEqual([]);
  });

  it("carries each symbol's next dated event, or its honest absence", () => {
    const view = researchShelfJson(
      { studies: [], ledgers: [] },
      [
        { symbol: "NVDA", next: { title: "Q2 print", date: "2026-09-02" } as never },
        { symbol: "AMD" },
      ],
      new Map(),
    );
    expect(view.symbols[0]?.next).toEqual({ title: "Q2 print", date: "2026-09-02" });
    expect(view.symbols[1]?.next).toBeUndefined();
    expect(view.symbols[1]?.href).toBe("/research/symbol/AMD");
  });

  it("links docs to their server-rendered pages with the assessment stamp intact", () => {
    const view = researchShelfJson(
      {
        studies: [doc("multi-symbol-sweep", "The sweep")],
        ledgers: [doc("events/nvda-2026-08-26-print", "NVDA print", "2026-08-27")],
      },
      [],
      new Map(),
    );
    expect(view.studies[0]?.href).toBe("/research/multi-symbol-sweep");
    expect(view.ledgers[0]?.lastAssessed).toBe("2026-08-27");
  });
});
