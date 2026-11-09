import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type FormEvent, type ReactElement, useId, useState } from "react";
import {
  type Card,
  type CardOption,
  type Choice,
  choose,
  type EventRow,
  type EventsCard,
  FAST_TRACK_TAP_BUDGET,
  type FastTrackInput,
  type FieldCard,
  type MemberBook,
  NOT_RESEARCHED,
  nextStep,
  type Outcome,
  rankEvents,
  startFastTrack,
  type Walk,
} from "../../../src/domain/fast-track";
import {
  eventDateLine,
  fastTrackKey,
  fetchFastTrack,
  PLAN_TEXT_MAX,
  ticketSearch,
} from "../live/fast-track";
import { setWatching, watchlistKey } from "../live/watchlist";
import { InlineResult } from "../ui";
import { PlanLines } from "./fast-track-plan";

/**
 * "WHAT'S COMING UP THAT I SHOULD WATCH?", AS CARDS (#7034 slice 2). The first quick question under
 * the member's own question box opens this walk in place (#7018 round 1: the member's question
 * first, canned ones as fallbacks). One card per empty field of the outcome — the engine
 * (`src/domain/fast-track.ts`) decides which, from the calendar, the ledgers and the member's book;
 * this file draws it.
 *
 * The cards, at 390: the events (at most 3, the member's names first, the rest folded behind a
 * count, each with its date in words and the house's stance) → "What would prove you wrong?" →
 * "Where would you take profit, or by when?" → the ticket, which opens the trade form with the stop
 * and the exit carried in. Five taps from the question to the trade form; the owner fires it there.
 *
 * Every card carries "My own answer" and "Add context" (criterion 4). On the events card an own
 * answer names no field, so it rides along as a note (criterion 5), shown under the card.
 *
 * "Watch" adds the name to the member's watchlist on the tap. "Ask what we know" hands the question
 * to the chat, which reads the same ledgers (`get_upcoming_events`, slice 3a); the slow research
 * path with an honest wait is slice 3b.
 */

/** A card's own words, two disclosures: the member's answer, and context that rides as a note. */
function CardWords({
  card,
  onChoose,
}: {
  readonly card: Card;
  readonly onChoose: (choice: Choice) => void;
}): ReactElement {
  const ownLabel = card.field === "event" ? "My own answer (kept as a note)" : "My own answer";
  return (
    <div className="ft-words">
      <WordsForm summary={ownLabel} onSubmit={(own) => onChoose({ own })} />
      <WordsForm summary="Add context" onSubmit={(context) => onChoose({ context })} />
    </div>
  );
}

function WordsForm({
  summary,
  onSubmit,
}: {
  readonly summary: string;
  readonly onSubmit: (text: string) => void;
}): ReactElement {
  const [text, setText] = useState("");
  const inputId = useId();
  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };
  return (
    <details className="story-more ft-own">
      <summary>{summary}</summary>
      <form className="ask-row" onSubmit={submit}>
        <label className="visually-hidden" htmlFor={inputId}>
          {summary}
        </label>
        <input
          id={inputId}
          className="ask-input"
          type="text"
          value={text}
          maxLength={PLAN_TEXT_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="In your own words"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary ask-send" disabled={!text.trim()}>
          Add
        </button>
      </form>
    </details>
  );
}

function ActionButton({
  option,
  onPick,
}: {
  readonly option: CardOption;
  readonly onPick: (id: string) => void;
}): ReactElement {
  const primary = option.kind === "ticket";
  return (
    <button
      type="button"
      className={`ft-action${primary ? " ft-action--plan" : ""}`}
      onClick={() => onPick(option.id)}
    >
      {option.label}
    </button>
  );
}

function EventItem({
  row,
  onPick,
}: {
  readonly row: EventRow;
  readonly onPick: (id: string) => void;
}): ReactElement {
  const researched = row.stance !== NOT_RESEARCHED;
  return (
    <li className="ft-event">
      <p className="ft-event-title">{row.title}</p>
      <p className="ft-event-date">
        <span className="num">{eventDateLine(row.date, row.dateWords)}</span>
      </p>
      <p className={`ft-stance${researched ? "" : " ft-stance--none"}`}>
        <span className="story-mark">House stance</span> {row.stance}
      </p>
      <div className="ft-actions">
        {row.actions.map((a) => (
          <ActionButton key={a.id} option={a} onPick={onPick} />
        ))}
      </div>
    </li>
  );
}

function EventsCardView({
  card,
  onChoose,
}: {
  readonly card: EventsCard;
  readonly onChoose: (choice: Choice) => void;
}): ReactElement {
  const pick = (option: string): void => onChoose({ option });
  return (
    <>
      {card.rows.length === 0 ? (
        <p className="note">Nothing on the calendar in the next 14 days.</p>
      ) : (
        <ul className="ft-events">
          {card.rows.map((r) => (
            <EventItem key={r.id} row={r} onPick={pick} />
          ))}
        </ul>
      )}
      {card.more > 0 ? (
        <details className="story-more ft-fold">
          <summary>{card.more} more in the next 14 days</summary>
          <ul className="ft-events">
            {card.folded.map((r) => (
              <EventItem key={r.id} row={r} onPick={pick} />
            ))}
          </ul>
        </details>
      ) : null}
      <p className="ft-uncovered">{card.notCovered}.</p>
    </>
  );
}

function FieldCardView({
  card,
  onChoose,
}: {
  readonly card: FieldCard;
  readonly onChoose: (choice: Choice) => void;
}): ReactElement {
  return (
    <>
      {card.context ? <p className="ft-context">{card.context}</p> : null}
      {card.options.length > 0 ? (
        <ul className="ft-options">
          {card.options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className="ft-option"
                title={o.detail}
                onClick={() => onChoose({ option: o.id })}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function Notes({ notes }: { readonly notes: readonly string[] }): ReactElement | null {
  if (notes.length === 0) return null;
  return (
    <div className="ft-notes">
      <p className="story-mark">Your notes, kept with the move</p>
      <ul>
        {notes.map((n, i) => (
          // A note can repeat; its place in the list is what tells two apart.
          // biome-ignore lint/suspicious/noArrayIndexKey: the list only ever grows at its end
          <li key={`${i}-${n}`}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** The walk's end. A ticket goes to the trade form; a watch and an ask already happened on the tap. */
function Done({
  outcome,
  watched,
  asked,
}: {
  readonly outcome: Outcome;
  /** Whether the chat took the question: pending, sent, or it didn't open. */
  readonly asked: "pending" | "sent" | "failed";
  /** The watchlist's answer to the tap: pending, kept, or the reason it wasn't. */
  readonly watched:
    | { readonly state: "pending" | "ok" }
    | { readonly state: "err"; readonly why: string };
}): ReactElement {
  if (outcome.kind === "watchlist") {
    return (
      <div className="ft-done">
        {watched.state === "err" ? (
          <InlineResult tone="err">{watched.why}</InlineResult>
        ) : (
          <p>
            <b className="num">{outcome.symbol}</b>{" "}
            {watched.state === "ok" ? "is on your watchlist." : "is being added to your watchlist…"}
          </p>
        )}
        <Notes notes={outcome.notes} />
      </div>
    );
  }
  if (outcome.kind === "research-ask") {
    return (
      <div className="ft-done">
        {asked === "failed" ? (
          <InlineResult tone="err">
            The chat didn't open, so "{outcome.question}" wasn't sent. Start over to try again.
          </InlineResult>
        ) : (
          <p>
            {asked === "sent" ? "Asked in the chat" : "Asking in the chat"}: "{outcome.question}"
          </p>
        )}
        <Notes notes={outcome.notes} />
      </div>
    );
  }
  return (
    <div className="ft-done ft-ticket">
      <p className="ft-ticket-head">
        Your move on <b className="num">{outcome.symbol}</b>
      </p>
      <PlanLines stop={outcome.stop.text} exit={outcome.exit.text} />
      <Notes notes={outcome.notes} />
      <Link className="btn btn-primary ft-fire" to="/trade" search={ticketSearch(outcome)}>
        Open it in the trade form
      </Link>
      <p className="ft-hint">
        You pick the contract and the size there, and only you can send it. Paper money; the trade
        form reviews it before anything is sent.
      </p>
    </div>
  );
}

const onBook = (symbols: readonly string[], book: MemberBook): boolean =>
  symbols.some((s) => book.held.includes(s) || book.watched.includes(s));

/** The events card's heading says how it ranked — "your names first" only when one of the member's
 *  names actually leads the list; a field card asks its own question. */
function headingOf(card: Card, input: FastTrackInput): string {
  if (card.field !== "event") return card.question;
  const first = rankEvents(input)[0];
  const mine = first !== undefined && onBook(first.event.symbols, input.book);
  return mine
    ? "The next 14 days: your names first, then by impact"
    : "The next 14 days, by impact";
}

/** Where each field card sits on the shortest path: the question, "Plan a move", then the stop,
 *  the exit, and the trade form. Fixed, so an added note never reads as a tap past the budget. */
const PATH_TAP = { stop: 3, exit: 4 } as const;

/** The walk over one read of the fortnight. */
function WalkOver({
  input,
  onAsk,
}: {
  readonly input: FastTrackInput;
  readonly onAsk: (text: string) => Promise<boolean>;
}): ReactElement {
  const [walk, setWalk] = useState<Walk>(startFastTrack);
  const [asked, setAsked] = useState<"pending" | "sent" | "failed">("pending");
  const client = useQueryClient();
  const watch = useMutation({
    mutationFn: (symbol: string) => setWatching(symbol, true),
    onSuccess: () => void client.invalidateQueries({ queryKey: [...watchlistKey] }),
  });
  const step = nextStep(walk, input);
  const onChoose = (card: Card) => (choice: Choice) => {
    const next = choose(walk, card, choice);
    if (next === walk) return;
    setWalk(next);
    const done = nextStep(next, input);
    if (!("complete" in done)) return;
    if (done.complete.kind === "watchlist") watch.mutate(done.complete.symbol);
    if (done.complete.kind === "research-ask") {
      setAsked("pending");
      void onAsk(done.complete.question).then(
        (sent) => setAsked(sent ? "sent" : "failed"),
        () => setAsked("failed"),
      );
    }
  };
  const watched = watch.isError
    ? { state: "err" as const, why: watch.error.message }
    : watch.data && !watch.data.ok
      ? { state: "err" as const, why: watch.data.refusals.join(" ") }
      : { state: watch.isSuccess ? ("ok" as const) : ("pending" as const) };
  const restart =
    walk.taps > 1 ? (
      <button type="button" className="ft-restart" onClick={() => setWalk(startFastTrack())}>
        Start over
      </button>
    ) : null;
  if ("complete" in step) {
    return (
      <>
        <Done outcome={step.complete} watched={watched} asked={asked} />
        {restart}
      </>
    );
  }
  const { card } = step;
  return (
    <>
      <p className="ft-question">
        {headingOf(card, input)}
        {card.field !== "event" ? (
          <span className="ft-taps num">
            {" "}
            · tap {PATH_TAP[card.field]} of {FAST_TRACK_TAP_BUDGET}
          </span>
        ) : null}
      </p>
      {card.field === "event" ? (
        <EventsCardView card={card} onChoose={onChoose(card)} />
      ) : (
        <FieldCardView card={card} onChoose={onChoose(card)} />
      )}
      <CardWords card={card} onChoose={onChoose(card)} />
      <Notes notes={walk.notes} />
      {restart}
    </>
  );
}

/** The fast track, opened under the quick question that started it. */
export function FastTrackWalk({
  onAsk,
}: {
  readonly onAsk: (text: string) => Promise<boolean>;
}): ReactElement {
  const data = useQuery({
    queryKey: [...fastTrackKey],
    queryFn: fetchFastTrack,
    staleTime: 300_000,
  });
  return (
    <section className="ft-walk" aria-label="What's coming up" aria-live="polite">
      {data.isPending ? (
        <p className="note">Reading the next 14 days…</p>
      ) : data.isError ? (
        <p className="note">The calendar didn't load. Try again in a moment.</p>
      ) : (
        <WalkOver input={data.data} onAsk={onAsk} />
      )}
    </section>
  );
}
