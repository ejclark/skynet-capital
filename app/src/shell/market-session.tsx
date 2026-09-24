import { type CSSProperties, type ReactElement, useEffect, useState } from "react";
import { formatMinutes, marketSession, sessionSentence } from "../live/market-session";

/**
 * The topbar market clock (#3689 slice 1, design handoff 3a): the time left to trade, always in
 * view on every route. Left, a label stack (state eyebrow + time left); middle, the session track
 * with a dashed power-hour tick and a "now" knob. `styles/market-session.css` holds the look.
 *
 * Deliberately NOT here: a "decisions today" counter (rejected in review as overly prescriptive).
 * The clock is local (`live/market-session.ts`), not a query: the session is a pure function of
 * the time, so a 30s tick is all it needs. The knob moves without transition, so no motion
 * budget is spent on a clock.
 */

const TICK_MS = 30_000;

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function MarketSession({ now }: { readonly now?: Date }): ReactElement {
  const ticking = useNow();
  const view = marketSession(now ?? ticking);
  const open = view.state === "open" || view.state === "power";
  const pct = (x: number) => `${(x * 100).toFixed(2)}%`;

  return (
    <div
      className="market-session"
      data-state={view.state}
      role="timer"
      aria-label={sessionSentence(view)}
      style={{ "--elapsed": pct(view.elapsed), "--power": pct(view.powerAt) } as CSSProperties}
    >
      <div className="session-label" aria-hidden="true">
        <span className="session-eyebrow">
          <span className="session-dot" />
          {view.state === "pre"
            ? `Opens in ${formatMinutes(view.minutesLeft)}`
            : open
              ? "Market open"
              : "Market closed"}
        </span>
        <span className="session-left">
          {open ? (
            <>
              <b>{formatMinutes(view.minutesLeft)}</b> left today
            </>
          ) : view.state === "pre" ? (
            "pre-market"
          ) : view.nextOpen ? (
            `opens ${view.nextOpen}`
          ) : null}
        </span>
      </div>
      <div className="session-track-wrap" aria-hidden="true">
        <div className="session-track">
          <span className="session-fill" />
          <span className="session-power" />
          {open ? <span className="session-knob" /> : null}
        </div>
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
