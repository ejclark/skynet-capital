import type { ReactElement } from "react";
import {
  type DayRange,
  type FiscalQuarterLabel,
  type MarketClosure,
  rangeLabel,
} from "../live/horizon-range";
import type { Lens, ResearchEvent } from "../live/research";
import { CalendarGrid, ClosedKey, type DayMark } from "./calendar-grid";
import { CalendarHead, type DayFog, headLine } from "./calendar-head";
import { CalendarSheet } from "./calendar-sheet";
import { usePhoneWidth } from "./use-media";

/**
 * THE EVENT HORIZON (#738, rail-controls round — Eric: "view template shift controls to the left
 * rail... research can move the calendar control/filter to the left rail to drive the view").
 * A compact month calendar: dots mark event days (filled when a ledger exists); clicking a day
 * pins `?on=YYYY-MM-DD` — the calendar drives the view, the URL keeps the state, and typing
 * `on:YYYY-MM-DD` into the filter box lands on the same URL (one model, two carriers).
 *
 * THE BAND HEAD (#3807 slice 2a — the rail left the frame): R&D's calendar leads its stage as one
 * row — the head and the lens row from `calendar-head.tsx` (the same markup the Profile page's
 * cockpit head renders) — with the month grid FOLDED beneath it. The IA's target is a popover at
 * ≥861 and a bottom sheet at ≤860, never in flow; no popover or sheet primitive exists in the shell
 * yet, so this slice folds the grid into a plain disclosure (`<details>`) at every width, and the
 * pinned day's "Clear" stays on the row where the fold cannot hide it. Falsifier: a member on the
 * live route cannot find the grid behind the fold (a crawl step that picks a day fails, or Eric
 * asks where the calendar went) — then the fold opens by default until the popover lands. The range is root URL state (`live/horizon-params.ts`, `?on=&span=`), so
 * the day picked here is the day the whole app reads. The lens picks the RANGE around the anchor
 * day (shaded on the grid) and the arrows step by that duration (#1704 slice 2). Weekdays the
 * exchange is closed are hatched and struck (never hue alone — docs/BRAND.md → Accessibility)
 * and carry the reason. Every day is pickable now: a day with no event is a fine anchor for a
 * week, and a disabled day with nothing behind it was noise, not fog (docs/FOG-OF-WAR.md).
 *
 * THE ALL LENS HAS NO BUTTON: tapping the pressed lens again clears it, and no lens pressed IS
 * `span=all` — every ledger in view (Eric, 2026-09-06: a fifth pill "getting pushed below has a
 * clunky feel. couldn't the toggle cluster… be deselectable which implicitly enable ALL records to
 * show?"). The head names the state — "all research · N events" — so the empty cluster reads.
 *
 * THE GRID ITSELF is `calendar-grid.tsx` (#7077 AT10, AT11), shared with the landing page; this
 * file says what marks R&D's days (a dot, filled when a ledger exists) and where the grid sits.
 */

/** @category hero */
export function EventHorizon({
  events,
  closures,
  lens,
  anchor,
  range,
  today,
  pinned,
  onPick,
  onLens,
  onStep,
  dayFog,
  fiscal,
  decideDays,
  open = false,
}: {
  readonly events: readonly ResearchEvent[];
  readonly closures: readonly MarketClosure[];
  readonly lens: Lens;
  /** The day the range is built around — the `on:` token, or today when none is pinned. */
  readonly anchor: string;
  readonly range: DayRange;
  readonly today: string;
  /** Whether `anchor` came from the query (true) or defaulted to today (false). */
  readonly pinned: boolean;
  readonly onPick: (date: string) => void;
  readonly onLens: (lens: Lens) => void;
  readonly onStep: (direction: 1 | -1) => void;
  /** The day lens's fog (docs/FOG-OF-WAR.md): the door, its why, and how many calls sit behind it. */
  readonly dayFog?: DayFog;
  /** The quarter lens's fiscal identity (#1736) — set only when exactly one symbol is in scope
   *  and has a confirmed fiscal year-end; absent, the quarter lens reads (and is) the calendar. */
  readonly fiscal?: FiscalQuarterLabel;
  /** Days a "Needs a decision" card is due (#3977 slice 4) — the Profile page's Events section
   *  passes them; each gets a ▲ in its cell and the legend names it, so the mark is a shape and a
   *  word, never a hue. R&D's market board passes none: a member's decisions are not its data. */
  readonly decideDays?: ReadonlySet<string>;
  /** Whether the month grid starts unfolded — the Profile page's Events section, where the grid is
   *  the point (#3807 slice 2c); R&D keeps it folded under its band head. */
  readonly open?: boolean;
}): ReactElement | null {
  const phone = usePhoneWidth();
  const month = anchor.slice(0, 7);
  const all = {
    name: rangeLabel(range, "all"),
    count: `${String(events.length)} ${events.length === 1 ? "event" : "events"}`,
  };
  const marks = new Map<string, DayMark>();
  for (const event of events) {
    const prev = marks.get(event.date);
    marks.set(event.date, {
      titles: [...(prev?.titles ?? []), event.title],
      glyph: prev?.glyph === "hot" || event.researched ? "hot" : "dot",
    });
  }

  const head = (
    <CalendarHead
      lens={lens}
      range={range}
      closures={closures}
      all={all}
      onLens={onLens}
      onStep={onStep}
      {...(fiscal ? { fiscal } : {})}
      {...(dayFog ? { dayFog } : {})}
    />
  );
  const clear = pinned ? (
    <button type="button" className="eh-clear" onClick={() => onPick(anchor)}>
      Clear {anchor} ×
    </button>
  ) : null;
  /** The month grid; `onPicked` runs after a day is picked (the phone's sheet closes on it). */
  const grid = (onPicked?: () => void): ReactElement => (
    <CalendarGrid
      month={month}
      lens={lens}
      range={range}
      today={today}
      closures={closures}
      marks={marks}
      picked={pinned ? anchor : undefined}
      {...(decideDays ? { decideDays } : {})}
      legend={
        <>
          <i className="eh-dot eh-hot" /> researched · <i className="eh-dot" /> dated ·{" "}
          <ClosedKey />
          {decideDays && decideDays.size > 0 ? (
            <>
              {" "}
              · <i className="eh-decide eh-decide-key">▲</i> decide by
            </>
          ) : null}
        </>
      }
      onPick={(date) => {
        onPick(date);
        onPicked?.();
      }}
    />
  );

  // A phone's R&D (#3977): the head and the grid, unfolded, in the calendar's one sheet; the chip
  // and the pinned day's Clear stay in flow. The Events section's open grid IS its content, so it
  // stays in flow at every width.
  if (phone && !open) {
    return (
      <CalendarSheet
        className="cal-head rx-band"
        line={headLine({
          lens,
          range,
          closures,
          all,
          ...(fiscal ? { fiscal } : {}),
        })}
        below={clear}
      >
        {(close) => (
          <>
            {head}
            {grid(close)}
          </>
        )}
      </CalendarSheet>
    );
  }
  return (
    <section className="cal-head rx-band" aria-label="Market calendar">
      {head}
      {clear}
      <details className="eh-fold" open={open}>
        <summary className="eh-fold-toggle">Month · pick a day</summary>
        {grid()}
      </details>
    </section>
  );
}
