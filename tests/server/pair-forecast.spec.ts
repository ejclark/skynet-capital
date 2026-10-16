import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { forecastFor, withForecasts } from "../../src/server/pair-forecast.js";

/**
 * THIS REPORT beside PAST REPORTS (#5444, #5448). WHEN a single-ticker pair has a next earnings
 * report on file, its row SHALL carry R&D's headline call for that report — call, confidence and
 * the dated "wrong if" — read verbatim from the ledger; WHEN no ledger states a call, the row SHALL
 * carry the report date alone, so the app says "no call yet" instead of inventing one.
 */

const AS_OF = "2026-10-16T15:00:00.000Z";
const PRINTS: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-11-18", status: "estimate", source: "fixture" },
  { symbol: "GOOG", date: "2026-10-28", status: "confirmed", source: "fixture" },
];

const LEDGER = `# NVDA print

## At a glance

**TL;DR.** Fixture.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no print-keyed entry | High | The date is an \`estimate\` | NVIDIA's call notice posted **before 2026-10-21** |
| This week | **Watch** | Medium | why | NVDA closes ≥ **$251** |

## Initial research
`;

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "pair-forecast-"));
  mkdirSync(join(root, "events"));
  writeFileSync(join(root, "events", "nvda-2026-11-18-print.md"), LEDGER);
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("forecastFor", () => {
  it("reads the next report's headline call, its confidence and its falsifier, as words", () => {
    expect(forecastFor("NVDA", AS_OF, root, PRINTS)).toEqual({
      reportOn: "2026-11-18",
      dateSet: false,
      call: "Stand aside",
      confidence: "high",
      wrongIf: "NVIDIA's call notice posted before 2026-10-21",
      href: "/research/events/nvda-2026-11-18-print",
    });
  });

  it("carries the report date alone when no ledger states a call — never an invented one", () => {
    expect(forecastFor("GOOG", AS_OF, root, PRINTS)).toEqual({
      reportOn: "2026-10-28",
      dateSet: true,
    });
  });

  it("has nothing to say for a ticker with no report on file", () => {
    expect(forecastFor("DJT", AS_OF, root, PRINTS)).toBeUndefined();
  });
});

describe("withForecasts", () => {
  it("adds the forecast to single-ticker rows only, leaving a basket as it was", () => {
    const [card] = withForecasts(
      [{ pairs: [{ symbols: ["NVDA"] }, { symbols: ["NVDA", "GOOG"] }, { symbols: [] }] }],
      AS_OF,
      root,
    );
    const [one, basket, none] = card?.pairs ?? [];
    // The real calendar: NVDA has a report on file after the fixture's day.
    expect(one).toHaveProperty("forecast.reportOn");
    expect(basket).toEqual({ symbols: ["NVDA", "GOOG"] });
    expect(none).toEqual({ symbols: [] });
  });
});
