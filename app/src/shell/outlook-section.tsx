import { useQuery } from "@tanstack/react-query";
import { type ReactElement, useId, useState } from "react";
import { structureLabel } from "../../../src/options/candidate-mechanics";
import {
  OUTLOOK_DIRECTIONS,
  OUTLOOK_HORIZON_DAYS,
  OUTLOOK_MAGNITUDES,
  type Outlook,
  type OutlookDirection,
  type OutlookMagnitude,
} from "../../../src/options/outlook";
import type { RankedCandidate, Recommendation } from "../../../src/options/recommend";
import type { CandidateAbsence } from "../../../src/options/structure-candidates";
import { absenceWords, volRegimeWords } from "../../../src/options/structure-words";
import type { PlayInfo } from "../live/options";
import { type StructuresAnswer, structuresKey, structuresQuery } from "../live/structures";
import { OutlookCard } from "./outlook-card";
import { type OutlookPick, outlookPick } from "./outlook-pick";
import { SymbolPrompt } from "./symbol-prompt";

/**
 * THE OUTLOOK PANE (#3407, slice 4) — state a view, read the ways this chain can express it, pick
 * one and land on the chain with its legs outlined.
 *
 * AN AUXILIARY ENTRY INTO THE BENCH, NEVER A HOME (#3407's state block, which placed this before it
 * was built). Of the four lo-fi shapes, "Outlook" was the one that made a belief the START of the
 * journey; the shape Eric picked was Workbench, where the chain and the ticket are the workspace. So
 * this is a tool ON that bench — reachable through the section switch folded and a door docked,
 * exactly as Guidance and the standalone Chain are, and it never docks on its own. It proposes and
 * hands off; it never places an order, and `?section=` is the only trace it leaves.
 *
 * THE READ IS ASKED FOR, NOT IMPLIED. Changing a control stages a view; the button commits it. One
 * read is up to 22 broker calls (`structures-route.ts`), so a pane that refetched on every toggle
 * would spend a member's rate limit on views they were still composing — and a stated forecast is
 * exactly the kind of input that is half-right until it is finished.
 *
 * Nothing is silently dropped: the structures the chain could not carry are folded underneath with
 * `absenceWords`' reason for each, because a shorter list with no explanation reads as "these were
 * considered and rejected", which is a different and false claim (`recommend.ts`'s own doctrine).
 */

/** The words each direction is offered under. Keyed by the vocabulary in `outlook.ts`, which is the
 *  same list the route accepts — a choice this pane offered and the route refused would come back as
 *  a note blaming the broker for our own mismatch. */
const DIRECTION_WORDS: Readonly<Record<OutlookDirection, string>> = {
  bullish: "Up",
  bearish: "Down",
  neutral: "Sideways",
};
const DIRECTIONS = OUTLOOK_DIRECTIONS.map((id) => ({ id, label: DIRECTION_WORDS[id] }));

/** Magnitude reads as DISTANCE for a directional view and as TIGHTNESS for a neutral one — the one
 *  thing `outlook.ts` warns a renderer not to collapse, so the words change with the direction. */
const MAGNITUDE_WORDS: Readonly<Record<OutlookMagnitude, readonly [string, string]>> = {
  slight: ["a little", "loosely"],
  moderate: ["a fair amount", "fairly tightly"],
  strong: ["a lot", "very tightly"],
};

function magnitudeLabel(magnitude: OutlookMagnitude, direction: OutlookDirection): string {
  const [distance, tightness] = MAGNITUDE_WORDS[magnitude];
  return direction === "neutral" ? tightness : distance;
}

/** A radio group drawn as a row of segments: the checked one carries a weight and a border, never a
 *  hue alone (docs/BRAND.md → Accessibility — a standing reader is red/green colorblind). */
function Choice<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  readonly legend: string;
  readonly name: string;
  readonly options: readonly { readonly id: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (next: T) => void;
}): ReactElement {
  const id = useId();
  return (
    <fieldset className="outlook-choice">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={String(option.id)} data-checked={option.id === value ? "true" : undefined}>
          <input
            type="radio"
            name={`${name}-${id}`}
            checked={option.id === value}
            onChange={() => onChange(option.id)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

/** The structures that could not be ranked, each with the engine's own reason, folded. */
function Absent({
  absent,
}: {
  readonly absent: readonly {
    readonly kind: RankedCandidate["kind"];
    readonly reason: CandidateAbsence;
  }[];
}): ReactElement | null {
  if (absent.length === 0) return null;
  return (
    <details className="outlook-absent">
      <summary>
        {absent.length} structure{absent.length === 1 ? "" : "s"} couldn't be ranked — why
      </summary>
      <ul>
        {absent.map((item) => (
          <li key={`${item.kind}-${item.reason}`}>
            <strong>{structureLabel(item.kind)}</strong> — {absenceWords(item.reason)}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** The view as the member stated it, in words — the sentence the ranked list is an answer TO, so a
 *  reading can never be mistaken for an answer to a different forecast. */
function viewSentence(view: Outlook): string {
  const motion =
    view.direction === "neutral"
      ? "holds a range"
      : view.direction === "bullish"
        ? "is up"
        : "is down";
  return `${view.symbol} ${motion} ${magnitudeLabel(view.magnitude, view.direction)} over the next ${view.horizonDays} days.`;
}

/** The answered half: the regime read, what the view points at, the ranked cards, what couldn't be
 *  ranked, and the standing disclosure — extracted so the pane itself stays one readable branch. */
function Proposals({
  recommendation,
  spot,
  asOf,
  plays,
  onUse,
}: {
  readonly recommendation: Recommendation;
  readonly spot: number;
  readonly asOf: string;
  readonly plays: readonly PlayInfo[] | undefined;
  readonly onUse: (candidate: RankedCandidate, pick: OutlookPick) => void;
}): ReactElement {
  const { ranked, absent, volRegime, target, disclosure } = recommendation;
  return (
    <>
      {/* The view these cards ANSWER, echoed from the route rather than read off the controls: the
          controls keep moving while an answer sits on screen, and a bullish list under a sentence
          that now says "is down" would be a false label on a real reading. */}
      <p className="outlook-answered">Answering: {viewSentence(recommendation.outlook)}</p>
      <p className="outlook-regime">{volRegimeWords(volRegime)}</p>
      <p className="outlook-muted">
        {target === undefined
          ? `Spot $${spot.toFixed(2)}`
          : `That view points at $${target.toFixed(2)}, from a spot of $${spot.toFixed(2)}`}{" "}
        as of {new Date(asOf).toLocaleTimeString()}.
      </p>
      {ranked.length === 0 ? (
        <p className="note">
          This chain couldn't carry any of the structures that express that view — the reasons are
          below.
        </p>
      ) : (
        <ul className="outlook-list">
          {ranked.map((candidate) => {
            const pick = outlookPick(candidate, plays);
            // The rung is named as unearned only when the ladder actually SAYS so. While `plays` is
            // still loading (or its read failed) `outlookPick` reads locked — fail safe, so nothing
            // widens — but claiming the member hasn't earned a rung we couldn't look up would be a
            // false statement about their own progression, so the label stays neutral.
            const rung = plays?.find((p) => p.code === pick.lockedPlay)?.name;
            return (
              <OutlookCard
                key={`${candidate.kind}-${candidate.expiration ?? candidate.daysToExpiry}`}
                candidate={candidate}
                useLabel={
                  pick.locked && rung
                    ? `Open the chain on its legs — ${rung} isn't earned yet`
                    : "Open the chain on its legs"
                }
                onUse={(c) => onUse(c, pick)}
              />
            );
          })}
        </ul>
      )}
      <Absent absent={absent} />
      <p className="outlook-muted outlook-disclosure">{disclosure}</p>
    </>
  );
}

export function OutlookSection({
  symbol,
  plays,
  onUse,
  onSymbolCommit,
}: {
  readonly symbol: string;
  /** The ladder, for the rung a pick would preset — a locked rung is said, never silently skipped. */
  readonly plays: readonly PlayInfo[] | undefined;
  readonly onUse: (candidate: RankedCandidate, pick: OutlookPick) => void;
  /** Set when the ticket is not on screen (folded): the empty pane asks for the symbol itself. */
  readonly onSymbolCommit?: (symbol: string) => void;
}): ReactElement {
  const [direction, setDirection] = useState<OutlookDirection>("bullish");
  const [magnitude, setMagnitude] = useState<OutlookMagnitude>("moderate");
  const [horizonDays, setHorizonDays] = useState<number>(30);
  // The view that was ASKED for, which is the only one queried — see the header comment.
  const [asked, setAsked] = useState<Outlook | undefined>(undefined);
  const staged: Outlook = { symbol, direction, magnitude, horizonDays };
  const view = asked ?? staged;
  const answer = useQuery(structuresQuery(view, asked !== undefined && asked.symbol === symbol));
  /** Asking for the SAME view again has to force the read, not just set state: the query key is the
   *  view, so re-asking after a failure (or after a stale answer) matches a key react-query already
   *  holds and would do nothing — the button would be dead exactly where its copy invites a retry. */
  const onAsk = async () => {
    const same =
      asked !== undefined && structuresKey(asked).join() === structuresKey(staged).join();
    setAsked(staged);
    if (same) await answer.refetch();
  };

  if (symbol === "") {
    return onSymbolCommit ? (
      <SymbolPrompt ask="Pick a symbol to state a view on it." onCommit={onSymbolCommit} />
    ) : (
      <p className="note">Pick a symbol on the ticket to state a view on it.</p>
    );
  }
  const data = answer.data;
  return (
    <div className="outlook">
      <p className="outlook-kicker">Your view</p>
      <p className="outlook-sentence">{viewSentence(staged)}</p>
      <div className="outlook-controls">
        <Choice
          legend="Direction"
          name="outlook-direction"
          options={DIRECTIONS}
          value={direction}
          onChange={setDirection}
        />
        <Choice
          legend={direction === "neutral" ? "How tightly" : "How far"}
          name="outlook-magnitude"
          options={OUTLOOK_MAGNITUDES.map((m) => ({ id: m, label: magnitudeLabel(m, direction) }))}
          value={magnitude}
          onChange={setMagnitude}
        />
        <Choice
          legend="Over"
          name="outlook-horizon"
          options={OUTLOOK_HORIZON_DAYS.map((d) => ({ id: d, label: `${d} days` }))}
          value={horizonDays}
          onChange={setHorizonDays}
        />
      </div>
      <button
        type="button"
        className="btn outlook-ask"
        onClick={() => void onAsk()}
        disabled={answer.isFetching}
      >
        {answer.isFetching ? "Reading the chain…" : "Show me the structures"}
      </button>
      <Readout
        symbol={symbol}
        asked={asked !== undefined}
        pending={answer.isPending}
        failed={answer.isError}
        data={data}
        plays={plays}
        onUse={onUse}
      />
    </div>
  );
}

/** Exactly one of the five states a stated view can be in — never asked, reading, unreachable, a
 *  note the route chose to answer with, or the proposals themselves. Split out of the pane so the
 *  branch reads as a list of states rather than as a stack of nested ternaries. */
function Readout({
  symbol,
  asked,
  pending,
  failed,
  data,
  plays,
  onUse,
}: {
  readonly symbol: string;
  readonly asked: boolean;
  readonly pending: boolean;
  readonly failed: boolean;
  readonly data: StructuresAnswer | undefined;
  readonly plays: readonly PlayInfo[] | undefined;
  readonly onUse: (candidate: RankedCandidate, pick: OutlookPick) => void;
}): ReactElement | null {
  if (!asked) {
    return (
      <p className="note">
        Nothing is read until you ask — one look is up to 22 calls on your own broker connection.
      </p>
    );
  }
  if (pending) {
    return <p className="note">Reading {symbol}'s chain across every expiry that reaches it…</p>;
  }
  if (failed) {
    return <p className="note">Couldn't reach the chain right now — ask again when you like.</p>;
  }
  if (!data) return null;
  if ("note" in data) return <p className="note">{data.note}</p>;
  return (
    <Proposals
      recommendation={data.recommendation}
      spot={data.spot}
      asOf={data.asOf}
      plays={plays}
      onUse={onUse}
    />
  );
}
