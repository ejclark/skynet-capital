import { type CSSProperties, type ReactElement, useEffect, useState } from "react";
import {
  formatMinutes,
  type MarketSessionView,
  marketSession,
  sessionSentence,
} from "../live/market-session";

/**
 * The market clock (#3689 slice 1, design handoff 3a): a label stack (state eyebrow + time left)
 * and the session track with a dashed power-hour tick and a "now" knob. `styles/market-session.css`
 * holds the look.
 *
 * It draws in two sizes from the same pieces, so the two never word or draw a state differently:
 *   - FOLDED, in the top bar (`session-status.tsx`): the words and the track alone, compact — the
 *     strip that held the bar before round 2 of #5037, which Eric asked back for on 2026-10-10
 *     ("I liked the 'market open' widget in the before better than the badge in the after");
 *   - OPENED, in the status line's panel: the full clock below, with the track's 9:30 and close
 *     labels — "the bigger version in the after, line tapped widget", kept as it was.
 *
 * Deliberately NOT here: a "decisions today" counter (rejected in review as overly prescriptive).
 * The clock is local (`live/market-session.ts`), not a query: the session is a pure function of
 * the time, so a 30s tick is all it needs. The knob moves without transition, so no motion
 * budget is spent on a clock.
 */

const TICK_MS = 30_000;

/** The wall clock, re-read every 30s — the status line and the opened clock share one tick rate. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const pct = (x: number) => `${(x * 100).toFixed(2)}%`;

/** Where the track's fill, knob and power-hour tick sit — set on whatever box holds the track. */
export function sessionTrackStyle(view: MarketSessionView): CSSProperties {
  return { "--elapsed": pct(view.elapsed), "--power": pct(view.powerAt) } as CSSProperties;
}

const trading = (view: MarketSessionView) => view.state === "open" || view.state === "power";

/**
 * The clock's two lines of words — the state over the time left. Spans only, so the folded widget
 * can sit inside the status line's button. The state word and the duration are spans of their own:
 * the eyebrow is uppercase, the duration is not ("7H 50M" reads as a code). "today" is its own
 * span so a phone bar can drop it and keep the rest.
 */
export function SessionWords({ view }: { readonly view: MarketSessionView }): ReactElement {
  const left = formatMinutes(view.minutesLeft);
  return (
    <>
      <span className="session-eyebrow">
        <span className="session-dot" />
        {view.state === "pre" ? (
          <>
            <span className="session-state">Opens in</span>{" "}
            <span className="session-eyebrow-time">{left}</span>
          </>
        ) : (
          <span className="session-state">{trading(view) ? "Market open" : "Market closed"}</span>
        )}
      </span>
      <span className="session-left">
        {trading(view) ? (
          <>
            <b>{left}</b> left<span className="session-today"> today</span>
          </>
        ) : view.state === "pre" ? (
          "pre-market"
        ) : view.nextOpen ? (
          `opens ${view.nextOpen}`
        ) : null}
      </span>
    </>
  );
}

/** The session's track: how much of today has run, power hour's dashed tick, and while the market
 *  trades a knob at "now". Spans, for the same reason as the words. */
export function SessionTrack({ view }: { readonly view: MarketSessionView }): ReactElement {
  return (
    <span className="session-track">
      <span className="session-fill" />
      <span className="session-power" />
      {trading(view) ? <span className="session-knob" /> : null}
    </span>
  );
}

/** The opened clock — the bigger version, in the status line's panel. */
export function MarketSession({ now }: { readonly now?: Date }): ReactElement {
  const ticking = useNow();
  const view = marketSession(now ?? ticking);

  return (
    <div
      className="market-session"
      data-state={view.state}
      role="timer"
      aria-label={sessionSentence(view)}
      style={sessionTrackStyle(view)}
    >
      <div className="session-label" aria-hidden="true">
        <SessionWords view={view} />
      </div>
      <div className="session-track-wrap" aria-hidden="true">
        <SessionTrack view={view} />
        <div className="session-ticks">
          <span>9:30</span>
          <span>
            <span className="session-power-label">power hour</span> → {view.closeLabel} ET
          </span>
        </div>
      </div>
    </div>
  );
}
