import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactElement, type ReactNode, useId, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { fetchBars } from "../live/bars";
import type { Decision, DeskPosition } from "../live/desk";
import { asideFor, asideWords, shareWatch } from "../live/mark-aside";
import { MARK_GLYPH, MARK_WORD, type MarkWatch, type PositionMark } from "../live/position-mark";
import { signedDollars } from "../live/position-picture";
import { priceRange } from "../live/price-context";
import { CONFIDENCE_METER, type RowCall } from "../live/row-call";
import { LessonTerm } from "./glossary-term";
import { PositionActs } from "./position-act";
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
 *    aside (a share row's names its 20-day low, from the bars the opened picture reads), and the
 *    hand-off to the full guidance on Trade. When this browser read the guidance
 *    for exactly this holding today, the spot says that call and its confidence ("Hold · ▰▰▱
 *    medium", `row-call.ts`); otherwise it says "Guidance", never a made-up call.
 * Opened, it leads with the position's picture (#5070 slice 2, `position-picture.tsx`): the price
 * strip, the waiting-earns strip and the three figures. Then what the decision engine says about
 * this position, when it says anything: its sentence ("Collected $255; buying back costs $550")
 * and the lesson the retired pager carried ("What is a breakeven?", a glossary term opened in
 * place), or a playbook that fits the name (#5083). Then the row's acts (#5070 slice 3,
 * `position-act.tsx`): Buy back · Roll · Not now, a ticket in place and one recap modal. The acts
 * and Undo are the owner's (ownership-gated controls); everyone sees the marks.
 * Last, "Full page ›" (#5070 slice 6, `position-page.tsx`): the opt-in deep dive, whose one way
 * back returns to this row, still open.
 * On a bot's own book, the playbook that opened the position rides one line under it (#5073 slice
 * 4b, `position-playbook-tag.tsx`) — beneath what opens, so the guidance still opens under its line.
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

/** A share row's Not now names its 20-day edge (`shareWatch`), read from the bars the opened
 *  picture reads — one cache, and only while the row is open with Not now on offer. */
function useShareWatch(
  position: DeskPosition,
  open: boolean,
  settable: boolean,
): MarkWatch | undefined {
  const daily = useQuery({
    queryKey: ["bars", position.symbol],
    queryFn: () => fetchBars(position.symbol),
    enabled: open && settable && !position.isOption,
    staleTime: 5 * 60_000,
  });
  const range = daily.data && "bars" in daily.data ? priceRange(daily.data.bars) : undefined;
  return shareWatch(position, range, signedDollars(position.price));
}

export function GuidanceSlot({
  position,
  positions = [],
  row,
  deskId,
  canTrade,
  call,
  decisions = [],
  picture,
  playbook,
  initialOpen = false,
  onFullPage,
  onAside,
  onUndo,
}: {
  readonly position: DeskPosition;
  /** The account's positions: what a close frees depends on what else is held (slice 3). */
  readonly positions?: readonly DeskPosition[];
  readonly row: RowMark;
  readonly deskId: string;
  /** The row's call from today's guidance read of this holding, when this browser has one. */
  readonly call?: RowCall;
  /** The decision engine's cards on this row (`decisionsByRow`): a holding's, a playbook idea. */
  readonly decisions?: readonly Decision[];
  /** The position's picture, first in the opened guidance (`PositionPicture`). */
  readonly picture?: ReactNode;
  /** Does the viewer own this account? Off it, the row's acts (Buy back · Roll · Not now) and
   *  Undo are not drawn. */
  readonly canTrade: boolean;
  /** The playbook that opened it, as its tag line — the bot owner's alone (#885). */
  readonly playbook?: ReactNode;
  /** The row comes back open: "← Positions" from its full page (slice 6, `use-position-page.ts`). */
  readonly initialOpen?: boolean;
  /** "Full page ›", the depth ladder's opt-in last step before a commit (slice 6). */
  readonly onFullPage?: () => void;
  /** Not now, with the price a share row watches while it is aside (`shareWatch`). */
  readonly onAside: (watch?: MarkWatch) => void;
  readonly onUndo: () => void;
}): ReactElement {
  const [open, setOpen] = useState(initialOpen);
  const openId = useId();
  const { mark, aside } = row;
  const stock = parseOccSymbol(position.symbol)?.underlying ?? position.symbol;
  const settable = canTrade && !aside && mark.kind !== "onplan";
  const watch = useShareWatch(position, open, settable);
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
          {picture}
          {decisions.map((d) => (
            <DecisionSaid key={d.id} decision={d} />
          ))}
          {call ? (
            <p className="pos-guide-read">
              {call.word}, {call.confidence} confidence — from your guidance read at {call.readAt}.
            </p>
          ) : null}
          {canTrade ? (
            <PositionActs
              deskId={deskId}
              position={position}
              positions={positions}
              {...(call ? { call } : {})}
              {...(settable
                ? {
                    aside: {
                      when: asideWords(asideFor(position.symbol, mark, new Date(), watch)).full,
                      onAside: () => {
                        onAside(watch);
                        setOpen(false);
                      },
                    },
                  }
                : {})}
            />
          ) : null}
          {aside ? (
            <p className="pos-guide-aside">
              <span className="pos-guide-when">{asideWords(aside).full}</span>
            </p>
          ) : null}
          {onFullPage ? (
            <button type="button" className="pos-guide-link pos-guide-page" onClick={onFullPage}>
              Full page<span className="visually-hidden"> for {position.display}</span>{" "}
              <span aria-hidden="true">›</span>
            </button>
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
      {playbook}
    </div>
  );
}
