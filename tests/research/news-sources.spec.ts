import { linkNews, type NewsItem, parseNewsItem } from "../../src/domain/campaign-news.js";
import { campaignById } from "../../src/domain/campaigns.js";
import {
  cikMap,
  edgarItems,
  eightKWords,
  fedItems,
  gdeltItems,
  gdeltQueries,
  keepLinked,
  queryWord,
  tidyTitle,
} from "../../src/research/news-sources.js";

/**
 * #6949 slice 4 — the free news collector's readers, on fixtures shaped like each source's own
 * reply (data.sec.gov/submissions, federalreserve.gov/feeds/press_all.xml and GDELT's DOC 2.0
 * `artlist`, all three read live 2026-11-08). No network here: the CLI fetches, these parse.
 */

const ai = () => {
  const c = campaignById("ai-buildout");
  if (!c) throw new Error("the AI-buildout campaign is missing");
  return c;
};

describe("news sources (#6949 slice 4)", () => {
  describe("SEC EDGAR", () => {
    const submissions = {
      filings: {
        recent: {
          form: ["8-K", "10-Q", "8-K", "4"],
          accessionNumber: [
            "0001045810-26-000201",
            "0001045810-26-000190",
            "0001045810-26-000100",
            "0001045810-26-000202",
          ],
          acceptanceDateTime: [
            "2026-11-05T16:05:12.000Z",
            "2026-11-01T16:05:12.000Z",
            "2026-08-27T16:05:12.000Z",
            "2026-11-06T18:00:00.000Z",
          ],
          items: ["2.02,9.01", "", "8.01", ""],
          primaryDocument: ["nvda-8k.htm", "q.htm", "old.htm", "f4.xml"],
        },
      },
    };

    it("keeps the 8-Ks inside the window, titled with the company and its ticker", () => {
      const items = edgarItems("NVDA", "0001045810", submissions, "2026-10-09");
      expect(items).toEqual([
        {
          id: "sec-nvda-0001045810-26-000201",
          title: "Nvidia (NVDA) 8-K: Results of Operations and Financial Condition",
          url: "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000201/nvda-8k.htm",
          at: "2026-11-05T16:05:12Z",
          source: "SEC: EDGAR 8-K 0001045810-26-000201",
        },
      ]);
    });

    it("writes items that pass the record's contract and link to the filer as measured", () => {
      const [filing] = edgarItems("NVDA", "0001045810", submissions, "2026-10-09");
      if (!filing) throw new Error("no filing");
      expect(parseNewsItem(filing, "fixture").source).toMatch(/^SEC:/);
      const [link] = linkNews(ai(), [filing]);
      expect(link?.reasons).toEqual([{ via: "cast", symbol: "NVDA" }]);
      expect(link?.evidence).toBe("measured");
    });

    it("says an 8-K's items in words, leaving out the exhibits every 8-K carries", () => {
      expect(eightKWords("5.02,9.01")).toBe("Departure or Appointment of Directors or Officers");
      expect(eightKWords("9.01")).toBe("Financial Statements and Exhibits");
      expect(eightKWords("4.01")).toBe("Item 4.01");
    });

    it("reads EDGAR's ticker map, padding the CIK to ten digits", () => {
      expect(cikMap({ 0: { ticker: "nvda", cik_str: 1045810 } }).get("NVDA")).toBe("0001045810");
      expect(edgarItems("NVDA", "1", { nope: true }, "2026-01-01")).toEqual([]);
    });
  });

  describe("the Federal Reserve's press releases", () => {
    const xml = `<rss><channel>
      <item>
        <title>Federal Reserve issues FOMC statement</title>
        <link><![CDATA[https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm]]></link>
        <pubDate><![CDATA[Wed, 28 Oct 2026 18:00:00 GMT]]></pubDate>
      </item>
      <item>
        <title>Old release</title>
        <link><![CDATA[https://www.federalreserve.gov/newsevents/pressreleases/other20260101a.htm]]></link>
        <pubDate><![CDATA[Thu, 1 Jan 2026 18:00:00 GMT]]></pubDate>
      </item>
    </channel></rss>`;

    it("reads each release in the window as a measured FED: item", () => {
      const items = fedItems(xml, "2026-10-01");
      expect(items).toEqual([
        {
          id: "fed-monetary20261028a",
          title: "Federal Reserve issues FOMC statement",
          url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm",
          at: "2026-10-28T18:00:00Z",
          source: "FED: federalreserve.gov press release",
        },
      ]);
      expect(linkNews(ai(), items)[0]?.reasons).toEqual([{ via: "force", force: "rates" }]);
    });
  });

  describe("GDELT's article search", () => {
    const body = {
      articles: [
        {
          url: "https://www.techtimes.com/articles/330159/coreweave-network.htm",
          title: "CoreWeave Announces Global AI Network as Stock Drops",
          seendate: "20261107T070000Z",
          domain: "techtimes.com",
        },
        {
          url: "https://timesofindia.indiatimes.com/x.cms",
          title: "As $2 . 5 trillion wiped off Nasdaq , Nvidia leads losers",
          seendate: "20261106T050000Z",
          domain: "timesofindia.indiatimes.com",
        },
        { url: "https://broken.example", title: "no date" },
      ],
    };

    it("reads each article as a reported NEWS: item, with GDELT's spacing tidied", () => {
      const items = gdeltItems(body);
      expect(items.map((i) => [i.title, i.at, i.source])).toEqual([
        [
          "CoreWeave Announces Global AI Network as Stock Drops",
          "2026-11-07T07:00:00Z",
          "NEWS: techtimes.com via GDELT",
        ],
        [
          "As $2.5 trillion wiped off Nasdaq, Nvidia leads losers",
          "2026-11-06T05:00:00Z",
          "NEWS: timesofindia.indiatimes.com via GDELT",
        ],
      ]);
      for (const i of items) expect(linkNews(ai(), [i])[0]?.evidence).toBe("reported");
    });

    it("searches the cast's names in small groups and each force on its own", () => {
      const queries = gdeltQueries(ai());
      expect(queries.length).toBeGreaterThan(ai().forces.length + 1);
      expect(queries.some((q) => q.includes("CoreWeave"))).toBe(true);
      for (const q of queries) expect(q.split(" OR ").length).toBeLessThanOrEqual(8);
      expect(queries.find((q) => q.includes("PJM"))).toContain("ERCOT");
      for (const q of queries) expect(q).toMatch(/\) sourcelang:english$/);
    });

    it("puts back the punctuation GDELT spaces out, never changing a word", () => {
      expect(tidyTitle("Gold at $3, 800 – 4, 000 : a $1. 25 trillion ( AMD ) story")).toBe(
        "Gold at $3,800 – 4,000: a $1.25 trillion (AMD) story",
      );
      expect(tidyTitle("In 2026, 500 jobs went")).toBe("In 2026, 500 jobs went");
    });

    it("searches a list name by its first word of three letters or more", () => {
      expect(queryWord(["layoff", "AI"])).toBe("layoff");
      expect(queryWord(["AI", "job cut"])).toBe("job cut");
      expect(queryWord("FOMC")).toBe("FOMC");
    });
  });

  describe("what a run keeps", () => {
    const press = (id: string, title: string): NewsItem => ({
      id,
      title,
      url: `https://example.com/${id}`,
      at: "2026-11-06T05:00:00Z",
      source: "NEWS: example.com via GDELT",
    });

    it("keeps new items a campaign links, once each, and drops the rest", () => {
      const kept = keepLinked(
        [ai()],
        [
          press("a", "Nvidia rallies"),
          press("a", "Nvidia rallies"),
          press("b", "A recipe for soup"),
          press("c", "Broadcom slips"),
        ],
        [press("c", "Broadcom slips")],
      );
      expect(kept.map((i) => i.id)).toEqual(["a"]);
    });

    // Seen in the first harvest: one story under thirteen URLs.
    it("keeps a syndicated story once, from its earliest publication", () => {
      const at = (id: string, when: string): NewsItem => ({
        ...press(id, "Protesters Storm Microsoft Data Center Construction Site"),
        at: when,
      });
      const kept = keepLinked(
        [ai()],
        [at("late", "2026-11-07T09:00:00Z"), at("early", "2026-11-06T09:00:00Z")],
        [],
      );
      expect(kept.map((i) => i.id)).toEqual(["early"]);
    });
  });
});
