/**
 * IPO listing math — the pure readers behind the listing half of `lockup-discovery.mjs` (#5912
 * slice 3). Slice 1 dated a lockup from the final prospectus (424B4), which only exists once the
 * IPO has priced. This puts a listing on the calendar weeks earlier, from its public registration
 * statement (S-1, or F-1 for a foreign issuer), with its lockup estimated beside it.
 *
 * A registration statement has no prospectus date: its cover is "Subject to completion, dated …",
 * and the dealer line reads "Through and including , 2026". So nothing in it dates the pricing, and
 * both events it yields are `estimate`, dated by the base rates below. When the 424B4 lands it
 * dates the pair (`listingEvent` here, `lockupEvent` in lockup-math.mjs), and each estimate is
 * marked `supersededBy` its dated twin (`supersessions`).
 *
 * THE DATE RULE, measured 2026-10-22 on EDGAR's filing history for the 60 IPOs of $500M+ priced
 * since 2021 in `docs/research/ipo-lockup-expiry-events.json` (slice 2's set):
 *   - first public S-1/F-1 → pricing: median 26 days (p25 25, p75 30, p90 62). The SEC's
 *     15-days-before-the-roadshow rule plus a roadshow of about a week and a half.
 *   - last amendment filed 3+ days before pricing (the one that launches the roadshow with a price
 *     range) → pricing: median 8 days (p25 7, p75 9). Cerebras 9, SpaceX 8, Iambic 6 in 2026.
 * So a filing with a price range prices about 8 days later; one without prices about 26 days after
 * the first public filing, and never sooner than 8 days after this one (its range is still to
 * come). A weekend lands on the Monday. An estimate already in the past with no 424B4 is a deal
 * that stalled or was postponed (Oura: a range on 2026-09-21, nothing since), so it files nothing.
 *
 * PURE: no I/O, no clock, no network.
 */

import { addDays, impactFor, MEDIUM_USD, quote, titleCase, usd } from "./lockup-math.mjs";

export const RANGE_TO_PRICING_DAYS = 8;
export const FIRST_FILING_TO_PRICING_DAYS = 26;

const RANGE = /offering price[^.$]{0,100}?between \$([\d,]+(?:\.\d+)?) and \$([\d,]+(?:\.\d+)?)/i;
// Some covers set one expected price instead of a range: SpaceX's 2026-06-03 S-1/A, "We expect the
// initial public offering price to be $135.00 per share". Never "of $": that is the "assumed …
// price of $X per share, the midpoint" line every range S-1 repeats, and blank before the range.
const FIXED =
  /offering price[^.$]{0,60}?(?:to be|will be|is expected to be) \$([\d,]+(?:\.\d+)?) (?:per|a) (?:share|ADS)/i;
const SYMBOL = /under the (?:ticker )?symbol\s+"([A-Z]{1,5}(?:\.[A-Z])?)[.,]?"/;

const num = (s) => Number(s.replace(/,/g, ""));

/**
 * What a registration statement says that the dates need: the price range on its cover (absent on
 * a first public S-1, which leaves it blank: "between $ and $"), the symbol it applied to list
 * under, and the size the range implies. `parsed` is lockup-math's `parseProspectus` on the same
 * text — the lock-up clause reads the same before pricing as after.
 */
export function readRegistration(text, parsed) {
  const between = RANGE.exec(text);
  const fixed = between ? undefined : FIXED.exec(text);
  const range = between
    ? { low: num(between[1]), high: num(between[2]) }
    : fixed && { low: num(fixed[1]), high: num(fixed[1]) };
  const midpoint = range ? (range.low + range.high) / 2 : undefined;
  // Sized only from the cover's own "we are offering N shares": the last-resort first share count
  // can be the authorized or outstanding total (lockup-math.mjs, `sharesFrom`).
  const shares = parsed.sharesFrom === "offering" ? parsed.sharesOffered : undefined;
  const offeringUsd = midpoint && shares ? Math.round(midpoint * shares) : undefined;
  return {
    isIpo: parsed.isIpo,
    symbol: SYMBOL.exec(text)?.[1],
    range: range || undefined,
    offeringUsd,
  };
}

/**
 * The registration fee table's total (`ffd:TtlOfferingAmt` in the EX-FILING FEES XBRL). A first S-1
 * with no price range still registers an amount "estimated solely for the purpose of calculating
 * the registration fee" — a placeholder, so it can only lift a listing over the floor, never size
 * it (SpaceX registered $1.0B and raised about $75B).
 */
export function registeredUsd(feeXml) {
  const total = /<ffd:TtlOfferingAmt\b[^>]*>([\d.]+)</.exec(feeXml);
  if (total) return Number(total[1]);
  const lines = [...feeXml.matchAll(/<ffd:MaxAggtOfferingPric\b[^>]*>([\d.]+)</g)];
  return lines.length ? lines.reduce((sum, m) => sum + Number(m[1]), 0) : undefined;
}

/** Saturday and Sunday land on the Monday: an IPO prices on a weekday. */
function weekday(iso) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dow === 6 ? addDays(iso, 2) : dow === 0 ? addDays(iso, 1) : iso;
}

/** The expected pricing date, and the sentence that says how it was reached. */
export function expectedPricing({ form, filedOn, firstFiledOn, hasRange }) {
  const afterThis = addDays(filedOn, RANGE_TO_PRICING_DAYS);
  if (hasRange)
    return {
      date: weekday(afterThis),
      basis: `its ${filedOn} ${form} sets its price (a range, or one expected price), and $500M+ IPOs since 2021 priced a median ${RANGE_TO_PRICING_DAYS} days after that amendment (n=59)`,
    };
  const afterFirst = addDays(firstFiledOn, FIRST_FILING_TO_PRICING_DAYS);
  return {
    date: weekday(afterFirst > afterThis ? afterFirst : afterThis),
    basis: `no price range yet; $500M+ IPOs since 2021 priced a median ${FIRST_FILING_TO_PRICING_DAYS} days after the first public filing (n=60, here ${firstFiledOn}), never under ${RANGE_TO_PRICING_DAYS} days after the range amendment still to come`,
  };
}

/**
 * The listing and its lockup as `estimate` events, from one registration statement. `size` is
 * `{ usd, from: "range" | "fee-table" }` or undefined when neither was read; `impact` overrides the
 * size-derived tier for a watched filer whose size could not be read.
 */
export function listingEstimates({
  symbol,
  company,
  form,
  url,
  fetchedOn,
  reg,
  parsed,
  pricing,
  size,
  impact,
}) {
  const filing = `${form} ${url}, fetched ${fetchedOn} (scripts/research/lockup-discovery.mjs)`;
  const name = titleCase(company);
  const tier =
    impact ?? impactFor(size?.from === "range" ? size.usd : Math.min(size?.usd ?? 0, MEDIUM_USD));
  const sizeText = !size
    ? "Offering size not read yet"
    : size.from === "range"
      ? `About a ${usd(size.usd)} offering at ${reg.range.low === reg.range.high ? `its expected $${reg.range.low} a share` : `the $${reg.range.low}–$${reg.range.high} range's midpoint`}`
      : `${usd(size.usd)} registered in the fee table, a placeholder until the price range is set`;
  const listing = {
    id: `${symbol.toLowerCase()}-ipo-listing-${pricing.date}`,
    kind: "ipo-listing",
    title: `${symbol} IPO expected to price — ${name}, estimated from its public ${form}`,
    date: pricing.date,
    status: "estimate",
    source: `EST: ${filing}. No prospectus date exists before pricing: ${pricing.basis}. The 424B4 dates this listing and retires this estimate.`,
    impact: tier,
    symbols: [symbol],
    notes: `${sizeText}. First trade is the session after pricing; the IPO playbook takes no position on day 1 (#5912).`,
  };
  const { lockupDays, periods, lockupQuote, earlyRelease } = parsed;
  if (!lockupDays) return [listing];
  const date = addDays(pricing.date, lockupDays);
  const doubts = [
    `the pricing date is itself an estimate (${pricing.date})`,
    periods.length > 1 &&
      `the filing states more than one lock-up period (${periods.join(", ")} days; this date uses ${lockupDays}, the one its lock-up sentences name most)`,
    earlyRelease &&
      "the lock-up has an early-release trigger, so shares can unlock before this date",
  ].filter(Boolean);
  const lockup = {
    id: `${symbol.toLowerCase()}-lockup-expiry-${date}`,
    kind: "lockup-expiry",
    title: `${symbol} IPO lockup ends — ${name}, ${lockupDays} days after its expected ${pricing.date} pricing`,
    date,
    status: "estimate",
    source: `EST: ${filing}. ${doubts.join("; ")}. Lock-up clause: "${lockupQuote}"`,
    impact: tier,
    symbols: [symbol],
    notes: [
      `${sizeText}. Insiders may sell from the next session; the 424B4 dates this unlock and retires this estimate (#5912).`,
      earlyRelease &&
        `Early-release wording, read it before trusting the date: "${quote(earlyRelease)}"`,
    ]
      .filter(Boolean)
      .join(" "),
  };
  return [listing, lockup];
}

/**
 * The dated listing, from the final prospectus: the pricing date is the prospectus date the 424B4
 * states on its own cover or dealer line, so it is `confirmed` on an `SEC:` source. First trade is
 * the next session; the date is the pricing, the one fact the filing states.
 */
export function listingEvent({ symbol, company, url, fetchedOn, parsed }) {
  const { isIpo, prospectus, priceUsd, offeringUsd } = parsed;
  if (!(isIpo && prospectus)) return undefined;
  const size = offeringUsd ? `${usd(offeringUsd)} offering` : "Offering size not read";
  return {
    id: `${symbol.toLowerCase()}-ipo-listing-${prospectus.date}`,
    kind: "ipo-listing",
    title: `${symbol} prices its IPO — ${titleCase(company)}, first trade the next session`,
    date: prospectus.date,
    status: "confirmed",
    source: `SEC: 424B4 ${url}, fetched ${fetchedOn} (scripts/research/lockup-discovery.mjs). Prospectus dated ${prospectus.date} (read from its ${prospectus.from === "cover" ? "cover" : "dealer-delivery line"}).`,
    impact: impactFor(offeringUsd),
    symbols: [symbol],
    notes: `${size}${priceUsd ? ` at $${priceUsd} a share` : ""}. The IPO playbook takes no position on day 1; its listing phase records day-1 and day-30 closes against the offer price and whether the stock revisits it within 60 sessions (#5912).`,
  };
}

const REGISTRATION_SOURCE =
  /^EST: (?:S-1|F-1)(?:\/A)? https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/(\d+)\//;
const SEC_FILING = /https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/(\d+)\//;

/** The filer's CIK when `event` is an estimate this file wrote from a registration statement — the
 *  marker that says discovery still owns it. A research lane that re-sources it takes it over. */
export function registrationEstimateCik(event) {
  return REGISTRATION_SOURCE.exec(event.source ?? "")?.[1];
}

/**
 * Which registration estimates the dated events retire: every live estimate from the same filer
 * (CIK, read from both sources' EDGAR paths, so a reused ticker cannot match) and of the same kind,
 * under another id. Returns `[{ id, supersededBy }]`. An estimate whose id the dated event already
 * holds is the same file, so it is not here: discovery re-files it in place (the confirming flip).
 */
export function supersessions(existing, dated) {
  const out = [];
  for (const d of dated) {
    const cik = SEC_FILING.exec(d.source)?.[1];
    if (!cik) continue;
    for (const e of existing)
      if (
        e.kind === d.kind &&
        e.id !== d.id &&
        e.supersededBy === undefined &&
        registrationEstimateCik(e) === cik
      )
        out.push({ id: e.id, supersededBy: d.id });
  }
  return out;
}
