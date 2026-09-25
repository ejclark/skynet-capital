import { EdgarFilings, FILINGS_TTL_MS } from "../../src/adapters/edgar-filings.js";

/** EDGAR 8-Ks for the Brief's filings pulse (#3729): primary source, fail-soft, briefly cached. */

const tickers = { "0": { ticker: "CRWV", cik_str: 1769628 } };
const submissions = {
  filings: {
    recent: {
      form: ["8-K", "10-Q", "8-K"],
      filingDate: ["2026-09-22", "2026-08-12", "2026-08-11"],
      items: ["1.01,2.03", "", "2.02,9.01"],
    },
  },
};

describe("EdgarFilings", () => {
  it("resolves the CIK and returns only 8-Ks, with their items", async () => {
    const urls: string[] = [];
    const edgar = new EdgarFilings((url) => {
      urls.push(url);
      return Promise.resolve(url.includes("company_tickers") ? tickers : submissions);
    });
    expect(await edgar.eightKs("CRWV")).toEqual([
      { date: "2026-09-22", items: "1.01,2.03" },
      { date: "2026-08-11", items: "2.02,9.01" },
    ]);
    expect(urls[1]).toBe("https://data.sec.gov/submissions/CIK0001769628.json");
  });

  it("serves a repeat inside five minutes from cache, and re-fetches after", async () => {
    let t = 0;
    let calls = 0;
    const edgar = new EdgarFilings(
      (url) => {
        if (!url.includes("company_tickers")) calls += 1;
        return Promise.resolve(url.includes("company_tickers") ? tickers : submissions);
      },
      () => t,
    );
    await edgar.eightKs("CRWV");
    await edgar.eightKs("CRWV");
    expect(calls).toBe(1);
    t = FILINGS_TTL_MS + 1;
    await edgar.eightKs("CRWV");
    expect(calls).toBe(2);
  });

  it("is undefined — never an empty list — when EDGAR fails", async () => {
    const edgar = new EdgarFilings(() => Promise.reject(new Error("403")));
    expect(await edgar.eightKs("CRWV")).toBeUndefined();
  });
});
