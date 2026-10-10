import {
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { dayLabel } from "../live/book-events";
import {
  axisFor,
  type BookLanes,
  type BookLens,
  type Lane,
  type LaneGlyph,
  type LaneMark,
  placeWords,
} from "../live/book-lanes";
import type { DayRange, MarketClosure } from "../live/horizon-range";

/**
 * THE LANES PICTURE (#5074; #5037 round 2, the calendar's R2): the body the Events section's range
 * head drives — one lane per position, then the market-wide lane, days across, the axis and a key
 * under them (`live/book-lanes.ts` is the pure half). Everything on it is a control a member can
 * use with a thumb:
 *
 *   a mark    picks its day (`?events=`), the way the month grid's cell did — the list under the
 *             picture narrows to it; a second tap clears it
 *   an edge   a lane whose next date is past the range pins it at the lane's head (`◇ Nov 18 ›`);
 *             a tap moves the range onto it (the head's own `?on=` write, #5045's jump on every lane)
 *   today     the accent rule and the word under it; off the range, "‹ today Oct 8" goes back
 *
 * HONEST SHAPES. Each glyph is a shape, never a hue alone (▲ decide by · ◆ confirmed · ◇ estimated
 * · ○ market-wide · hatched = market closed, an early close hatched to half height), and the key
 * names only what the frame draws. Words ride beside a mark only where they fit — the list under
 * the picture says every date in words, so a crowded quarter draws glyphs and nothing overlaps.
 */

export const GLYPH_WORD: Record<LaneGlyph, string> = {
  decide: "decide by",
  confirmed: "confirmed date",
  estimated: "estimated date",
  market: "market-wide",
};

/** The glyph as a drawn shape in the text colour — crisp at 12px in any font. */
export function LaneGlyphIcon({ glyph }: { readonly glyph: LaneGlyph | "closed" }): ReactElement {
  return (
    <svg className={`lane-glyph lane-glyph--${glyph}`} viewBox="0 0 12 12" aria-hidden="true">
      {glyph === "decide" ? <polygon points="6,1.5 11,10.5 1,10.5" /> : null}
      {glyph === "confirmed" || glyph === "estimated" ? (
        <polygon points="6,1 11,6 6,11 1,6" />
      ) : null}
      {glyph === "market" ? <circle cx="6" cy="6" r="4" /> : null}
      {glyph === "closed" ? (
        <>
          <rect x="1" y="1" width="10" height="10" />
          <path d="M1 6 6 1M1 11 11 1M6 11l5-5" />
        </>
      ) : null}
    </svg>
  );
}

/** The track's drawn width — label placement reads it; a phone's track is the first guess. */
function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(330);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

const pct = (n: number): string => `${String(Math.round(n * 10000) / 100)}%`;

const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const short = (iso: string): string => SHORT.format(new Date(`${iso}T00:00:00Z`));

/** A mark's or an edge's accessible name: the day, then each event on it in the list's words. */
const said = (mark: LaneMark): string =>
  `${dayLabel(mark.date)}: ${mark.events.map((e) => e.title).join("; ")}`;

interface Frame {
  readonly days: readonly string[];
  readonly rules: readonly number[];
  readonly closures: readonly MarketClosure[];
  readonly picked: string | undefined;
  readonly today: string;
  readonly width: number;
}

/** What every track shares behind its marks: the rules, the closed days, the picked day, today. */
function Backdrop({ frame }: { readonly frame: Frame }): ReactElement {
  const n = frame.days.length;
  const at = (date: string): number => frame.days.indexOf(date);
  return (
    <>
      {frame.rules.map((i) => (
        <span key={`r${String(i)}`} className="lane-rule" style={{ left: pct(i / n) }} />
      ))}
      {frame.closures.map((c) => (
        <span
          key={c.date}
          className={`lane-closed${c.early ? " lane-closed--early" : ""}`}
          style={{ left: pct(at(c.date) / n), width: pct(1 / n) }}
        />
      ))}
      {frame.picked && at(frame.picked) >= 0 ? (
        <span
          className="lane-picked"
          style={{ left: pct(at(frame.picked) / n), width: pct(1 / n) }}
        />
      ) : null}
      {at(frame.today) >= 0 ? (
        <span className="lane-today" style={{ left: pct((at(frame.today) + 0.5) / n) }} />
      ) : null}
    </>
  );
}

function LaneRow({
  lane,
  frame,
  onPick,
  onJump,
}: {
  readonly lane: Lane;
  readonly frame: Frame;
  readonly onPick: (date: string) => void;
  readonly onJump: (date: string) => void;
}): ReactElement {
  const n = frame.days.length;
  const placed = lane.marks.map((m) => ({ index: frame.days.indexOf(m.date), words: m.words }));
  const sides = placeWords(placed, n, frame.width);
  const edge = lane.marks.length === 0 ? lane.nextAfter : undefined;
  return (
    <div className="lane" data-market={lane.key === "market" || undefined}>
      <div className="lane-head">
        <span className="lane-name">{lane.name}</span>
        {lane.detail ? <span className="lane-detail">{lane.detail}</span> : null}
        {edge ? (
          <button
            type="button"
            className="lane-edge"
            aria-label={`Move the range to ${said(edge)}`}
            onClick={() => onJump(edge.date)}
          >
            <LaneGlyphIcon glyph={edge.glyph} />
            <span className="num">{short(edge.date)}</span>
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
      <div className="lane-track">
        <Backdrop frame={frame} />
        {lane.marks.map((mark, i) => {
          const side = sides[i];
          return (
            <button
              key={mark.date}
              type="button"
              className="lane-mark"
              style={{ left: pct(((placed[i]?.index ?? 0) + 0.5) / n) }}
              aria-pressed={frame.picked === mark.date}
              aria-label={said(mark)}
              onClick={() => onPick(mark.date)}
            >
              <LaneGlyphIcon glyph={mark.glyph} />
              {side ? (
                <span className={`lane-words lane-words--${side}`} aria-hidden="true">
                  {mark.words}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Ticks under the tracks, then today in words — or the way back to it when it is off the range. */
function Axis({
  frame,
  ticks,
  range,
  onToday,
}: {
  readonly frame: Frame;
  readonly ticks: ReturnType<typeof axisFor>["ticks"];
  readonly range: DayRange;
  readonly onToday: () => void;
}): ReactElement {
  const n = frame.days.length;
  const edge = (i: number): string => (i < n * 0.08 ? " start" : i > n * 0.92 ? " end" : "");
  const today = frame.days.indexOf(frame.today);
  return (
    <div className="lane-axis" aria-hidden={today >= 0 || undefined}>
      <div className="lane-ticks">
        {ticks.map((t) => (
          <span
            key={t.index}
            className={`lane-tick num${edge(t.index)}`}
            style={{ left: pct((t.index + 0.5) / n) }}
          >
            {t.label}
          </span>
        ))}
      </div>
      <div className="lane-when">
        {today >= 0 ? (
          <span className={`lane-now${edge(today)}`} style={{ left: pct((today + 0.5) / n) }}>
            Today
          </span>
        ) : (
          <button
            type="button"
            className={`lane-back${frame.today > range.end ? " end" : ""}`}
            onClick={onToday}
          >
            {frame.today > range.end
              ? `today ${short(frame.today)} ›`
              : `‹ today ${short(frame.today)}`}
          </button>
        )}
      </div>
    </div>
  );
}

export function BookLanesPicture({
  lanes,
  lens,
  range,
  closures,
  picked,
  today,
  label,
  note,
  onPick,
  onJump,
  onToday,
}: {
  readonly lanes: BookLanes;
  readonly lens: BookLens;
  readonly range: DayRange;
  readonly closures: readonly MarketClosure[];
  readonly picked: string | undefined;
  readonly today: string;
  /** "Dates on what you hold, October 2026" — the picture's name for a screen reader. */
  readonly label: string;
  /** Said in place of the holdings' lanes — still reading, unreachable, nothing held. */
  readonly note?: ReactNode;
  readonly onPick: (date: string) => void;
  readonly onJump: (date: string) => void;
  readonly onToday: () => void;
}): ReactElement {
  const ref = useRef<HTMLElement>(null);
  const width = useWidth(ref);
  const { days, ticks } = axisFor(range, lens);
  const shut = closures.filter((c) => c.date >= range.start && c.date <= range.end);
  const frame: Frame = {
    days,
    rules: ticks.map((t) => t.index).filter((i) => i > 0),
    closures: shut,
    picked,
    today,
    width,
  };
  const shown = [...lanes.holdings, lanes.market].flatMap((l) => [
    ...l.marks.map((m) => m.glyph),
    ...(l.marks.length === 0 && l.nextAfter ? [l.nextAfter.glyph] : []),
  ]);
  const drawn = (["decide", "confirmed", "estimated", "market"] as const).filter((g) =>
    shown.includes(g),
  );
  const row = (lane: Lane) => (
    <LaneRow key={lane.key} lane={lane} frame={frame} onPick={onPick} onJump={onJump} />
  );
  return (
    <figure className="lanes" aria-label={label} ref={ref}>
      {note ?? lanes.holdings.map(row)}
      {note || lanes.folded.length === 0 ? null : (
        <p className="lanes-folded">
          {lanes.folded.length > 4
            ? `${lanes.folded.slice(0, 3).join(" · ")} · ${String(lanes.folded.length - 3)} more`
            : lanes.folded.join(" · ")}{" "}
          — nothing dated in this range or after
        </p>
      )}
      {row(lanes.market)}
      <Axis frame={frame} ticks={ticks} range={range} onToday={onToday} />
      <p className="lanes-key">
        {drawn.map((g) => (
          <span key={g}>
            <LaneGlyphIcon glyph={g} /> {GLYPH_WORD[g]}
          </span>
        ))}
        {shut.length > 0 ? (
          <span>
            <LaneGlyphIcon glyph="closed" /> market closed
          </span>
        ) : null}
      </p>
    </figure>
  );
}
