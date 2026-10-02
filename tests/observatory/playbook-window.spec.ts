import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  NEXT_ENTRY_HORIZON_DAYS,
  readPlaybookWindow,
} from "../../src/observatory/playbook-window.js";
import type { Playbook } from "../../src/playbooks/playbook.js";

const NOW = new Date("2026-10-02T15:00:00Z");

/** A date-keyed playbook with S1-NVDA's window shape: long from D-20 to D-6 on a CONFIRMED print.
 *  Declared here rather than imported so these specs pin the window read, not the house roster. */
const dated = (overrides: Partial<Playbook> = {}): Playbook => ({
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
  ...overrides,
});

const confirmed = (date: string): EarningsPrint[] => [
  { symbol: "TST", date, status: "confirmed", source: "IR: a spec" },
];
const estimated = (date: string): EarningsPrint[] => [
  { symbol: "TST", date, status: "estimate", source: "cadence" },
];

describe("readPlaybookWindow — what an armed playbook is actually waiting for", () => {
  it("names the day the playbook's own rule would next open, by asking the playbook", () => {
    // D-20 off a print 30 days out is 10 days from now — never re-derived here.
    const read = readPlaybookWindow(dated(), "no-window", NOW, confirmed("2026-11-01"));
    expect(read).toEqual({
      nextEntry: "2026-10-12",
      reason: "On and waiting for its own window to open.",
    });
  });

  /** The reason this exists: on the day it was written the house calendar held no confirmed NVDA
   *  print, so a single shared "it trades when its condition holds" would have read as reassurance
   *  while S1-NVDA could not open a window at all. */
  it("blames the calendar, specifically, when a date-keyed playbook has no window ahead", () => {
    expect(readPlaybookWindow(dated(), "no-window", NOW, [])).toEqual({
      nextEntry: null,
      reason: "On, but no print date is on the calendar for TST, so no window can open yet.",
    });
    expect(readPlaybookWindow(dated(), "no-window", NOW, estimated("2026-11-01")).reason).toBe(
      "On, but the next print date for TST (2026-11-01) is an estimate — only a confirmed date opens a position.",
    );
  });

  it("never blames the calendar for a playbook that did not say the calendar opens its window", () => {
    const read = readPlaybookWindow(dated({ keyedOn: undefined }), "no-window", NOW, []);
    expect(read.reason).toContain(`next ${NEXT_ENTRY_HORIZON_DAYS}`);
    expect(read.reason).not.toContain("print date");
  });

  it("stays quiet about the calendar for a basket where only some symbols are dated", () => {
    // Naming only TST's estimate would leave the undated symbol out of a sentence claiming to be
    // the whole cause.
    const basket = dated({ symbols: ["TST", "OTR"] });
    const read = readPlaybookWindow(basket, "no-window", NOW, estimated("2026-11-01"));
    expect(read.reason).toContain(`next ${NEXT_ENTRY_HORIZON_DAYS}`);
    expect(read.reason).not.toContain("estimate");
  });

  it("says what an open and a closed window mean in words, not in a state name", () => {
    expect(readPlaybookWindow(dated(), "long", NOW, confirmed("2026-10-16")).reason).toBe(
      "On, and its window is open — it wants to hold TST.",
    );
    expect(readPlaybookWindow(dated(), "flat", NOW, confirmed("2026-10-16")).reason).toBe(
      "On, and its window has closed — it wants out of TST.",
    );
  });

  /** A playbook whose window is open would scan to today, so the line would read "its window is
   *  open" above "next window: today" — a readout contradicting itself. */
  it("offers a next window only to a playbook that is actually between windows", () => {
    const inWindow = confirmed("2026-10-16"); // D-14 today: the rule says long
    for (const state of ["long", "flat", "tactical"] as const) {
      expect(readPlaybookWindow(dated(), state, NOW, inWindow).nextEntry).toBe(null);
    }
    expect(readPlaybookWindow(dated(), "no-window", NOW, confirmed("2026-11-01")).nextEntry).toBe(
      "2026-10-12",
    );
  });

  /** TACO-DJT's wiring gap is scheduled to be deleted by the slice that wires its news feed, and
   *  the line underneath must not then claim a horizon nothing looked at. */
  it("never tells a playbook whose window no date can predict that it has no day ahead", () => {
    const read = readPlaybookWindow(dated({ keyedOn: "event" }), "no-window", NOW, []);
    expect(read.nextEntry).toBe(null);
    expect(read.reason).toBe(
      "On, watching for the signal its rule opens on — there is no date to wait for.",
    );
    expect(read.reason).not.toContain(`${NEXT_ENTRY_HORIZON_DAYS}`);
  });

  it("does not try to date a rule-chain playbook's window — it has none to date", () => {
    const read = readPlaybookWindow(
      dated({ tactics: [] }),
      "tactical",
      NOW,
      confirmed("2026-11-01"),
    );
    expect(read.nextEntry).toBe(null);
    expect(read.reason).toContain("reading live price and sentiment every pass");
  });
});

describe("readPlaybookWindow — against the live house roster", () => {
  it("reports the two date-keyed house plays' real standing today", async () => {
    const { S1_NVDA, G1_GOOG } = await import("../../src/playbooks/registry.js");
    const now = new Date();
    for (const play of [S1_NVDA, G1_GOOG]) {
      const read = readPlaybookWindow(play, "no-window", now);
      // Either there IS a window ahead (a confirmed print is on the calendar) or the reason says
      // which of the two calendar causes is holding it — never the bare "it trades when its
      // condition holds" that this module exists to replace.
      expect(read.nextEntry !== null || /print date/.test(read.reason)).toBe(true);
    }
  });
});
