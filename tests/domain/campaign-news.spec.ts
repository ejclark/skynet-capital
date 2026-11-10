import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  linkNews,
  loadNews,
  type NewsItem,
  newsCensus,
  newsReasons,
  parseNewsItem,
  titleNames,
  titleNamesSymbol,
  titleSays,
} from "../../src/domain/campaign-news.js";
import {
  CAMPAIGNS,
  type Campaign,
  campaignById,
  linkEvents,
  parseCampaign,
} from "../../src/domain/campaigns.js";
import { MARKET_EVENTS } from "../../src/domain/market-events-data.js";

const item = (over: Partial<NewsItem> & Pick<NewsItem, "title">): NewsItem => ({
  id: "gdelt-abc",
  url: "https://example.com/story",
  at: "2026-11-06T05:00:00Z",
  source: "NEWS: example.com via GDELT",
  ...over,
});

const house = (id: string): Campaign => {
  const c = campaignById(id);
  if (!c) throw new Error(`the ${id} campaign is missing`);
  return c;
};

describe("campaign news (#6949 slice 4)", () => {
  describe("how a title says a word", () => {
    it("matches a capitalised word case-sensitively and a lowercase phrase in any case", () => {
      expect(titleSays("Fed holds rates", "Fed")).toBe(true);
      expect(titleSays("fed up with prices", "Fed")).toBe(false);
      expect(titleSays("PJM Capacity Auction clears", "capacity auction")).toBe(true);
    });

    it("matches whole words only, with a trailing s allowed", () => {
      expect(titleSays("Ratepayers push back", "ratepayer")).toBe(true);
      expect(titleSays("AIRBUS orders", "AI")).toBe(false);
      expect(titleSays("Said the analyst", "AI")).toBe(false);
    });

    it("needs every word of a list name", () => {
      expect(titleNames("AI drives a wave of layoffs", ["layoff", "AI"])).toBe(true);
      expect(titleNames("Retailer announces layoffs", ["layoff", "AI"])).toBe(false);
    });
  });

  describe("how a title names a cast symbol", () => {
    it("by the company's name, or the ticker in parentheses at any length", () => {
      expect(titleNamesSymbol("Micron beats on memory demand", "MU")).toBe(true);
      expect(titleNamesSymbol("Micron (MU) 8-K: Other Events", "MU")).toBe(true);
      expect(titleNamesSymbol("Stocks rally (NASDAQ: MU) leads", "MU")).toBe(true);
    });

    it("never by a two-letter ticker standing alone as a word", () => {
      expect(titleNamesSymbol("MU fans celebrate a derby win", "MU")).toBe(false);
    });

    it("by a ticker marked as one (a cashtag or an exchange), never a bare word", () => {
      expect(titleNamesSymbol("Fund buys shares of Invesco QQQ $QQQ", "QQQ")).toBe(true);
      expect(titleNamesSymbol("Invesco QQQ ( NASDAQ: QQQ ) falls 2.9%", "QQQ")).toBe(true);
      expect(titleNamesSymbol("Advanced Micro Devices ( AMD ) slides", "AMD")).toBe(true);
      expect(titleNamesSymbol("COP 30 opens in Belém", "COP")).toBe(false);
      // Seen in the first harvest: the product is QLD; QQQ is only part of its name.
      expect(titleNamesSymbol("Firm buys shares of ProShares Ultra QQQ $QLD", "QQQ")).toBe(false);
    });

    it("not when the title says the word in another sense", () => {
      expect(titleNamesSymbol("Amazon rainforest loss slows", "AMZN")).toBe(false);
      expect(titleNamesSymbol("Amazon lifts AI spending", "AMZN")).toBe(true);
    });
  });

  describe("linking an item to a campaign", () => {
    it("links the AI buildout to a headline that names a cast company, saying which", () => {
      expect(
        newsReasons(house("ai-buildout"), item({ title: "Nvidia supplier TSMC lifts guidance" })),
      ).toEqual([
        { via: "cast", symbol: "NVDA" },
        { via: "cast", symbol: "TSM" },
      ]);
    });

    it("links a headline that says a force's name", () => {
      expect(
        newsReasons(house("ai-buildout"), item({ title: "PJM capacity prices hit a record" })),
      ).toEqual([{ via: "force", force: "power" }]);
    });

    // The slice's falsifier: a keyword that belongs to another story must not pull it in.
    it("leaves out a headline that shares a word but names neither cast nor force", () => {
      const ai = house("ai-buildout");
      expect(newsReasons(ai, item({ title: "Exxon raises capex for Guyana barrels" }))).toEqual([]);
      expect(newsReasons(ai, item({ title: "Ukraine's power grid hit again" }))).toEqual([]);
      // Seen in the first harvest: a gas-line accident and a solar statistic named a word of the
      // oil campaign's forces, not the forces themselves.
      const oil = house("oil-supply");
      expect(
        newsReasons(oil, item({ title: "Crew hits natural gas line, causing evacuation" })),
      ).toEqual([]);
      expect(
        newsReasons(oil, item({ title: "Solar and storage jump to 16% of installs: EIA" })),
      ).toEqual([]);
      expect(
        newsReasons(oil, item({ title: "EIA says US crude inventories sink further" })),
      ).toEqual([{ via: "force", force: "inventories" }]);
      expect(
        newsReasons(house("oil-supply"), item({ title: "Nvidia unveils a new chip" })),
      ).toEqual([]);
    });

    it("carries the source and timestamp, marking a filing measured and press reported", () => {
      const ai = house("ai-buildout");
      const [press] = linkNews(ai, [item({ title: "CoreWeave stock drops" })]);
      expect(press).toMatchObject({
        source: "NEWS: example.com via GDELT",
        at: "2026-11-06T05:00:00Z",
        evidence: "reported",
      });
      const [filing] = linkNews(ai, [
        item({
          id: "sec-nvda-0001045810-26-000001",
          title: "Nvidia (NVDA) 8-K: Other Events",
          url: "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000001/x.htm",
          source: "SEC: EDGAR 8-K 0001045810-26-000001",
        }),
      ]);
      expect(filing?.evidence).toBe("measured");
    });

    it("counts linked news by source family, by mark, by force and by cast", () => {
      const census = newsCensus(
        linkNews(house("ai-buildout"), [
          item({ id: "a", title: "Nvidia and the FOMC" }),
          item({
            id: "b",
            title: "Federal Reserve issues FOMC statement",
            url: "https://www.federalreserve.gov/x.htm",
            source: "FED: federalreserve.gov press release",
          }),
          item({ id: "c", title: "Nothing here" }),
        ]),
      );
      expect(census).toEqual({
        linked: 2,
        bySource: { press: 1, fed: 1 },
        byEvidence: { reported: 1, measured: 1 },
        byForce: { rates: 2 },
        byCast: 1,
      });
    });
  });

  describe("the record's contract", () => {
    const raw = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
      id: "gdelt-abc",
      title: "Nvidia rallies",
      url: "https://example.com/x",
      at: "2026-11-06T05:00:00Z",
      source: "NEWS: example.com via GDELT",
      ...over,
    });

    it("accepts a well-formed item", () => {
      expect(parseNewsItem(raw(), "t.json").id).toBe("gdelt-abc");
    });

    it("refuses a primary prefix on a press URL, so press can never read as measured", () => {
      expect(() => parseNewsItem(raw({ source: "SEC: EDGAR 8-K" }), "t.json")).toThrow(/sec\.gov/);
      expect(() => parseNewsItem(raw({ source: "FED: press" }), "t.json")).toThrow(
        /federalreserve\.gov/,
      );
    });

    it("refuses an estimated or unknown source: a news item has already been published", () => {
      expect(() => parseNewsItem(raw({ source: "EST: guess" }), "t.json")).toThrow(
        /never estimated/,
      );
      expect(() => parseNewsItem(raw({ source: "IR: deck" }), "t.json")).toThrow(/NEWS:/);
    });

    it("refuses a timestamp that is not ISO-8601 UTC to the second", () => {
      expect(() => parseNewsItem(raw({ at: "2026-11-06" }), "t.json")).toThrow(/ISO-8601/);
    });

    it("lets a force match by names alone, and refuses a malformed name", () => {
      const campaign = (forces: unknown[]): Campaign =>
        parseCampaign(
          {
            id: "t",
            title: "T",
            storyline: "S.",
            sector: "Energy",
            cast: [{ role: "Fund", symbols: ["XLE"], source: "test" }],
            forces,
            openQuestions: [],
          },
          "t.json",
          "t",
        );
      expect(campaign([{ id: "lng", name: "LNG", why: "w", names: ["LNG"] }]).forces).toHaveLength(
        1,
      );
      expect(() => campaign([{ id: "x", name: "X", why: "w", names: [[]] }])).toThrow(/names/);
      expect(() => campaign([{ id: "x", name: "X", why: "w", names: [3] }])).toThrow(/names/);
    });
  });

  describe("the loader", () => {
    it("reads every run file, each id once, newest first, and an absent folder as none", () => {
      const dir = mkdtempSync(join(tmpdir(), "news-"));
      try {
        const file = (items: Record<string, unknown>[]): string =>
          JSON.stringify({ collectedAt: "2026-11-07T00:00:00Z", items });
        const a = { ...item({ title: "Nvidia" }), id: "a", at: "2026-11-01T00:00:00Z" };
        const b = { ...item({ title: "Nvidia" }), id: "b", at: "2026-11-03T00:00:00Z" };
        writeFileSync(join(dir, "2026-11-01.json"), file([a]));
        writeFileSync(join(dir, "2026-11-03.json"), file([b, a]));
        expect(loadNews(dir).map((i) => i.id)).toEqual(["b", "a"]);
        expect(loadNews(join(dir, "missing"))).toEqual([]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe("the checked-in harvest", () => {
    const harvest = loadNews();

    it("holds only items some house campaign's title test links", () => {
      const linked = new Set(CAMPAIGNS.flatMap((c) => linkNews(c, harvest).map((l) => l.item.id)));
      expect(harvest.filter((i) => !linked.has(i.id)).map((i) => i.title)).toEqual([]);
    });

    it("marks every press item reported and every measured item on its publisher's host", () => {
      for (const c of CAMPAIGNS)
        for (const link of linkNews(c, harvest)) {
          const host = new URL(link.item.url).hostname;
          if (link.evidence === "measured")
            expect(host).toMatch(/(^|\.)(sec|federalreserve)\.gov$/);
          else expect(link.source.startsWith("NEWS:")).toBe(true);
        }
    });

    // The state block's done line: the AI buildout's linked count rises from slice 2's 46
    // (events linked by more than the rates force alone).
    it("lifts the AI buildout's non-rates links above slice 2's 46", () => {
      const ai = house("ai-buildout");
      const ratesOnly = (reasons: readonly { via: string; force?: string }[]): boolean =>
        reasons.every((r) => r.via === "force" && r.force === "rates");
      const events = linkEvents(ai, MARKET_EVENTS).filter((l) => !ratesOnly(l.reasons)).length;
      const news = linkNews(ai, harvest).filter((l) => !ratesOnly(l.reasons)).length;
      expect(news).toBeGreaterThan(0);
      expect(events + news).toBeGreaterThan(46);
    });
  });
});
