import { type ReactElement, type ReactNode, useId } from "react";
import {
  type DayRange,
  type FiscalQuarterLabel,
  type MarketClosure,
  rangeLabel,
  sessionsIn,
} from "../live/horizon-range";
import { LENSES, type Lens } from "../live/research";

/**
 * THE MARKET CALENDAR'S HEAD (#3807 slice 2·1) — the range label, the arrows and the session
 * count, the lens row and the day lens's fog line: the instrument's controls WITHOUT its grid.
 * Extracted from `event-horizon.tsx` (#738, #1704) so ONE markup renders in two places — R&D's
 * rail, where `EventHorizon` seats its month grid in the slot between the head row and the lens
 * row, and the Profile page's cockpit head (`cockpit-clock.tsx`), where there is no grid yet
 * (phase 3's popover or sheet). A fragment, on purpose: R&D's `.eh` column lays its parts out
 * with one flex gap, and a wrapper here would double it.
 *
 * "Market calendar", not "Event horizon": the visible label names what the thing does (CLAUDE.md
 * → no coined names in copy). The range label is text, not a control — tapping it is inert this
 * slice; the cockpit clock's header says what would change that.
 *
 * THE LENS ROW (#1704 slice 2, Eric's brief): day · week · month · quarter. The lens picks the
 * RANGE around the anchor and the arrows step by that duration; the head names the range and
 * counts its sessions, so Labor Day week reads "4 sessions" — theta decays an extra day. THE ALL
 * LENS HAS NO BUTTON: tapping the pressed lens again clears it, and no lens pressed IS the all
 * lens (Eric, 2026-09-06: a fifth pill "getting pushed below has a clunky feel"), so the caller
 * says what the head reads then (`all`) — R&D counts its events, the Profile page says what its
 * line lists.
 *
 * THE FOG (docs/FOG-OF-WAR.md; dead end 8 in docs/members/README.md): the day lens is held behind
 * rung 501, and its reason is VISIBLE TEXT in the chip's own box — the lens row is one fieldset
 * holding the pill and the fog line, the chip points at the line with `aria-describedby`, and
 * `title` only repeats the longer why. A reason that lived only in `title` was invisible on a
 * phone; `scripts/crawl/probes.mjs` reads the chip's enclosing fieldset for the reason's first
 * words, which is why the line opens with the door's own name.
 * @category hero
 */

const LENS_NAME: Record<Lens, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  all: "All",
};
/** What one arrow press moves — the lens's span, or the grid's month under the all lens. */
const STEP_UNIT: Record<Lens, string> = {
  day: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
  all: "month",
};

/** The day lens's fog: the door's short name (the visible line), the longer why (`title`), and
 *  how many calls sit behind it where the caller can count them — R&D can, the Profile page has
 *  no calls to count. */
export interface DayFog {
  readonly door: string;
  readonly reason: string;
  readonly held?: number;
}

export function CalendarHead({
  lens,
  range,
  closures,
  all,
  fiscal,
  dayFog,
  onLens,
  onStep,
  children,
}: {
  readonly lens: Lens;
  readonly range: DayRange;
  readonly closures: readonly MarketClosure[];
  /** What the head reads under the all lens, whose range is unbounded: its name, and what stands
   *  in for the session count. */
  readonly all: { readonly name: string; readonly count: string };
  /** The quarter lens's fiscal identity (#1736) — one symbol in scope with a confirmed year-end. */
  readonly fiscal?: FiscalQuarterLabel;
  readonly dayFog?: DayFog;
  readonly onLens: (lens: Lens) => void;
  readonly onStep: (direction: 1 | -1) => void;
  /** Seated between the head row and the lens row — R&D's month grid. */
  readonly children?: ReactNode;
}): ReactElement {
  const fogId = useId();
  const allLens = lens === "all";
  const sessions = allLens ? 0 : sessionsIn(range, closures);
  return (
    <>
      <p className="rail-label">Market calendar</p>
      <div className="eh-head">
        <button
          type="button"
          className="eh-nav"
          aria-label={`Previous ${STEP_UNIT[lens]}`}
          onClick={() => onStep(-1)}
        >
          ‹
        </button>
        <span className="eh-month">
          <span className="eh-range">{allLens ? all.name : rangeLabel(range, lens, fiscal)}</span>
          <span className="eh-sessions num">
            {allLens ? all.count : `${String(sessions)} ${sessions === 1 ? "session" : "sessions"}`}
          </span>
        </span>
        <button
          type="button"
          className="eh-nav"
          aria-label={`Next ${STEP_UNIT[lens]}`}
          onClick={() => onStep(1)}
        >
          ›
        </button>
      </div>
      {children}
      <fieldset className="eh-lens-row">
        <legend className="visually-hidden">Lens</legend>
        <div className="eh-lenses">
          {LENSES.filter((option) => option !== "all").map((option) => {
            const fog = option === "day" ? dayFog : undefined;
            return (
              <button
                key={option}
                type="button"
                className="eh-lens"
                aria-pressed={option === lens}
                disabled={fog !== undefined}
                title={fog?.reason}
                aria-describedby={fog ? fogId : undefined}
                onClick={() => onLens(option === lens ? "all" : option)}
              >
                {LENS_NAME[option]}
                {fog ? (
                  <span className="eh-lens-lock" aria-hidden="true">
                    ◷
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {dayFog ? (
          <p className="eh-fog" id={fogId}>
            Day lens: {dayFog.door}
            {dayFog.held === undefined ? (
              "."
            ) : (
              <>
                {" — "}
                <span className="num">{dayFog.held}</span> {dayFog.held === 1 ? "call" : "calls"} in
                range behind it.
              </>
            )}
          </p>
        ) : null}
      </fieldset>
    </>
  );
}
