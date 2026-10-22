import {
  expectedPricing,
  listingEstimates,
  listingEvent,
  readRegistration,
  registeredUsd,
  registrationEstimateCik,
  supersessions,
} from "../../scripts/research/listing-math.mjs";
import { parseProspectus } from "../../scripts/research/lockup-math.mjs";

/**
 * #5912 slice 3 — a listing and its lockup on the calendar from the public S-1, weeks before the
 * 424B4 dates them. Cover sentences are quoted verbatim from EDGAR filings fetched 2026-10-22:
 *   - Cerebras Systems (CBRS), S-1/A 2026-05-04 — a price range; priced 2026-05-13.
 *   - Space Exploration Technologies (SPCX), S-1/A 2026-06-01 (blank range) and 2026-06-03 (one
 *     expected price, $135); priced 2026-06-11.
 *   - FF Global Holdings (FFGG), F-1/A 2026-06-03 — "on a firm commitment basis", 4B authorized.
 */

const read = (text: string) => readRegistration(text, parseProspectus(text));

/** The first event a call files — every call here files at least one. */
function first<T>(events: readonly T[]): T {
  const [e] = events;
  if (!e) throw new Error("an event expected");
  return e;
}

const CBRS = [
  "Cerebras Systems Inc. is offering 28,000,000 shares of its Class A common stock.",
  "This is our initial public offering and no public market currently exists for shares of our Class A common stock.",
  "We anticipate that the initial public offering price per share of our Class A common stock will be between $115.00 and $125.00 .",
  'We have applied to list our Class A common stock on the Nasdaq Global Select Market under the symbol "CBRS," and this offering is contingent upon the listing.',
  'Eastern Time on the second trading day following our release of earnings for the quarter ending September 30, 2026 or (ii) 180 days after the date of this prospectus (the "Lock-up Period"), subject to certain customary exceptions.',
].join(" ");

const SPCX_BLANK = [
  "We are offering shares of our Class A common stock.",
  "Currently, no public market exists for our Class A common stock.",
  "We expect the initial public offering price to be between $ and $ per share.",
  'We have applied to list our Class A common stock on The Nasdaq Stock Market LLC ("Nasdaq") and Nasdaq Texas, LLC ("Nasdaq Texas") under the symbol "SPCX."',
  "Assuming an offering size as set forth above and an initial public offering price of $ per share (the midpoint of the price range set forth above).",
].join(" ");

const SPCX_FIXED = [
  "We are offering 555,555,555 shares of our Class A common stock.",
  "Currently, no public market exists for our Class A common stock.",
  "We expect the initial public offering price to be $135.00 per share.",
  'We have applied to list our Class A common stock on The Nasdaq Stock Market LLC ("Nasdaq") under the symbol "SPCX."',
].join(" ");

const FFGG = [
  "We are offering, on a firm commitment basis, 6,250,000 Class A Ordinary Shares, to be sold in the offering pursuant to this prospectus.",
  "We anticipate that the initial public offering price of the Class A Ordinary Shares will be between $4.00 and $6.00 per Class A Ordinary Share.",
  "Prior to this offering, there has been no public market for our Class A Ordinary Shares.",
  "Our authorized share capital is $50,000 divided into 4,000,000,000 Class A Ordinary Shares.",
].join(" ");

describe("readRegistration", () => {
  it("reads the price range, the proposed symbol and the size at the range's midpoint", () => {
    expect(read(CBRS)).toEqual({
      isIpo: true,
      symbol: "CBRS",
      range: { low: 115, high: 125 },
      offeringUsd: 3_360_000_000,
    });
  });

  it("reads one expected price as a range of one — SpaceX set $135, not a range", () => {
    expect(read(SPCX_FIXED)).toMatchObject({
      range: { low: 135, high: 135 },
      offeringUsd: 74_999_999_925,
    });
  });

  it("leaves a first S-1's blank range unread, and does not mistake the 'assumed … of $' line", () => {
    expect(read(SPCX_BLANK)).toEqual({
      isIpo: true,
      symbol: "SPCX",
      range: undefined,
      offeringUsd: undefined,
    });
  });

  it("sizes from 'we are offering, on a firm commitment basis', never the authorized shares", () => {
    // Before slice 3 this read 4,000,000,000 authorized shares and sized a $31M IPO at $20B.
    expect(parseProspectus(FFGG).sharesFrom).toBe("offering");
    expect(read(FFGG).offeringUsd).toBe(31_250_000);
  });

  it("refuses to size from a last-resort share count", () => {
    const text =
      "Prior to this offering, there has been no public market for our common stock. The initial public offering price is expected to be between $10.00 and $12.00 per share. 400,000,000 shares authorized.";
    expect(parseProspectus(text).sharesFrom).toBe("first-count");
    expect(read(text).offeringUsd).toBeUndefined();
  });
});

describe("registeredUsd", () => {
  it("reads the fee table's total — SpaceX's first S-1 registered a $1.0B placeholder", () => {
    const xml =
      '<ffd:MaxAggtOfferingPric contextRef="offrl_1" decimals="2" unitRef="USD">1000000000.00</ffd:MaxAggtOfferingPric><ffd:TtlOfferingAmt contextRef="rc" decimals="2" id="ixv-371" unitRef="USD">1000000000.00</ffd:TtlOfferingAmt>';
    expect(registeredUsd(xml)).toBe(1_000_000_000);
  });

  it("sums the offering lines when no total is tagged, and is undefined on an empty table", () => {
    const xml =
      '<ffd:MaxAggtOfferingPric unitRef="USD">400000000</ffd:MaxAggtOfferingPric><ffd:MaxAggtOfferingPric unitRef="USD">200000000</ffd:MaxAggtOfferingPric>';
    expect(registeredUsd(xml)).toBe(600_000_000);
    expect(registeredUsd("<xbrl/>")).toBeUndefined();
  });
});

describe("expectedPricing", () => {
  it("a filing with its price prices about 8 days later — Cerebras's range amendment", () => {
    const p = expectedPricing({
      form: "S-1/A",
      filedOn: "2026-05-04",
      firstFiledOn: "2026-04-10",
      hasRange: true,
    });
    expect(p.date).toBe("2026-05-12"); // it priced 2026-05-13
    expect(p.basis).toMatch(/median 8 days/);
  });

  it("a first S-1 prices about 26 days after the first public filing — SpaceX's", () => {
    expect(
      expectedPricing({ form: "S-1", filedOn: "2026-05-20", firstFiledOn: "2026-05-20" }).date,
    ).toBe("2026-06-15"); // it priced 2026-06-11
  });

  it("a late amendment without a range is never under 8 days out", () => {
    expect(
      expectedPricing({ form: "S-1/A", filedOn: "2026-06-25", firstFiledOn: "2026-05-20" }).date,
    ).toBe("2026-07-03");
  });

  it("moves a weekend to the Monday", () => {
    // 2026-10-10 + 8 = Sunday 2026-10-18.
    expect(
      expectedPricing({
        form: "S-1/A",
        filedOn: "2026-10-10",
        firstFiledOn: "2026-10-01",
        hasRange: true,
      }).date,
    ).toBe("2026-10-19");
  });
});

const S1_URL = "https://www.sec.gov/Archives/edgar/data/2021728/000162828026029503/cerebras.htm";

function cbrsEstimates() {
  const parsed = parseProspectus(CBRS);
  const reg = readRegistration(CBRS, parsed);
  const pricing = expectedPricing({
    form: "S-1/A",
    filedOn: "2026-05-04",
    firstFiledOn: "2026-04-10",
    hasRange: true,
  });
  const [listing, lockup] = listingEstimates({
    symbol: "CBRS",
    company: "Cerebras Systems",
    form: "S-1/A",
    url: S1_URL,
    fetchedOn: "2026-05-05",
    reg,
    parsed,
    pricing,
    size: { usd: reg.offeringUsd ?? 0, from: "range" },
  });
  if (!(listing && lockup)) throw new Error("a listing and its lockup expected");
  return [listing, lockup] as const;
}

describe("listingEstimates", () => {
  it("files the listing and its lockup, both estimate, the lock-up clause quoted", () => {
    const [listing, lockup] = cbrsEstimates();
    expect(listing).toMatchObject({
      id: "cbrs-ipo-listing-2026-05-12",
      kind: "ipo-listing",
      date: "2026-05-12",
      status: "estimate",
      impact: "medium",
      symbols: ["CBRS"],
    });
    expect(listing.source).toMatch(/^EST: S-1\/A https:\/\/www\.sec\.gov\//);
    expect(lockup).toMatchObject({
      id: "cbrs-lockup-expiry-2026-11-08",
      kind: "lockup-expiry",
      status: "estimate",
    });
    expect(lockup.source).toMatch(/pricing date is itself an estimate/);
    expect(lockup.source).toMatch(/early-release trigger/);
    expect(lockup.source).toMatch(/Lock-up clause: ".*180 days after the date of this prospectus/);
  });

  it("files a watched listing with no size read, at the impact it was given", () => {
    const parsed = parseProspectus(SPCX_BLANK);
    const listing = first(
      listingEstimates({
        symbol: "SPCX",
        company: "SPACE EXPLORATION TECHNOLOGIES",
        form: "S-1",
        url: "https://www.sec.gov/Archives/edgar/data/1181412/x/spacex.htm",
        fetchedOn: "2026-05-20",
        reg: readRegistration(SPCX_BLANK, parsed),
        parsed,
        pricing: { date: "2026-06-15", basis: "b" },
        impact: "high",
      }),
    );
    expect(listing).toMatchObject({
      impact: "high",
      title: expect.stringMatching(/Space Exploration Technologies/),
    });
    expect(listing.notes).toMatch(/^Offering size not read yet/);
  });

  it("never sizes a fee-table placeholder past the floor tier", () => {
    const parsed = parseProspectus(SPCX_BLANK);
    const listing = first(
      listingEstimates({
        symbol: "SPCX",
        company: "SpaceX",
        form: "S-1",
        url: "https://www.sec.gov/Archives/edgar/data/1181412/x/spacex.htm",
        fetchedOn: "2026-05-20",
        reg: readRegistration(SPCX_BLANK, parsed),
        parsed,
        pricing: { date: "2026-06-15", basis: "b" },
        size: { usd: 9_000_000_000, from: "fee-table" },
      }),
    );
    expect(listing.impact).toBe("medium");
    expect(listing.notes).toMatch(/placeholder until the price range is set/);
  });
});

describe("listingEvent — the 424B4 dates the listing", () => {
  it("is confirmed on the prospectus date the filing states", () => {
    const e = listingEvent({
      symbol: "CBRS",
      company: "Cerebras Systems",
      url: "https://www.sec.gov/Archives/edgar/data/2021728/000162828026035214/cerebras-424b4.htm",
      fetchedOn: "2026-05-14",
      parsed: parseProspectus(
        "Prospectus dated May 13, 2026. Currently, no public market currently exists for shares of our Class A common stock. The initial public offering price is $185.00 per share. We are offering 30,000,000 shares of Class A common stock.",
      ),
    });
    expect(e).toMatchObject({
      id: "cbrs-ipo-listing-2026-05-13",
      kind: "ipo-listing",
      date: "2026-05-13",
      status: "confirmed",
      impact: "high",
    });
    expect(e?.source).toMatch(/^SEC: 424B4 /);
  });
});

describe("supersessions — the dated pair retires the estimates", () => {
  const [listingEst, lockupEst] = cbrsEstimates();
  const datedLockup = {
    id: "cbrs-lockup-expiry-2026-11-09",
    kind: "lockup-expiry",
    source:
      "EST: the lock-up has an early-release trigger. 424B4 https://www.sec.gov/Archives/edgar/data/2021728/000162828026035214/x.htm",
  };
  const dated = [
    {
      id: "cbrs-ipo-listing-2026-05-13",
      kind: "ipo-listing",
      source: "SEC: 424B4 https://www.sec.gov/Archives/edgar/data/2021728/000162828026035214/x.htm",
    },
    datedLockup,
  ];

  it("marks each estimate superseded by its dated twin of the same kind and filer", () => {
    expect(supersessions([listingEst, lockupEst], dated)).toEqual([
      { id: "cbrs-ipo-listing-2026-05-12", supersededBy: "cbrs-ipo-listing-2026-05-13" },
      { id: "cbrs-lockup-expiry-2026-11-08", supersededBy: "cbrs-lockup-expiry-2026-11-09" },
    ]);
  });

  it("leaves another filer, a re-sourced entry, a retired one and the same id alone", () => {
    const otherFiler = { ...listingEst, source: listingEst.source.replace("2021728", "9999999") };
    const resourced = { ...lockupEst, source: "SEC: re-read by its research lane" };
    const retired = { ...listingEst, supersededBy: "cbrs-ipo-listing-2026-05-13" };
    const sameId = { ...listingEst, id: "cbrs-ipo-listing-2026-05-13" };
    expect(supersessions([otherFiler, resourced, retired, sameId], dated)).toEqual([]);
  });

  it("knows its own estimates by their source, and nothing else", () => {
    expect(registrationEstimateCik(listingEst)).toBe("2021728");
    expect(registrationEstimateCik(datedLockup)).toBeUndefined();
  });
});
