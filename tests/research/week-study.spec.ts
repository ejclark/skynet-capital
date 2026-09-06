import type { WeekEntry } from "../../src/research/week-study.js";
import {
  composeWeekStudy,
  confidenceMix,
  isoWeekLabel,
  marketWeekOf,
  rangeOfIsoWeek,
  weekHasClosed,
  weekHubs,
} from "../../src/research/week-study.js";
import type { HorizonRow } from "../../src/server/research-event-calls.js";

/**
 * The weekly study genre (#1716). The invariant under test is not "does it render" — it is that the
 * document can only ever say what a cited ledger already said. Every assertion here is either about
 * a quote surviving intact or about an absence being stated rather than filled in.
 */

const row = (over: Partial<HorizonRow> = {}): HorizonRow => ({
  call: "Stand aside",
  horizon: "This week",
  confidence: "High",
  why: "the **9/11** print owns the week",
  provesWrong: "VIX above 18 by 2026-09-10",
  ...over,
});

const entry = (over: Partial<WeekEntry> = {}): WeekEntry => ({
  id: "cpi-2026-09-11",
  title: "CPI release",
  date: "2026-09-11",
  impact: "high",
  symbols: [],
  row: row(),
  adjacent: [],
  ...over,
});

const RANGE = rangeOfIsoWeek("2026-W37");

const compose = (entries: readonly WeekEntry[], trackedNames: readonly string[] = ["NVDA"]) =>
  composeWeekStudy({
    range: RANGE,
    entries,
    trackedNames,
    ledgerIds: new Set(entries.map((e) => e.id)),
    composedOn: "2026-09-06",
  });

describe("ISO week arithmetic", () => {
  it("labels a date with the ISO week its Thursday falls in", () => {
    expect(isoWeekLabel("2026-09-07")).toBe("2026-W37");
    expect(isoWeekLabel("2026-09-13")).toBe("2026-W37");
    expect(isoWeekLabel("2026-09-14")).toBe("2026-W38");
  });

  it("resolves an ISO week label back to its Monday and Sunday", () => {
    expect(rangeOfIsoWeek("2026-W37")).toEqual({
      isoWeek: "2026-W37",
      start: "2026-09-07",
      end: "2026-09-13",
    });
  });

  it("round-trips every week of a year — the label and the range agree", () => {
    for (let week = 1; week <= 52; week++) {
      const label = `2026-W${String(week).padStart(2, "0")}`;
      expect(isoWeekLabel(rangeOfIsoWeek(label).start)).toBe(label);
    }
  });

  it("rejects a malformed week label rather than guessing a range", () => {
    expect(() => rangeOfIsoWeek("2026-37")).toThrow(/ISO week label/);
  });

  it("resolves a SUNDAY forward — the market week beginning, not the ISO week ending", () => {
    // 2026-09-06 is a Sunday: ISO week 36 is ending, market week 37 is what the cadence is for.
    expect(isoWeekLabel("2026-09-06")).toBe("2026-W36");
    expect(marketWeekOf("2026-09-06").isoWeek).toBe("2026-W37");
    expect(marketWeekOf("2026-09-09").isoWeek).toBe("2026-W37");
  });

  it("knows when a week has closed — the append-only guard's input", () => {
    expect(weekHasClosed(RANGE, "2026-09-13")).toBe(false);
    expect(weekHasClosed(RANGE, "2026-09-14")).toBe(true);
  });
});

describe("aggregation — counted, never generated", () => {
  it("counts authored confidence grades and nothing else", () => {
    const mix = confidenceMix([
      entry({ row: row({ confidence: "High" }) }),
      entry({ row: row({ confidence: "**High**" }) }),
      entry({ row: row({ confidence: "Medium" }) }),
      entry({ row: row({ confidence: undefined }) }),
      entry({ row: null }),
    ]);
    expect(mix.get("high")).toBe(2);
    expect(mix.get("medium")).toBe(1);
    expect(mix.get("ungraded")).toBe(2);
  });

  it("counts hub degrees once per ledger, however often a ledger repeats an id", () => {
    const hubs = weekHubs([
      entry({ id: "a", adjacent: ["fomc", "fomc", "cpi"] }),
      entry({ id: "b", adjacent: ["fomc"] }),
    ]);
    expect(hubs).toEqual([
      { id: "fomc", count: 2 },
      { id: "cpi", count: 1 },
    ]);
  });
});

describe("composing the study", () => {
  it("quotes a name's call, confidence, why and falsifier verbatim, and cites the ledger", () => {
    const md = compose(
      [
        entry({
          id: "nvda-2026-09-09-print",
          symbols: ["NVDA"],
          row: row({ call: "Flat by D-1", why: "implied ~7% vs ~2.8% realized" }),
        }),
      ],
      ["NVDA"],
    );
    expect(md).toContain("Flat by D-1");
    expect(md).toContain("implied ~7% vs ~2.8% realized");
    expect(md).toContain("VIX above 18 by 2026-09-10");
    expect(md).toContain("[`nvda-2026-09-09-print`](../events/nvda-2026-09-09-print.md)");
  });

  it("keeps a ledger's own emphasis in a quoted cell — stripping it would be an edit", () => {
    const md = compose([entry({ symbols: ["NVDA"], row: row({ why: "**23** tracked events" }) })]);
    expect(md).toContain("**23** tracked events");
  });

  it("states absence for a name with no ledger in range instead of inferring a call", () => {
    const md = compose([entry()], ["NVDA"]);
    expect(md).toContain("| **NVDA** | No researched event this week | none |");
    expect(md).not.toContain("| **NVDA** | Stand aside");
  });

  it("lists names with a call in range before the absences, alphabetical inside each group", () => {
    const md = compose(
      [entry({ id: "zeta-print", symbols: ["ZETA"], row: row({ call: "Flat by D-1" }) })],
      ["ABC", "ZETA", "MNO"],
    );
    const names = [...md.matchAll(/^\| \*\*([A-Z]+)\*\* \|/gm)].map((m) => m[1]);
    expect(names).toEqual(["ZETA", "ABC", "MNO"]);
  });

  it("keeps a market-wide event off every name's row and on the board", () => {
    const md = compose([entry({ symbols: [] })], ["NVDA"]);
    expect(md).toContain("No researched event this week");
    expect(md.split("## The week's board")[1]).toContain("cpi-2026-09-11");
  });

  it("names a hub with no ledger rather than linking to a page that would 404", () => {
    const md = compose([entry({ adjacent: ["fomc-2026-09-16"] })]);
    expect(md).toContain("`fomc-2026-09-16` (no ledger yet)");
    expect(md).not.toContain("(../events/fomc-2026-09-16.md)");
  });

  it("says so when a ledger authored no `This week` row, rather than borrowing another horizon", () => {
    const md = compose([entry({ row: null })]);
    expect(md).toContain("_no `This week` row authored_");
  });

  it("emits the header lines and decision heading the research gate requires", () => {
    const md = compose([entry()]);
    expect(md).toMatch(/^# The market week of 2026-09-07 — 2026-W37$/m);
    expect(md).toMatch(/^\*\*Kind:\*\* weekly-study/m);
    expect(md).toMatch(/^\*\*Last assessed:\*\* 2026-09-06$/m);
    expect(md).toContain("## The call — what to do, by name");
    expect(md).toContain("**TL;DR.**");
    expect(md).toContain("**Signals & conditions**");
  });
});
