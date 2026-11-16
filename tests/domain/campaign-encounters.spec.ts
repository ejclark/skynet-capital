import { encounterSetLines } from "../../src/domain/campaign-encounter-lines.js";
import {
  checkedOn,
  type EncounterSet,
  type ExploreEncounter,
  encountersFor,
  NAME_CHOICES,
  type NameEncounter,
  pose,
  reveal,
} from "../../src/domain/campaign-encounters.js";
import type {
  Landscape,
  Move,
  Reported,
  Scheduled,
  Tested,
} from "../../src/domain/campaign-landscape.js";
import { type LessonRecord, startDiscovery } from "../../src/domain/campaign-lessons.js";
import { STALE_AFTER_DAYS } from "../../src/domain/campaign-verdicts.js";
import { type Campaign, campaignById } from "../../src/domain/campaigns.js";

/**
 * CAMPAIGN ENCOUNTERS (#6952 slice 3, criteria 2–4 and 6). The done line: explore and find-names
 * encounters are generated from a campaign's landscape. Each `describe` holds one criterion to the
 * generator: a question before its answer, a mark on every claim, old research said to be old, and
 * a stand-aside choice no different in shape from the other two.
 */

const TODAY = "2026-11-09";

const house = (id: string): Campaign => {
  const c = campaignById(id);
  if (!c) throw new Error(`the ${id} campaign is missing`);
  return c;
};

const ENERGY = house("energy-for-ai");

const move = (symbol: string, changePct: number): Move => ({
  symbol,
  from: { date: "2026-10-30", close: 100 },
  to: { date: "2026-11-06", close: 100 + changePct },
  changePct,
  source: "fixture closes",
});

const scheduled = (over: Partial<Scheduled> & Pick<Scheduled, "id" | "date">): Scheduled => ({
  title: over.id,
  daysUntil: 5,
  kind: "earnings",
  impact: "critical",
  dateIs: "estimated",
  source: "EST: fixture cadence",
  reasons: [{ via: "cast", symbol: "CEG" }],
  ...over,
});

const reported = (over: Partial<Reported> = {}): Reported => ({
  title: "Constellation signs a new power deal",
  url: "https://example.com/ceg",
  at: "2026-11-08T12:00:00Z",
  source: "NEWS: example.com via GDELT",
  evidence: "reported",
  reasons: [{ via: "cast", symbol: "CEG" }],
  ...over,
});

const landscape = (over: Partial<Landscape> = {}): Landscape => ({
  campaign: { id: ENERGY.id, title: ENERGY.title, storyline: ENERGY.storyline },
  anchor: "Utilities (XLU)",
  today: TODAY,
  moved: {
    sessions: 5,
    moves: [
      move("SPXC", -10.8),
      move("CMI", -10),
      move("XLU", 1.2),
      move("D", 3),
      move("ET", -7.9),
    ],
  },
  unread: [],
  scheduled: [],
  reported: [],
  tested: [],
  ...over,
});

const RECORD: LessonRecord = {
  campaign: ENERGY.id,
  lessons: [
    {
      id: "bwxt-killed",
      kind: "killed",
      idea: "BWXT's backlog converts.",
      symbols: ["BWXT"],
      on: "2026-11-07",
      recheckOn: "2027-02-22",
      falsifier: "Q4 book-to-bill of 1.0 or better.",
      source: "fixture.md",
    },
    {
      id: "cmi-watch",
      kind: "on-watch",
      idea: "CMI's power margins rose.",
      symbols: ["CMI"],
      on: "2026-11-07",
      recheckOn: "2027-02-05",
      falsifier: "CMI closes above $500.",
      source: "fixture.md",
    },
    {
      id: "spxc-old-watch",
      kind: "on-watch",
      idea: "SPXC's backlog grows.",
      symbols: ["SPXC"],
      on: "2026-08-12",
      recheckOn: "2027-02-23",
      source: "old-study.md",
    },
    {
      id: "ceg-due",
      kind: "on-watch",
      idea: "CEG's contracts sit outside the cap.",
      symbols: ["CEG"],
      on: "2026-11-07",
      recheckOn: TODAY,
      source: "fixture.md",
    },
    {
      id: "mod-killed",
      kind: "killed",
      idea: "MOD as a cooling play.",
      symbols: ["MOD"],
      on: "2026-08-12",
      falsifier: "New evidence only.",
      source: "old-study.md",
    },
    {
      id: "gev-watch",
      kind: "on-watch",
      idea: "GEV's turbine slots are sold out.",
      symbols: ["GEV"],
      on: "2026-11-07",
      recheckOn: "2027-01-20",
      source: "fixture.md",
    },
  ],
};

const brief = () => startDiscovery(ENERGY.id, TODAY, { records: [RECORD] });

const explore = (l: Landscape = landscape()): EncounterSet =>
  encountersFor(ENERGY, { landscape: l, brief: brief(), mode: "explore" });

const findNames = (l: Landscape = landscape()): EncounterSet =>
  encountersFor(ENERGY, { landscape: l, brief: brief(), mode: "find-names" });

const exploreOf = (set: EncounterSet): ExploreEncounter[] =>
  set.encounters.filter((e): e is ExploreEncounter => e.kind === "explore");

const namesOf = (set: EncounterSet): NameEncounter[] =>
  set.encounters.filter((e): e is NameEncounter => e.kind === "find-names");

const nameFor = (set: EncounterSet, symbol: string): NameEncounter => {
  const e = namesOf(set).find((n) => n.symbol === symbol);
  if (!e) throw new Error(`no find-names encounter for ${symbol}`);
  return e;
};

describe("a mode is a set of encounters, never a screen (criterion 6)", () => {
  it("posts explore questions in explore mode and candidates in find-names mode", () => {
    expect(exploreOf(explore()).length).toBeGreaterThan(0);
    expect(namesOf(explore())).toEqual([]);
    expect(namesOf(findNames()).length).toBeGreaterThan(0);
    expect(exploreOf(findNames())).toEqual([]);
  });

  it("reads the campaign's own mode when none is passed: energy for AI starts in explore", () => {
    const set = encountersFor(ENERGY, { landscape: landscape(), brief: brief() });
    expect(set.mode).toBe("explore");
  });

  it("posts build-a-strategy's names in that mode, and only them", () => {
    const set = encountersFor(ENERGY, {
      landscape: landscape(),
      brief: brief(),
      mode: "build-strategy",
    });
    expect(set.encounters.length).toBeGreaterThan(0);
    expect(set.encounters.every((e) => e.kind === "build-strategy")).toBe(true);
    expect(set.note).toBeUndefined();
  });

  it("posts nothing in play, and says where those encounters come from", () => {
    const set = encountersFor(ENERGY, { landscape: landscape(), brief: brief(), mode: "play" });
    expect(set.encounters).toEqual([]);
    expect(set.note).toMatch(/#6948/);
  });
});

describe("the question comes before the answer (criterion 2)", () => {
  it("a posed encounter carries no answer and no verdict", () => {
    for (const e of [...explore().encounters, ...findNames().encounters]) {
      const posed = pose(e) as Record<string, unknown>;
      expect(posed.answer).toBeUndefined();
      expect(posed.house).toBeUndefined();
      expect(posed.question).toBe(e.question);
      expect(posed.choices).toBe(e.choices);
    }
  });

  it("reveal takes a pick that is one of the choices, and refuses anything else", () => {
    const e = exploreOf(explore())[0];
    if (!e) throw new Error("no explore encounter");
    expect(reveal(e, e.answer.choice).matched).toBe(true);
    expect(() => reveal(e, "not-a-choice")).toThrow(/not a choice/);
  });

  it("every explore answer is one of its own choices", () => {
    for (const e of exploreOf(explore()))
      expect(e.choices.map((c) => c.id)).toContain(e.answer.choice);
  });

  it("the moved-most choices are alphabetical, so their order gives the answer away to no one", () => {
    const e = exploreOf(explore()).find((x) => x.topic === "moved-most");
    expect(e?.choices.map((c) => c.id)).toEqual(["CMI", "D", "ET", "SPXC"]);
    expect(e?.answer.choice).toBe("SPXC");
  });

  it("a name tied with the top move is left out, so moved-most has one right answer", () => {
    const tied = landscape({
      moved: {
        sessions: 5,
        moves: [move("CEG", -4.2), move("VST", 4.2), move("ET", -3), move("D", 1)],
      },
    });
    const e = exploreOf(explore(tied)).find((x) => x.topic === "moved-most");
    expect(e?.answer.choice).toBe("CEG");
    expect(e?.choices.map((c) => c.id)).toEqual(["CEG", "D", "ET"]);
  });

  it("a fund a lesson names is still a benchmark, never a candidate", () => {
    const record: LessonRecord = {
      campaign: ENERGY.id,
      lessons: [
        {
          id: "xlu-watch",
          kind: "on-watch",
          idea: "Utilities as a group.",
          symbols: ["SPY"],
          on: "2026-11-07",
          recheckOn: "2027-01-01",
          source: "fixture.md",
        },
      ],
    };
    const set = encountersFor(ENERGY, {
      landscape: landscape(),
      brief: startDiscovery(ENERGY.id, TODAY, { records: [record] }),
      mode: "find-names",
    });
    expect(namesOf(set).map((n) => n.symbol)).not.toContain("SPY");
  });

  it("a fund is a benchmark, not a name: XLU never appears as a choice or a candidate", () => {
    const ids = exploreOf(explore()).flatMap((e) => e.choices.map((c) => c.id));
    expect(ids).not.toContain("XLU");
    expect(namesOf(findNames()).map((n) => n.symbol)).not.toContain("XLU");
    expect(namesOf(findNames()).map((n) => n.symbol)).not.toContain("XLE");
  });
});

describe("every claim in an answer carries its mark, source and date (criterion 2)", () => {
  const full = landscape({
    scheduled: [scheduled({ id: "ceg-q3-print", date: "2026-11-14" })],
    reported: [reported()],
    tested: [
      {
        question: "Does the group trade as one bet?",
        conviction: "fixture-view",
        claim: "1",
        statement: "1. A studied claim.",
        bucket: "tested",
        tested: true,
        study: {
          reading: "r",
          call: "The group fell together",
          confidence: "high",
          dataDate: "2026-11-06",
        },
      } satisfies Tested,
    ],
  });

  it("marks, sources and dates every claim, on every topic", () => {
    const set = explore(full);
    expect(new Set(exploreOf(set).map((e) => e.topic))).toEqual(
      new Set(["moved-most", "together", "date", "evidence", "tested"]),
    );
    for (const e of exploreOf(set))
      for (const c of e.answer.claims) {
        expect(["measured", "reported", "estimated"]).toContain(c.mark);
        expect(c.source.trim()).not.toBe("");
        expect(c.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
  });

  it("a press headline is reported, never measured", () => {
    const e = exploreOf(explore(full)).find((x) => x.topic === "evidence");
    expect(e?.answer.choice).toBe("reported");
    expect(e?.answer.claims[0]?.mark).toBe("reported");
  });

  it("an estimated date is marked estimated, never measured", () => {
    const e = exploreOf(explore(full)).find((x) => x.topic === "date");
    expect(e?.answer.choice).toBe("estimated");
    expect(e?.answer.claims[0]?.mark).toBe("estimated");
  });

  it("an untested claim is not answered as tested", () => {
    const untested = landscape({
      tested: [
        {
          question: "Will it hold?",
          conviction: "fixture-view",
          claim: "2",
          statement: "2. A forward claim.",
          bucket: "forward",
          tested: false,
        },
      ],
    });
    const e = exploreOf(explore(untested)).find((x) => x.topic === "tested");
    expect(e?.answer.choice).toBe("untested");
    expect(e?.answer.claims[0]?.mark).toBe("reported");
  });

  it("the words carry each claim's mark beside its source and date", () => {
    const lines = encounterSetLines(explore(full)).join("\n");
    expect(lines).toContain("(estimated, not confirmed · EST: fixture cadence");
    expect(lines).toContain("(reported · NEWS: example.com via GDELT · 2026-11-08)");
    expect(lines).toContain("(measured · fixture closes · 2026-11-06)");
  });

  it("the words put every question before its reveal", () => {
    const lines = encounterSetLines(explore(full));
    const qs = lines.flatMap((l, i) => (l.startsWith("Q. ") ? [i] : []));
    const reveals = lines.flatMap((l, i) => (l.trim() === "Reveal:" ? [i] : []));
    expect(qs.length).toBe(reveals.length);
    for (const [i, q] of qs.entries()) expect(q).toBeLessThan(reveals[i] ?? -1);
  });
});

describe("old research is said to be old, and re-checked first (criterion 3)", () => {
  it("reads the day a calendar source was checked", () => {
    expect(checkedOn("FED: federalreserve.gov FOMC calendar, checked 2026-08-15")).toBe(
      "2026-08-15",
    );
    expect(checkedOn("IR: fixture")).toBeUndefined();
  });

  it(`a date checked more than ${STALE_AFTER_DAYS} days ago is labelled stale and queued for a re-check`, () => {
    const old = landscape({
      scheduled: [
        scheduled({
          id: "fomc-2026-12-09",
          date: "2026-12-09",
          dateIs: "confirmed",
          source: "FED: calendar, checked 2026-08-15",
        }),
      ],
    });
    const set = explore(old);
    const e = exploreOf(set).find((x) => x.topic === "date");
    expect(e?.stale).toEqual({ since: "2026-08-15", days: 86 });
    expect(e?.answer.claims[0]?.date).toBe("2026-08-15");
    expect(set.rechecks.map((r) => r.subject)).toContain(e?.id);
    expect(encounterSetLines(set).join("\n")).toContain("86 days old");
  });

  it("a study whose data is past the line is stale; a fresh one is not", () => {
    const study = (dataDate: string): Tested => ({
      question: "Q?",
      conviction: "fixture-view",
      claim: "1",
      statement: "1. x",
      bucket: "tested",
      tested: true,
      study: { reading: "r", call: "c", confidence: "low", dataDate },
    });
    const of = (d: string) =>
      exploreOf(explore(landscape({ tested: [study(d)] }))).find((x) => x.topic === "tested");
    expect(of("2026-09-01")?.stale?.days).toBe(69);
    expect(of("2026-11-06")?.stale).toBeUndefined();
  });

  it("a watch older than the line is never shown as current: the house checks it first", () => {
    const spxc = nameFor(findNames(), "SPXC");
    expect(spxc.house.verdict).toBe("check-first");
    expect(spxc.house.stale?.days).toBe(89);
    expect(findNames().rechecks.map((r) => r.subject)).toContain("name:SPXC");
  });

  it("a watch due for its re-check today is checked first, not shown as watch", () => {
    expect(nameFor(findNames(), "CEG").house.verdict).toBe("check-first");
  });

  it("a fresh watch is shown as watch, with what would prove it wrong", () => {
    const cmi = nameFor(findNames(), "CMI").house;
    expect(cmi.verdict).toBe("watch");
    expect(cmi.why).toContain("CMI closes above $500.");
    expect(cmi.stale).toBeUndefined();
  });

  it("the house is never the one calling a name enterable", () => {
    for (const n of namesOf(findNames())) expect(n.house.verdict).not.toBe("enter");
  });
});

describe("every candidate shows the house's checks and a stand-aside of equal weight (criterion 4)", () => {
  it("every candidate offers the same three choices, stand aside among them", () => {
    for (const n of namesOf(findNames())) {
      expect(n.choices).toEqual(NAME_CHOICES);
      expect(n.choices.map((c) => c.id)).toContain("stand-aside");
      for (const c of n.choices) expect(Object.keys(c).sort()).toEqual(["id", "label"]);
    }
  });

  it("shows the record, the price, the next report and both sweep instruments on each name", () => {
    for (const n of namesOf(findNames()))
      expect(n.checks.map((c) => c.label)).toEqual(
        expect.arrayContaining([
          "The house's record",
          "Price",
          "Next report",
          "earnings-cycle",
          "intraday-edges",
        ]),
      );
  });

  it("an instrument that has not run says so, never 'no edge'", () => {
    const cmi = nameFor(findNames(), "CMI");
    const ec = cmi.checks.find((c) => c.label === "earnings-cycle");
    expect(ec?.claim).toBeUndefined();
    expect(ec?.text).toBe("Not run on CMI for this campaign yet.");
  });

  it("a sweep result handed in is shown, measured, with its source and date", () => {
    const set = encountersFor(ENERGY, {
      landscape: landscape(),
      brief: brief(),
      mode: "find-names",
      sweep: {
        CMI: [
          { instrument: "earnings-cycle", result: "no edge", on: "2026-11-07", source: "sweep" },
        ],
      },
    });
    const ec = nameFor(set, "CMI").checks.find((c) => c.label === "earnings-cycle");
    expect(ec?.claim).toEqual({
      text: "no edge",
      mark: "measured",
      source: "sweep",
      date: "2026-11-07",
    });
  });

  it("a name with no closes says nothing about price", () => {
    const vst = nameFor(findNames(), "VST").checks.find((c) => c.label === "Price");
    expect(vst?.claim).toBeUndefined();
    expect(vst?.text).toMatch(/No closes read/);
  });

  it("the record check says a finding exists and when; what it says waits for the reveal", () => {
    const cmi = nameFor(findNames(), "CMI");
    const rec = cmi.checks.find((c) => c.label === "The house's record");
    expect(rec?.text).toContain("2026-11-07");
    expect(rec?.claim).toBeUndefined();
    expect(JSON.stringify(cmi.checks)).not.toContain("power margins rose");
    expect(JSON.stringify(pose(cmi))).not.toContain("power margins rose");
    expect(cmi.house.record).toEqual([
      {
        text: "CMI's power margins rose.",
        mark: "reported",
        source: "fixture.md",
        date: "2026-11-07",
      },
    ]);
  });

  it("a verdict's next re-check is in the future tense, never 're-checked'", () => {
    for (const n of namesOf(findNames())) expect(n.house.why).not.toMatch(/re-checked on/i);
    expect(nameFor(findNames(), "BWXT").house.why).toContain("Next re-check 2027-02-22.");
  });

  it("a killed cast name stays a candidate, and the house stands aside on it", () => {
    const bwxt = nameFor(findNames(), "BWXT");
    expect(bwxt.house.verdict).toBe("stand-aside");
    expect(reveal(bwxt, "stand-aside").matched).toBe(true);
    expect(reveal(bwxt, "enter").matched).toBe(false);
  });

  it("a name the house holds no verdict on matches no pick", () => {
    expect(reveal(nameFor(findNames(), "VST"), "watch").matched).toBeUndefined();
  });

  it("a killed name outside the cast is withheld; a watched one outside the cast is asked about", () => {
    const set = findNames();
    expect(set.withheld.map((w) => w.symbol)).toEqual(["MOD"]);
    expect(namesOf(set).map((n) => n.symbol)).not.toContain("MOD");
    expect(nameFor(set, "GEV").role).toBe("On the house's watch");
  });
});

describe("the checked-in energy-for-AI record generates its encounters", () => {
  it("find-names asks about every stock in the cast, with BWXT stood aside", () => {
    const set = encountersFor(ENERGY, {
      landscape: landscape({ moved: { sessions: 5, moves: [] }, unread: ["CEG"] }),
      brief: startDiscovery(ENERGY.id, TODAY),
      mode: "find-names",
    });
    expect(namesOf(set).map((n) => n.symbol)).toEqual(
      expect.arrayContaining(["CEG", "VST", "D", "SPXC", "CMI", "BWXT", "ET"]),
    );
    expect(nameFor(set, "BWXT").house.verdict).toBe("stand-aside");
    expect(set.withheld.map((w) => w.symbol)).toEqual(
      expect.arrayContaining(["SMR", "UEC", "MOD"]),
    );
  });
});
