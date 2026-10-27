import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  type Announcement,
  cadenceFills,
  confirmCandidates,
  fetchEarningsDate,
  parseReportText,
  refreshExitCode,
  rewriteCalendar,
  runConfirm,
} from "../../src/research/print-date-refresh.js";

/**
 * #4479 — the earnings calendar has to stay current on its own, or armed S1-NVDA and G1-GOOG
 * never open a window (both enter only on a `confirmed` print). These pin the refresh's rules:
 * a dead source fails loudly (so does an error inside a 200, and an unchecked playbook symbol), a
 * stalled fetch gives up, an algorithmic guess never confirms, a moved date moves the estimate and
 * is reported as needing IR, every company date not confirmed is said out loud, a past estimate is
 * not re-checked, a confirmation touches only its own row, and a playbook symbol with nothing ahead
 * gets its next print estimated from cadence.
 */

const est = (symbol: string, date: string, extra: Partial<EarningsPrint> = {}): EarningsPrint => ({
  symbol,
  date,
  status: "estimate",
  source: "spec fixture",
  ...extra,
});

const noSleep = async (): Promise<void> => undefined;
const quiet = (): void => undefined;

// Nasdaq's two wordings, as api.nasdaq.com/api/analyst/<SYM>/earnings-date answered 2026-10-19.
const EXPECTED = (date: string): string =>
  `Alphabet Inc. Class C Capital Stock is expected* to report earnings on  ${date} after market close.  The report will be for the fiscal Quarter ending Sep 2026.`;
const ESTIMATED = (date: string): string =>
  `NVIDIA Corporation Common Stock is estimated to report earnings on  ${date}. The upcoming earnings date is derived from an algorithm based on a company's historical reporting dates.`;

const answering =
  (texts: Record<string, string>) =>
  async (symbol: string): Promise<Announcement> =>
    parseReportText(texts[symbol] ?? "");

describe("parseReportText", () => {
  it("reads the expected* wording as the company's date, with its release time", () => {
    expect(parseReportText(EXPECTED("10/28/2026"))).toEqual({
      ok: true,
      date: "2026-10-28",
      confirmed: true,
      time: "after market close",
    });
  });

  it("never reads Zacks' algorithmic estimate as confirmed — the NVDA Nov 18 false positive", () => {
    expect(parseReportText(ESTIMATED("11/18/2026"))).toEqual({
      ok: true,
      date: "2026-11-18",
      confirmed: false,
    });
  });

  it("reads Nasdaq's no-date wording as not announced", () => {
    expect(
      parseReportText(
        "Our vendor, Zacks Investment Research, hasn't provided us with the upcoming earnings report date.",
      ),
    ).toEqual({ ok: true, confirmed: false });
  });

  it("reads empty or unknown wording as a failure, never as not announced", () => {
    expect(parseReportText("")).toEqual({ ok: false, confirmed: false });
    expect(parseReportText("Earnings will be released in due course.")).toEqual({
      ok: false,
      confirmed: false,
    });
  });
});

describe("runConfirm", () => {
  it("reports the source unreachable when every fetch fails, and that run exits non-zero", async () => {
    const result = await runConfirm(
      [est("GOOG", "2026-10-28"), est("AAPL", "2026-10-29")],
      "2026-10-19",
      async () => ({ ok: false, confirmed: false }),
    );

    expect(result.outcome).toBe("unreachable");
    expect(result.attempts).toBe(2);
    expect(refreshExitCode(result)).not.toBe(0);
  });

  it("names a symbol it could not check, and a playbook symbol unchecked is not a clean pass", async () => {
    const result = await runConfirm(
      [est("GOOG", "2026-10-28"), est("AAPL", "2026-10-29")],
      "2026-10-19",
      async (symbol) =>
        symbol === "GOOG"
          ? { ok: false, confirmed: false }
          : parseReportText(ESTIMATED("10/29/2026")),
    );

    expect(result.outcome).toBe("none");
    expect(result.failed).toEqual(["GOOG"]);
    expect(refreshExitCode(result, ["NVDA", "GOOG"])).toBe(3);
    expect(refreshExitCode(result, ["NVDA"])).toBe(0);
  });

  it("confirms an estimate the source calls the company's date, citing the CAL: source and time", async () => {
    const result = await runConfirm(
      [est("GOOG", "2026-10-28")],
      "2026-10-19",
      answering({ GOOG: EXPECTED("10/28/2026") }),
    );

    expect(result.outcome).toBe("found");
    expect(refreshExitCode(result)).toBe(0);
    expect(result.updates).toEqual([
      {
        from: est("GOOG", "2026-10-28"),
        to: {
          symbol: "GOOG",
          date: "2026-10-28",
          status: "confirmed",
          source:
            'CAL: Nasdaq earnings date (api.nasdaq.com/api/analyst/GOOG/earnings-date) says "expected", Zacks\' confirmed-date wording, checked 2026-10-19 — after market close',
        },
      },
    ]);
  });

  it("leaves an algorithmic estimate an estimate, however close the print", async () => {
    const result = await runConfirm(
      [est("NVDA", "2026-11-18")],
      "2026-10-19",
      answering({ NVDA: ESTIMATED("11/18/2026") }),
    );

    expect(result.outcome).toBe("none");
    expect(result.updates).toEqual([]);
  });

  it("moves an estimate to the company's date, keeping both days guarded and its ledger id, and says it needs IR", async () => {
    const result = await runConfirm(
      [est("AAPL", "2026-10-29")],
      "2026-10-19",
      answering({ AAPL: EXPECTED("11/02/2026") }),
    );

    const moved: EarningsPrint = {
      symbol: "AAPL",
      date: "2026-11-02",
      status: "estimate",
      source:
        "spec fixture · CAL: Nasdaq calls 2026-11-02 the company's date (checked 2026-10-19) — a move off 2026-10-29, so held as an estimate until an IR read",
      window: { start: "2026-10-29", end: "2026-11-02" },
      ledgerId: "aapl-2026-10-29-print",
    };
    expect(result.updates).toEqual([{ from: est("AAPL", "2026-10-29"), to: moved }]);
    expect(result.needsIr).toEqual([
      { print: est("AAPL", "2026-10-29"), said: "2026-11-02", why: "moved" },
    ]);
    expect(result.outcome).toBe("needs-ir");
    expect(refreshExitCode(result)).toBe(0);
  });

  it("moves a date that lands inside the estimate's window too — NVDA to the 25th is never dropped", async () => {
    const nvda = est("NVDA", "2026-11-18", { window: { start: "2026-11-17", end: "2026-11-25" } });
    const result = await runConfirm(
      [nvda],
      "2026-10-27",
      answering({ NVDA: EXPECTED("11/25/2026") }),
    );

    expect(result.updates[0]?.to).toMatchObject({
      date: "2026-11-25",
      status: "estimate",
      window: { start: "2026-11-17", end: "2026-11-25" },
      ledgerId: "nvda-2026-11-18-print",
    });
    expect(result.needsIr.map((n) => n.why)).toEqual(["moved"]);
  });

  it("holds a moved estimate for IR when a later run finds the same day, and reports it every time", async () => {
    const moved = est("AAPL", "2026-11-02", {
      source:
        "8-K cadence · CAL: Nasdaq calls 2026-11-02 the company's date (checked 2026-10-19) — a move off 2026-10-29, so held as an estimate until an IR read",
      window: { start: "2026-10-29", end: "2026-11-02" },
      ledgerId: "aapl-2026-10-29-print",
    });
    const result = await runConfirm(
      [moved],
      "2026-10-20",
      answering({ AAPL: EXPECTED("11/02/2026") }),
    );

    expect(result.updates).toEqual([]);
    expect(result.needsIr).toEqual([{ print: moved, said: "2026-11-02", why: "held" }]);
    expect(result.outcome).toBe("needs-ir");
  });

  it("keeps a row's ledgerId through a confirmation", async () => {
    const result = await runConfirm(
      [est("MSFT", "2026-10-28", { ledgerId: "msft-2026-10-27-print" })],
      "2026-10-19",
      answering({ MSFT: EXPECTED("10/28/2026") }),
    );

    expect(result.updates[0]?.to).toMatchObject({
      status: "confirmed",
      ledgerId: "msft-2026-10-27-print",
    });
  });

  it("does not pin a confirmed date from another quarter onto this estimate, but says so", async () => {
    const result = await runConfirm(
      [est("NVDA", "2026-11-18")],
      "2026-10-19",
      answering({ NVDA: EXPECTED("02/24/2027") }),
    );

    expect(result.updates).toEqual([]);
    expect(result.needsIr).toEqual([
      { print: est("NVDA", "2026-11-18"), said: "2027-02-24", why: "far" },
    ]);
    expect(result.outcome).toBe("needs-ir");
  });
});

describe("confirmCandidates", () => {
  it("checks only estimates still ahead and inside the lookahead — never a past one", () => {
    const prints: EarningsPrint[] = [
      est("AVGO", "2026-09-02"),
      est("GOOG", "2026-10-28"),
      est("NVDA", "2027-02-24"),
      { ...est("MSFT", "2026-10-28"), status: "confirmed" },
    ];

    expect(confirmCandidates(prints, "2026-10-19").map((p) => p.symbol)).toEqual(["GOOG"]);
  });
});

describe("fetchEarningsDate", () => {
  it("gives up on a fetch that never answers instead of hanging the run", async () => {
    const stalled = (_url: string, init?: RequestInit): Promise<Response> =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });

    const said = await fetchEarningsDate("GOOG", {
      fetch: stalled,
      sleep: noSleep,
      timeoutMs: 5,
      log: quiet,
    });

    expect(said).toEqual({ ok: false, confirmed: false });
  });

  it("reads the answer's reportText", async () => {
    const said = await fetchEarningsDate("GOOG", {
      fetch: async () => Response.json({ data: { reportText: EXPECTED("10/28/2026") } }),
      sleep: noSleep,
      log: quiet,
    });

    expect(said).toMatchObject({ ok: true, date: "2026-10-28", confirmed: true });
  });

  it("reads Nasdaq's error-inside-a-200 as a failure, not an answer", async () => {
    // api.nasdaq.com/api/analyst/ZZZZQ/earnings-date, as it answered 2026-10-19
    const errorShaped = {
      data: null,
      message: null,
      status: {
        rCode: 400,
        bCodeMessage: [{ code: 1001, errorMessage: "Symbol not exists." }],
        developerMessage: null,
      },
    };
    const said = await fetchEarningsDate("ZZZZQ", {
      fetch: async () => Response.json(errorShaped),
      sleep: noSleep,
      log: quiet,
    });

    expect(said).toEqual({ ok: false, confirmed: false });
    const run = await runConfirm([est("GOOG", "2026-10-28")], "2026-10-19", async () => said);
    expect(run.outcome).toBe("unreachable");
    expect(refreshExitCode(run)).toBe(2);
  });
});

describe("cadenceFills", () => {
  it("estimates the next print 13 weeks on for a playbook symbol with nothing in the next 100 days", () => {
    const fills = cadenceFills([est("GOOG", "2026-10-28")], ["GOOG"], "2026-11-02");

    expect(fills).toEqual([
      {
        symbol: "GOOG",
        date: "2027-01-27",
        status: "estimate",
        source:
          "EST: auto cadence — 13 weeks after the 2026-10-28 print (confirm-print-dates, 2026-11-02); unconfirmed",
        window: { start: "2027-01-20", end: "2027-02-10" },
      },
    ]);
  });

  it("adds nothing while a print is already on file inside the lookahead", () => {
    expect(cadenceFills([est("NVDA", "2026-11-18")], ["NVDA"], "2026-10-19")).toEqual([]);
  });

  it("steps forward past today when the table has gone stale by more than a quarter", () => {
    const [fill] = cadenceFills([est("GOOG", "2026-04-29")], ["GOOG"], "2026-11-02");
    expect(fill?.date).toBe("2027-01-27");
  });
});

describe("rewriteCalendar", () => {
  const file = [
    "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [",
    '  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "IR: a" },',
    "  {",
    "    // Q3 FY27 — a comment the rewrite must keep.",
    '    symbol: "NVDA",',
    '    date: "2026-11-18",',
    '    status: "estimate",',
    '    source: "EST: b",',
    '    window: { start: "2026-11-17", end: "2026-11-25" },',
    "  },",
    '  { symbol: "GOOG", date: "2026-10-28", status: "estimate", source: "8-K cadence" },',
    "];",
    "",
    "export const after = 1;",
    "",
  ].join("\n");

  it("replaces only the confirmed row — not every row that shares its symbol — and keeps its comment", () => {
    const out = rewriteCalendar(
      file,
      [
        {
          from: est("NVDA", "2026-11-18"),
          to: { symbol: "NVDA", date: "2026-11-18", status: "confirmed", source: "CAL: c" },
        },
      ],
      [],
    );

    expect(out).toContain(
      '{ symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "IR: a" }',
    );
    expect(out).toContain(
      [
        "  {",
        "    // Q3 FY27 — a comment the rewrite must keep.",
        '    symbol: "NVDA",',
        '    date: "2026-11-18",',
        '    status: "confirmed",',
        '    source: "CAL: c",',
        "  },",
      ].join("\n"),
    );
    expect(out).toContain(
      '{ symbol: "GOOG", date: "2026-10-28", status: "estimate", source: "8-K cadence" }',
    );
    expect(out).toContain("export const after = 1;");
  });

  it("appends a cadence fill as a new row with its window, leaving the rest untouched", () => {
    const fill = est("GOOG", "2027-01-27", {
      source: "EST: auto",
      window: { start: "2027-01-20", end: "2027-02-10" },
    });

    const out = rewriteCalendar(file, [], [fill]);

    expect(out).toBe(
      file.replace(
        "\n];",
        [
          "",
          "  {",
          '    symbol: "GOOG",',
          '    date: "2027-01-27",',
          '    status: "estimate",',
          '    source: "EST: auto",',
          '    window: { start: "2027-01-20", end: "2027-02-10" },',
          "  },",
          "];",
        ].join("\n"),
      ),
    );
  });

  it("writes a row's ledgerId back, so a print and its ledger keep finding each other", () => {
    const out = rewriteCalendar(
      file,
      [
        {
          from: est("GOOG", "2026-10-28"),
          to: {
            symbol: "GOOG",
            date: "2026-10-27",
            status: "confirmed",
            source: "CAL: d",
            ledgerId: "goog-2026-10-28-print",
          },
        },
      ],
      [],
    );

    expect(out).toContain('ledgerId: "goog-2026-10-28-print"');
  });
});
