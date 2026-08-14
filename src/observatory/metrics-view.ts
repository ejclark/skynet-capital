import { escapeHtml } from "../ui/escape-html.js";
import { renderShell } from "./dashboard-shell.js";
import { DESK_STYLE } from "./desk-style.js";
import { deskFrame } from "./desk-tabs.js";
import { equityDrawdown, renderEquitySparkline } from "./equity-sparkline.js";
import {
  changeOver,
  DAY_MS,
  doubledAt,
  MONTH_MS,
  seedBaseline,
  type WindowChange,
} from "./history-metrics.js";
import type { EquitySample } from "./history-store.js";
import { participantUnrealized } from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import type { DeskViewOptions } from "./positions-view.js";
import { formatCurrency, formatSigned, formatTimestamp, pct, plClass } from "./render-atoms.js";

/**
 * THE METRICS BOARD — how the *account* performs, over time. Its inputs are recorded equity
 * samples, which makes it the counterpart to Analysis (whose input is closed trades): the two go
 * blank for different reasons, and each says which reason applies rather than rendering a
 * confident zero.
 *
 * The honesty rule carried through from `history-metrics.ts`: a windowed change measured against a
 * history younger than the window is labelled **"since first sample"**, never presented as a day
 * or a month. And the doubling progress bar — the friendly race everyone is running — measures
 * against the seed baseline recorded at onboarding, so it can't be gamed by a later deposit.
 */

export interface MetricsViewOptions extends DeskViewOptions {
  readonly history?: readonly EquitySample[];
}

function windowTile(label: string, change: WindowChange | null, fallback: string): string {
  if (!change) {
    return `<div class="desk-tile"><span class="desk-k">${escapeHtml(label)}</span><span class="desk-v">—</span><span class="desk-note">${escapeHtml(fallback)}</span></div>`;
  }
  const note = change.partial
    ? `since first sample · ${formatTimestamp(change.from)}`
    : `from ${formatTimestamp(change.from)}`;
  return `<div class="desk-tile">
      <span class="desk-k">${escapeHtml(label)}</span>
      <span class="desk-v ${plClass(change.abs)}">${formatSigned(change.abs)}</span>
      <span class="desk-note">${pct(change.pct)} · ${escapeHtml(note)}</span>
    </div>`;
}

/** The friendly race: progress from the founding stake toward doubling it. */
function doublingPanel(samples: readonly EquitySample[], equity: number): string {
  const seed = seedBaseline(samples);
  if (!seed || seed.equity <= 0) {
    return `<p class="caveat"><b>No founding baseline recorded yet.</b> The doubling race is measured from the equity written down when an account joins the board — this one starts scoring at its next sample.</p>`;
  }
  const already = doubledAt(samples);
  const target = seed.equity * 2;
  const progress = Math.max(0, Math.min(100, ((equity - seed.equity) / seed.equity) * 100));
  const body = already
    ? `<b>Doubled.</b> Crossed ${formatCurrency(target)} on ${escapeHtml(formatTimestamp(already.at))} — the trophy is banked and can't be taken back by a later dip.`
    : `<b>${progress.toFixed(1)}% of the way to 2×.</b> ${formatCurrency(equity)} against a founding ${formatCurrency(seed.equity)}; ${formatCurrency(Math.max(0, target - equity))} to go.`;
  return `<section class="panel">
      <h2 class="panel-title">The doubling race</h2>
      <p class="panel-sub">${body}</p>
      <div class="progress"><i style="width:${progress.toFixed(1)}%"></i></div>
    </section>`;
}

function curvePanel(samples: readonly EquitySample[]): string {
  const spark = renderEquitySparkline(samples, { width: 640, height: 120 });
  if (!spark) {
    return `<section class="panel">
      <h2 class="panel-title">Equity curve</h2>
      <p class="panel-sub">Two samples are needed to draw a line. History is still accruing — the curve appears on the next recorded sample.</p>
    </section>`;
  }
  const drawdown = equityDrawdown(samples);
  return `<section class="panel">
      <h2 class="panel-title">Equity curve</h2>
      <p class="panel-sub">Every recorded sample since this account joined — the shape of the ride, not just where it ended.</p>
      ${spark}
      ${
        drawdown
          ? `<div class="review-line"><span>Peak equity</span><span>${formatCurrency(drawdown.peak)}</span></div>
      <div class="review-line"><span>Max drawdown</span><span class="${drawdown.ddPct > 0 ? "neg" : "flat"}">${drawdown.ddPct.toFixed(2)}% · ${formatCurrency(drawdown.ddAbs)}</span></div>`
          : ""
      }
    </section>`;
}

export function renderMetricsBody(
  snapshot: ParticipantSnapshot,
  options: MetricsViewOptions = {},
): string {
  const { asOf, header } = deskFrame(snapshot, "metrics", options, {
    title: "Metrics board",
    sub: "How the account performs over time — equity, the windows, the drawdown, and the race to double.",
  });
  const samples = options.history ?? [];
  const unrealized = participantUnrealized(snapshot);

  const day = changeOver(samples, DAY_MS, asOf);
  const month = changeOver(samples, MONTH_MS, asOf);

  return renderShell(
    options.nav,
    `${DESK_STYLE}<section class="desk">
    ${header}
    <div class="desk-tiles">
      <div class="desk-tile lead"><span class="desk-k">Equity</span><span class="desk-v">${formatCurrency(snapshot.equity)}</span><span class="desk-note">cash ${formatCurrency(snapshot.cash)}</span></div>
      <div class="desk-tile"><span class="desk-k">Unrealized P/L</span><span class="desk-v ${plClass(unrealized)}">${formatSigned(unrealized)}</span><span class="desk-note">open positions only</span></div>
      ${windowTile("24-hour change", day, "needs two samples a day apart")}
      ${windowTile("30-day change", month, "needs two samples in the window")}
    </div>
    ${
      samples.length === 0
        ? `<p class="caveat"><b>No recorded history yet.</b> The board samples equity as the world turns; the curve, the windows, and the drawdown all fill in from there. Nothing is back-filled or estimated.</p>`
        : ""
    }
    ${curvePanel(samples)}
    ${doublingPanel(samples, snapshot.equity)}
  </section>`,
    asOf,
  );
}
