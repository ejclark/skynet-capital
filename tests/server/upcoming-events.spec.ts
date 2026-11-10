import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NOT_COVERED, NOT_RESEARCHED } from "../../src/domain/fast-track.js";
import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  heldNames,
  STANCE_UNREADABLE,
  UPCOMING_ROWS,
  upcomingEvents,
} from "../../src/server/upcoming-events.js";

/**
 * The chat's calendar lookup (#7034 slice 3a): the fast track's fortnight, ranked the way the first
 * card ranks it, with the house's stance and live kill switches read for the rows it shows.
 */

const ASOF = "2026-11-09";

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id">): MarketEvent => ({
  kind: "earnings",
  title: `${over.id} title`,
  date: "2026-11-17",
  status: "confirmed",
  source: "IR: fixture",
  impact: "medium",
  symbols: [],
  ...over,
});

const NVDA_LEDGER = `# NVDA print

## At a glance

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** · E1 | High | reasons | NVDA closes under $150 by **2026-11-12** |

## Stance & kill switches

**Kill switches:**

- A guide below consensus by 2026-11-19
- An old switch that could fire only by 2026-10-01
- Implied move over 12%

## Assessment ledger
`;

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "upcoming-events-"));
  mkdirSync(join(root, "events"));
  writeFileSync(join(root, "events", "nvda-print.md"), NVDA_LEDGER);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const nvda = event({ id: "nvda-print", title: "NVDA earnings print", symbols: ["NVDA"] });
const cpi = event({ id: "cpi", kind: "macro-print", title: "CPI", impact: "critical" });
const launch = event({
  id: "launch",
  kind: "product-launch",
  title: "A launch",
  date: "2026-11-11",
  status: "estimate",
  impact: "high",
  symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "AMD"],
});
const tooFar = event({ id: "too-far", date: "2026-11-24", impact: "critical" });
const retired = event({ id: "retired", impact: "critical", supersededBy: "cpi" });

const read = (held: string[], underlying?: string, events = [nvda, cpi, launch, tooFar, retired]) =>
  upcomingEvents({
    asOf: ASOF,
    held,
    events,
    prints: [],
    root,
    ...(underlying ? { underlying } : {}),
  });

describe("upcomingEvents — the next fortnight, ranked like the fast track's first card", () => {
  it("puts an event on a held name first, then impact; drops past-the-fortnight and retired events", () => {
    const answer = read(["NVDA"]);
    expect(answer.events.map((e) => e.id)).toEqual(["nvda-print", "cpi", "launch"]);
    expect(answer.events[0]?.onYourBook).toEqual(["NVDA"]);
    expect(answer.horizonDays).toBe(14);
    expect(answer.more).toBe(0);
    expect(answer.rankedBy).toMatch(/held names first.*watchlist is not read/);
  });

  it("with nothing held, ranks by impact and says the order had no held names to use", () => {
    const answer = read([]);
    expect(answer.events.map((e) => e.id)).toEqual(["cpi", "launch", "nvda-print"]);
    expect(answer.events.every((e) => e.onYourBook === undefined)).toBe(true);
    expect(answer.rankedBy).toMatch(/no held names/);
  });

  it("words every date confirmed or estimate, and names the sources it does not read", () => {
    const answer = read([]);
    const byId = new Map(answer.events.map((e) => [e.id, e]));
    expect(byId.get("cpi")?.dateWords).toBe("date confirmed");
    expect(byId.get("launch")?.dateWords).toBe("date is an estimate");
    expect(answer.notCovered).toBe(NOT_COVERED);
  });

  it("reads the house's stance and live kill switches from the ledger; no ledger says not researched", () => {
    const answer = read(["NVDA"]);
    const [nvdaRow, cpiRow] = answer.events;
    expect(nvdaRow?.stance).not.toBe(NOT_RESEARCHED);
    expect(nvdaRow?.stance).toMatch(/Stand aside/);
    expect(nvdaRow?.killSwitches).toEqual([
      "A guide below consensus by 2026-11-19",
      "Implied move over 12%",
    ]);
    expect(cpiRow?.stance).toBe(NOT_RESEARCHED);
    expect(cpiRow?.killSwitches).toEqual([]);
  });

  it("caps a many-name event's tickers and counts the rest", () => {
    const row = read([]).events.find((e) => e.id === "launch");
    expect(row?.symbols).toEqual(["AAPL", "MSFT", "GOOGL", "AMZN", "META"]);
    expect(row?.moreSymbols).toBe(2);
  });

  it("shows five rows at most and counts the rest, so a long fortnight is never cut silently", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      event({ id: `e-${i}`, date: "2026-11-1" + i }),
    );
    const answer = read([], undefined, many);
    expect(answer.events).toHaveLength(UPCOMING_ROWS);
    expect(answer.more).toBe(8 - UPCOMING_ROWS);
  });

  it("narrows to one ticker's events when asked, market-wide prints included only if they name it", () => {
    const answer = read([], "AAPL");
    expect(answer.underlying).toBe("AAPL");
    expect(answer.events.map((e) => e.id)).toEqual(["launch"]);
  });

  it("counts the market-wide prints a ticker's own list leaves out", () => {
    expect(read([], "AAPL").marketWide).toBe(1);
    expect(read([]).marketWide).toBeUndefined();
  });

  it("reads a dotted ticker's ledger — brk.b's id is a real slug", () => {
    const brk = event({ id: "brk.b-print", symbols: ["BRK.B"] });
    writeFileSync(join(root, "events", "brk.b-print.md"), NVDA_LEDGER);
    expect(read([], undefined, [brk]).events[0]?.stance).toMatch(/Stand aside/);
  });

  it("says the research couldn't be read, never 'not researched yet', when a ledger won't open", () => {
    mkdirSync(join(root, "events", "broken.md"));
    const broken = event({ id: "broken" });
    expect(read([], undefined, [broken]).events[0]).toMatchObject({
      stance: STANCE_UNREADABLE,
      killSwitches: [],
    });
  });

  it("never reads a path from an id outside the slug shape", () => {
    const odd = event({ id: "../escape", impact: "critical" });
    writeFileSync(join(root, "escape.md"), NVDA_LEDGER);
    expect(read([], undefined, [odd]).events[0]?.stance).toBe(NOT_RESEARCHED);
  });
});

describe("heldNames — a desk's positions as the tickers events name", () => {
  it("reads an option contract as its underlying and keeps each name once", () => {
    expect(heldNames(["NVDA", "NVDA261218C00200000", "MSFT260918P00420000"])).toEqual([
      "NVDA",
      "MSFT",
    ]);
  });
});
