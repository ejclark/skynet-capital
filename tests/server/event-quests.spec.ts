import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Campaign } from "../../src/domain/campaigns.js";
import type { MarketEvent } from "../../src/domain/market-events-types.js";
import { rankQuests } from "../../src/domain/quest.js";
import { type EventStance, eventQuests } from "../../src/server/event-quests.js";
import { readEventStances } from "../../src/server/event-stances.js";

/**
 * Quests from a market event (#7028 slice 4). An event becomes a quest only when a campaign links it
 * to a tradable symbol AND its written ledger carries `Buy signal: yes`; the quest says "untested" in
 * words, quotes the ledger's falsifier, names the put's worst case, and expires on the event's date.
 */

const TODAY = "2026-11-08";

const event = (over: Partial<MarketEvent> = {}): MarketEvent => ({
  id: "crwv-2026-11-10-print",
  kind: "earnings",
  title: "CRWV earnings print",
  date: "2026-11-10",
  status: "confirmed",
  source: "IR: CoreWeave",
  impact: "critical",
  symbols: ["CRWV"],
  ...over,
});

/** A ledger in the TEMPLATE's shape: probe-ref price, horizon table, Call line, Buy signal bullet. */
function ledger(over: { buy?: "yes" | "no"; call?: string; confidence?: string } = {}): string {
  return [
    "# CoreWeave print — crwv-2026-11-10-print",
    "",
    "**Last assessed:** 2026-11-06",
    '<!-- probe-ref: {"symbols":{"CRWV":80},"vix":19.5} -->',
    "",
    "## At a glance",
    "",
    "**TL;DR.** A way in exists only through a put.",
    "",
    "| Horizon | Call | Confidence | Why | Proves it wrong |",
    "|---|---|---|---|---|",
    `| Today | Accumulate small | ${over.confidence ?? "Medium"} | Capex guide held | CRWV closes under $70 before 2026-11-10 |`,
    "",
    `**Call:** ${over.call ?? "buy until 2026-11-10"}`,
    "",
    "**Signals & conditions** — the buy/sell/hold triggers:",
    "",
    `- **Buy signal:** ${over.buy ?? "yes"} — capex guide held`,
    "",
    "## Initial research",
  ].join("\n");
}

const stance = (over: Partial<EventStance> = {}): EventStance => ({
  event: event(),
  md: ledger(),
  campaigns: ["The AI buildout"],
  ...over,
});

const rich = { cash: 50_000 };

describe("eventQuests", () => {
  it("offers a cash-secured put on the event's symbol, with the ledger's falsifier quoted", () => {
    const [q, ...rest] = eventQuests("d-1", [stance()], rich, TODAY);
    expect(rest).toEqual([]);
    expect(q).toMatchObject({
      id: "event:crwv-2026-11-10-print:CRWV:sell-cash-secured-put",
      source: "event",
      houseCall: "take",
      confidence: "medium",
      atOpen: false,
      move: {
        kind: "sell-cash-secured-put",
        label: "Sell a cash-secured put on CRWV",
        symbol: "CRWV",
        contracts: 1,
        href: "/app/trade?desk=d-1&symbol=CRWV&play=201",
      },
    });
    const why = q?.why.map((r) => r.text).join("\n") ?? "";
    expect(why).toContain("CRWV closes under $70 before 2026-11-10");
    expect(why).toContain("The AI buildout");
    expect(why).toContain("assigned CRWV shares at the strike");
    expect(q?.why.length).toBeLessThanOrEqual(3);
  });

  it("says the edge is untested in words, and never calls a time good to buy", () => {
    const [q] = eventQuests("d-1", [stance()], rich, TODAY);
    expect(q?.baseRate.kind).toBe("untested");
    expect(JSON.stringify(q)).not.toMatch(/great time|good time|good moment|buy the dip/i);
  });

  it("expires on the event's date, or on the ledger's own until-date when that comes first", () => {
    const [onEvent] = eventQuests("d-1", [stance()], rich, TODAY);
    expect(onEvent?.expires.date).toBe("2026-11-10");
    const [early] = eventQuests(
      "d-1",
      [stance({ md: ledger({ call: "buy until 2026-11-09" }) })],
      rich,
      TODAY,
    );
    expect(early?.expires.date).toBe("2026-11-09");
  });

  it("is still on offer on the event's own day, and gone the day after (expired)", () => {
    expect(eventQuests("d-1", [stance()], rich, "2026-11-10")).toHaveLength(1);
    expect(eventQuests("d-1", [stance()], rich, "2026-11-11")).toEqual([]);
  });

  it("is gone once the ledger's own call has lapsed, though the event is still ahead", () => {
    const lapsed = stance({ md: ledger({ call: "buy until 2026-11-07" }) });
    expect(eventQuests("d-1", [lapsed], rich, TODAY)).toEqual([]);
  });

  it("offers nothing for an event that names no symbol", () => {
    const macro = stance({
      event: event({ id: "jobs-2026-11-06", kind: "macro-print", symbols: [] }),
    });
    expect(eventQuests("d-1", [macro], rich, TODAY)).toEqual([]);
  });

  it("offers nothing for a symbol the order path does not trade", () => {
    expect(
      eventQuests("d-1", [stance({ event: event({ symbols: ["ZZZZ9"] }) })], rich, TODAY),
    ).toEqual([]);
  });

  it("offers nothing when the ledger says no, or has no buy signal line at all", () => {
    expect(eventQuests("d-1", [stance({ md: ledger({ buy: "no" }) })], rich, TODAY)).toEqual([]);
    expect(eventQuests("d-1", [stance({ md: "# no stance written here\n" })], rich, TODAY)).toEqual(
      [],
    );
  });

  it("offers nothing when the ledger's confidence is none", () => {
    expect(
      eventQuests("d-1", [stance({ md: ledger({ confidence: "None" }) })], rich, TODAY),
    ).toEqual([]);
  });

  it("offers nothing when cash cannot cover one contract at the probed price", () => {
    expect(eventQuests("d-1", [stance()], { cash: 7_999 }, TODAY)).toEqual([]);
    expect(eventQuests("d-1", [stance()], { cash: 8_000 }, TODAY)).toHaveLength(1);
  });

  it("offers nothing when the ledger recorded no price for the symbol (cash cannot be checked)", () => {
    const noPrice = ledger().replace('"CRWV":80', '"AMD":500');
    expect(eventQuests("d-1", [stance({ md: noPrice })], rich, TODAY)).toEqual([]);
  });

  it("marks an estimated date beside the date", () => {
    const [q] = eventQuests("d-1", [stance({ event: event({ status: "estimate" }) })], rich, TODAY);
    expect(q?.why[0]?.text).toContain("Nov 10 (estimate)");
  });

  it("ranks below a tested quest", () => {
    const [q] = eventQuests("d-1", [stance()], rich, TODAY);
    if (!q) throw new Error("no quest");
    const tested = {
      ...q,
      id: "tested",
      baseRate: { kind: "tested", rate: 0.6, sample: 40, worstDecile: -0.1, source: "docs/x.md" },
    } as const;
    expect(rankQuests([q, tested]).map((x) => x.id)).toEqual(["tested", q.id]);
  });
});

describe("readEventStances", () => {
  const campaign = {
    id: "demo",
    title: "Demo campaign",
    storyline: "x",
    sector: "Technology",
    cast: [{ role: "Chips", symbols: ["CRWV"], source: "x" }],
    forces: [],
    openQuestions: [],
  } as unknown as Campaign;

  function root(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), "event-stances-"));
    mkdirSync(join(dir, "events"));
    for (const [name, md] of Object.entries(files)) writeFileSync(join(dir, "events", name), md);
    return dir;
  }

  it("reads only events a campaign links, that name a tradable symbol, and have a ledger", () => {
    // Real calendar events: CRWV's print is in the AI buildout cast; the demo cast names CRWV only.
    const upcoming = readEventStances("2026-11-08", [campaign], root({}));
    expect(upcoming).toEqual([]); // no ledger files on disk -> nothing
    const withLedger = readEventStances(
      "2026-11-08",
      [campaign],
      root({ "crwv-2026-11-10-print.md": ledger() }),
    );
    expect(withLedger.map((s) => s.event.id)).toEqual(["crwv-2026-11-10-print"]);
    expect(withLedger[0]?.campaigns).toEqual(["Demo campaign"]);
  });

  it("drops an event no campaign links", () => {
    const other = { ...campaign, cast: [{ role: "x", symbols: ["XOM"], source: "x" }] } as Campaign;
    const stances = readEventStances(
      "2026-11-08",
      [other],
      root({ "crwv-2026-11-10-print.md": ledger() }),
    );
    expect(stances).toEqual([]);
  });
});
