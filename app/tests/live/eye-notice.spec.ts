import type { Edition, EditionDate, EditionStory } from "../../src/live/edition";
import type { SectorRow } from "../../src/live/edition-sectors";
import {
  leftItsRange,
  type NoticeInput,
  noticeCandidates,
  noticedThisSession,
  noticeHref,
  noticeMoves,
  noticeMovesFor,
  pickNotice,
  rememberNoticed,
  rememberQuests,
  seenQuests,
  windowHref,
} from "../../src/live/eye-notice";
import type { MpMessage } from "../../src/live/moneypenny";
import type { Quest } from "../../src/live/quests";

/**
 * THE EYE NOTICES (#7487 slice 5): what is worth a look, from real data only — an event a story
 * waits on, today or next session; a quest the member has not seen; a sector whose last close left
 * its 20-day band — best first, never twice in a session, and nothing on the member's first look.
 */

const TODAY = "2026-11-11"; // a Wednesday; the next session is Thu, Nov 12

const nbis: EditionDate = { date: "2026-11-12", what: "Nebius Q3 results", status: "confirmed" };
const cpi: EditionDate = { date: "2026-11-13", what: "October CPI", status: "confirmed" };

const story = (id: string, reports: readonly EditionDate[]): EditionStory => ({
  id,
  headline: id,
  line: id,
  symbols: ["NBIS"],
  facts: [],
  reports,
  more: [],
});

function sector(over: Partial<SectorRow> & Pick<SectorRow, "fund" | "name">): SectorRow {
  return {
    moves: { day: 0, week: 0, month: 0, ytd: 0 },
    range: { low: 90, mid: 95, high: 100, close: 95 },
    trail: [95, 96, 95],
    ...over,
  };
}

function edition(over: Partial<Edition> = {}): Edition {
  return {
    date: "2026-11-10",
    writtenBy: "the desk",
    ageDays: 1,
    stories: [],
    next: [],
    ...over,
  };
}

function quest(id: string, label: string): Quest {
  return {
    id,
    source: "position",
    move: { kind: "close", label, symbol: "NVDA", href: "/app/trade?symbol=NVDA" },
    why: [],
    baseRate: { kind: "untested", note: "No study yet." },
    exits: [],
    expires: { date: "2026-11-20", why: "the call expires" },
    houseCall: "take",
    confidence: "low",
    atOpen: false,
  } as unknown as Quest;
}

const input = (over: Partial<NoticeInput> = {}): NoticeInput => ({
  edition: edition(),
  today: TODAY,
  inside: [],
  quests: undefined,
  seenQuests: new Set(),
  ...over,
});

describe("the Eye notices · a calendar event a story waits on", () => {
  it("points at an event on the next session that a story waits on, in its window", () => {
    const e = edition({ stories: [story("ai-capex", [nbis])], next: [nbis] });
    const [n] = noticeCandidates(input({ edition: e, inside: [nbis] }));
    expect(n?.window).toBe("calendar");
    expect(n?.anchor).toBe("event-2026-11-12-nebius-q3-results");
    expect(n?.reason).toBe("next session · a story waits");
    expect(n?.line).toMatch(/the Eye is on the calendar: Nebius Q3 results, Thu, Nov 12/);
  });

  it("passes over an event no story waits on, and one past the next session", () => {
    const e = edition({ stories: [story("macro", [cpi])], next: [nbis, cpi] });
    expect(noticeCandidates(input({ edition: e, inside: [nbis, cpi] }))).toEqual([]);
  });

  it("passes over an event outside the calendar's range", () => {
    const e = edition({ stories: [story("ai-capex", [nbis])], next: [nbis] });
    expect(noticeCandidates(input({ edition: e, inside: [] }))).toEqual([]);
  });
});

describe("the Eye notices · a quest not seen before", () => {
  it("points at a shown quest the member has not seen, and never a seen one", () => {
    const quests = [quest("q-1", "Close your NVDA call"), quest("q-2", "Trim your AMD put")];
    const out = noticeCandidates(input({ quests, seenQuests: new Set(["q-1"]) }));
    expect(out.map((n) => n.key)).toEqual(["quest:q-2"]);
    expect(out[0]?.anchor).toBe("quest-q-2");
    expect(out[0]?.line).toMatch(/paper only; nothing is placed from here/);
  });
});

describe("the Eye notices · a sector that left its usual range", () => {
  it("counts a close outside the band only when the close before sat inside it", () => {
    expect(
      leftItsRange(
        sector({
          fund: "XLE",
          name: "Energy",
          range: { low: 90, mid: 95, high: 100, close: 103 },
          trail: [96, 99, 103],
        }),
      ),
    ).toBe(true);
    // Out there for days: not new.
    expect(
      leftItsRange(
        sector({
          fund: "XLE",
          name: "Energy",
          range: { low: 90, mid: 95, high: 100, close: 103 },
          trail: [101, 102, 103],
        }),
      ),
    ).toBe(false);
    // Inside: nothing to see.
    expect(leftItsRange(sector({ fund: "XLE", name: "Energy" }))).toBe(false);
  });

  it("points at the sector farthest out first, never the S&P 500, in words that are no signal", () => {
    const rows = [
      sector({
        fund: "SPY",
        name: "S&P 500",
        market: true,
        range: { low: 90, mid: 95, high: 100, close: 110 },
        trail: [95, 110],
      }),
      sector({
        fund: "XLE",
        name: "Energy",
        range: { low: 90, mid: 95, high: 100, close: 101 },
        trail: [99, 101],
      }),
      sector({
        fund: "XLU",
        name: "Utilities",
        range: { low: 90, mid: 95, high: 100, close: 86 },
        trail: [91, 86],
      }),
    ];
    const e = edition({
      sectors: {
        source: "s",
        from: { day: "", week: "", month: "", ytd: "" },
        rangeSpan: { from: "", to: "" },
        rows,
      },
    });
    const out = noticeCandidates(input({ edition: e }));
    expect(out.map((n) => n.key)).toEqual(["sector:XLU:2026-11-10", "sector:XLE:2026-11-10"]);
    expect(out[0]?.line).toMatch(/Utilities \(XLU\) closed below its usual 20-day range/);
    for (const n of out)
      expect(`${n.line} ${n.ask.msg}`).not.toMatch(/\b(buy|sell|overbought|oversold)\b/i);
  });
});

describe("the Eye notices · best first, once", () => {
  const e = edition({
    stories: [story("ai-capex", [nbis])],
    next: [nbis],
    sectors: {
      source: "s",
      from: { day: "", week: "", month: "", ytd: "" },
      rangeSpan: { from: "", to: "" },
      rows: [
        sector({
          fund: "XLE",
          name: "Energy",
          range: { low: 90, mid: 95, high: 100, close: 103 },
          trail: [99, 103],
        }),
      ],
    },
  });
  const all = noticeCandidates(
    input({ edition: e, inside: [nbis], quests: [quest("q-9", "Close it")] }),
  );

  it("ranks the event, then the quest, then the sector", () => {
    expect(all.map((n) => n.window)).toEqual(["calendar", "quests", "market"]);
  });

  it("skips what was already noticed this session", () => {
    expect(pickNotice(all, new Set([all[0]?.key ?? ""]))?.window).toBe("quests");
    expect(pickNotice(all, new Set(all.map((n) => n.key)))).toBeUndefined();
  });

  it("goes to the window on its row, and offers a question and the way back", () => {
    const n = all[2];
    if (!n) throw new Error("expected the sector");
    expect(noticeHref(n)).toBe("/?w=market#sector-XLE");
    expect(noticeMoves(n, "overview")).toEqual([
      {
        kind: "say",
        label: "What moved XLE?",
        msg: "What moved Energy (XLE) above its usual range?",
      },
      { kind: "go", label: "Back to where I was", href: "/" },
    ]);
    expect(windowHref("party")).toBe("/?w=party");
  });
});

describe("the Eye notices · its moves last while her line is the latest", () => {
  const line: MpMessage = { role: "mp", text: "Moneypenny · the Eye is on the market", at: 5 };
  const moves = [{ kind: "main", label: "x" }] as const;

  it("offers them while that line is her latest, and not once anything follows", () => {
    expect(noticeMovesFor(line, { line, moves })).toBe(moves);
    expect(noticeMovesFor({ ...line, at: 6, text: "an answer" }, { line, moves })).toBeUndefined();
    expect(noticeMovesFor(undefined, { line, moves })).toBeUndefined();
  });
});

describe("the Eye notices · its memory", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("knows nothing on the first look, then the quests it recorded", () => {
    expect(seenQuests()).toBeUndefined();
    rememberQuests([]);
    expect(seenQuests()).toEqual(new Set());
    rememberQuests(["q-1", "q-2"]);
    rememberQuests(["q-2", "q-3"]);
    expect(seenQuests()).toEqual(new Set(["q-1", "q-2", "q-3"]));
  });

  it("remembers what it noticed for the session", () => {
    rememberNoticed("event:a");
    rememberNoticed("sector:XLE:2026-11-10");
    expect(noticedThisSession()).toEqual(new Set(["event:a", "sector:XLE:2026-11-10"]));
  });
});
