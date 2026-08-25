import { humanizeCryptoSymbol, isCryptoSymbol } from "../trading/asset-class.js";
import { escapeHtml } from "../ui/escape-html.js";
import {
  type ParticipantSnapshot,
  type PositionView,
  unrealizedPl,
} from "./participant-snapshot.js";
import { formatCurrency, formatSigned, plClass } from "./render-atoms.js";
import { type VenueStatus, venueBoard, weekSharePct } from "./venue-clock.js";

/**
 * THE NIGHT SHIFT — the 24/7 board on a member's desk (#562).
 *
 * The desk is options-and-equities shaped, so it goes dark at 16:00 ET and stays dark all weekend,
 * and until now nothing on the page said so. This panel is the honest answer to "what's still
 * trading right now": the venue clock, then whatever crypto the account actually holds, read
 * straight from the broker snapshot the rest of the page already uses.
 *
 * Two honesty constraints shape every string in here, and they outrank making it feel good:
 *
 * - **It never implies you can trade crypto from this app.** The desk's order path doesn't speak
 *   crypto yet, so the panel says that in plain words rather than dangling a button that isn't
 *   wired. A surface that looks tradeable and isn't is a lie told with layout.
 * - **It never invents a holding or a price.** Crypto rows come from `snapshot.positions` and
 *   nowhere else; an account with none gets an empty state, never a demo coin.
 */

/** Crypto rows out of a snapshot's book — real holdings only, in the order the broker returned. */
export function cryptoHoldings(snapshot: ParticipantSnapshot): readonly PositionView[] {
  return snapshot.positions.filter((position) => isCryptoSymbol(position.symbol));
}

/** Combined market value of the account's crypto — the "how much of me is awake right now" number. */
export function cryptoExposure(snapshot: ParticipantSnapshot): number {
  return cryptoHoldings(snapshot).reduce((sum, position) => sum + position.marketValue, 0);
}

/** One venue row: name, status pill, its share of the week as a bar, and what happens next. */
function venueRow(status: VenueStatus): string {
  const pill = status.open ? "OPEN" : "CLOSED";
  const pillClass = status.open ? "ns-open" : "ns-shut";
  // "Scheduled" is worn on the row, not buried: an open US session is the published calendar, not
  // a broker read, and the difference is exactly one market holiday wide.
  const qualifier =
    status.certainty === "scheduled" ? `<span class="ns-sched">scheduled</span>` : "";
  const share = weekSharePct(status);
  return `<li class="ns-venue">
      <div class="ns-venue-top">
        <span class="ns-venue-name">${escapeHtml(status.label)}</span>
        <span class="ns-pill ${pillClass}">${pill}</span>
        ${qualifier}
        <span class="ns-hours num">${status.hoursPerWeek}h / wk</span>
      </div>
      <span class="ns-bar"><i class="${status.open ? "ns-bar-live" : ""}" style="width:${share.toFixed(1)}%"></i></span>
      <p class="ns-detail">${escapeHtml(status.detail)}</p>
    </li>`;
}

/** A crypto position row. Quantity keeps its decimals — a coin is held fractionally, unlike a share. */
function holdingRow(position: PositionView): string {
  const pl = unrealizedPl(position);
  return `<tr>
      <td class="sym">${escapeHtml(humanizeCryptoSymbol(position.symbol))}</td>
      <td class="num">${position.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })}</td>
      <td class="num">${formatCurrency(position.avgPrice)}</td>
      <td class="num">${formatCurrency(position.marketValue)}</td>
      <td class="num ${plClass(pl)}">${formatSigned(pl)}</td>
    </tr>`;
}

function holdingsBlock(snapshot: ParticipantSnapshot, isSelf: boolean): string {
  const holdings = cryptoHoldings(snapshot);
  const whose = isSelf ? "your book" : "this book";
  if (holdings.length === 0) {
    return `<p class="empty">No crypto in ${whose} yet — so nothing here is trading tonight.</p>`;
  }
  const exposure = formatCurrency(cryptoExposure(snapshot));
  return `<table class="positions ns-positions">
      <thead>
        <tr><th>Pair</th><th class="num">Qty</th><th class="num">Avg</th><th class="num">Mkt Value</th><th class="num">Unrealized</th></tr>
      </thead>
      <tbody>${holdings.map(holdingRow).join("")}</tbody>
    </table>
    <p class="ns-exposure">${exposure} of ${whose} keeps trading after the bell.</p>`;
}

/**
 * Render the panel for one desk. `now` is injectable so the clock is deterministic in tests and in
 * screenshots — the same discipline `generatedAt` already follows everywhere else on this page.
 */
export function renderNightShift(
  snapshot: ParticipantSnapshot,
  options: { now?: Date; isSelf?: boolean } = {},
): string {
  const isSelf = Boolean(options.isSelf);
  const board = venueBoard(options.now ?? new Date());
  const rows = board.map(venueRow).join("\n      ");
  // The headline numbers are read off the board rather than typed into the copy — a hand-written
  // "168 against 32.5" is a claim that silently goes stale the day the session definition moves.
  const widest = board.reduce((a, b) => (b.hoursPerWeek > a.hoursPerWeek ? b : a));
  const narrowest = board.reduce((a, b) => (b.hoursPerWeek < a.hoursPerWeek ? b : a));
  return `<section class="night-shift">
      <div class="ns-head">
        <span class="seam-label">24/7 · Night shift</span>
        <h2 class="ns-title">The market that never closes</h2>
        <p class="ns-sub">Your stock and options desk keeps banker's hours. Crypto doesn't — ${widest.hoursPerWeek} hours a week against ${narrowest.hoursPerWeek}.</p>
      </div>
      <ul class="ns-venues">
      ${rows}
      </ul>
      <div class="ns-holdings">
        <h3 class="col-head">Crypto in this account</h3>
        ${holdingsBlock(snapshot, isSelf)}
      </div>
      <p class="seam-note">This board <b>reads</b> the account — the desk can't send a crypto order yet. Crypto bought in Alpaca appears here alongside the rest of the book. Paper only, as always.</p>
    </section>`;
}
