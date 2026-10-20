/**
 * IPO lockup math — the pure readers behind `lockup-discovery.mjs` (#5912 slice 1).
 *
 * Insiders' shares are locked for a period after an IPO (usually 180 days, sometimes 90–365), and the
 * supply that unlocks when it ends is what the lockup-expiry playbook studies. The date is never
 * assumed: it is read from the company's final prospectus (EDGAR form 424B4), which states both the
 * prospectus date and the lock-up clause in its own words.
 *
 * WHAT MAKES A DATE `confirmed` — the calendar's date policy (`src/domain/market-events-data.ts`
 * header) lets a date-keyed entry act only on `confirmed`, so the bar is narrow on purpose:
 *   - the prospectus date was read from the filing itself (the cover line, or the dealer-delivery
 *     line "Through and including <date> (the 25th day after the date of this prospectus)"), and
 *   - every lock-up sentence names ONE period, and
 *   - no lock-up sentence carries an early-release trigger (an earnings release, a closing-price
 *     test, staged tranches). Those can unlock shares before the stated period ends, so the stated
 *     end is not the date — the entry stays `estimate` with the clause quoted for a reader.
 * Anything short of that is an `estimate`, which may only widen caution, never open a position.
 *
 * PURE: no I/O, no clock, no network.
 */

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** A prospectus is HTML; the readers below want one line of plain text. */
export function htmlToText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[\u00a0]/g, " ")
    .replace(/[‐‑‒–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ");
}

/** "October 14, 2026" → "2026-10-14"; undefined when it is not a date. */
function isoFromWords(words) {
  const m = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/.exec(words.trim());
  const month = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  if (!m || month < 0) return undefined;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[2]))).toISOString().slice(0, 10);
}

/** Calendar-day arithmetic on a YYYY-MM-DD date. */
export function addDays(iso, days) {
  const t = Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** The prospectus date, and which line of the filing it came from. */
function prospectusDate(text) {
  const DATE = "([A-Z][a-z]+\\s+\\d{1,2},\\s+\\d{4})";
  const cover = new RegExp(`(?:Prospectus dated|date of this prospectus is)\\s+${DATE}`, "i").exec(
    text,
  );
  const fromCover = cover && isoFromWords(cover[1]);
  if (fromCover) return { date: fromCover, from: "cover" };
  const dealer = new RegExp(
    `Through and including\\s+${DATE}\\s*\\(the\\s+(\\d+)(?:st|nd|rd|th)\\s+day after the date of this prospectus\\)`,
    "i",
  ).exec(text);
  const end = dealer && isoFromWords(dealer[1]);
  if (end) return { date: addDays(end, -Number(dealer[2])), from: "dealer-line" };
  return undefined;
}

const LOCKUP_WORD = /lock-?\s?up|market stand-?off/i;
const PERIOD =
  /(?:for a period of |for |ending |end of the |through )?(\d{2,3}) days (?:after|following|from) the date of (?:this|the final) prospectus/gi;
const EARLY = /earnings|closing price|early release|released early|earlier of|staggered|tranche/i;

// Rule 144 / Rule 701 resale periods ("affiliates may resell beginning 90 days after…, subject to the
// lock-up") are statutory waits every prospectus restates, not a lock-up: read as one, they dated
// Parabilis, Accelevation and Cerebras 90 days early.
const STATUTORY = /Rule (?:144|701)/;

/** The lock-up sentences: the ones naming a lock-up (or market stand-off) and a period. */
function lockupSentences(text) {
  return text
    .split(/(?<=[.;])\s+(?=[A-Z•])/)
    .filter(
      (s) =>
        LOCKUP_WORD.test(s) &&
        !STATUTORY.test(s) &&
        /days (?:after|following|from) the date of/i.test(s),
    );
}

/**
 * The lock-up periods the filing states, each with how many lock-up sentences name it. "Beginning
 * 181 days after" (the day shares become saleable) is the same period as "180 days after", so N+1
 * folds into N.
 */
function lockupPeriods(sentences) {
  const counts = new Map();
  for (const s of sentences)
    for (const m of s.matchAll(PERIOD))
      counts.set(Number(m[1]), (counts.get(Number(m[1])) ?? 0) + 1);
  for (const d of [...counts.keys()])
    if (counts.has(d - 1)) {
      counts.set(d - 1, counts.get(d - 1) + counts.get(d));
      counts.delete(d);
    }
  return counts;
}

/**
 * Which period dates the event when a filing states several (SpaceX: 180/280/340/366-day staged
 * releases; Cerebras: the company's own 90 beside the holders' 180). The one the lock-up sentences
 * name most is the holders' main lock-up; a tie goes to the SHORTER period, the earlier supply, which
 * is the direction an estimate may move a date (it may only widen caution).
 */
function mainPeriod(counts) {
  let best;
  for (const [d, n] of counts) {
    const [bd, bn] = best ?? [];
    if (best === undefined || n > bn || (n === bn && d < bd)) best = [d, n];
  }
  return best?.[0];
}

const IPO =
  /there (?:has|have) been no (?:established )?public market for|no public market (?:currently )?exists for/i;

/**
 * Read one final prospectus. `isIpo` false means a follow-on or a resale: it states a lock-up too,
 * but no insider supply is newly unlocking, so the playbook has nothing to study there.
 */
export function parseProspectus(text) {
  const sentences = lockupSentences(text);
  const counts = lockupPeriods(sentences);
  const periods = [...counts.keys()].sort((a, b) => a - b);
  const early = sentences.find((s) => EARLY.test(s));
  const price = /public offering price (?:of the [\w ]{2,30}? )?(?:is|of) (?:US)?\$([\d,.]+)/i.exec(
    text,
  );
  // "We are offering 9,375,000 shares" names the offering; the first big share count on a cover can
  // instead be the shares outstanding after it (INNIO's 660M), which overstated its size 10×.
  const shares =
    /(?:are|is) (?:offering|selling)\s+([\d,]{7,})\s+(?:of our\s+)?(?:shares|common shares|ordinary shares|American Depositary Shares|ADSs)/i.exec(
      text,
    ) ??
    /([\d,]{7,})\s+(?:shares|common shares|ordinary shares|American Depositary Shares)/i.exec(text);
  const priceUsd = price ? Number(price[1].replace(/,/g, "")) : undefined;
  const sharesOffered = shares ? Number(shares[1].replace(/,/g, "")) : undefined;
  const lockupDays = mainPeriod(counts);
  const stating = sentences.find((s) => s.includes(`${lockupDays} days`));
  return {
    isIpo: IPO.test(text),
    prospectus: prospectusDate(text),
    lockupDays,
    periods,
    lockupQuote: stating && quote(stating),
    earlyRelease: early && quote(early),
    priceUsd,
    sharesOffered,
    offeringUsd: priceUsd && sharesOffered ? Math.round(priceUsd * sharesOffered) : undefined,
  };
}

/** $670M · $1.8B · $75.0B — the size a reader compares, not the digits. */
function usd(n) {
  return n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${Math.round(n / 1e6)}M`;
}

/** EDGAR's display names are sometimes all caps ("SPACE EXPLORATION TECHNOLOGIES"). */
function titleCase(name) {
  return name === name.toUpperCase()
    ? name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
    : name;
}

function quote(sentence) {
  const s = sentence.trim();
  return s.length > 320 ? `${s.slice(0, 317)}…` : s;
}

/** Impact by money raised — it sets the research cadence (`assessment-cadence.json`). A $5B+ listing
 *  (SpaceX, Cerebras) unlocks supply that moves its sector; under $500M rarely moves anything. */
export const HIGH_USD = 5_000_000_000;
export const MEDIUM_USD = 500_000_000;

function impactFor(usd) {
  if (usd && usd >= HIGH_USD) return "high";
  return usd && usd >= MEDIUM_USD ? "medium" : "low";
}

/**
 * The calendar entry for one IPO's lockup expiry, or undefined when the filing cannot carry one
 * (not an IPO, no prospectus date, no lock-up period). The date is the lock-up's last day, the
 * convention calendars print; insiders may sell from the next session.
 */
export function lockupEvent({ symbol, company, url, fetchedOn, parsed }) {
  const { isIpo, prospectus, lockupDays, periods, lockupQuote, earlyRelease, offeringUsd } = parsed;
  if (!(isIpo && prospectus && lockupDays)) return undefined;
  const date = addDays(prospectus.date, lockupDays);
  const doubts = [
    periods.length > 1 &&
      `the filing states more than one lock-up period (${periods.join(", ")} days; this date uses ${lockupDays}, the one its lock-up sentences name most)`,
    earlyRelease &&
      "the lock-up has an early-release trigger, so shares can unlock before this date",
  ].filter(Boolean);
  const confirmed = doubts.length === 0;
  const read = `424B4 ${url}, fetched ${fetchedOn} (scripts/research/lockup-discovery.mjs). Prospectus dated ${prospectus.date} (read from its ${prospectus.from === "cover" ? "cover" : "dealer-delivery line"}); ${lockupDays} days after it is ${date}. Lock-up clause: "${lockupQuote}"`;
  const size = offeringUsd ? `${usd(offeringUsd)} offering` : "offering size not read";
  return {
    id: `${symbol.toLowerCase()}-lockup-expiry-${date}`,
    kind: "lockup-expiry",
    title: `${symbol} IPO lockup ends — ${titleCase(company)}, ${lockupDays} days after its ${prospectus.date} prospectus`,
    date,
    status: confirmed ? "confirmed" : "estimate",
    source: confirmed ? `SEC: ${read}` : `EST: ${doubts.join("; ")}. ${read}`,
    impact: impactFor(offeringUsd),
    symbols: [symbol],
    notes: [
      `${size}. Insiders may sell from the next session; the pullback the lockup-expiry playbook studies (#5912) is the supply that unlocks then.`,
      earlyRelease && `Early-release wording, read it before trusting the date: "${earlyRelease}"`,
    ]
      .filter(Boolean)
      .join(" "),
  };
}
