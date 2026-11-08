import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  campaignLinkReasons,
  campaignsLinking,
  readCampaignDir,
} from "../../scripts/campaign-links.mjs";
import { campaignFromForm, memberCampaignId } from "../../src/domain/campaign-form.js";
import {
  type Close,
  dateMarkOf,
  type LandscapeInputs,
  landscapeOf,
  type Scheduled,
  type Tested,
} from "../../src/domain/campaign-landscape.js";
import {
  landscapeLines,
  scheduledShown,
  testedLine,
} from "../../src/domain/campaign-landscape-lines.js";
import type { NewsItem } from "../../src/domain/campaign-news.js";
import { CAMPAIGNS, type Campaign, campaignById, linkReasons } from "../../src/domain/campaigns.js";
import { everyEvent, type MarketEvent } from "../../src/domain/market-events.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";

/**
 * THE LANDSCAPE READ (#6949 slice 5, criteria 4 and 5). The falsifier the plan wrote for it: "the
 * read states a move, a schedule or a test result the record behind it does not hold (a reported
 * item read as measured, an `estimate` date read as confirmed, an untested claim read as tested)."
 * Each `describe` below holds one of those three to the record, in the data and in the words.
 */

const house = (id: string): Campaign => {
  const c = campaignById(id);
  if (!c) throw new Error(`the ${id} campaign is missing`);
  return c;
};

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id" | "date">): MarketEvent => ({
  kind: "earnings",
  title: over.id,
  status: "confirmed",
  source: "IR: fixture",
  impact: "critical",
  symbols: ["NVDA"],
  ...over,
});

const news = (over: Partial<NewsItem> & Pick<NewsItem, "id" | "title" | "at">): NewsItem => ({
  url: "https://example.com/story",
  source: "NEWS: example.com via GDELT",
  ...over,
});

/** Six weekday closes ending 2026-11-06, rising 100 → 110. */
const RISING: readonly Close[] = [
  { date: "2026-10-30", close: 100 },
  { date: "2026-11-02", close: 102 },
  { date: "2026-11-03", close: 104 },
  { date: "2026-11-04", close: 106 },
  { date: "2026-11-05", close: 108 },
  { date: "2026-11-06", close: 110 },
];

const CONVICTION: Conviction = {
  id: "fixture-view",
  owner: "Eric",
  statedOn: "2026-10-01",
  checkOn: "2027-01-01",
  steers: [],
  claims: [
    {
      tag: "underrated",
      statement: "1. A studied claim.",
      bucket: "tested",
      evidence: "A study.",
      falsifier: "x",
      study: {
        disposition: "studied",
        instrument: "earnings-cycle",
        measures: "m",
        symbol: "NVDA",
        dataDate: "2026-10-16",
        verdict: {
          reading: "supports",
          call: "Runs up into its print.",
          confidence: "medium",
          why: "w",
          falsifier: "f",
          numbers: {},
        },
      },
    },
    {
      tag: "missing",
      statement: "2. A forward claim.",
      bucket: "forward",
      evidence: "Scored later.",
      falsifier: "x",
      scoreBy: "2026-11-06",
      score: { outcome: "pending", basis: "Not due.", dueOn: "2026-11-06" },
    },
    {
      tag: "missing",
      statement: "3. An untestable claim.",
      bucket: "untestable",
      evidence: "No fundamentals feed. Size zero.",
      falsifier: "x",
    },
  ],
};

/** The AI buildout with its open questions pointed at the fixture conviction. */
const AI: Campaign = {
  ...house("ai-buildout"),
  openQuestions: [
    { question: "Studied?", conviction: "fixture-view", claim: "1" },
    { question: "Forward?", conviction: "fixture-view", claim: "2" },
    { question: "Untestable?", conviction: "fixture-view", claim: "3" },
    { question: "Missing?", conviction: "fixture-view", claim: "9" },
  ],
};

const inputs = (over: Partial<LandscapeInputs> = {}): LandscapeInputs => ({
  today: "2026-11-08",
  events: [],
  news: [],
  convictions: [CONVICTION],
  ...over,
});

describe("the landscape read (#6949 slice 5)", () => {
  describe("what moved", () => {
    it("reads the move from the closes it was handed, naming both dates", () => {
      const read = landscapeOf(AI, inputs({ closes: { NVDA: RISING }, closesSource: "fixture" }));
      expect(read.moved.moves).toEqual([
        {
          symbol: "NVDA",
          from: { date: "2026-10-30", close: 100 },
          to: { date: "2026-11-06", close: 110 },
          changePct: 10,
          source: "fixture",
        },
      ]);
    });

    it("lists a symbol with no closes, or too few, as unread, never as flat", () => {
      const read = landscapeOf(AI, inputs({ closes: { NVDA: RISING.slice(0, 3) } }));
      expect(read.moved.moves).toEqual([]);
      expect(read.unread).toContain("NVDA");
      expect(read.unread).toContain("CRWV");
      expect(landscapeLines(read).join("\n")).toContain("says nothing about price");
    });

    it("never reads a close dated after the day of the read", () => {
      const read = landscapeOf(
        AI,
        inputs({ today: "2026-11-05", sessions: 3, closes: { NVDA: RISING } }),
      );
      expect(read.moved.moves[0]?.to.date).toBe("2026-11-05");
    });
  });

  describe("what is scheduled — an estimated date is never read as confirmed", () => {
    it("keeps linked events from today to the horizon, in date order", () => {
      const read = landscapeOf(
        AI,
        inputs({
          events: [
            event({ id: "later", date: "2026-11-20" }),
            event({ id: "past", date: "2026-11-07" }),
            event({ id: "today", date: "2026-11-08" }),
            event({ id: "beyond", date: "2026-12-30" }),
            event({ id: "unlinked", date: "2026-11-09", symbols: ["XOM"] }),
          ],
        }),
      );
      expect(read.scheduled.map((s) => [s.id, s.daysUntil])).toEqual([
        ["today", 0],
        ["later", 12],
      ]);
    });

    it("marks a date confirmed only on a confirmed status from a primary source", () => {
      const mark = (over: Partial<MarketEvent>) =>
        landscapeOf(AI, inputs({ events: [event({ id: "x", date: "2026-11-10", ...over })] }))
          .scheduled[0]?.dateIs;
      expect(mark({})).toBe("confirmed");
      expect(dateMarkOf(event({ id: "x", date: "2026-11-10" }), "measured")).toBe("confirmed");
      expect(mark({ status: "estimate" })).toBe("estimated");
      expect(mark({ status: "confirmed", source: "EST: cadence" })).toBe("estimated");
      expect(mark({ status: "confirmed", source: "NEWS: press" })).toBe("reported");
    });

    it("never says 'confirmed' for an estimated or press-reported date", () => {
      const read = landscapeOf(
        AI,
        inputs({
          events: [
            event({ id: "est", date: "2026-11-10", status: "estimate" }),
            event({ id: "press", date: "2026-11-11", source: "NEWS: wire" }),
          ],
        }),
      );
      const lines = landscapeLines(read).filter((l) => /\) (est|press):/.test(l));
      expect(lines.length).toBe(2);
      for (const line of lines) expect(line).toMatch(/not confirmed$/);
    });

    it("keeps the cast's own events when a broad force overflows the cap", () => {
      const row = (id: string, via: "cast" | "force", days: number): Scheduled => ({
        id,
        title: id,
        date: `2026-11-${String(8 + days).padStart(2, "0")}`,
        daysUntil: days,
        kind: "rates",
        impact: "high",
        dateIs: "confirmed",
        source: "TSY: x",
        reasons: [via === "cast" ? { via, symbol: "NVDA" } : { via, force: "rates" }],
      });
      const rows = [row("a1", "force", 1), row("a2", "force", 2), row("print", "cast", 9)];
      expect(scheduledShown(rows, 2).map((s) => s.id)).toEqual(["a1", "print"]);
    });
  });

  describe("what is reported — a press item is never read as measured", () => {
    const items = [
      news({ id: "a", title: "Nvidia beats", at: "2026-11-07T12:00:00Z" }),
      news({
        id: "b",
        title: "Nvidia files an 8-K",
        at: "2026-11-06T20:00:00Z",
        url: "https://www.sec.gov/x",
        source: "SEC: 8-K",
      }),
      news({ id: "old", title: "Nvidia, long ago", at: "2026-10-01T00:00:00Z" }),
      news({ id: "elsewhere", title: "Exxon drills", at: "2026-11-07T00:00:00Z" }),
    ];

    it("keeps the headlines that name the campaign inside the window, newest first", () => {
      const read = landscapeOf(AI, inputs({ news: items }));
      expect(read.reported.map((r) => [r.title, r.evidence])).toEqual([
        ["Nvidia beats", "reported"],
        ["Nvidia files an 8-K", "measured"],
      ]);
    });

    it("words press as reported and only a primary source as from the source", () => {
      const lines = landscapeLines(landscapeOf(AI, inputs({ news: items })));
      expect(lines.find((l) => l.includes("Nvidia beats"))).toContain("reported by press");
      expect(lines.find((l) => l.includes("Nvidia beats"))).not.toContain("from the source");
      expect(lines.find((l) => l.includes("8-K"))).toContain("from the source itself");
    });
  });

  describe("what the house has tested — an untested claim is never read as tested", () => {
    const read = landscapeOf(AI, inputs());
    const by = (q: string): Tested => {
      const t = read.tested.find((row) => row.question === q);
      if (!t) throw new Error(`no row for ${q}`);
      return t;
    };

    it("calls a claim tested only when its bucket or a study says so", () => {
      expect(read.tested.map((t) => [t.question, t.tested])).toEqual([
        ["Studied?", true],
        ["Forward?", false],
        ["Untestable?", false],
        ["Missing?", false],
      ]);
    });

    it("words each claim in the record's own terms", () => {
      expect(testedLine(by("Studied?"))).toContain(
        "tested: Runs up into its print. (medium confidence, data to 2026-10-16)",
      );
      expect(testedLine(by("Untestable?"))).toContain(
        "untestable: No fundamentals feed. Size zero.",
      );
      expect(testedLine(by("Missing?"))).toContain("no such claim on record");
      for (const q of ["Forward?", "Untestable?", "Missing?"])
        expect(testedLine(by(q))).not.toMatch(/: tested:/);
    });

    it("says a pending score past its day has not been read, not that it is not due", () => {
      expect(by("Forward?").score?.overdue).toBe(true);
      expect(testedLine(by("Forward?"))).toContain(
        "its score was due 2026-11-06 and has not been read yet",
      );
    });
  });

  describe("any campaign, house or member", () => {
    it("links a member's campaign against the same news harvest at read time", () => {
      const compiled = campaignFromForm(
        {
          title: "Memory chips",
          anchor: { kind: "sector", id: "Technology" },
          symbols: ["MU"],
          storyline: "Memory prices and the AI build.",
          mode: "explore",
        },
        memberCampaignId("Memory chips"),
      );
      if (!compiled.ok) throw new Error("the fixture form should compile");
      const read = landscapeOf(
        compiled.campaign,
        inputs({
          news: [news({ id: "m", title: "Micron raises guidance", at: "2026-11-07T00:00:00Z" })],
        }),
      );
      expect(read.reported.map((r) => r.title)).toEqual(["Micron raises guidance"]);
      expect(read.tested).toEqual([]);
    });

    it("reads every house campaign over the real records without throwing", () => {
      for (const c of CAMPAIGNS) {
        const read = landscapeOf(c, inputs({ events: everyEvent() }));
        expect(landscapeLines(read).length).toBeGreaterThan(4);
      }
    });
  });

  // Criterion 5's linker runs in the dependency-free scanner, so the rule exists twice; this pins
  // the two together over the whole calendar, the same drift gate event-scan.spec.ts keeps.
  describe("the scanner's campaign linker agrees with the domain's", () => {
    it("gives the same reasons for every calendar event and every house campaign", () => {
      const files = readCampaignDir(join(process.cwd(), "src", "domain", "campaigns"));
      expect(files.map((f) => f.id)).toEqual(CAMPAIGNS.map((c) => c.id));
      let linked = 0;
      for (const e of everyEvent())
        for (const c of CAMPAIGNS) {
          const file = files.find((f) => f.id === c.id);
          const ours = linkReasons(c, e);
          expect(campaignLinkReasons(file as never, e)).toEqual(ours);
          if (ours.length > 0) linked += 1;
        }
      expect(linked).toBeGreaterThan(50);
    });

    it("names each linking campaign once, with its strongest reason", () => {
      const files = readCampaignDir(join(process.cwd(), "src", "domain", "campaigns"));
      const print = event({ id: "nvda-print", date: "2026-11-17" });
      expect(campaignsLinking(files, print)).toEqual([{ id: "ai-buildout", via: "cast" }]);
      const auction = event({ id: "ust-10y", date: "2026-11-10", kind: "rates", symbols: [] });
      expect(campaignsLinking(files, auction)).toContainEqual({ id: "ai-buildout", via: "force" });
    });

    it("refuses an unreadable campaign directory instead of linking nothing", () => {
      expect(() => readCampaignDir("/no/such/dir")).toThrow(/refusing to guess/);
      const dir = mkdtempSync(join(tmpdir(), "campaign-links-"));
      try {
        writeFileSync(join(dir, "bad.json"), "{");
        expect(() => readCampaignDir(dir)).toThrow(/not valid JSON/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
