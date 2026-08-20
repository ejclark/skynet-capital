import type { OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import type { OptionTicketPreview } from "../trading/option-ticket.js";
import { escapeHtml } from "../ui/escape-html.js";

/**
 * The ticket's two deterministic SVGs — premium-by-strike (pick your strike by eye) and the
 * at-expiration payoff (see the shape of the promise before you make it). Pure functions,
 * data in → SVG string out, same discipline as `equity-sparkline.ts`: no client library, no
 * randomness, safe under `prefers-reduced-motion` because nothing animates.
 *
 * The strike bars are LINKS, not script targets — tapping a bar navigates to the same ticket
 * URL with that strike selected, so the interaction works with JavaScript off entirely.
 */

const W = 640;
const H = 190;
const PAD = { top: 26, right: 14, bottom: 34, left: 14 };

/** Chain rows windowed around the money so the chart stays readable. */
export function windowChain(
  chain: readonly OptionChainRow[],
  selectedStrike: number | undefined,
  spot: number | undefined,
  count = 9,
): OptionChainRow[] {
  if (chain.length <= count) return [...chain];
  const anchor = selectedStrike ?? spot;
  let start = 0;
  if (anchor !== undefined) {
    const nearest = chain.reduce(
      (best, row, index) =>
        Math.abs(row.strike - anchor) < Math.abs((chain[best] as OptionChainRow).strike - anchor)
          ? index
          : best,
      0,
    );
    start = Math.min(Math.max(0, nearest - Math.floor(count / 2)), chain.length - count);
  }
  return chain.slice(start, start + count);
}

/** Premium-by-strike bars; each bar links to `hrefFor(strike)` so selection needs no JS. */
export function premiumByStrikeSvg(
  chain: readonly OptionChainRow[],
  options: {
    readonly selectedStrike?: number;
    readonly spot?: number;
    readonly hrefFor: (strike: number) => string;
  },
): string {
  const rows = windowChain(chain, options.selectedStrike, options.spot);
  const priced = rows.filter((r) => rowPremium(r) !== undefined);
  if (priced.length === 0) {
    return `<p class="desk-note">No premium data for these strikes right now — the table view still lists them.</p>`;
  }
  const max = Math.max(...priced.map((r) => rowPremium(r) as number));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / rows.length;
  const barW = Math.min(46, slot * 0.62);

  const bars = rows
    .map((row, i) => {
      const premium = rowPremium(row);
      const x = PAD.left + slot * i + (slot - barW) / 2;
      const h = premium === undefined ? 0 : Math.max(3, (premium / max) * innerH);
      const y = PAD.top + innerH - h;
      const selected = row.strike === options.selectedStrike;
      const fill = selected ? "var(--accent)" : "color-mix(in srgb,var(--muted) 28%,transparent)";
      const label =
        premium === undefined
          ? ""
          : `<text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="9.5" font-family="var(--mono)" fill="${selected ? "var(--accent)" : "var(--muted)"}">${premium.toFixed(2)}</text>`;
      return `<a href="${escapeHtml(options.hrefFor(row.strike))}" aria-label="Strike ${row.strike}, premium ${premium === undefined ? "unknown" : `$${premium.toFixed(2)} per share`}">
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}"></rect>
        ${label}
        <text x="${x + barW / 2}" y="${H - 14}" text-anchor="middle" font-size="10" font-family="var(--mono)" fill="${selected ? "var(--accent)" : "var(--muted)"}">${Number.isInteger(row.strike) ? row.strike : row.strike.toFixed(1)}</text>
      </a>`;
    })
    .join("");

  const first = rows[0] as OptionChainRow;
  const last = rows[rows.length - 1] as OptionChainRow;
  const spotLine =
    options.spot !== undefined && options.spot >= first.strike && options.spot <= last.strike
      ? (() => {
          const t = (options.spot as number) - first.strike;
          const range = last.strike - first.strike || 1;
          const x = PAD.left + slot / 2 + (t / range) * (slot * (rows.length - 1));
          return `<line x1="${x.toFixed(1)}" y1="${PAD.top - 8}" x2="${x.toFixed(1)}" y2="${H - PAD.bottom}" stroke="var(--accent)" stroke-opacity=".5" stroke-dasharray="4 4"></line>
          <text x="${x.toFixed(1)}" y="${PAD.top - 12}" text-anchor="middle" font-size="9" font-family="var(--mono)" fill="var(--accent)">NOW $${(options.spot as number).toFixed(2)}</text>`;
        })()
      : "";

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Premium by strike — tap a bar to pick that strike" style="width:100%;height:auto;display:block">
    ${spotLine}${bars}
  </svg>`;
}

/**
 * The at-expiration payoff line: profit/loss in dollars against the stock price at expiry.
 * Green above zero, red below, breakeven dotted — the whole point is that the worst case is
 * VISIBLE, not implied.
 */
export function payoffSvg(preview: OptionTicketPreview): string {
  const { strike, estPremium, breakeven } = preview;
  if (
    strike === undefined ||
    estPremium === undefined ||
    preview.code === "close" ||
    preview.contracts <= 0
  ) {
    return "";
  }
  const scale = preview.contracts * 100;
  const lo = strike * 0.6;
  const hi = strike * 1.4;
  const value = (price: number): number => {
    const intrinsic =
      preview.optionType === "put" ? Math.max(0, strike - price) : Math.max(0, price - strike);
    const perShare = preview.side === "sell" ? estPremium - intrinsic : intrinsic - estPremium;
    return perShare * scale;
  };
  const samples = Array.from({ length: 57 }, (_, i) => lo + ((hi - lo) * i) / 56);
  const values = samples.map(value);
  const vMax = Math.max(...values, 0);
  const vMin = Math.min(...values, 0);
  const spread = vMax - vMin || 1;
  const x = (price: number): number =>
    PAD.left + ((price - lo) / (hi - lo)) * (W - PAD.left - PAD.right);
  const y = (v: number): number => PAD.top + ((vMax - v) / spread) * (H - PAD.top - PAD.bottom);

  const path = samples
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p).toFixed(1)},${y(values[i] as number).toFixed(1)}`)
    .join(" ");
  const zero = y(0);
  const beMark =
    breakeven !== undefined && breakeven > lo && breakeven < hi
      ? `<circle cx="${x(breakeven).toFixed(1)}" cy="${zero.toFixed(1)}" r="3.5" fill="var(--text)"></circle>
         <text x="${x(breakeven).toFixed(1)}" y="${zero - 8}" text-anchor="middle" font-size="9.5" font-family="var(--mono)" fill="var(--text)">$${breakeven.toFixed(2)}</text>`
      : "";

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profit and loss at expiration versus stock price" style="width:100%;height:auto;display:block">
    <defs>
      <clipPath id="po-above"><rect x="0" y="0" width="${W}" height="${zero.toFixed(1)}"></rect></clipPath>
      <clipPath id="po-below"><rect x="0" y="${zero.toFixed(1)}" width="${W}" height="${H}"></rect></clipPath>
    </defs>
    <line x1="${PAD.left}" y1="${zero.toFixed(1)}" x2="${W - PAD.right}" y2="${zero.toFixed(1)}" stroke="var(--border)"></line>
    <path d="${path}" fill="none" stroke="var(--pos)" stroke-width="2" clip-path="url(#po-above)"></path>
    <path d="${path}" fill="none" stroke="var(--neg)" stroke-width="2" clip-path="url(#po-below)"></path>
    ${beMark}
    <text x="${PAD.left}" y="${H - 8}" font-size="9" font-family="var(--mono)" fill="var(--muted)">$${lo.toFixed(0)}</text>
    <text x="${W - PAD.right}" y="${H - 8}" text-anchor="end" font-size="9" font-family="var(--mono)" fill="var(--muted)">$${hi.toFixed(0)} — stock price at expiration →</text>
  </svg>`;
}
