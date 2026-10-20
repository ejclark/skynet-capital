import {
  addDays,
  htmlToText,
  lockupEvent,
  parseProspectus,
} from "../../scripts/research/lockup-math.mjs";

/**
 * #5912 slice 1 — reading an IPO's lockup expiry from its final prospectus (424B4). Fixture
 * sentences are quoted verbatim from three EDGAR filings fetched 2026-10-20:
 *   - Iambic Therapeutics (IAM), CIK 0001997038 — one plain 180-day lock-up, dated by the dealer line.
 *   - Cerebras Systems (CBRS), CIK 0002021728 — 180 days OR two trading days after its Q3 earnings,
 *     whichever is earlier, beside a Rule 144 90-day affiliate resale line that is not a lock-up.
 *   - Space Exploration Technologies (SPCX), CIK 0001181412 — staged 180/366-day lock-ups with
 *     automatic earnings-linked early releases.
 *   - X-Energy (XE), CIK 0002088896 — 180 days, cut to ten trading days before a blackout period
 *     when it would end near one; its 8-K of 2026-06-04 moved the end from 2026-10-20 to 2026-09-01
 *     (#5920).
 */

const IAM = [
  "Prior to this offering, there has been no public market for our common stock.",
  "The initial public offering price is $16.00 per share.",
  "We are offering 9,375,000 shares of common stock.",
  "Through and including November 8, 2026 (the 25th day after the date of this prospectus), all dealers effecting transactions in these securities may be required to deliver a prospectus.",
  "We, our directors, our officers, and substantially all of the holders of our common stock have entered into lock-up agreements under which we have agreed not to offer, sell, or transfer such securities for 180 days following the date of this prospectus.",
  "• beginning 181 days after the date of this prospectus, subject to the terms of the lock-up and market standoff agreements, shares will be eligible for sale.",
].join(" ");

const CBRS = [
  "Prospectus dated May 13, 2026.",
  "Currently, no public market currently exists for shares of our Class A common stock.",
  "The initial public offering price is $185.00 per share of 30,000,000 shares.",
  'Eastern Time on the second trading day following our release of earnings for the quarter ending September 30, 2026 or (ii) 180 days after the date of this prospectus (the "Lock-up Period"), subject to certain customary exceptions.',
  'Eastern Time on the second trading day following our release of earnings for the quarter ending September 30, 2026 or (ii) 180 days after the date of this prospectus (the "Lock-up Period").',
  "Persons who are our affiliates may resell those shares beginning 90 days after the date of this prospectus without compliance with minimum holding period requirements under Rule 144 (subject to the terms of the lock-up agreements and market standoff provisions referred to below, if applicable).",
].join(" ");

const SPCX = [
  "Prospectus Dated June 11, 2026.",
  "Currently, no public market exists for our Class A common stock.",
  'Lock-up Agreements We have agreed with the underwriters that during the period of 180 days after the date of this prospectus (the "lock- up period"), we will not sell.',
  "Musk has agreed with the underwriters, that during a period of 366 days after the date of this prospectus, all of the shares owned by him are subject to the lock-up restrictions.",
].join(" ");

const XE = [
  "Prospectus dated April 23, 2026.",
  "Prior to this offering, there has been no public market for our Class A common stock.",
  "We, our officers and directors, and substantially all of the holders of our securities have agreed with the underwriters that, for a period of 180 days after the date of this prospectus, we and they will not sell any lock-up securities.",
  "Pursuant to the lock-up agreements with the underwriters, if (1) at least 120 days have elapsed since the date of this prospectus and (2) such lock-up period is scheduled to end during or within five trading days prior to a broadly applicable period during which trading in our securities would not be permitted under our insider trading policy, or a blackout period, such lock-up period will end ten trading days prior to the commencement of such blackout period.",
].join(" ");

const FOLLOW_ON =
  "Our executive officers and directors are subject to lock-up restrictions during the period ending 90 days after the date of this prospectus. Prospectus dated August 19, 2026.";

describe("parseProspectus", () => {
  it("reads a plain 180-day lock-up, folding the 'beginning 181 days' line into it", () => {
    const p = parseProspectus(IAM);
    expect(p.isIpo).toBe(true);
    expect(p.prospectus).toEqual({ date: "2026-10-14", from: "dealer-line" });
    expect(p.periods).toEqual([180]);
    expect(p.lockupDays).toBe(180);
    expect(p.earlyRelease).toBeUndefined();
    expect(p.offeringUsd).toBe(150_000_000);
  });

  it("flags an earnings-linked early release and ignores the Rule 144 resale wait", () => {
    const p = parseProspectus(CBRS);
    expect(p.prospectus).toEqual({ date: "2026-05-13", from: "cover" });
    expect(p.periods).toEqual([180]);
    expect(p.lockupDays).toBe(180);
    expect(p.earlyRelease).toMatch(/release of earnings/);
  });

  it("flags a blackout cut-off even though its sentence names no period after the prospectus", () => {
    const p = parseProspectus(XE);
    expect(p.lockupDays).toBe(180);
    expect(p.earlyRelease).toMatch(/ten trading days prior to the commencement of such blackout/);
  });

  it("breaks a tie between staged periods toward the shorter one — the earlier supply", () => {
    expect(parseProspectus(SPCX).lockupDays).toBe(180);
  });

  it("sizes the offering from 'we are offering', not the shares outstanding after it", () => {
    // Bending Spoons (BSP), 2026-06-30: the outstanding count precedes the offering on its cover.
    const p = parseProspectus(
      "324,978,625 ordinary shares will be outstanding after this offering. We are offering 34,398,640 of our ordinary shares. The initial public offering price is $29.00 per share.",
    );
    expect(p.offeringUsd).toBe(997_560_560);
  });

  it("tells a follow-on from an IPO — no insider supply newly unlocks there", () => {
    expect(parseProspectus(FOLLOW_ON).isIpo).toBe(false);
  });
});

describe("lockupEvent", () => {
  const event = (text: string, symbol: string) =>
    lockupEvent({
      symbol,
      company: symbol,
      url: "https://www.sec.gov/x.htm",
      fetchedOn: "2026-10-20",
      parsed: parseProspectus(text),
    });

  it("files a clean clause as confirmed, sourced to the SEC filing", () => {
    const e = event(IAM, "IAM");
    expect(e).toMatchObject({
      id: "iam-lockup-expiry-2027-04-12",
      kind: "lockup-expiry",
      date: "2027-04-12",
      status: "confirmed",
      impact: "low",
      symbols: ["IAM"],
    });
    expect(e?.source).toMatch(/^SEC: 424B4 /);
  });

  it("files an early-release clause as an estimate, quoting the trigger for a reader", () => {
    const e = event(CBRS, "CBRS");
    expect(e).toMatchObject({ date: "2026-11-09", status: "estimate", impact: "high" });
    expect(e?.source).toMatch(/^EST: .*early-release trigger/);
    expect(e?.notes).toMatch(/release of earnings/);
  });

  it("never files a blackout-shortened lock-up as confirmed on its stated date", () => {
    const e = event(XE, "XE");
    expect(e).toMatchObject({ date: "2026-10-20", status: "estimate" });
    expect(e?.notes).toMatch(/blackout period/);
  });

  it("files nothing for a follow-on", () => {
    expect(event(FOLLOW_ON, "ANDG")).toBeUndefined();
  });
});

describe("helpers", () => {
  it("adds calendar days across a year end", () => {
    expect(addDays("2026-12-20", 15)).toBe("2027-01-04");
  });

  it("flattens prospectus HTML, including the non-breaking hyphen EDGAR filings use", () => {
    expect(htmlToText("<p>lock&#8209;up&nbsp;<b>period</b></p>")).toBe(" lock-up period ");
  });
});
