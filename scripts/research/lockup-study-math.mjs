/**
 * IPO lockup-expiry event study — the pure arithmetic behind `lockup-study.mjs` (#5912 slice 2).
 *
 * The question: when insiders' shares unlock, does the stock fall against its sector, by how much,
 * and is that move tradeable by either shape the plan names — puts into the date, or buying after the
 * flush? The literature says about −1.5% abnormal over three days (Field & Hanka 2001); this
 * replicates it on 2019–2026 listings before anything is built on it.
 *
 * CONVENTIONS (stated once, used everywhere):
 *   - Day 0 is the first session insiders may sell: the first bar dated AFTER the calendar's
 *     lockup date (the lock-up's last day, `lockup-math.mjs`). Day −1 is the last locked session.
 *   - A day's return is close-to-close. CAR[a,b] sums (stock − benchmark) daily returns over days
 *     a..b inclusive, the Field & Hanka convention, so CAR[−10,+3] runs from the close of day −11
 *     to the close of day +3: exactly the put trade's holding period.
 *   - The put spread is priced off TRAILING REALIZED vol, because free history carries no implied
 *     vol. Into a known catalyst implied usually sits above realized, so this under-prices the
 *     spread and flatters the trade: a loss here is a robust loss, a win is only a maybe.
 *
 * PURE: no I/O, no clock, no network.
 */

/**
 * SIC ranges → benchmark, checked in order, so the narrow carve-outs (REITs inside finance, drug
 * developers inside chemicals) sit above the ranges that contain them. Each row is [lo, hi, ETF].
 */
const SECTOR_RANGES = [
  // Drug developers: a biotech IPO's sector is XBI, not the megacap pharma in XLV.
  [2833, 2836, "XBI"],
  [8731, 8731, "XBI"],
  [3841, 3851, "XLV"],
  [8000, 8099, "XLV"],
  [3826, 3826, "XLV"],
  [5047, 5047, "XLV"],
  [6798, 6798, "XLRE"],
  [6500, 6553, "XLRE"],
  [6000, 6799, "XLF"],
  [4900, 4949, "XLU"],
  [4991, 4991, "XLU"],
  [4800, 4899, "XLC"],
  [7810, 7819, "XLC"],
  [7841, 7841, "XLC"],
  [2711, 2711, "XLC"],
  [7370, 7379, "XLK"],
  [3570, 3579, "XLK"],
  [3660, 3679, "XLK"],
  [3820, 3829, "XLK"],
  [1300, 1399, "XLE"],
  [1221, 1221, "XLE"],
  [2911, 2911, "XLE"],
  [2840, 2844, "XLP"],
  [1000, 1099, "XLB"],
  [1400, 1499, "XLB"],
  [2600, 2699, "XLB"],
  [2800, 2829, "XLB"],
  [2850, 2899, "XLB"],
  [3300, 3399, "XLB"],
  [2000, 2199, "XLP"],
  [5400, 5499, "XLP"],
  [3710, 3716, "XLY"],
  [3751, 3751, "XLY"],
  [2300, 2399, "XLY"],
  [2510, 2599, "XLY"],
  [3940, 3949, "XLY"],
  [5200, 5399, "XLY"],
  [5500, 5999, "XLY"],
  [7000, 7099, "XLY"],
  [7900, 7999, "XLY"],
  [8200, 8299, "XLY"],
  [3812, 3812, "XLI"],
  [1500, 1799, "XLI"],
  [3400, 3569, "XLI"],
  [3580, 3659, "XLI"],
  [3700, 3799, "XLI"],
  [4000, 4799, "XLI"],
  [7380, 7389, "XLI"],
  [8700, 8748, "XLI"],
];

/** The benchmark ETF for an SIC code: its sector SPDR (or XBI), IWM when no sector claims it. */
export function sectorEtf(sic) {
  const s = Number(sic);
  return SECTOR_RANGES.find(([lo, hi]) => s >= lo && s <= hi)?.[2] ?? "IWM";
}

const num = (s) => Number(s.replace(/,/g, ""));
const AFTER =
  "to be outstanding (?:immediately )?after (?:this|the) offering\\s*:?\\s*([\\d,]{7,})\\s+shares";

/**
 * Every share outstanding after the IPO, all classes: "Common stock to be outstanding after this
 * offering 68,365,044 shares" → 68365044. A dual-class summary lists Class A (≈ the shares sold)
 * and Class B (the insiders') on separate lines; reading only the first counted CrowdStrike's 18M
 * public shares as its whole share count and its 179M locked shares as zero. So the summary's
 * "Total" line wins, else the class lines are summed, else the single line.
 */
export function sharesOutstandingAfter(text) {
  const total = new RegExp(`Total [\\w ]{0,60}?${AFTER}`, "i").exec(text);
  if (total) return num(total[1]);
  const byClass = new Map();
  for (const m of text.matchAll(
    new RegExp(`Class ([A-Z]) (?:common stock|common shares|ordinary shares) ${AFTER}`, "gi"),
  ))
    if (!byClass.has(m[1])) byClass.set(m[1], num(m[2]));
  if (byClass.size > 0) return [...byClass.values()].reduce((s, n) => s + n, 0);
  const one =
    new RegExp(AFTER, "i").exec(text) ??
    /([\d,]{7,}) (?:shares of (?:our )?(?:Class A )?common stock|common shares|ordinary shares) (?:will be )?outstanding (?:immediately )?after (?:this|the) offering/i.exec(
      text,
    );
  return one ? num(one[1]) : undefined;
}

/**
 * Locked shares in multiples of the float: everything outstanding after the IPO that was not sold
 * in it, over what was sold. Under 0.05× means the parse missed the insiders' class (a real IPO
 * never floats 95% of the company), so it reads as unknown, never as "no unlock".
 */
export function unlockMultiple(sharesOut, sharesOffered) {
  if (!(sharesOut > 0 && sharesOffered > 0)) return undefined;
  const x = (sharesOut - sharesOffered) / sharesOffered;
  return x >= 0.05 ? x : undefined;
}

/** Index of day 0 — the first bar strictly after the lockup's last day — or −1 if none. */
export function dayZero(bars, lockupDate) {
  return bars.findIndex((b) => b.date > lockupDate);
}

/** Close-to-close return of bar i. */
const ret = (bars, i) => bars[i].close / bars[i - 1].close - 1;

/**
 * Align a benchmark to the stock's dates: the benchmark's close-to-close return on each stock date,
 * or undefined where the benchmark has no bar that day (a gap the CAR then refuses to cross).
 */
export function benchReturns(bars, bench) {
  const byDate = new Map(bench.map((b, i) => [b.date, i]));
  return bars.map((b, i) => {
    const j = byDate.get(b.date);
    if (i === 0 || j === undefined || j === 0) return undefined;
    if (bench[j - 1].date !== bars[i - 1].date) return undefined;
    return bench[j].close / bench[j - 1].close - 1;
  });
}

/** CAR over event days a..b around day-0 index z; undefined if any day is missing. */
export function car(bars, benchRet, z, a, b) {
  let sum = 0;
  for (let k = a; k <= b; k++) {
    const i = z + k;
    if (i < 1 || i >= bars.length || benchRet[i] === undefined) return undefined;
    sum += ret(bars, i) - benchRet[i];
  }
  return sum;
}

/** Raw buy-and-hold return from the close of day a−1 to the close of day b. */
export function rawReturn(bars, z, a, b) {
  const from = z + a - 1;
  const to = z + b;
  if (from < 0 || to >= bars.length) return undefined;
  return bars[to].close / bars[from].close - 1;
}

/** Annualized realized vol of daily log returns over event days a..b. */
export function realizedVol(bars, z, a, b) {
  const xs = [];
  for (let k = a; k <= b; k++) {
    const i = z + k;
    if (i < 1 || i >= bars.length) return undefined;
    xs.push(Math.log(bars[i].close / bars[i - 1].close));
  }
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v * 252);
}

/** Mean volume over days a..b against mean volume over a quiet baseline, days c..d. */
export function volumeRatio(bars, z, [a, b], [c, d]) {
  const avg = (lo, hi) => {
    let s = 0;
    for (let k = lo; k <= hi; k++) {
      const v = bars[z + k]?.volume;
      if (!v) return undefined;
      s += v;
    }
    return s / (hi - lo + 1);
  };
  const on = avg(a, b);
  const base = avg(c, d);
  return on && base ? on / base : undefined;
}

// Φ via Abramowitz–Stegun 7.1.26 (|error| < 7.5e-8), the same approximation src/options/pricing.ts
// uses; that module is TypeScript and this lane runs plain node, so the eleven lines live here too.
function phi(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Black–Scholes European put, zero rate and dividend (a two-week hold makes both rounding). */
export function bsPut(S, K, sigma, years) {
  if (years <= 0 || sigma <= 0) return Math.max(K - S, 0);
  const sd = sigma * Math.sqrt(years);
  const d1 = (Math.log(S / K) + sd * sd * 0.5) / sd;
  return K * phi(-(d1 - sd)) - S * phi(-d1);
}

/**
 * Shape A, "puts into the date": buy the ATM put, sell the one `width` below, at the close of day
 * −11; hold to expiry at the close of day +3 (14 sessions). Returns P&L as a fraction of the debit,
 * so −1 is the whole debit lost and +1 doubles it. `sigma` prices the entry.
 */
export function putSpreadReturn({ entry, exit, sigma, width = 0.1, sessions = 14 }) {
  const k1 = entry;
  const k2 = entry * (1 - width);
  const years = sessions / 252;
  const debit = bsPut(entry, k1, sigma, years) - bsPut(entry, k2, sigma, years);
  if (!(debit > 0)) return undefined;
  const payoff = Math.max(k1 - exit, 0) - Math.max(k2 - exit, 0);
  return payoff / debit - 1;
}

/** n · mean · median · t (mean over its standard error) · share below zero. */
export function summarize(xs) {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const n = v.length;
  if (n === 0) return { n: 0 };
  const mean = v.reduce((s, x) => s + x, 0) / n;
  const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  const sd = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1)) : 0;
  const t = sd > 0 ? mean / (sd / Math.sqrt(n)) : 0;
  return { n, mean, median, t, negShare: v.filter((x) => x < 0).length / n };
}

/** Tercile cut points of a list (the 1/3 and 2/3 quantiles), for splits fixed before reading. */
export function terciles(xs) {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const q = (p) => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  return [q(1 / 3), q(2 / 3)];
}
