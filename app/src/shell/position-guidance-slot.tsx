import { Link } from "@tanstack/react-router";
import { type ReactElement, useId, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { Decision, DeskPosition } from "../live/desk";
import { asideFor, asideWords } from "../live/mark-aside";
import { MARK_GLYPH, MARK_WORD, type PositionMark } from "../live/position-mark";
import { CONFIDENCE_METER, type RowCall } from "../live/row-call";
import { LessonTerm } from "./glossary-term";
import type { RowMark } from "./use-row-marks";

/**
 * THE GUIDANCE LINE (#5070; round 2 of #5037, Eric's Build 4, aca3c01f: "a line on every position,
 * under a divider, in a slot that doesn't shift"). One line under every position's numbers, the
 * same height whatever it says:
 *  - left, the fact badge: "◆ Review · $2.60 above strike", "▲ Consider · 70% of premium kept",
 *    "○ On plan · earnings Nov 18" — or, while Not now holds it, "◇ Not now · till Fri close"
 *    with Undo beside it;
 *  - right, the row's guidance, which opens in place under the line (round 2's "tap opens it in
 *    place"). Today it holds Not now with its return condition, said before anything is set
 *    aside, and the hand-off to the full guidance on Trade; the position's pictures join it next
 *    (#5070 slice 2). When this browser read the guidance for exactly this holding today, the spot
 *    says that call and its confidence ("Hold · ▰▰▱ medium", `row-call.ts`); otherwise it says
 *    "Guidance", never a made-up call.
 * Opened, it leads with what the decision engine says about this position, when it says anything:
 * its sentence ("Collected $255; buying back costs $550") and the lesson the retired pager carried
 * ("What is a breakeven?", a glossary term opened in place), or a playbook that fits the name
 * (#5083). Not now and Undo are the owner's (ownership-gated controls); everyone sees the marks.
 */

function Mark({ mark }: { readonly mark: PositionMark }): ReactElement {
  return (
    <span className={`pos-guide-mark pos-guide-mark--${mark.kind}`}>
      <span className="pos-guide-glyph" aria-hidden="true">
        {MARK_GLYPH[mark.kind]}{" "}
      </span>
      <span className="pos-guide-word">{MARK_WORD[mark.kind]}</span>
      {mark.fact ? (
        <>
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>
          {mark.said ? (
            <>
              <span className="pos-guide-fact" aria-hidden="true">
                {mark.fact}
              </span>
              <span className="visually-hidden">{mark.said}</span>
            </>
          ) : (
            <span className="pos-guide-fact">{mark.fact}</span>
          )}
        </>
      ) : null}
    </span>
  );
}

/** A row's mark as its line draws it — or, while Not now holds it, "◇ Not now · till Fri close".
 *  The Map lens's cards wear the same badge, so a position reads one way on every lens. */
export function FactBadge({ row }: { readonly row: RowMark }): ReactElement {
  const { mark, aside } = row;
  return aside ? (
    <span className="pos-guide-mark pos-guide-mark--aside">
      <span className="pos-guide-glyph" aria-hidden="true">
        ◇{" "}
      </span>
      <span className="pos-guide-word">Not now</span>
      <span aria-hidden="true"> · </span>
      <span className="visually-hidden">, </span>
      <span className="pos-guide-fact">{asideWords(aside).short}</span>
      <span className="visually-hidden">, {MARK_WORD[aside.kind]} set aside</span>
    </span>
  ) : (
    <Mark mark={mark} />
  );
}

/** What the decision engine says about this position: its sentence, then its lesson — or, for a
 *  playbook idea, the way to the playbook. */
function DecisionSaid({ decision }: { readonly decision: Decision }): ReactElement {
  return (
    <div className="pos-guide-said">
      <p className="pos-guide-sentence">{decision.title}</p>
      {decision.kind === "idea" ? (
        <a className="pos-guide-link" href={decision.primary.href}>
          {decision.primary.label}
        </a>
      ) : (
        <LessonTerm learn={decision.learn} />
      )}
    </div>
  );
}

export function GuidanceSlot({
  position,
  row,
  deskId,
  canTrade,
  call,
  decisions = [],
  onAside,
  onUndo,
}: {
  readonly position: DeskPosition;
  readonly row: RowMark;
  readonly deskId: string;
  /** The row's call from today's guidance read of this holding, when this browser has one. */
  readonly call?: RowCall;
  /** The decision engine's cards on this row (`decisionsByRow`): a holding's, a playbook idea. */
  readonly decisions?: readonly Decision[];
  /** Does the viewer own this account? Off it, Not now and Undo are not drawn. */
  readonly canTrade: boolean;
  readonly onAside: () => void;
  readonly onUndo: () => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const openId = useId();
  const { mark, aside } = row;
  const stock = parseOccSymbol(position.symbol)?.underlying ?? position.symbol;
  const settable = canTrade && !aside && mark.kind !== "onplan";
  return (
    <div className="pos-guide">
      <div className="pos-guide-line">
        <FactBadge row={row} />
        {aside && canTrade ? (
          <button type="button" className="pos-guide-undo" onClick={onUndo}>
            Undo<span className="visually-hidden"> Not now on {position.display}</span>
          </button>
        ) : null}
        <button
          type="button"
          className="pos-guide-call"
          aria-expanded={open}
          aria-controls={openId}
          onClick={() => setOpen((o) => !o)}
        >
          {call ? (
            <>
              <span className="visually-hidden">Guidance for {position.display}: </span>
              {call.word}
              <span aria-hidden="true"> · </span>
              <span className="visually-hidden">, </span>
              <span className="pos-guide-meter" aria-hidden="true">
                {CONFIDENCE_METER[call.confidence]}{" "}
              </span>
              <span className="pos-guide-conf">{call.confidence}</span>
              <span className="visually-hidden"> confidence</span>
            </>
          ) : (
            <>
              Guidance<span className="visually-hidden"> for {position.display}</span>
            </>
          )}
          <span className="pos-guide-chev" aria-hidden="true">
            ›
          </span>
        </button>
      </div>
      {open ? (
        <div id={openId} className="pos-guide-open">
          {decisions.map((d) => (
            <DecisionSaid key={d.id} decision={d} />
          ))}
          {call ? (
            <p className="pos-guide-read">
              {call.word}, {call.confidence} confidence — from your guidance read at {call.readAt}.
            </p>
          ) : null}
          {settable ? (
            <p className="pos-guide-aside">
              <button
                type="button"
                className="pos-guide-btn"
                onClick={() => {
                  onAside();
                  setOpen(false);
                }}
              >
                Not now
              </button>
              <span className="pos-guide-when">
                {asideWords(asideFor(position.symbol, mark)).full}
              </span>
            </p>
          ) : aside ? (
            <p className="pos-guide-aside">
              <span className="pos-guide-when">{asideWords(aside).full}</span>
            </p>
          ) : null}
          <Link
            to="/trade"
            search={{ desk: deskId, symbol: stock, section: "guidance" }}
            className="pos-guide-link"
          >
            Guidance for {stock} on Trade <span aria-hidden="true">›</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
