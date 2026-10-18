import type { ReactElement } from "react";
import { daysBetween } from "../../../src/domain/market-calendar";
import { DOTS, dayText, spanText } from "../../../src/options/position-guidance-rules";
import {
  type OutlookWindow,
  recapOf,
  type SymbolOutlook,
  WINDOW_STATES,
} from "../../../src/research/symbol-outlook-shape";

/**
 * THE RECAP CARD (#4807 slice 3) — a symbol's summary, first thing on the Guidance tab: the house
 * call on owning the shares, how long it holds, a strip of the next ~90 days (open · caution ·
 * protected · no view) and what would prove the call wrong. It renders the server's
 * `SymbolOutlook` as it arrives and reshapes nothing; the levers below it are the strategy half.
 *
 * Phone first (390px): the call line and its until-date, one reason, the strip, then one row per
 * window. Every state is a glyph plus a word AND a fill pattern, never hue alone
 * (docs/BRAND.md → Accessibility), so the strip reads in greyscale. A call past its until-date says
 * stale in words and is demoted (`recapOf`), exactly as stale research is in the levers.
 */

const HOW_MANY_ROWS = 4;

const days = (w: OutlookWindow): number => daysBetween(w.start, w.end) + 1;

function Strip({ windows }: { readonly windows: readonly OutlookWindow[] }): ReactElement {
  const first = windows[0];
  const last = windows.at(-1);
  return (
    <div className="recap-strip">
      <div
        className="recap-bar"
        role="img"
        aria-label={`The next ${windows.reduce((n, w) => n + days(w), 0)} days, window by window — listed below`}
      >
        {windows.map((w) => (
          <span
            key={`${w.start}-${w.state}`}
            className="recap-seg"
            data-state={w.state}
            style={{ flexGrow: days(w) }}
          >
            <span aria-hidden="true">{WINDOW_STATES[w.state].glyph}</span>
          </span>
        ))}
      </div>
      {first && last ? (
        <p className="recap-ends guidance-muted">
          <span>Today · {dayText(first.start)}</span>
          <span>{dayText(last.end)}</span>
        </p>
      ) : null}
    </div>
  );
}

function WindowRow({ w }: { readonly w: OutlookWindow }): ReactElement {
  const state = WINDOW_STATES[w.state];
  return (
    <li className="recap-window" data-state={w.state}>
      <strong>
        <span aria-hidden="true">{state.glyph}</span> {state.word}
      </strong>{" "}
      <span className="recap-dates">{spanText(w.start, w.end)}</span>
      <span className="guidance-muted"> — {w.reason}</span>
    </li>
  );
}

export function SymbolRecap({ outlook }: { readonly outlook: SymbolOutlook }): ReactElement {
  const recap = recapOf(outlook, outlook.asOf);
  const shown = outlook.windows.slice(0, HOW_MANY_ROWS);
  const more = outlook.windows.slice(HOW_MANY_ROWS);
  return (
    <section
      className="recap"
      aria-label={`${outlook.symbol} research recap`}
      data-stale={recap.stale}
    >
      <p className="guidance-kicker">House research call · owning the shares</p>
      <p className="recap-call">
        <strong className="recap-word" data-call={recap.call}>
          {recap.call.toUpperCase()}
        </strong>
        {recap.confidence === "none" ? null : (
          <span className="guidance-confidence">
            <span aria-hidden="true">{DOTS[recap.confidence]}</span> {recap.confidence} confidence
          </span>
        )}
        {recap.stale ? (
          <strong className="recap-stale">
            <span aria-hidden="true">✕</span> stale since {dayText(outlook.until)}
          </strong>
        ) : (
          <span className="guidance-until">holds until {dayText(outlook.until)}</span>
        )}
      </p>
      {recap.demotedFrom ? (
        <p className="guidance-muted">
          The research said {recap.demotedFrom.toUpperCase()}; with its until-date passed and
          nothing assessed since, a buy stands aside.
        </p>
      ) : null}
      <p>{outlook.why}</p>
      <Strip windows={outlook.windows} />
      <ul className="recap-windows" aria-label="Windows ahead">
        {shown.map((w) => (
          <WindowRow key={`${w.start}-${w.state}`} w={w} />
        ))}
      </ul>
      {more.length ? (
        <details className="guidance-more">
          <summary>
            {more.length} more window{more.length === 1 ? "" : "s"}
          </summary>
          <ul className="recap-windows">
            {more.map((w) => (
              <WindowRow key={`${w.start}-${w.state}`} w={w} />
            ))}
          </ul>
        </details>
      ) : null}
      <p className="recap-wrong">
        <strong>Proves it wrong:</strong> {outlook.falsifier}
      </p>
    </section>
  );
}
