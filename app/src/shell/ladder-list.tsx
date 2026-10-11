import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { Journey, JourneyCourse, JourneyMilestone } from "../live/learn";
import type { PlayInfo, PlaysIndex } from "../live/options";
import { ladderProgress } from "./course-cards";
import { ladderStatus } from "./milestone-strip";

/**
 * THE TRADING CHAPTER'S LADDER, DRAWN ONCE (#5242; Eric's pick on #5176 round 2). The chapter used
 * to draw the same eight rungs twice — Trade's strip ("n / 8 earned") over a panel of level cards
 * ("n / 8 complete"). Now one teal-edged card: the count and the status line, then every level as
 * a header row with its rungs under it. Trade keeps its strip; this is the chapter's own shape.
 *
 * Each rung row has one of four shapes, chosen in this order:
 *   - **its level is finished** → one compact line: ✓ · code · "earned <date>" (Eric's r2 note:
 *     "tabular structures can be synthesised in a fraction of the time"). The order id is one tap
 *     deep — the proof stays reachable without spending a line on it.
 *   - **it is the server's `nextUp`** → the open row: title, explanation and the Trade link preset
 *     to that rung.
 *   - **locked on the desk** (`PlayInfo.locked`) → one dimmed line saying what opens it
 *     (`opensAfter`), and NO Trade link — round 2 caught the old card offering "open Trade →" on a
 *     rung the desk refuses.
 *   - **anything else** → one line (mark · code · title · points), the explanation one tap deep.
 *
 * Nothing here decides earned or locked: both arrive from the server (`/api/learn` for the proof,
 * `/api/trade/plays` for the desk's lock), paired by the rung's code, never by position. No rung
 * links to the page it is on (round 1 found six strip rungs doing so). Colour never carries a state
 * alone: earned is ✓ and the word, locked is the lock line or "opens after" plus dimming, next is
 * the open row.
 * @category learning
 */
export function LadderList({
  journey,
  plays,
  deskId,
}: {
  readonly journey: Journey;
  /** `/api/trade/plays`, when it answered — fail-soft: without it no rung offers Trade. */
  readonly plays?: PlaysIndex;
  readonly deskId: string;
}): ReactElement {
  const { done, total } = ladderProgress(journey);
  return (
    <section className="ladder-list" aria-label="Trading ladder">
      <div className="ll-head">
        <span className="ll-eyebrow">Milestone · Trading ladder</span>
        <span className="ll-count num">
          {done} / {total} earned
        </span>
      </div>
      {plays ? (
        <p className="ll-status">
          {ladderStatus({
            plays: plays.plays,
            wheels: plays.wheels,
            gate: plays.gate,
            nextUp: plays.nextUp,
          })}
        </p>
      ) : null}
      {journey.courses.map((course) => (
        <Level key={course.level} course={course} plays={plays} deskId={deskId} />
      ))}
    </section>
  );
}

function Level({
  course,
  plays,
  deskId,
}: {
  readonly course: JourneyCourse;
  readonly plays?: PlaysIndex;
  readonly deskId: string;
}): ReactElement {
  const finished = course.total > 0 && course.done === course.total;
  return (
    <section
      className={`ll-level${course.locked ? " ll-level-locked" : ""}`}
      aria-label={`Level ${course.level} · ${course.title}`}
    >
      <div className="ll-level-head">
        <span className="ll-badge num">{course.level}</span>
        <span className="ll-level-title">{course.title}</span>
        <span className="ll-level-count num">
          {finished ? "✓ " : ""}
          {course.done} / {course.total}
        </span>
      </div>
      {course.locked ? <p className="ll-lock">🔒 finish the level below</p> : null}
      <ul className="ll-rungs">
        {course.milestones.map((m) => (
          <Rung
            key={m.id}
            milestone={m}
            play={plays?.plays.find((p) => p.code === m.code)}
            next={plays?.nextUp !== undefined && plays.nextUp === m.code}
            finished={finished}
            levelLocked={course.locked}
            deskId={deskId}
          />
        ))}
      </ul>
    </section>
  );
}

function Rung({
  milestone: m,
  play,
  next,
  finished,
  levelLocked,
  deskId,
}: {
  readonly milestone: JourneyMilestone;
  readonly play?: PlayInfo;
  readonly next: boolean;
  readonly finished: boolean;
  readonly levelLocked: boolean;
  readonly deskId: string;
}): ReactElement {
  const code = <span className="ll-code num">{m.code ?? ""}</span>;
  if (finished && m.earned) {
    return (
      <li className="ll-rung ll-earned">
        <details>
          <summary>
            <span className="ll-mark" aria-hidden="true">
              ✓
            </span>
            {code}
            <span className="ll-proof num">earned {m.earned.on}</span>
          </summary>
          <span className="ll-order num">order {m.earned.orderId}</span>
        </details>
      </li>
    );
  }
  // The desk's lock wins when `/api/trade/plays` answered; without it, the level's own lock.
  const locked = !m.earned && (play ? play.locked : levelLocked);
  const trade = play && !locked && !m.earned ? <TradeLink deskId={deskId} play={play} /> : null;
  if (next && !m.earned) {
    return (
      <li className="ll-rung ll-next">
        <span className="ll-mark" aria-hidden="true">
          ○
        </span>
        {code}
        <span className="ll-body">
          <span className="ll-title">{m.title}</span>
          <span className="ll-detail">{m.detail}</span>
          <span className="ll-act">
            {trade}
            <span className="ll-pts num">+{m.points}</span>
          </span>
        </span>
      </li>
    );
  }
  const trail = m.earned ? (
    <span className="ll-proof num">earned {m.earned.on}</span>
  ) : locked && play?.opensAfter ? (
    <span className="ll-opens num">opens after {play.opensAfter.code} fills</span>
  ) : (
    <span className="ll-pts num">+{m.points}</span>
  );
  const state = m.earned ? "ll-earned" : locked ? "ll-locked" : "ll-open";
  return (
    <li className={`ll-rung ${state}`}>
      <details>
        <summary>
          <span className="ll-mark" aria-hidden="true">
            {m.earned ? "✓" : "○"}
          </span>
          {code}
          <span className="ll-title">{m.title}</span>
          {trail}
        </summary>
        <span className="ll-detail">{m.detail}</span>
        {m.earned ? <span className="ll-order num">order {m.earned.orderId}</span> : null}
        {trade}
      </details>
    </li>
  );
}

/** Preset to the rung, on the account the page is showing — never a gate (the desk refuses a
 *  locked rung regardless), and only ever drawn on a rung the desk has open. */
function TradeLink({
  deskId,
  play,
}: {
  readonly deskId: string;
  readonly play: PlayInfo;
}): ReactElement {
  return (
    <Link
      to="/trade"
      search={{ ...(deskId ? { desk: deskId } : {}), play: play.code }}
      className="ll-go"
    >
      open Trade →
    </Link>
  );
}
