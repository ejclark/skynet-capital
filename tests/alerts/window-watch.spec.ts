import { alertFingerprint } from "../../src/alerts/alert.js";
import {
  WINDOW_WATCH_SOURCE,
  type WindowWatchInput,
  windowAlerts,
} from "../../src/alerts/window-watch.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { Pair } from "../../src/playbooks/pair-table.js";
import type { Playbook } from "../../src/playbooks/playbook.js";
import type { PairForecast } from "../../src/server/pair-forecast.js";

/**
 * Window watch (#5719): when a researched, earnings-keyed window is open on a name a member holds
 * or watches, one alert carries R&D's call, its confidence and what proves it wrong — and says so
 * when the print date the window keys on is only an estimate. Nothing else raises one.
 */

const NOW = Date.parse("2026-10-02T15:00:00Z");

/** S1-NVDA's shape, declared here so these specs pin the watch, not the house roster: long from
 *  D-20 to D-6 on a CONFIRMED print. */
const playbook = (over: Partial<Playbook> = {}): Playbook => ({
  id: "D1-TEST",
  symbols: ["TST"],
  thesis: "a pre-print positioning bid",
  evidence: "a spec",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  keyedOn: "earnings",
  desiredState(asOfIso, calendar) {
    const print = calendar.find((p) => p.symbol === "TST");
    if (!print || print.status !== "confirmed") return "no-window";
    const days = Math.round(
      (Date.parse(`${print.date}T00:00:00Z`) - Date.parse(`${asOfIso.slice(0, 10)}T00:00:00Z`)) /
        86_400_000,
    );
    return days >= 6 && days <= 20 ? "long" : "no-window";
  },
  ...over,
});

const pair = (over: Partial<Pair["evidence"]> = {}): Pair => ({
  id: "D1-TEST",
  strategy: "pre-print-run-up",
  symbols: ["TST"],
  evidence: {
    status: "researched",
    call: "Long from 20 sessions before a confirmed print to 6 before",
    confidence: "medium",
    ...over,
  },
});

const print = (status: EarningsPrint["status"], date = "2026-10-17"): EarningsPrint[] => [
  { symbol: "TST", date, status, source: "a spec" },
];

const FORECAST: PairForecast = {
  reportOn: "2026-10-17",
  dateSet: true,
  call: "Hold into D-6",
  confidence: "high",
  wrongIf: "TST closes below its D-20 price on D-10",
  href: "/research/events/tst-2026-10-17-print",
};

const input = (over: Partial<WindowWatchInput> = {}): WindowWatchInput => ({
  playbooks: [playbook()],
  held: new Set(["TST"]),
  watched: new Set(),
  forecast: () => FORECAST,
  calendar: print("confirmed"),
  pairOf: () => pair(),
  ...over,
});

describe("windowAlerts — a researched window open on a held or watched name", () => {
  it("raises one alert carrying the call, its confidence and what proves it wrong", () => {
    const alerts = windowAlerts(input(), NOW);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      source: WINDOW_WATCH_SOURCE,
      priority: "info",
      symbol: "TST",
      title: "The pre-print run-up window is open on TST",
      data: {
        playbookId: "D1-TEST",
        reportOn: "2026-10-17",
        dateSet: true,
        call: "Hold into D-6",
        confidence: "high",
        wrongIf: "TST closes below its D-20 price on D-10",
      },
    });
    expect(alerts[0]?.body).toBe(
      "You hold TST. R&D's call for the 2026-10-17 report: Hold into D-6 (confidence: high). " +
        "What proves it wrong: TST closes below its D-20 price on D-10. " +
        "A heads-up only: nothing is placed on your account.",
    );
  });

  it("raises it for a name on the watchlist, and says that is why", () => {
    const [alert] = windowAlerts(input({ held: new Set(), watched: new Set(["TST"]) }), NOW);
    expect(alert?.body).toMatch(/^TST is on your watchlist\./);
  });

  it("says so when the print date keying the window is an estimate", () => {
    const [alert] = windowAlerts(input({ calendar: print("estimate") }), NOW);
    expect(alert?.title).toBe(
      "The pre-print run-up window on TST is due, on an estimated report date",
    );
    expect(alert?.body).toContain(
      "The 2026-10-17 report date is an estimate the company has not confirmed. A playbook opens a position on a confirmed date only",
    );
    expect(alert?.data).toMatchObject({ dateSet: false });
  });

  it("says the date is an estimate when the window is open but counts from an estimated print", () => {
    // A rule that is open whatever the date's status (the wheel's shape), keyed on an estimate.
    const open = playbook({ desiredState: () => "long" });
    const [alert] = windowAlerts(input({ playbooks: [open], calendar: print("estimate") }), NOW);
    expect(alert?.title).toBe("The pre-print run-up window is open on TST");
    expect(alert?.body).toContain(
      "The 2026-10-17 report date this window counts from is an estimate the company has not confirmed",
    );
  });

  it("raises nothing while the window is closed", () => {
    expect(windowAlerts(input({ calendar: print("confirmed", "2026-11-30") }), NOW)).toEqual([]);
    expect(windowAlerts(input({ calendar: [] }), NOW)).toEqual([]);
  });

  it("raises nothing for a name the member neither holds nor watches", () => {
    expect(
      windowAlerts(input({ held: new Set(["AAPL"]), watched: new Set(["MSFT"]) }), NOW),
    ).toEqual([]);
  });

  it("raises nothing for a pair that is not researched, or a window no print date opens", () => {
    const conviction = pair({ status: "conviction" });
    expect(windowAlerts(input({ pairOf: () => conviction }), NOW)).toEqual([]);
    expect(windowAlerts(input({ pairOf: () => undefined }), NOW)).toEqual([]);
    expect(windowAlerts(input({ playbooks: [playbook({ keyedOn: undefined })] }), NOW)).toEqual([]);
  });

  it("stands the study's call in when no forecast call is on file, and says the falsifier is missing", () => {
    const [alert] = windowAlerts(input({ forecast: () => undefined }), NOW);
    expect(alert?.body).toContain(
      "No call for the 2026-10-17 report is on file yet. The study's call: Long from 20 sessions before a confirmed print to 6 before. Confidence: medium.",
    );
    expect(alert?.body).toContain(
      "No dated observation that would prove it wrong is on file for the 2026-10-17 report yet.",
    );
  });

  it("is the same alert read twice, and new news once the estimated date is confirmed", () => {
    const fingerprint = (calendar: EarningsPrint[]) =>
      windowAlerts(input({ calendar }), NOW).map(alertFingerprint);
    expect(fingerprint(print("estimate"))).toEqual(fingerprint(print("estimate")));
    expect(fingerprint(print("estimate"))).not.toEqual(fingerprint(print("confirmed")));
  });
});
