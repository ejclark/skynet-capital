import type { LessonRecord } from "../../src/domain/campaign-lessons.js";
import type { Campaign } from "../../src/domain/campaigns.js";
import type { DiscoveryAsk } from "../../src/domain/discovery-queue.js";
import {
  createHouseResearchReader,
  HOUSE_RESEARCH_NOTE,
  houseResearchOn,
  LEDGER_NAME_ROWS,
  LESSON_ROWS,
} from "../../src/server/house-research.js";

/**
 * What the house already knows about one company, sector or market (the Moneypenny operator plan,
 * ASSESS): the research ledger on the shelf, the house campaigns that follow it, the lessons they
 * recorded, and whether a question about it already waits on the research list. Fixtures are
 * injected so the checked-in campaigns can change without moving these specs.
 */

const TODAY = "2026-11-09";

const campaign = (over: Partial<Campaign> & Pick<Campaign, "id">): Campaign => ({
  title: `${over.id} title`,
  storyline: `${over.id} storyline`,
  cast: [],
  forces: [],
  openQuestions: [],
  ...over,
});

const AI = campaign({
  id: "ai-buildout",
  title: "The AI buildout",
  sector: "Technology",
  cast: [{ role: "Chips", symbols: ["NVDA", "AMD"], source: "research/nvda.md" }],
});
const OIL = campaign({
  id: "oil-supply",
  title: "Oil supply",
  sector: "Energy",
  cast: [{ role: "Majors", symbols: ["XOM"], source: "research/xom.md" }],
});
const CRUDE = campaign({
  id: "crude-fund",
  title: "Crude through the fund",
  sector: "Energy",
  cast: [{ role: "Fund", symbols: ["USO"], source: "research/uso.md" }],
});
const BROAD = campaign({
  id: "broad-market",
  title: "The broad market",
  market: "us-large-caps",
  cast: [{ role: "Fund", symbols: ["SPY"], source: "research/spy.md" }],
});

const LESSONS: readonly LessonRecord[] = [
  {
    campaign: "ai-buildout",
    lessons: [
      {
        id: "chips-run",
        kind: "tested",
        idea: "Chip makers lead when capex guides up.",
        symbols: ["NVDA"],
        on: "2026-10-01",
        recheckOn: "2026-12-01",
        falsifier: "Capex guides down two quarters running.",
        source: "research/nvda.md",
      },
      {
        id: "amd-share",
        kind: "on-watch",
        idea: "AMD takes share in data centres.",
        symbols: ["AMD", "NVDA"],
        on: "2026-09-01",
        recheckOn: "2026-10-15",
        source: "research/amd.md",
      },
      {
        id: "sector-wide",
        kind: "killed",
        idea: "Every AI name moves together.",
        symbols: [],
        on: "2026-08-01",
        falsifier: "Correlation above 0.9 for a quarter.",
        source: "research/ai.md",
      },
    ],
  },
  {
    campaign: "oil-supply",
    lessons: [
      {
        id: "xom-print",
        kind: "tested",
        idea: "Majors hold up when crude dips.",
        symbols: ["XOM"],
        on: "2026-10-20",
        source: "research/xom.md",
      },
    ],
  },
];

const ask = (over: Partial<DiscoveryAsk> & Pick<DiscoveryAsk, "id">): DiscoveryAsk => ({
  kind: "name",
  subject: "PLTR",
  askedAt: "2026-11-01T00:00:00Z",
  askers: ["m-aaaa"],
  ...over,
});

const SECTOR_NAMES: Record<string, readonly string[]> = {
  "Consumer Discretionary": ["AMZN", "DHI", "KBH", "LEN", "NKE"],
  Technology: ["AMD", "NVDA"],
};

const base = {
  isResearched: (t: string) => t === "NVDA",
  namesInSector: (sector: string) => SECTOR_NAMES[sector] ?? [],
  queue: [] as readonly DiscoveryAsk[],
  held: [] as readonly string[],
  today: TODAY,
  laneReads: false,
  campaigns: [AI, OIL, BROAD],
  lessons: LESSONS,
};

describe("houseResearchOn — a company the house has researched", () => {
  it("says the shelf has a ledger, names the house campaign whose cast holds it, and lists its lessons as written", () => {
    const out = houseResearchOn({ kind: "name", subject: "NVDA" }, base);
    expect(out.kind).toBe("name");
    expect(out.subject).toBe("NVDA");
    expect(out.shelf).toBe("has a research ledger");
    expect(out.campaigns).toEqual([
      { id: "ai-buildout", title: "The AI buildout", storyline: "ai-buildout storyline" },
    ]);
    expect(out.lessons).toEqual([
      {
        kind: "tested",
        idea: "Chip makers lead when capex guides up.",
        on: "2026-10-01",
        recheckOn: "2026-12-01",
        falsifier: "Capex guides down two quarters running.",
        source: "research/nvda.md",
      },
      {
        kind: "on-watch",
        idea: "AMD takes share in data centres.",
        on: "2026-09-01",
        recheckOn: "2026-10-15",
        source: "research/amd.md",
        stale: true,
      },
    ]);
    expect(out.more).toBe(0);
  });

  it("marks a lesson stale only when its re-check date is before today", () => {
    const out = houseResearchOn(
      { kind: "name", subject: "NVDA" },
      { ...base, today: "2026-10-15" },
    );
    expect(out.lessons.map((l) => l.stale)).toEqual([undefined, undefined]);
    const later = houseResearchOn(
      { kind: "name", subject: "NVDA" },
      { ...base, today: "2027-01-01" },
    );
    expect(later.lessons.every((l) => l.stale === true)).toBe(true);
  });

  it("says whether the member holds the name, an option contract reading as its underlying", () => {
    expect(houseResearchOn({ kind: "name", subject: "NVDA" }, base).onYourBook).toBe(false);
    const held = ["NVDA261218C00150000"];
    expect(houseResearchOn({ kind: "name", subject: "NVDA" }, { ...base, held }).onYourBook).toBe(
      true,
    );
  });

  it("shows at most the lesson cap, newest first, and counts the rest in more", () => {
    const many: LessonRecord[] = [
      {
        campaign: "ai-buildout",
        lessons: Array.from({ length: LESSON_ROWS + 3 }, (_, i) => ({
          id: `l${i}`,
          kind: "tested" as const,
          idea: `idea ${i}`,
          symbols: ["NVDA"],
          on: `2026-10-${String(i + 1).padStart(2, "0")}`,
          source: "research/nvda.md",
        })),
      },
    ];
    const out = houseResearchOn({ kind: "name", subject: "NVDA" }, { ...base, lessons: many });
    expect(out.lessons).toHaveLength(LESSON_ROWS);
    expect(out.more).toBe(3);
    expect(out.lessons[0]?.idea).toBe(`idea ${LESSON_ROWS + 2}`);
  });
});

describe("houseResearchOn — a sector or a market", () => {
  it("finds a sector through the house campaign set in it, with that campaign's lessons", () => {
    const out = houseResearchOn({ kind: "sector", subject: "Energy" }, base);
    expect(out.campaigns.map((c) => c.id)).toEqual(["oil-supply"]);
    expect(out.lessons.map((l) => l.idea)).toEqual(["Majors hold up when crude dips."]);
    expect(out).not.toHaveProperty("shelf");
    expect(out).not.toHaveProperty("onYourBook");
    expect(out.ledgersInSector).toEqual({ names: [], more: 0 });
  });

  it("names the sector's companies that have a ledger even when no house campaign is set in it", () => {
    const researched = new Set(["AMZN", "DHI", "KBH", "LEN"]);
    const out = houseResearchOn(
      { kind: "sector", subject: "Consumer Discretionary" },
      { ...base, isResearched: (t: string) => researched.has(t) },
    );
    expect(out.campaigns).toEqual([]);
    expect(out.ledgersInSector).toEqual({ names: ["AMZN", "DHI", "KBH", "LEN"], more: 0 });
  });

  it("lists at most the name cap for a sector and counts the rest", () => {
    const many = Array.from({ length: LEDGER_NAME_ROWS + 2 }, (_, i) => `T${i}`);
    const out = houseResearchOn(
      { kind: "sector", subject: "Technology" },
      { ...base, isResearched: () => true, namesInSector: () => many },
    );
    expect(out.ledgersInSector?.names).toHaveLength(LEDGER_NAME_ROWS);
    expect(out.ledgersInSector?.more).toBe(2);
  });

  it("reads a market through its fund: the fund's ledger, and a campaign whose cast holds the fund", () => {
    const out = houseResearchOn(
      { kind: "market", subject: "oil" },
      { ...base, isResearched: (t: string) => t === "USO", campaigns: [AI, OIL, CRUDE, BROAD] },
    );
    expect(out.fund).toBe("USO");
    expect(out.shelf).toBe("has a research ledger");
    expect(out.campaigns.map((c) => c.id)).toEqual(["crude-fund"]);
    expect(out).not.toHaveProperty("ledgersInSector");
  });

  it("finds a market through the house campaign played through it", () => {
    const out = houseResearchOn({ kind: "market", subject: "us-large-caps" }, base);
    expect(out.campaigns.map((c) => c.id)).toEqual(["broad-market"]);
    expect(out.lessons).toEqual([]);
    expect(out.fund).toBe("SPY");
    expect(out.shelf).toBe("no ledger yet");
  });

  it("includes a sector-wide lesson (no symbols) for the sector, which a name read leaves out", () => {
    const sector = houseResearchOn({ kind: "sector", subject: "Technology" }, base);
    expect(sector.lessons.map((l) => l.idea)).toContain("Every AI name moves together.");
    const name = houseResearchOn({ kind: "name", subject: "NVDA" }, base);
    expect(name.lessons.map((l) => l.idea)).not.toContain("Every AI name moves together.");
  });
});

describe("houseResearchOn — the research list", () => {
  it("says a waiting question with how many asks are ahead and how many members asked, never a key or the words", () => {
    const queue = [
      ask({ id: "name:AAPL", subject: "AAPL" }),
      ask({ id: "name:PLTR", askers: ["m-1111", "m-2222"], question: "Is PLTR priced for it?" }),
      ask({ id: "m-1111~mine/name:PLTR", campaign: "m-1111~mine", askers: ["m-1111", "m-3333"] }),
    ];
    const out = houseResearchOn({ kind: "name", subject: "PLTR" }, { ...base, queue });
    expect(out.onTheList).toEqual({ waiting: true, ahead: 1, askedBy: 3 });
    const text = JSON.stringify(out);
    for (const secret of ["m-1111", "m-2222", "m-3333", "Is PLTR priced", "mine"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("says research does not read the list yet while no lane reads it", () => {
    const out = houseResearchOn({ kind: "name", subject: "PLTR" }, base);
    expect(out.onTheList).toEqual({ waiting: false });
    expect(out.wait).toBe(
      "The house's research does not read the list yet, so no wait can be promised.",
    );
  });

  it("names the place in line once a lane does read it", () => {
    const queue = [ask({ id: "name:AAPL", subject: "AAPL" }), ask({ id: "name:PLTR" })];
    const out = houseResearchOn(
      { kind: "name", subject: "PLTR" },
      { ...base, queue, laneReads: true },
    );
    expect(out.wait).toContain("1 ask");
    expect(out.wait).not.toContain("does not read");
  });
});

describe("houseResearchOn — nothing held", () => {
  it("says so plainly: empty lists and no ledger yet, never an error", () => {
    const out = houseResearchOn({ kind: "name", subject: "ZZZZ" }, base);
    expect(out.shelf).toBe("no ledger yet");
    expect(out.campaigns).toEqual([]);
    expect(out.lessons).toEqual([]);
    expect(out.more).toBe(0);
    expect(out.onTheList).toEqual({ waiting: false });
  });

  it("always carries what it does not cover and that it is never a recommendation", () => {
    const out = houseResearchOn({ kind: "sector", subject: "Utilities" }, base);
    expect(out.notCovered).toEqual(["news", "lawsuits"]);
    expect(out.note).toBe(HOUSE_RESEARCH_NOTE);
    expect(out.note).toContain("never a recommendation");
  });
});

describe("createHouseResearchReader", () => {
  it("reads the shelf fresh on every call, and turns a failed list read into an empty list", () => {
    let shelfReads = 0;
    const read = createHouseResearchReader({
      shelf: () => {
        shelfReads += 1;
        return (t) => t === "NVDA";
      },
      queue: () => {
        throw new Error("disk gone");
      },
      answered: () => false,
      today: () => TODAY,
      campaigns: [AI],
      lessons: LESSONS,
    });
    const out = read({ kind: "name", subject: "NVDA" }, ["NVDA"]);
    expect(out.shelf).toBe("has a research ledger");
    expect(out.onYourBook).toBe(true);
    expect(out.onTheList).toEqual({ waiting: false });
    read({ kind: "sector", subject: "Technology" }, []);
    expect(shelfReads).toBe(2);
  });

  it("drops an ask the shelf already answers: it is not waiting, and it is not counted ahead of another", () => {
    const read = createHouseResearchReader({
      shelf: () => () => false,
      queue: () => [
        ask({ id: "name:AAPL", subject: "AAPL" }),
        ask({ id: "name:MSFT", subject: "MSFT" }),
        ask({ id: "name:PLTR" }),
      ],
      answered: (a) => a.subject === "AAPL",
      today: () => TODAY,
      laneReads: true,
      campaigns: [],
      lessons: [],
    });
    const answered = read({ kind: "name", subject: "AAPL" }, []);
    expect(answered.onTheList).toEqual({ waiting: false });
    expect(answered.wait).toBe("No question about it is waiting on the research list.");
    const behind = read({ kind: "name", subject: "PLTR" }, []);
    expect(behind.onTheList).toEqual({ waiting: true, ahead: 1, askedBy: 1 });
    expect(behind.wait).toBe("1 ask is ahead of it on the research list.");
  });
});
