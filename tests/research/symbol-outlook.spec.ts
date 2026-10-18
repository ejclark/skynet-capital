import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type EarningsPrint,
  nextPrintRisk,
  printSpan,
  UPCOMING_PRINTS,
} from "../../src/domain/earnings-calendar.js";
import { nextSession } from "../../src/domain/market-calendar.js";
import type { MarketEvent } from "../../src/domain/market-events-types.js";
import { loadSymbolFacts, type SymbolFacts } from "../../src/domain/symbol-facts.js";
import {
  OUTLOOK_HORIZON_DAYS,
  type OutlookInput,
  type OutlookWindow,
  outlookOf,
  symbolOutlook,
  WINDOW_STATES,
} from "../../src/research/symbol-outlook.js";

/** The symbol summary (#4807 slice 1): the call, its until-date and the dated windows, as data. */

const CALLS = ["buy", "hold", "trim", "sell", "wait"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const print = (overrides: Partial<EarningsPrint> = {}): EarningsPrint => ({
  symbol: "ACME",
  date: "2026-10-28",
  status: "confirmed",
  source: "IR: newsroom",
  ...overrides,
});

const event = (overrides: Partial<MarketEvent> & { id: string; date: string }): MarketEvent => ({
  kind: "product-launch" as MarketEvent["kind"],
  title: `Event ${overrides.id}`,
  status: "confirmed",
  source: "IR: newsroom",
  impact: "high",
  symbols: ["ACME"],
  ...overrides,
});

const ledgerMd = (buySignal: "yes" | "no") => `# ACME earnings print
**Last assessed:** 2026-09-30

## At a glance

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-27) | **Stand aside** · S2 | Medium | the **print** is the risk | ACME confirms a date before 2026-10-15 |

**Signals & conditions**

- **Buy signal:** ${buySignal} — the trigger.
`;

const LEDGER = {
  path: "docs/research/events/acme-2026-10-28-print.md",
  md: ledgerMd("no"),
  eventDate: "2026-10-28",
};

const input = (overrides: Partial<OutlookInput> = {}): OutlookInput => ({
  symbol: "acme",
  now: "2026-10-01T15:00:00Z",
  prints: [print()],
  events: [],
  ledger: LEDGER,
  ...overrides,
});

const dayAfter = (d: string) => {
  const at = new Date(`${d}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + 1);
  return at.toISOString().slice(0, 10);
};

/** Where the strip fails to run back to back from asOf to the horizon — empty when it does. */
function breaksIn(windows: readonly OutlookWindow[], asOf: string): string[] {
  const last = new Date(`${asOf}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() + OUTLOOK_HORIZON_DAYS);
  const out: string[] = [];
  if (windows[0]?.start !== asOf) out.push(`starts ${windows[0]?.start}, not ${asOf}`);
  if (windows.at(-1)?.end !== last.toISOString().slice(0, 10)) out.push("stops short of horizon");
  for (const [i, w] of windows.entries()) {
    if (w.start > w.end) out.push(`${w.start} ends before it starts`);
    if (!w.reason) out.push(`${w.start} has no reason`);
    const next = windows[i + 1];
    if (next && next.start !== dayAfter(w.end)) out.push(`gap or overlap after ${w.end}`);
  }
  return out;
}

const protectedOf = (windows: readonly OutlookWindow[]) =>
  windows.filter((w) => w.state === "protected");

describe("symbolOutlook — over the checked-in calendar, ledgers and facts", () => {
  const NOW = "2026-10-18T15:00:00Z";

  it("returns CRWV's call, its until-date, and a protected window over the print and the session after", () => {
    const o = symbolOutlook("CRWV", NOW);
    expect(CALLS).toContain(o.call);
    expect(o.until).toMatch(DATE);
    expect(o.why.length).toBeGreaterThan(0);
    expect(o.falsifier.length).toBeGreaterThan(0);
    expect(breaksIn(o.windows, o.asOf)).toEqual([]);

    const next = nextPrintRisk("CRWV", NOW, UPCOMING_PRINTS);
    expect(next).toBeDefined();
    const span = printSpan(next as EarningsPrint);
    const after = nextSession(span.end);
    const guard = protectedOf(o.windows).find((w) => w.start <= span.start && after <= w.end);
    expect(guard).toBeDefined();
    // The facts file is cited, not re-derived: CRWV's reaction lands the session after the filing.
    expect(guard?.reason).toContain("session after the filing");
    expect(guard?.source).toContain("docs/research/crwv-premium-fit.md");
  });

  it("returns wait / no view, in words, for a symbol no research covers — never an empty summary", () => {
    const o = symbolOutlook("ZZZT", NOW);
    expect(o.call).toBe("wait");
    expect(o.confidence).toBe("none");
    expect(o.why).toMatch(/No current research covers ZZZT/);
    expect(o.basis).toBeUndefined();
    expect(o.windows).toHaveLength(1);
    expect(o.windows[0]?.state).toBe("no-view");
    expect(o.windows[0]?.reason).toMatch(/no ledger/i);
    expect(breaksIn(o.windows, o.asOf)).toEqual([]);
  });

  it("treats a malformed symbol as one no research covers", () => {
    expect(symbolOutlook("../nv", NOW).call).toBe("wait");
  });
});

describe("outlookOf — the pure summary", () => {
  it("is a function of its inputs and now alone", () => {
    expect(outlookOf(input())).toEqual(outlookOf(input()));
  });

  it("rolls the ledger's Today row up as wait, quoting its why and falsifier", () => {
    const o = outlookOf(input());
    expect(o.symbol).toBe("ACME");
    expect(o.asOf).toBe("2026-10-01");
    expect(o.call).toBe("wait");
    expect(o.confidence).toBe("medium");
    expect(o.why).toBe("the print is the risk");
    expect(o.falsifier).toBe("ACME confirms a date before 2026-10-15");
    expect(o.basis).toEqual({
      ledger: "docs/research/events/acme-2026-10-28-print.md",
      stance: "Stand aside",
      assessed: "2026-09-30",
    });
  });

  it("reads buy only off the ledger's own Buy signal line", () => {
    expect(outlookOf(input({ ledger: { ...LEDGER, md: ledgerMd("yes") } })).call).toBe("buy");
  });

  it("protects from the S2 entry guard's first day through the session after the print", () => {
    const o = outlookOf(input());
    // Confirmed Wed 10-28: S2 refuses buys from 10-26; the reaction lands Thu 10-29.
    expect(protectedOf(o.windows)).toEqual([
      expect.objectContaining({ start: "2026-10-26", end: "2026-10-29" }),
    ]);
    expect(o.until).toBe("2026-10-26");
    expect(o.windows[0]).toMatchObject({ state: "open", start: "2026-10-01", end: "2026-10-25" });
    expect(breaksIn(o.windows, o.asOf)).toEqual([]);
  });

  it("covers an estimate's whole window, not its point date", () => {
    const o = outlookOf(
      input({
        prints: [
          print({
            status: "estimate",
            date: "2026-11-10",
            window: { start: "2026-11-09", end: "2026-11-16" },
          }),
        ],
        ledger: { ...LEDGER, eventDate: "2026-11-10" },
      }),
    );
    expect(protectedOf(o.windows)[0]).toMatchObject({ start: "2026-11-07", end: "2026-11-17" });
    expect(protectedOf(o.windows)[0]?.reason).toMatch(/estimated 2026-11-09 to 2026-11-16/);
  });

  it("lets a facts file widen the tail and never narrow it", () => {
    const facts = (sessionsAfter: number): SymbolFacts => ({
      symbol: "ACME",
      printReaction: { sessionsAfter, fact: "Lands late.", source: "docs/x.md", falsifier: "n" },
    });
    const end = (f: SymbolFacts) => protectedOf(outlookOf(input({ facts: f })).windows)[0]?.end;
    expect(end(facts(2))).toBe("2026-10-30");
    expect(end(facts(0))).toBe("2026-10-29");
  });

  it("reads wait inside a protected window, until the day after it ends", () => {
    const o = outlookOf(
      input({ now: "2026-10-27T15:00:00Z", ledger: { ...LEDGER, md: ledgerMd("yes") } }),
    );
    expect(o.call).toBe("wait");
    expect(o.windows[0]).toMatchObject({ state: "protected", end: "2026-10-29" });
    expect(o.until).toBe("2026-10-30");
    expect(o.why).toMatch(/^Protected until 2026-10-29: no new entries, exits run\./);
  });

  it("ends the call with its ledger's event, and says no view past it", () => {
    const o = outlookOf(input({ prints: [], ledger: { ...LEDGER, eventDate: "2026-10-10" } }));
    expect(o.until).toBe("2026-10-11");
    expect(o.windows.map((w) => w.state)).toEqual(["open", "no-view"]);
    expect(o.windows[1]?.reason).toMatch(/Past the call's until-date \(2026-10-11\)/);
  });

  it("marks a loud event naming the symbol caution, and ignores quiet and market-wide ones", () => {
    const o = outlookOf(
      input({
        events: [
          event({ id: "acme-launch-2026-10-08", date: "2026-10-08", title: "ACME launch" }),
          event({ id: "acme-minor-2026-10-09", date: "2026-10-09", impact: "low" }),
          event({ id: "cpi-2026-10-14", date: "2026-10-14", symbols: [] }),
          event({ id: "acme-launch-2026-10-27", date: "2026-10-27" }),
        ],
      }),
    );
    const caution = o.windows.filter((w) => w.state === "caution");
    expect(caution).toEqual([
      expect.objectContaining({
        start: "2026-10-08",
        end: "2026-10-08",
        source: "src/domain/market-events/acme-launch-2026-10-08.json",
      }),
    ]);
    // Inside the protected window, protected wins.
    expect(o.windows.find((w) => w.start <= "2026-10-27" && "2026-10-27" <= w.end)?.state).toBe(
      "protected",
    );
    expect(breaksIn(o.windows, o.asOf)).toEqual([]);
  });

  it("drops windows already past and beyond the horizon", () => {
    const o = outlookOf(
      input({
        prints: [print({ date: "2026-09-01" }), print({ date: "2027-06-01" }), print()],
      }),
    );
    expect(protectedOf(o.windows)).toHaveLength(1);
  });
});

describe("WINDOW_STATES — shape plus word, never hue alone", () => {
  it("gives every state its own glyph and a word", () => {
    const states = Object.values(WINDOW_STATES);
    expect(states).toHaveLength(4);
    expect(new Set(states.map((s) => s.glyph)).size).toBe(4);
    for (const s of states) expect(s.word.length).toBeGreaterThan(0);
  });
});

describe("loadSymbolFacts", () => {
  const dirWith = (files: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), "symbol-facts-"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
  };

  it("loads the checked-in CRWV facts, cited", () => {
    const crwv = loadSymbolFacts().get("CRWV");
    expect(crwv?.printReaction?.sessionsAfter).toBeGreaterThanOrEqual(1);
    expect(crwv?.printReaction?.source).toMatch(/crwv-premium-fit\.md/);
    expect(crwv?.printReaction?.falsifier.length).toBeGreaterThan(0);
  });

  it("names the file when one is malformed", () => {
    expect(() => loadSymbolFacts(dirWith({ "ACME.json": '{"symbol":"ACMX"}' }))).toThrow(
      /ACME\.json.*file name/,
    );
    expect(() =>
      loadSymbolFacts(
        dirWith({
          "ACME.json": JSON.stringify({ symbol: "ACME", printReaction: { sessionsAfter: 1 } }),
        }),
      ),
    ).toThrow(/ACME\.json: printReaction\.fact/);
  });

  it("reads a missing directory as no facts", () => {
    expect(loadSymbolFacts(join(tmpdir(), "no-such-symbols-dir")).size).toBe(0);
  });
});
