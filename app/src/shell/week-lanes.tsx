import type { ReactElement, ReactNode } from "react";
import type { CardState } from "../live/bot-playbooks";
import { bucketsIn, dayLabel, inGap, placeIn, tradeText, weekTime } from "../live/check-week";
import type { CheckWeek, WeekLane, WeekTrade } from "../live/heartbeat";

/**
 * LANES ON ONE CLOCK (#5073 slice 2 — #5037 round 2, R2). The bot's week of checks is a strip; each
 * playbook's answers are a lane under it on the same clock, so a trade mark on a lane lines up
 * straight under the check that placed it on the strip. Each session is a column sized by its own
 * length (an early close is shorter), the gap between columns is the closed night, and every
 * column is cut into the server's half-hour buckets (`live/check-week.ts` reads them).
 *
 * Shapes, never hue alone (docs/BRAND.md → Accessibility): on the strip a tick is a half hour with
 * checks and a hatched cell one with a span of no check; on a lane solid is trading on live
 * signals, a thin bar wants to hold, an outline wants out, dots wait for a window, hatching with a
 * dashed edge can't fire. ▲ is a buy placed, ▼ a sell, a tall bar is now. The drawings are hidden
 * from a screen reader, which hears each one's sentence instead. A card arrived at from an order
 * (#5073 slice 4a) rings that order's mark — a circle drawn round it, a shape, never a tint.
 */

type Session = CheckWeek["sessions"][number];

/** One session's column: its cells in a grid, anything positioned on its clock laid over them.
 *  Spans throughout — a lane sits inside a card's `<summary>`, which holds phrasing content only. */
function Day({
  week,
  session,
  children,
  over,
}: {
  readonly week: CheckWeek;
  readonly session: Session;
  readonly children: ReactNode;
  readonly over?: ReactNode;
}): ReactElement {
  const n = bucketsIn(week, session);
  return (
    <span className="wk-day" style={{ flexGrow: n }}>
      <span className="wk-cells" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {children}
      </span>
      {over}
    </span>
  );
}

/** The now bar, on the one session it falls inside. */
function NowBar({ week, session }: { readonly week: CheckWeek; readonly session: Session }) {
  const at = placeIn(session, week.now);
  if (at === undefined || week.now >= session.closeAt) return null;
  return <span className="wk-now" style={{ left: `${at * 100}%` }} />;
}

/** ▲/▼ at each trade's instant. `labelled` writes the ticker beside a mark when there is room;
 *  `ringAt` rings the marks the check at that instant placed. */
function TradeMarks({
  trades,
  session,
  labelled = false,
  ringAt,
}: {
  readonly trades: readonly WeekTrade[];
  readonly session: Session;
  readonly labelled?: boolean;
  readonly ringAt?: number;
}) {
  return (
    <>
      {trades.map((trade, i) => {
        const at = placeIn(session, trade.at);
        if (at === undefined) return null;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: two playbooks can place the same order in one check, and a nameless trade carries nothing else to tell them apart; the list is the payload's own order.
            key={`${i}:${trade.at}:${trade.symbol}:${trade.side}`}
            className="wk-mark"
            data-side={trade.side}
            data-edge={at > 0.7 ? "end" : undefined}
            data-ringed={trade.at === ringAt ? "" : undefined}
            style={{ left: `${at * 100}%` }}
            title={tradeText(trade)}
          >
            {trade.side === "buy" ? "▲" : "▼"}
            {labelled ? <span className="wk-mark-sym">{trade.symbol}</span> : null}
          </span>
        );
      })}
    </>
  );
}

/** The bot's own week: a tick per half hour it checked, a hatched cell where it went quiet while
 *  the market was open, the day names under it, and every trade it placed marked on top. */
export function WeekStrip({ week, label }: { readonly week: CheckWeek; readonly label: string }) {
  // A ticker beside each mark only while few enough fit without colliding.
  const labelled = week.trades.length <= 4;
  return (
    <figure className="wk wk-strip" aria-label={label}>
      <div className="wk-row" aria-hidden="true">
        {week.sessions.map((session, s) => (
          <Day
            key={session.date}
            week={week}
            session={session}
            over={
              <>
                <TradeMarks trades={week.trades} session={session} labelled={labelled} />
                <NowBar week={week} session={session} />
              </>
            }
          >
            {(week.checks[s] ?? []).map((count, b) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: a bucket IS its index on the clock.
                key={b}
                className="wk-cell"
                data-c={
                  count === null
                    ? "future"
                    : inGap(week, session, b)
                      ? "gap"
                      : count > 0
                        ? "checked"
                        : "quiet"
                }
              />
            ))}
          </Day>
        ))}
      </div>
      <div className="wk-days" aria-hidden="true">
        {week.sessions.map((session) => (
          <span key={session.date} style={{ flexGrow: bucketsIn(week, session) }}>
            {dayLabel(session.date)}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** What one lane cell draws: a can't-fire card is hatched for every half hour that has happened —
 *  the wiring gap wins over whatever its checks recorded, the same rule as its state word. */
function cellOf(
  state: WeekLane["states"][number][number] | undefined,
  begun: boolean,
  blocked: boolean,
): string {
  if (!begun) return "future";
  if (blocked) return "blocked";
  return state ?? "none";
}

/** One playbook's week: its answer each half hour, and the trades it placed, on the strip's clock. */
export function WeekLaneRow({
  week,
  lane,
  trades,
  state,
  label,
  ringAt,
}: {
  readonly week: CheckWeek;
  readonly lane: WeekLane | undefined;
  readonly trades: readonly WeekTrade[];
  readonly state: CardState;
  readonly label: string;
  /** The check whose trades this lane rings — the order the reader arrived from. */
  readonly ringAt?: number;
}): ReactElement {
  const blocked = state === "blocked";
  return (
    <span className="wk wk-lane" role="img" aria-label={label}>
      <span className="wk-row">
        {week.sessions.map((session, s) => (
          <Day
            key={session.date}
            week={week}
            session={session}
            over={
              <>
                <TradeMarks trades={trades} session={session} {...(ringAt ? { ringAt } : {})} />
                <NowBar week={week} session={session} />
              </>
            }
          >
            {(week.checks[s] ?? []).map((count, b) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: a bucket IS its index on the clock.
                key={b}
                className="wk-cell"
                data-s={cellOf(lane?.states[s]?.[b], count !== null, blocked)}
              />
            ))}
          </Day>
        ))}
      </span>
    </span>
  );
}

/** The key to a lane's shapes, in the opened card — each swatch is the lane's own cell. */
export function LaneKey(): ReactElement {
  const rows: readonly [string, string][] = [
    ["tactical", "Trading on live signals"],
    ["long", "Wants to hold"],
    ["flat", "Wants out"],
    ["no-window", "Waiting for its window"],
    ["blocked", "Can't fire"],
  ];
  return (
    <ul className="wk-key">
      {rows.map(([state, word]) => (
        <li key={state}>
          <span className="wk-swatch wk-cell" data-s={state} aria-hidden="true" /> {word}
        </li>
      ))}
      <li>
        <span aria-hidden="true">▲</span> buy · <span aria-hidden="true">▼</span> sell placed
      </li>
    </ul>
  );
}

/** "Sell CRWV placed · Tue 10:31 AM" for each of a card's trades — the marks, said in words; the
 *  ringed one says it is the order the reader came from. */
export function LaneTrades({
  trades,
  ringAt,
}: {
  readonly trades: readonly WeekTrade[];
  readonly ringAt?: number;
}) {
  if (trades.length === 0) return null;
  return (
    <ul className="wk-trades">
      {trades.map((trade, i) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: as on the marks — one check can place the same order twice.
          key={`${i}:${trade.at}:${trade.symbol}:${trade.side}`}
          data-ringed={trade.at === ringAt ? "" : undefined}
        >
          <span className="wk-trade-mark" aria-hidden="true">
            {trade.side === "buy" ? "▲" : "▼"}
          </span>{" "}
          {trade.side === "buy" ? "Buy" : "Sell"} <b>{trade.symbol}</b> placed{" "}
          <span className="pbb-meta">{weekTime(trade.at)}</span>
          {trade.at === ringAt ? (
            <span className="wk-trade-this"> · the order you came from</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
