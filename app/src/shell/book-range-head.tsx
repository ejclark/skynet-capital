import type { ReactElement } from "react";
import { BOOK_LENSES, type BookLens } from "../live/book-lanes";
import { type DayRange, type MarketClosure, rangeLabel, sessionsIn } from "../live/horizon-range";

/**
 * THE RANGE HEADS THE CALENDAR OF WHAT YOU HOLD (#5074; #5037 round 2, the calendar's R2). The
 * Events section's own head, and the only date control on the Profile page: the cockpit head
 * carries none on any section (Eric, round 1: "controls that do nothing is an oxy moron"; "the
 * date ranges warrants a larger piece of real estate to effectively drive behavior"). So it gets
 * room — 44px arrows, the range in words at heading size, its sessions and closed days under it,
 * and Week · Month · Quarter across the full width.
 *
 * COUNTED OPTIONS. Each option shows how many days on what you hold its range would show, around
 * the same anchor — so a member picks a range that holds something instead of hunting for one. A
 * zero is drawn hollow and dashed, a count filled: the shape says it, the number says how many,
 * and the caption under the row says what is counted. The pressed option wears a ✓ as well as
 * the accent.
 *
 * Day is not an option here: a day is picked by tapping it in the picture (`?events=`). The range
 * is still the root `?on=&span=` R&D and Trade read (`live/horizon-params.ts`).
 */

const NAME: Record<BookLens, string> = { week: "Week", month: "Month", quarter: "Quarter" };

const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const short = (iso: string): string => SHORT.format(new Date(`${iso}T00:00:00Z`));

/** The heading and the line under it: "October 2026" / "Oct 1 – Oct 31 · 22 sessions". */
export function rangeWords(
  range: DayRange,
  lens: BookLens,
  closures: readonly MarketClosure[],
): { readonly title: string; readonly line: string } {
  const sessions = sessionsIn(range, closures);
  const closed = closures.filter(
    (c) => !c.early && c.date >= range.start && c.date <= range.end,
  ).length;
  const parts = [`${String(sessions)} ${sessions === 1 ? "session" : "sessions"}`];
  if (closed > 0) parts.push(`${String(closed)} closed`);
  const span = `${short(range.start)} – ${short(range.end)}`;
  if (lens === "week") return { title: span, line: parts.join(" · ") };
  if (lens === "month")
    return { title: rangeLabel(range, "month"), line: [span, ...parts].join(" · ") };
  const quarter = rangeLabel(range, "quarter").split(" · ")[0] ?? span;
  return { title: quarter, line: [`${span}, calendar quarter`, ...parts].join(" · ") };
}

export function BookRangeHead({
  lens,
  range,
  closures,
  counts,
  onStep,
  onLens,
}: {
  readonly lens: BookLens;
  readonly range: DayRange;
  readonly closures: readonly MarketClosure[];
  readonly counts: Record<BookLens, number>;
  readonly onStep: (direction: 1 | -1) => void;
  readonly onLens: (lens: BookLens) => void;
}): ReactElement {
  const words = rangeWords(range, lens, closures);
  return (
    <div className="range-head">
      <div className="range-top">
        <button
          type="button"
          className="range-arrow"
          aria-label={`Previous ${lens}`}
          onClick={() => onStep(-1)}
        >
          ‹
        </button>
        <div className="range-words">
          <h3 className="range-title">{words.title}</h3>
          <p className="range-line">{words.line}</p>
        </div>
        <button
          type="button"
          className="range-arrow"
          aria-label={`Next ${lens}`}
          onClick={() => onStep(1)}
        >
          ›
        </button>
      </div>
      <fieldset className="range-pick">
        <legend className="visually-hidden">Range</legend>
        <div className="range-options">
          {BOOK_LENSES.map((option) => {
            const count = counts[option];
            const pressed = option === lens;
            return (
              <button
                key={option}
                type="button"
                className="range-option"
                aria-pressed={pressed}
                aria-label={`${NAME[option]} — ${String(count)} ${count === 1 ? "date" : "dates"} on what you hold`}
                onClick={() => (pressed ? undefined : onLens(option))}
              >
                {pressed ? (
                  <span className="range-check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
                {NAME[option]}
                <span className="range-count num" data-zero={count === 0 || undefined}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="range-caption">count = dates on what you hold</p>
      </fieldset>
    </div>
  );
}
