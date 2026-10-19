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
    // Inside the dead zone the estimate is still the whole cause, but no window would open on any
    // day ahead even once confirmed, so there is no day to promise.
    expect(readPlaybookWindow(dated(), "no-window", NOW, estimated("2026-10-05")).reason).toBe(
      "On, but the next print date for TST (2026-10-05) is an estimate — only a confirmed date opens a position.",
    );
  });

  /** #4479 slice 2 (EARS 4): an estimate the playbook's window would already be open on is not
   *  "waiting for its window" — the window is due, and only the company's date is missing. Asked of
   *  the playbook itself, with the estimate read as confirmed, never by a fixed day count. */
  it("says a playbook is held by an unconfirmed date when its window would be open now", () => {
    expect(readPlaybookWindow(dated(), "no-window", NOW, estimated("2026-10-17"))).toEqual({
      nextEntry: null,
      unconfirmed: [{ symbol: "TST", date: "2026-10-17" }],
      reason:
        "On, but TST's 2026-10-17 print is still an estimate — its window would be open now if that date were confirmed, and only a confirmed date opens a position.",
    });
  });

  it("says when the window would open once an estimate further out is confirmed", () => {
    const read = readPlaybookWindow(dated(), "no-window", NOW, estimated("2026-11-01"));
    expect(read).toEqual({
      nextEntry: null,
      reason:
        "On, but TST's 2026-11-01 print is still an estimate — once it is confirmed, its window would open 2026-10-12.",
    });
  });

  /** Why the read asks the playbook rather than drawing a "within 25 days" line: S1-NVDA counts
   *  its D-20 in TRADING SESSIONS (#4776), so its window is due about four weeks of calendar out —
   *  a 25-calendar-day line would call it "waiting" for its first days of being held. */
  it("holds S1-NVDA on an estimate 27 calendar days out — its window counts sessions", async () => {
    const { S1_NVDA } = await import("../../src/playbooks/registry.js");
    const nvda: EarningsPrint[] = [
      { symbol: "NVDA", date: "2026-10-29", status: "estimate", source: "cadence" },
    ];
    expect(readPlaybookWindow(S1_NVDA, "no-window", NOW, nvda).unconfirmed).toEqual([
      { symbol: "NVDA", date: "2026-10-29" },
    ]);
    // The same date confirmed is an open window — the estimate is the only thing in the way.
    const open = nvda.map((p) => ({ ...p, status: "confirmed" as const }));
    expect(S1_NVDA.desiredState(`2026-10-02T18:30:00Z`, open, [])).toBe("long");
  });

  /** "Open now" is a claim about now, so it is asked at now. At 9:30 PM ET on Oct 20 the UTC date
   *  is already Oct 21 — S1-NVDA's D-20 off the Nov 18 estimate — but in New York the window opens
   *  tomorrow, and the read must say so rather than "open now". */
  it("does not call a window open now when it opens on tomorrow's New York session", async () => {
    const { S1_NVDA } = await import("../../src/playbooks/registry.js");
    const nvda: EarningsPrint[] = [
      { symbol: "NVDA", date: "2026-11-18", status: "estimate", source: "cadence" },
    ];
    const evening = readPlaybookWindow(
      S1_NVDA,
      "no-window",
      new Date("2026-10-21T01:30:00Z"),
      nvda,
    );
    expect(evening.unconfirmed).toBeUndefined();
    expect(evening.reason).toBe(
      "On, but NVDA's 2026-11-18 print is still an estimate — once it is confirmed, its window would open 2026-10-21.",
    );
    // The next afternoon, New York's Oct 21, it is held.
    const next = readPlaybookWindow(S1_NVDA, "no-window", new Date("2026-10-21T20:00:00Z"), nvda);
    expect(next.unconfirmed).toEqual([{ symbol: "NVDA", date: "2026-11-18" }]);
  });

  /** A print-day rule that goes flat from 15:45 ET is not open at 4 PM, even though the scan's
   *  mid-session clock would find it long earlier that day. */
  it("does not call a print-day window open now after its cutoff", async () => {
    const { etTimeOf } = await import("../../src/domain/earnings-calendar.js");
    const printDay = dated({
      desiredState(asOfIso, calendar) {
        const print = calendar.find((p) => p.symbol === "TST");
        if (!print || print.status !== "confirmed") return "no-window";
        if (asOfIso.slice(0, 10) !== print.date) return "no-window";
        return etTimeOf(asOfIso) >= "15:45" ? "flat" : "long";
      },
    });
    const at = (iso: string) =>
      readPlaybookWindow(printDay, "no-window", new Date(iso), estimated("2026-10-28"));
    expect(at("2026-10-28T18:30:00Z").unconfirmed).toEqual([{ symbol: "TST", date: "2026-10-28" }]);
    const late = at("2026-10-28T20:00:00Z"); // 4:00 PM New York
    expect(late.unconfirmed).toBeUndefined();
    expect(late.reason).not.toContain("open now");
    expect(late.reason).not.toContain("would open 2026-10-28");
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

  it("does not try to date a live-signals playbook's window — it has none to date", () => {
    const read = readPlaybookWindow(
      dated({ rulesOf: "another-persona" }),
      "tactical",
      NOW,
      confirmed("2026-11-01"),
    );
    expect(read.nextEntry).toBe(null);
    expect(read.reason).toContain("reading live price and sentiment every pass");
  });

  /** SAURON (#4651) has no window either: whatever verdict reaches this read, no date is scanned
   *  for a persona's own rules — its `desiredState` exists only to satisfy the type. */
  it("never dates a window for a persona's own rules, whatever verdict arrives", () => {
    const read = readPlaybookWindow(
      dated({ rulesOf: "sauron" }),
      "no-window",
      NOW,
      confirmed("2026-11-01"),
    );
    expect(read.nextEntry).toBe(null);
    expect(read.reason).not.toContain(`${NEXT_ENTRY_HORIZON_DAYS}`);
  });
});

describe("the live house roster declares what opens each window", () => {
  /** The registry half of this read: the calendar diagnosis is only said for a playbook that
   *  declares the calendar opens its window, so a date-keyed house play that forgets `keyedOn`
   *  silently falls back to the generic horizon sentence. Asserted against the declarations rather
   *  than against today's calendar: a routine print-date refresh (the documented unlock for
   *  date-keyed entries) must never be able to turn this spec red. */
  it("keys S1-NVDA and G1-GOOG on earnings, and TACO-DJT on an event", async () => {
    const { S1_NVDA, G1_GOOG, TACO_DJT } = await import("../../src/playbooks/registry.js");
    expect([S1_NVDA.keyedOn, G1_GOOG.keyedOn]).toEqual(["earnings", "earnings"]);
    expect(TACO_DJT.keyedOn).toBe("event");
  });
});
