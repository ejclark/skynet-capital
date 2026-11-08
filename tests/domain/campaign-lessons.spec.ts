import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LESSON_RECORDS,
  type LessonRecord,
  lessonsAnswering,
  lessonsFor,
  loadLessonRecords,
  parseLessonRecord,
  proposable,
  startDiscovery,
} from "../../src/domain/campaign-lessons.js";
import { CAMPAIGNS, campaignById, castSymbols } from "../../src/domain/campaigns.js";
import { everyEvent } from "../../src/domain/market-events.js";

/** One killed, one on watch, one tested, one angle-only kill: the four shapes a record holds. */
const record = (): LessonRecord => ({
  campaign: "test-campaign",
  lessons: [
    {
      id: "nope-dead",
      kind: "killed",
      idea: "NOPE's thesis",
      symbols: ["NOPE"],
      on: "2026-11-07",
      recheckOn: "2027-02-22",
      falsifier: "a new order book",
      source: "test",
    },
    {
      id: "watch-me",
      kind: "on-watch",
      idea: "WTCH on watch",
      symbols: ["WTCH"],
      on: "2026-11-07",
      recheckOn: "2026-12-01",
      source: "test",
    },
    {
      id: "one-bet",
      kind: "tested",
      idea: "they trade as one",
      symbols: [],
      on: "2026-11-07",
      falsifier: "fewer than 20 of 28 fall",
      source: "test",
    },
  ],
});

const raw = (lesson: Record<string, unknown>): Record<string, unknown> => ({
  campaign: "test-campaign",
  lessons: [
    {
      id: "a",
      kind: "killed",
      idea: "an idea",
      symbols: ["AAA"],
      on: "2026-11-07",
      falsifier: "x",
      source: "test",
      ...lesson,
    },
  ],
});
const parse = (lesson: Record<string, unknown>): LessonRecord =>
  parseLessonRecord(raw(lesson), "test-campaign.json", "test-campaign");

describe("a campaign's lesson record (#6952 slice 2, criterion 8)", () => {
  describe("WHEN discovery starts, it reads the record first", () => {
    it("does not re-propose BWXT, killed on 11-07, before its 2027-02-22 re-check", () => {
      const brief = startDiscovery("energy-for-ai", "2026-11-08");
      expect(brief.closed.map((l) => l.id)).toContain("bwxt-backlog-converts");
      const { propose, withheld } = proposable(brief, ["BWXT", "CMI", "VRT"]);
      expect(propose).toEqual(["CMI", "VRT"]);
      expect(withheld.map((w) => [w.symbol, w.lesson.id])).toEqual([
        ["BWXT", "bwxt-backlog-converts"],
      ]);
    });

    it("lets BWXT back in as a new case once the re-check date has passed", () => {
      const brief = startDiscovery("energy-for-ai", "2027-02-22");
      expect(brief.reopened.map((l) => l.id)).toContain("bwxt-backlog-converts");
      expect(proposable(brief, ["BWXT"]).propose).toEqual(["BWXT"]);
    });

    it("reopens a kill early only when new prints contradict it", () => {
      const before = startDiscovery("test-campaign", "2026-11-08", { records: [record()] });
      expect(proposable(before, ["nope"]).withheld).toHaveLength(1);
      const after = startDiscovery("test-campaign", "2026-11-08", {
        records: [record()],
        contradicted: ["nope-dead"],
      });
      expect(after.reopened.map((l) => l.id)).toEqual(["nope-dead"]);
      expect(proposable(after, ["NOPE"]).propose).toEqual(["NOPE"]);
    });

    it("keeps a kill with no re-check date closed until prints contradict it", () => {
      const brief = startDiscovery("energy-for-ai", "2030-01-01");
      expect(proposable(brief, ["MOD", "SMR", "UEC", "D"]).propose).toEqual([]);
    });

    it("puts a watched name whose re-check date has come up first, ahead of anything new", () => {
      const early = startDiscovery("test-campaign", "2026-11-30", { records: [record()] });
      expect(early.due).toEqual([]);
      expect(early.watching.map((l) => l.id)).toEqual(["watch-me"]);
      const due = startDiscovery("test-campaign", "2026-12-01", { records: [record()] });
      expect(due.due.map((l) => l.id)).toEqual(["watch-me"]);
      expect(due.tested.map((l) => l.id)).toEqual(["one-bet"]);
    });

    it("starts empty for a campaign with no record yet", () => {
      const brief = startDiscovery("ai-buildout", "2026-11-08");
      expect([...brief.closed, ...brief.reopened, ...brief.due, ...brief.watching]).toEqual([]);
      expect(proposable(brief, ["NVDA"]).propose).toEqual(["NVDA"]);
    });

    it("refuses a date that is not a calendar day", () => {
      expect(() => startDiscovery("energy-for-ai", "11/08/2026")).toThrow(/YYYY-MM-DD/);
    });
  });

  describe("the energy-for-AI record, seeded from the 11-07 encounters", () => {
    it("holds BWXT killed and SPXC, CMI, ET and CEG on watch, as the page called them", () => {
      const kinds = Object.fromEntries(
        lessonsFor("energy-for-ai")
          .filter((l) => l.symbols.length === 1)
          .map((l) => [l.symbols[0], l.kind]),
      );
      expect(kinds).toMatchObject({
        BWXT: "killed",
        SPXC: "on-watch",
        CMI: "on-watch",
        ET: "on-watch",
        CEG: "on-watch",
      });
    });

    it("never withholds CEG: the midterm-catalyst kill rejects an angle, not the name", () => {
      const brief = startDiscovery("energy-for-ai", "2026-11-08");
      expect(brief.closed.map((l) => l.id)).toContain("ceg-midterm-catalyst");
      expect(proposable(brief, ["CEG"]).propose).toEqual(["CEG"]);
    });

    it("cites a research file that exists for every lesson", () => {
      for (const r of LESSON_RECORDS)
        for (const l of r.lessons) expect(existsSync(l.source)).toBe(true);
    });
  });

  describe("the energy-for-AI campaign the record belongs to", () => {
    const c = campaignById("energy-for-ai");

    it("starts in explore mode, anchored on Utilities with its fund in the cast", () => {
      expect(c?.mode).toBe("explore");
      expect(c?.sector).toBe("Utilities");
      expect(c && castSymbols(c)).toContain("XLU");
    });

    it("has no dead force prefix", () => {
      const ids = everyEvent().map((e) => e.id);
      for (const force of c?.forces ?? [])
        for (const prefix of force.prefixes ?? [])
          expect(ids.some((id) => id.startsWith(prefix))).toBe(true);
    });

    it("gives every house campaign its own mode", () => {
      for (const campaign of CAMPAIGNS) expect(campaign.mode).toBeDefined();
    });
  });

  describe("the parser refuses a record discovery could not trust", () => {
    it("accepts a well-formed lesson", () => {
      expect(parse({}).lessons).toHaveLength(1);
    });

    it("refuses a lesson with neither a re-check date nor a falsifier", () => {
      expect(() => parse({ falsifier: undefined })).toThrow(/re-check date or a falsifier/);
    });

    it("refuses a name on watch with no date to check it again", () => {
      expect(() => parse({ kind: "on-watch" })).toThrow(/checked again/);
    });

    it("refuses an unknown kind, a bad ticker and a day that does not exist", () => {
      expect(() => parse({ kind: "maybe" })).toThrow(/kind must be/);
      expect(() => parse({ symbols: ["bwxt"] })).toThrow(/uppercase tickers/);
      expect(() => parse({ recheckOn: "2027-02-30" })).toThrow(/recheckOn/);
    });

    it("refuses a re-check date before the day it was recorded", () => {
      expect(() => parse({ recheckOn: "2026-11-01" })).toThrow(/before the day/);
    });

    it("refuses a record whose campaign differs from its file name", () => {
      expect(() => parseLessonRecord(raw({}), "other.json", "other")).toThrow(/file name/);
    });

    it("accepts a finding that names the ask it answers, and refuses one that names nothing real", () => {
      expect(parse({ answers: "name:PLTR" }).lessons[0]?.answers).toBe("name:PLTR");
      expect(parse({ answers: "energy-for-ai/sector:Utilities" }).lessons).toHaveLength(1);
      expect(() => parse({ answers: "who knows" })).toThrow(/answers must be an ask id/);
      expect(() => parse({ answers: "" })).toThrow(/answers must be an ask id/);
    });

    it("refuses the same lesson id twice", () => {
      const twice = raw({});
      twice.lessons = [...(twice.lessons as unknown[]), ...(twice.lessons as unknown[])];
      expect(() => parseLessonRecord(twice, "test-campaign.json", "test-campaign")).toThrow(
        /listed twice/,
      );
    });
  });

  describe("the loader", () => {
    it("refuses a record for a campaign that does not exist", () => {
      const dir = mkdtempSync(join(tmpdir(), "lessons-"));
      try {
        writeFileSync(join(dir, "ghost.json"), JSON.stringify({ campaign: "ghost", lessons: [] }));
        expect(() => loadLessonRecords(dir)).toThrow(/no campaign "ghost"/);
        expect(loadLessonRecords(dir, () => true).map((r) => r.campaign)).toEqual(["ghost"]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

describe("a finding names the ask it answers (#6952 slice 2c, criterion 9)", () => {
  it("lessonsAnswering returns only the findings for that ask, in that campaign", () => {
    // No house record answers an ask yet; the lookup is total and empty rather than throwing.
    expect(lessonsAnswering("energy-for-ai", "energy-for-ai/name:PLTR")).toEqual([]);
    expect(lessonsAnswering("no-such-campaign", "name:PLTR")).toEqual([]);
  });

  it("every house finding that names an ask uses the id the queue would have made", () => {
    for (const r of LESSON_RECORDS)
      for (const l of r.lessons) if (l.answers) expect(l.answers).toMatch(/^[a-z0-9~/-]*\w+:/);
  });
});
