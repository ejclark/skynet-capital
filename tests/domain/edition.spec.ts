import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CAMPAIGNS, campaignById } from "../../src/domain/campaigns.js";
import {
  type Edition,
  editions,
  editionView,
  loadEditions,
  marketToday,
  parseEdition,
} from "../../src/domain/edition.js";

// The day's edition (#7077): the landing page's market news. The record is hand-written until
// #6949 slice 5 writes it, so its honesty rules live in the loader and are proved here.

/** A minimal valid edition, as plain data a spec can bend one field of. */
function valid(): Record<string, unknown> {
  return {
    date: "2026-11-06",
    writtenBy: "Written by hand for a spec.",
    stories: [
      {
        id: "lead",
        headline: "Chip stocks fell hard.",
        line: "Chips fell hard",
        narrator: "Sensors logged a hard hit.",
        symbols: ["SMH"],
        facts: [{ label: "SMH", value: "−11.2%", move: "down" }],
        reports: [
          { date: "2026-11-10", when: "after the close", what: "CRWV Q3", status: "confirmed" },
        ],
        more: [{ text: "Press tied it to the vote.", mark: "reported", source: "CNBC" }],
      },
    ],
    next: [
      { date: "2026-11-05", what: "Already past", status: "confirmed" },
      { date: "2026-11-10", what: "CPI", status: "confirmed" },
    ],
  };
}

const parse = (raw: unknown) => parseEdition(raw, "2026-11-06.json", "2026-11-06");

function withStory(change: Record<string, unknown>): Record<string, unknown> {
  const e = valid();
  const [story] = e.stories as Record<string, unknown>[];
  return { ...e, stories: [{ ...story, ...change }] };
}

describe("the edition record", () => {
  it("loads every checked-in edition, and the hand-written one leads with the chip drop", () => {
    expect(editions().length).toBeGreaterThan(0);
    const first = editions().find((e) => e.date === "2026-11-06");
    expect(first?.stories[0]?.id).toBe("chip-drop");
    expect(first?.campaign).toBe("ai-buildout");
  });

  it("names only campaigns that are real records", () => {
    const ids = new Set(CAMPAIGNS.map((c) => c.id));
    for (const e of editions()) if (e.campaign) expect(ids.has(e.campaign), e.date).toBe(true);
  });

  it("accepts a valid edition", () => {
    expect(parse(valid()).stories).toHaveLength(1);
  });

  it("refuses a base rate with no sample size (criterion 7)", () => {
    const line = { text: "It filled 38% of the time.", mark: "measured", source: "study" };
    expect(() => parse(withStory({ more: [line] }))).toThrow(/base rate with no sample size/);
    expect(parse(withStory({ more: [{ ...line, n: 65 }] })).stories[0]?.more[0]?.n).toBe(65);
    const fact = { label: "Fill rate", value: "38%", move: "up", note: "38% of the time" };
    expect(() => parse(withStory({ facts: [fact] }))).toThrow(/sample size/);
  });

  it("refuses copy that frames a time as good to buy (criterion 7)", () => {
    for (const text of [
      "A great time to buy chips.",
      "Buy the dip.",
      "A buying opportunity.",
      "Is this a chance to buy?",
    ]) {
      expect(() => parse(withStory({ headline: text }))).toThrow(/good to buy/);
    }
    expect(() =>
      parse(withStory({ more: [{ text: "You should buy now.", mark: "call", source: "x" }] })),
    ).toThrow(/good to buy/);
  });

  it("marks every line, and names its source", () => {
    expect(() => parse(withStory({ more: [{ text: "Up.", source: "x" }] }))).toThrow(/mark/);
    expect(() => parse(withStory({ more: [{ text: "Up.", mark: "guess", source: "x" }] }))).toThrow(
      /mark/,
    );
    expect(() => parse(withStory({ more: [{ text: "Up.", mark: "measured" }] }))).toThrow(
      /no source/,
    );
  });

  it("holds each story's one line to what fits beside its number at 390 (round 3, AT4)", () => {
    expect(() => parse(withStory({ line: undefined }))).toThrow(/line must be one line/);
    expect(() => parse(withStory({ line: "x".repeat(35) }))).toThrow(/at most 34/);
    expect(() => parse(withStory({ line: "Chips fell\nhard" }))).toThrow(/one line/);
    expect(() => parse(withStory({ line: "A chance to buy" }))).toThrow(/good to buy/);
  });

  it("holds the narrator to one original line (criterion 4)", () => {
    expect(() => parse(withStory({ narrator: "Captain's log: chips fell." }))).toThrow(/franchise/);
    // Market words that a franchise also uses stay usable.
    expect(
      parse(withStory({ narrator: "Enterprise AI budgets held; Vulcan Materials slid." })),
    ).toBeTruthy();
    expect(() => parse(withStory({ narrator: "x".repeat(161) }))).toThrow(/one line/);
    expect(() => parse(withStory({ narrator: "One.\nTwo." }))).toThrow(/one line/);
  });

  it("draws every key fact's move as a shape, so it needs one (docs/IA.md §5.9)", () => {
    expect(() => parse(withStory({ facts: [{ label: "SMH", value: "1" }] }))).toThrow(
      /move must be/,
    );
    expect(() =>
      parse(withStory({ facts: [{ label: "SMH", value: "1", move: "sideways" }] })),
    ).toThrow(/move must be/);
  });

  it("names the list when an entry is not an object, never a bare TypeError", () => {
    expect(() => parse({ ...valid(), next: [null] })).toThrow(
      /2026-11-06\.json: next must be a list of objects/,
    );
    expect(() => parse({ ...valid(), stories: ["x"] })).toThrow(
      /stories must be a list of objects/,
    );
    expect(() => parse(withStory({ facts: [1] }))).toThrow(/facts must be a list of objects/);
  });

  it("refuses a repeat in a list the page keys its rows by", () => {
    const fact = { label: "NVDA", value: "1", move: "up" };
    expect(() => parse(withStory({ facts: [fact, fact] }))).toThrow(/lists "NVDA" twice/);
    const line = { text: "Up.", mark: "measured", source: "x" };
    expect(() => parse(withStory({ more: [line, line] }))).toThrow(/twice/);
    const d = { date: "2026-11-10", what: "CPI", status: "confirmed" };
    expect(() => parse({ ...valid(), next: [d, d] })).toThrow(/next lists "2026-11-10 CPI" twice/);
  });

  it("keeps key facts to one to four", () => {
    expect(() => parse(withStory({ facts: [] }))).toThrow(/1 to 4/);
    const fact = { label: "A", value: "1", move: "up" };
    expect(() => parse(withStory({ facts: [fact, fact, fact, fact, fact] }))).toThrow(/1 to 4/);
  });

  it("names the file, and the date must equal it", () => {
    expect(() => parseEdition(valid(), "2026-11-07.json", "2026-11-07")).toThrow(
      /2026-11-07\.json: date "2026-11-06" must equal the file name/,
    );
  });

  it("refuses a campaign that is not an id, and a report with no status", () => {
    expect(() => parse({ ...valid(), campaign: "Not A Slug" })).toThrow(/campaign id/);
    const report = { date: "2026-11-10", what: "CPI" };
    expect(() => parse(withStory({ reports: [report] }))).toThrow(/confirmed or estimate/);
  });

  it("loads a directory oldest first", () => {
    const dir = mkdtempSync(join(tmpdir(), "editions-"));
    try {
      writeFileSync(join(dir, "2026-11-06.json"), JSON.stringify(valid()));
      writeFileSync(
        join(dir, "2026-11-02.json"),
        JSON.stringify({ ...valid(), date: "2026-11-02" }),
      );
      expect(loadEditions(dir).map((e) => e.date)).toEqual(["2026-11-02", "2026-11-06"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("editionView — what the landing page reads", () => {
  const older = { ...parse(valid()), date: "2026-11-02" } as Edition;
  const latest = parse(valid());
  const noTitle = () => undefined;

  it("counts the day in New York, not UTC", () => {
    // 01:00 UTC on the 9th is still the evening of the 8th on Wall Street.
    expect(marketToday(new Date("2026-11-09T01:00:00Z"))).toBe("2026-11-08");
  });

  it("serves the latest edition on or before today, never one dated ahead", () => {
    const view = editionView([older, latest], new Date("2026-11-08T15:00:00Z"), noTitle);
    expect(view.today).toBe("2026-11-08");
    expect(view.edition?.date).toBe("2026-11-06");
    const before = editionView([older, latest], new Date("2026-11-04T15:00:00Z"), noTitle);
    expect(before.edition?.date).toBe("2026-11-02");
  });

  it("cuts passed items from what's next, and marks a story's passed report instead of hiding it", () => {
    const view = editionView([latest], new Date("2026-11-08T15:00:00Z"), noTitle);
    expect(view.edition?.next.map((d) => d.what)).toEqual(["CPI"]);
    expect(view.edition?.stories[0]?.reports[0]?.passed).toBeUndefined();
    const later = editionView([latest], new Date("2026-11-11T15:00:00Z"), noTitle);
    expect(later.edition?.next).toEqual([]);
    // The story is written as of its close: its report stays, so "three are inbound" still counts
    // three on the list, and the page says which have passed.
    expect(later.edition?.stories[0]?.reports).toEqual([
      {
        date: "2026-11-10",
        when: "after the close",
        what: "CRWV Q3",
        status: "confirmed",
        passed: true,
      },
    ]);
  });

  it("says how old the edition is, in calendar days from its close", () => {
    expect(editionView([latest], new Date("2026-11-06T22:00:00Z"), noTitle).edition?.ageDays).toBe(
      0,
    );
    expect(editionView([latest], new Date("2026-11-09T15:00:00Z"), noTitle).edition?.ageDays).toBe(
      3,
    );
    expect(editionView([latest], new Date("2026-12-01T15:00:00Z"), noTitle).edition?.ageDays).toBe(
      25,
    );
  });

  it("answers null when no edition has been written for any day yet", () => {
    expect(editionView([latest], new Date("2026-11-01T15:00:00Z"), noTitle).edition).toBeNull();
  });

  it("names the campaign the stories belong to", () => {
    const view = editionView(
      [{ ...latest, campaign: "ai-buildout" }],
      new Date("2026-11-08T15:00:00Z"),
      (id) => campaignById(id)?.title,
    );
    expect(view.edition?.campaignTitle).toBe("The AI buildout");
  });
});
