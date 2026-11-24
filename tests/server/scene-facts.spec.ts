import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Campaign } from "../../src/domain/campaigns.js";
import { NOT_COVERED, NOT_RESEARCHED } from "../../src/domain/fast-track.js";
import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  AFTER_CLOSE_WORDS,
  BEFORE_OPEN_WORDS,
  MARKET_CLOSED_WORDS,
  MARKET_OPEN_WORDS,
  NO_EVENT_WORDS,
  type SceneFactsQuery,
  sceneFacts,
} from "../../src/server/scene-facts.js";

/**
 * THE GAME MASTER'S ONE READ (#8191 criteria 3, 4, 7, 9, 10), on a frozen calendar and a fixture
 * shelf: one event, the member's held names first; nothing invented when the fortnight is empty;
 * the market clock and an earnings print's timing in words; a quest link to the ticket's review
 * screen only when the house's ledger carries a buy signal and the desk's cash covers it.
 */

const ASOF = "2026-11-08";

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id">): MarketEvent => ({
  kind: "earnings",
  title: `${over.id} title`,
  date: "2026-11-12",
  status: "confirmed",
  source: "IR: fixture",
  impact: "medium",
  symbols: [],
  ...over,
});

const crwv = event({
  id: "crwv-2026-11-10-print",
  title: "CRWV earnings print",
  date: "2026-11-10",
  impact: "critical",
  symbols: ["CRWV"],
});
const nbis = event({
  id: "nbis-2026-11-12-print",
  title: "NBIS earnings print",
  source: "IR: results Thu Nov 12 BEFORE market open",
  symbols: ["NBIS"],
});
const cpi = event({
  id: "cpi-nov",
  kind: "macro-print",
  title: "CPI, October",
  impact: "high",
  status: "estimate",
});

/** A ledger in the template's shape with a buy signal (the shape `event-quests.spec.ts` uses). */
const CRWV_LEDGER = [
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
  "| Today | Accumulate small | Medium | Capex guide held | CRWV closes under $70 before 2026-11-10 |",
  "",
  "**Call:** buy until 2026-11-10",
  "",
  "**Signals & conditions** — the buy/sell/hold triggers:",
  "",
  "- **Buy signal:** yes — capex guide held",
  "",
  "## Initial research",
].join("\n");

const campaign = {
  id: "demo",
  title: "Demo campaign",
  storyline: "x",
  sector: "Technology",
  cast: [{ role: "Chips", symbols: ["CRWV"], source: "x" }],
  forces: [],
  openQuestions: [],
} as unknown as Campaign;

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "scene-facts-"));
  mkdirSync(join(root, "events"));
  writeFileSync(join(root, "events", "crwv-2026-11-10-print.md"), CRWV_LEDGER);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const read = (over: Partial<SceneFactsQuery> = {}) =>
  sceneFacts({
    asOf: ASOF,
    marketOpen: true,
    held: [],
    events: [crwv, nbis, cpi],
    prints: [],
    campaigns: [campaign],
    root,
    ...over,
  });

function found(facts: ReturnType<typeof sceneFacts>) {
  if (!facts.found) throw new Error(`expected an event, got: ${facts.said}`);
  return facts;
}

describe("sceneFacts — one event from the next 14 days", () => {
  it("puts the member's held name first, with its date words, stance and the campaigns linking it", () => {
    const facts = found(read({ held: ["NBIS"] }));
    expect(facts.event).toMatchObject({
      id: "nbis-2026-11-12-print",
      title: "NBIS earnings print",
      dateWords: "date confirmed",
      kind: "earnings",
      onYourBook: ["NBIS"],
      stance: NOT_RESEARCHED,
      campaigns: [],
    });
    expect(facts.otherEvents).toBe(2);
    expect(facts.notCovered).toBe(NOT_COVERED);
  });

  it("with no held names, takes the highest-ranked event and names the campaign that links it", () => {
    const facts = found(read());
    expect(facts.event.id).toBe("crwv-2026-11-10-print");
    expect(facts.event.campaigns).toEqual(["Demo campaign"]);
    expect(facts.event.stance).not.toBe(NOT_RESEARCHED);
  });

  it("narrows to an underlying or an event id an earlier answer gave", () => {
    expect(found(read({ underlying: "NBIS" })).event.id).toBe("nbis-2026-11-12-print");
    expect(found(read({ eventId: "cpi-nov" })).event).toMatchObject({
      id: "cpi-nov",
      dateWords: "date is an estimate",
      isEarningsPrint: false,
      symbols: [],
    });
    expect(found(read({ eventId: "cpi-nov" })).event.timing).toBeUndefined();
  });

  it("invents nothing when the fortnight is empty (criterion 4)", () => {
    const facts = read({ events: [event({ id: "far", date: "2026-12-30" })] });
    expect(facts).toEqual({
      found: false,
      asOf: ASOF,
      marketOpen: true,
      marketWords: MARKET_OPEN_WORDS,
      said: NO_EVENT_WORDS,
      notCovered: NOT_COVERED,
    });
    expect(read({ eventId: "no-such-event" }).found).toBe(false);
    expect(read({ underlying: "XOM" })).toMatchObject({ found: false });
  });

  it("says the session is closed, prices after-hours, and a paper order waits for the open (criterion 9)", () => {
    const facts = read({ marketOpen: false });
    expect(facts.marketOpen).toBe(false);
    expect(facts.marketWords).toBe(MARKET_CLOSED_WORDS);
    expect(MARKET_CLOSED_WORDS).toContain("after-hours price");
    expect(MARKET_CLOSED_WORDS).toContain("fills at the next open");
  });

  it("says an earnings print lands after the close unless its source says before the open (criterion 10)", () => {
    expect(found(read()).event).toMatchObject({ isEarningsPrint: true, timing: AFTER_CLOSE_WORDS });
    expect(found(read({ held: ["NBIS"] })).event.timing).toBe(BEFORE_OPEN_WORDS);
  });

  it("links the ticket's review screen with the quest only when the ledger's buy signal derives one for this desk (criterion 7)", () => {
    const withDesk = found(read({ desk: { id: "desk-1", cash: 50_000 } }));
    expect(withDesk.event.questHref).toBe(
      "/trade?desk=desk-1&symbol=CRWV&play=201&quest=event%3Acrwv-2026-11-10-print%3ACRWV%3Asell-cash-secured-put",
    );
    expect(withDesk.event.ticketHref).toBe("/trade?symbol=CRWV");
    // No desk, or cash that can't cover one contract: no quest, the plain ticket link stays.
    expect(found(read()).event.questHref).toBeUndefined();
    expect(found(read({ desk: { id: "desk-1", cash: 100 } })).event.questHref).toBeUndefined();
    // No ledger with a buy signal (NBIS has none on the shelf): no quest.
    expect(
      found(read({ held: ["NBIS"], desk: { id: "desk-1", cash: 50_000 } })).event.questHref,
    ).toBeUndefined();
  });
});
