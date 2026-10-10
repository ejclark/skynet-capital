import { type KeyboardEvent, type ReactElement, useId, useRef, useState } from "react";
import {
  marketSession,
  nextOpenLabel,
  sessionSentence,
  statusLineCue,
} from "../live/market-session";
import { FleetHealth, useFleet } from "./fleet-health";
import {
  MarketSession,
  SessionTrack,
  SessionWords,
  sessionTrackStyle,
  useNow,
} from "./market-session";

/**
 * THE TOP BAR'S STATUS LINE (#5037 round 2, question 9; revisited by #5075).
 *
 * Round 2 folded the market clock strip that held this spot into one line of words ("Open · 1h
 * 28m left") with the full clock, the next open and fleet health one tap down, in place. Eric's
 * review of what shipped, 2026-10-10: "I liked the 'market open' widget in the before better than
 * the badge in the after. I also like the bigger version in the after, line tapped widget. I don't
 * care for the badge - the information is only needed in one spot without redundancy… I like the
 * open, line tapped opens in place the best."
 *
 * So, FOLDED, the line is the before's widget made compact — the state and the time left over the
 * session's track (`SessionWords`, `SessionTrack`: the same pieces the opened clock draws) — and
 * OPENED, the panel is #5064's, unchanged: the full clock, the next open, fleet health, IN PLACE —
 * a disclosure that grows the bar and pushes the page down, never a dialog or a sheet over it. While
 * it is open the line folds its own widget away and says "Hide", so the market is said in one spot
 * at a time, never twice. IA §5.8's "always visible" (#3689) keeps its intent.
 *
 * The fleet rides the line only when it has something to say. A healthy fleet adds nothing; a
 * degraded or unreadable one is said there in words beside a shape (`fleetReading`), because a
 * standing reader is red/green colourblind and the widget's own dot is the market's. When the
 * alarm crowds a phone bar, the widget steps aside for the market's one word (`statusLineCue`)
 * beside its own mark, so its state never rides on hue.
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
        data-alarm={alarm && !open ? "" : undefined}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          open
            ? "Hide the market clock and fleet health"
            : `${sessionSentence(view)}${alarm ? `, ${alarm}` : ""} — market clock and fleet health`
        }
        onClick={() => setOpen((was) => !was)}
        onKeyDown={onKeyDown}
      >
        {open ? (
          <span className="status-line-hide">Hide</span>
        ) : (
          <>
            <span className="status-line-dot" aria-hidden="true" />
            <span className="status-clock" style={sessionTrackStyle(view)}>
              <span className="status-clock-words">
                <SessionWords view={view} />
              </span>
              <SessionTrack view={view} />
            </span>
            {alarm ? <span className="status-line-cue">{statusLineCue(view)}</span> : null}
            {alarm ? (
              <span className="status-line-fleet" data-brief={brief ? "" : undefined}>
                <span className="status-line-flag" aria-hidden="true" />
                <span className="status-line-alarm">{alarm}</span>
                {brief ? <span className="status-line-brief">{brief}</span> : null}
              </span>
            ) : null}
          </>
        )}
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
