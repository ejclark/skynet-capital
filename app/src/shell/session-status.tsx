import { type KeyboardEvent, type ReactElement, useId, useRef, useState } from "react";
import {
  marketSession,
  nextOpenLabel,
  sessionSentence,
  statusLineCue,
  statusLineWords,
} from "../live/market-session";
import { FleetHealth, useFleet } from "./fleet-health";
import { MarketSession, useNow } from "./market-session";

/**
 * THE TOP BAR'S STATUS LINE (#5037 round 2, question 9 — the part every disclosure level shares).
 *
 * Eric, 2026-10-10, on the market clock strip that held this spot: "this information is a really
 * cool visual but is not actionable and taking prime real estate. Knowing we are on the clock is
 * useful for planning 'your day at work' while using the application but is secondary." And on the
 * icons beside it: "too many options are presented, competing for attention. Progressive reveal to
 * elevate what's important and move the rest to the side until it's needed."
 *
 * So the always-on statuses fold into one line of words — "Open · 1h 28m left", "Opens in 42m",
 * "Closed · opens Mon 9:30" — and a tap opens the full clock, the next open and fleet health IN
 * PLACE: a disclosure that grows the bar and pushes the page down, never a dialog or a sheet over
 * it. IA §5.8's "always visible" (#3689) keeps its intent and only gets smaller.
 *
 * The fleet dot left the bar with it. A healthy fleet adds nothing to the line; a degraded or
 * unreadable one is said there in words beside a shape (`fleetReading`), because a standing reader
 * is red/green colourblind and the line's own dot is the market's. When the alarm crowds a phone
 * bar, the market keeps one word of its own (`statusLineCue`) so its state never rides on hue.
 *
 * The panel does not close on a click elsewhere, on purpose: it sits in the flow, so closing it on
 * pointerdown would pull the page up under the finger mid-tap. The line toggles it, Escape closes
 * it from inside, and the shell remounts it per route (`__root.tsx`), so a new page starts folded.
 */
export function SessionStatus({ now }: { readonly now?: Date }): ReactElement {
  const ticking = useNow();
  const at = now ?? ticking;
  const view = marketSession(at);
  const fleet = useFleet();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const lineRef = useRef<HTMLButtonElement>(null);

  const words = statusLineWords(view);
  const alarm = fleet.reading.line;
  const brief = fleet.reading.brief;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !open) return;
    setOpen(false);
    lineRef.current?.focus();
  };

  return (
    <>
      <button
        ref={lineRef}
        type="button"
        className="status-line"
        data-state={view.state}
        data-fleet={fleet.reading.verdict}
        data-alarm={alarm ? "" : undefined}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${sessionSentence(view)}${alarm ? `, ${alarm}` : ""} — market clock and fleet health`}
        onClick={() => setOpen((was) => !was)}
        onKeyDown={onKeyDown}
      >
        <span className="status-line-dot" aria-hidden="true" />
        <span className="status-line-words">{words}</span>
        {alarm ? <span className="status-line-cue">{statusLineCue(view)}</span> : null}
        {alarm ? (
          <span className="status-line-fleet" data-brief={brief ? "" : undefined}>
            <span className="status-line-flag" aria-hidden="true" />
            <span className="status-line-alarm">{alarm}</span>
            {brief ? <span className="status-line-brief">{brief}</span> : null}
          </span>
        ) : null}
        <span className="status-line-chev" aria-hidden="true">
          <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
            <path
              d="M1 1.2 4.5 4.7 8 1.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <section
          id={panelId}
          className="status-panel"
          aria-label="Market clock and fleet health"
          onKeyDown={onKeyDown}
        >
          <MarketSession now={at} />
          <p className="status-panel-row">
            <span>Next open</span>
            <span className="num">{nextOpenLabel(at)}</span>
          </p>
          <FleetHealth fleet={fleet} />
        </section>
      ) : null}
    </>
  );
}
