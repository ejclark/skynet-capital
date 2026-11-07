import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CAMPAIGNS,
  type Campaign,
  campaignById,
  castSymbols,
  evidenceOf,
  isTradable,
  linkCensus,
  linkEvents,
  linkReasons,
  loadCampaigns,
  MAX_STORYLINE,
  parseCampaign,
} from "../../src/domain/campaigns.js";
import { everyEvent } from "../../src/domain/market-events.js";
import { MARKET_EVENTS, type MarketEvent } from "../../src/domain/market-events-data.js";
import { claimLabel } from "../../src/playbooks/claim-score.js";
import { SEEDED_CONVICTIONS } from "../../src/playbooks/conviction-seeds.js";

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id">): MarketEvent => ({
  kind: "sector",
  title: over.id,
  date: "2026-12-01",
  status: "confirmed",
  source: "IR: test",
  impact: "medium",
  symbols: [],
  ...over,
});

const minimal = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: "test-campaign",
  title: "Test",
  storyline: "A one-sentence story.",
  sector: "Energy",
  cast: [{ role: "Majors", symbols: ["XOM"], source: "test" }],
  forces: [{ id: "oil", name: "Oil supply", why: "test", prefixes: ["opec-"] }],
  openQuestions: [],
  ...over,
});

const parse = (over: Record<string, unknown> = {}): Campaign =>
  parseCampaign(minimal(over), "test-campaign.json", "test-campaign");

const aiBuildout = (): Campaign => {
  const c = campaignById("ai-buildout");
  if (!c) throw new Error("the AI-buildout campaign is missing");
  return c;
};

describe("campaigns", () => {
  describe("the AI-buildout campaign (#6949 slice 1)", () => {
    it("exists as a record in the Technology sector with a one-sentence storyline", () => {
      const c = aiBuildout();
      expect(c.sector).toBe("Technology");
      expect(c.storyline.length).toBeLessThanOrEqual(MAX_STORYLINE);
    });

    it("casts the research basket's names, the hyperscalers and the benchmarks", () => {
      expect(castSymbols(aiBuildout())).toEqual([
        "NVDA",
        "AMD",
        "AVGO",
        "MU",
        "TSM",
        "CRWV",
        "NBIS",
        "MSFT",
        "GOOG",
        "AMZN",
        "META",
        "SMH",
        "QQQ",
        "XLK",
      ]);
    });

    it("includes an instrument the order path trades today, so it is not research-only", () => {
      const c = aiBuildout();
      expect(c.researchOnly).toBeUndefined();
      expect(castSymbols(c).every(isTradable)).toBe(true);
    });

    it("cites a research file that exists for every cast role — no symbol guessed in", () => {
      for (const role of aiBuildout().cast) {
        const paths = role.source.match(/(?:docs|src)\/[\w./-]+\.(?:md|ts)/g) ?? [];
        expect(paths.length).toBeGreaterThan(0);
        for (const p of paths) expect(existsSync(p)).toBe(true);
      }
    });

    it("points every open question at a claim the conviction actually holds", () => {
      for (const q of aiBuildout().openQuestions) {
        const conviction = SEEDED_CONVICTIONS.find((c) => c.id === q.conviction);
        expect(conviction).toBeDefined();
        const labels = conviction?.claims.map((cl, i) => claimLabel(cl.statement, i + 1));
        expect(labels).toContain(q.claim);
      }
    });

    it("has no dead force prefix: each one matches at least one event on the calendar", () => {
      const ids = everyEvent().map((e) => e.id);
      for (const force of aiBuildout().forces)
        for (const prefix of force.prefixes ?? [])
          expect(ids.some((id) => id.startsWith(prefix))).toBe(true);
    });

    // The state block's falsifier: fewer than 50 linked events would mean the cast or forces are
    // drawn too narrowly to steer research.
    it("links at least 50 of the calendar's events", () => {
      expect(linkEvents(aiBuildout(), MARKET_EVENTS).length).toBeGreaterThanOrEqual(50);
    });
  });

  describe("linking", () => {
    const campaign = parse({
      cast: [{ role: "Chips", symbols: ["NVDA", "AMD"], source: "test" }],
      forces: [
        { id: "power", name: "Power", why: "test", prefixes: ["pjm-"] },
        { id: "rates", name: "Rates", why: "test", kinds: ["rates"] },
      ],
    });

    it("links an event that names a cast symbol, saying which", () => {
      expect(linkReasons(campaign, event({ id: "nvda-gtc", symbols: ["NVDA", "AAPL"] }))).toEqual([
        { via: "cast", symbol: "NVDA" },
      ]);
    });

    it("links an event a force matches by id prefix or by kind", () => {
      expect(linkReasons(campaign, event({ id: "pjm-capacity-auction-2026-12" }))).toEqual([
        { via: "force", force: "power" },
      ]);
      expect(linkReasons(campaign, event({ id: "treasury-10y-note", kind: "rates" }))).toEqual([
        { via: "force", force: "rates" },
      ]);
    });

    it("leaves out an event nothing in the campaign reaches", () => {
      expect(linkReasons(campaign, event({ id: "uk-cpi", kind: "macro-print" }))).toEqual([]);
    });

    it("carries each link's source, its date as timestamp, and how it is known", () => {
      const [link] = linkEvents(campaign, [
        event({ id: "pjm-x", source: "NEWS: press", date: "2026-12-02" }),
      ]);
      expect(link).toMatchObject({ source: "NEWS: press", at: "2026-12-02", evidence: "reported" });
    });

    it("counts links by kind, by force and by cast, an event under every force it matched", () => {
      const census = linkCensus(
        linkEvents(campaign, [
          event({ id: "pjm-a", kind: "rates", symbols: ["AMD"] }),
          event({ id: "pjm-b" }),
          event({ id: "other" }),
        ]),
      );
      expect(census).toEqual({
        linked: 2,
        byKind: { rates: 1, sector: 1 },
        byForce: { power: 2, rates: 1 },
        byCast: 1,
      });
    });
  });

  describe("how a linked item is marked", () => {
    it("marks a primary source measured, press reported, and our own projection estimated", () => {
      expect(evidenceOf("BLS: release schedule")).toBe("measured");
      expect(evidenceOf("NEWS: Reuters")).toBe("reported");
      expect(evidenceOf("EST: monthly cadence")).toBe("estimated");
    });
  });

  describe("the record's contract", () => {
    it("accepts a well-formed campaign", () => {
      expect(parse().id).toBe("test-campaign");
    });

    it("refuses a cast with nothing tradable unless it is marked research-only", () => {
      const untradable = { cast: [{ role: "Oil", symbols: ["BRENT"], source: "test" }] };
      expect(() => parse(untradable)).toThrow(/researchOnly/);
      expect(parse({ ...untradable, researchOnly: true }).researchOnly).toBe(true);
    });

    it("does not count crypto as tradable: this plan adds no crypto order path", () => {
      expect(isTradable("BTC/USD")).toBe(false);
      expect(isTradable("XLE")).toBe(true);
    });

    it("refuses a storyline over the cap", () => {
      expect(() => parse({ storyline: "x".repeat(MAX_STORYLINE + 1) })).toThrow(/storyline/);
    });

    it("refuses a sector that is not one of the 11 GICS sectors", () => {
      expect(() => parse({ sector: "AI" })).toThrow(/GICS/);
    });

    it("refuses a force that matches nothing, or names a kind the calendar lacks", () => {
      expect(() => parse({ forces: [{ id: "x", name: "X", why: "y" }] })).toThrow(
        /matches nothing/,
      );
      expect(() => parse({ forces: [{ id: "x", name: "X", why: "y", kinds: ["news"] }] })).toThrow(
        /event kinds/,
      );
    });

    it("refuses an id that differs from its file name", () => {
      expect(() => parseCampaign(minimal(), "other.json", "other")).toThrow(/file name/);
    });

    it("refuses an open question whose claim is not a claim label", () => {
      expect(() =>
        parse({ openQuestions: [{ question: "q", conviction: "c", claim: "three" }] }),
      ).toThrow(/claim label/);
    });
  });

  describe("the loader", () => {
    it("reads every campaign file in a directory, sorted by id", () => {
      const dir = mkdtempSync(join(tmpdir(), "campaigns-"));
      try {
        writeFileSync(join(dir, "b.json"), JSON.stringify(minimal({ id: "b" })));
        writeFileSync(join(dir, "a.json"), JSON.stringify(minimal({ id: "a" })));
        expect(loadCampaigns(dir).map((c) => c.id)).toEqual(["a", "b"]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("loads the checked-in campaigns at boot", () => {
      expect(CAMPAIGNS.map((c) => c.id)).toContain("ai-buildout");
    });
  });
});
