import { type ReactElement, useId, useState } from "react";
import {
  type DraftAnswer,
  type DraftCard,
  type MemberConvictionView,
  previewConvictionRequest,
  type SteerablePairView,
  saveConvictionRequest,
} from "../live/member-convictions";
import { EnvPill, InlineResult } from "../ui";
import { ClaimBlock, PairSettings, Problems } from "./conviction-claim";
import {
  blanksOf,
  type ClaimFields,
  type ConvictionFields,
  draftOf,
  emptyClaim,
  emptyFields,
  emptyPair,
  fieldsFrom,
  MAX_CLAIMS,
  MAX_STEERS,
  MAX_TITLE,
  type PairFields,
  placeProblems,
  type Said,
  saidAt,
} from "./conviction-fields";

/**
 * THE CONVICTION FORM (#5482 slice 6b, criteria 1, 3, 4 and 8) — a member states a view of the
 * market as claims, picks the pairs it steers among the ones their bots already run, narrows what
 * each may do, and sees exactly what that changes before anything is kept.
 *
 * TWO TAPS, TWO STEPS. "Preview" asks `/api/convictions/draft`, which writes nothing and answers
 * with the card: each pair's settings, before → after, the check-day sentence and who keeps the
 * timing. Only a preview that came back clean shows "Save draft"; any edit after it puts the card
 * away, so the member can never save a view other than the one they just read. `/save` judges the
 * same draft again: the server is the authority, the preview an early read of it. This is the shape
 * Moneypenny's chat intake will take as well (criterion 9: applied only on the member's tap).
 *
 * PHONE FIRST, IN THE ORDER A VIEW IS MADE: its name, its claims (the heart of it), which pairs it
 * steers and how far, then the day it is checked. One column at 390px; a wide container gives the
 * claims and the pair settings two columns of fields each, no new fields.
 *
 * WHAT IT IS NOT. A saved view is a draft that steers nothing yet, said under the button and on the
 * card. It never subscribes a pair, never widens a bound and never places an order. Paper only:
 * the card wears SIM.
 */

function Card({ card, note }: { readonly card: DraftCard; readonly note: string }): ReactElement {
  return (
    <section className="cvf-card" aria-label="What this view changes">
      <h3 className="cvf-card-h">
        What it changes <EnvPill />
      </h3>
      {card.pairs.map((pair) => (
        <div key={pair.pair} className="cvf-card-pair">
          <p className="cvf-card-name">{pair.name}</p>
          {pair.changes.length > 0 ? (
            <ul className="cvf-changes">
              {pair.changes.map((change) => (
                <li key={change.setting} className="cvf-change">
                  <span className="cvf-change-what">{change.setting}</span>
                  <span className="cvf-change-before">{change.before}</span>
                  <span className="cvf-change-arrow">
                    <span aria-hidden="true">→</span>
                    <span className="visually-hidden">becomes</span>
                  </span>
                  <b className="cvf-change-after">{change.after}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pba-hint">No setting changes: it is steered for its check day alone.</p>
          )}
        </div>
      ))}
      <p className="cvf-card-line">{card.check}</p>
      <p className="cvf-card-line">{card.timing}</p>
      <p className="pba-hint">{note}</p>
    </section>
  );
}

/** Discard sits last and quiet, and asks once before it throws the view away. */
function DiscardAsk({
  title,
  busy,
  discarding,
  onDiscard,
}: {
  readonly title: string;
  readonly busy: boolean;
  readonly discarding: boolean;
  readonly onDiscard: () => void;
}): ReactElement {
  const [asking, setAsking] = useState(false);
  return asking ? (
    <fieldset className="pba-discard">
      <legend>Discard {title}?</legend>
      <button type="button" className="btn mc-btn" disabled={discarding} onClick={onDiscard}>
        {discarding ? "Discarding…" : "Discard"}
      </button>
      <button type="button" className="btn mc-btn" onClick={() => setAsking(false)}>
        Keep
      </button>
    </fieldset>
  ) : (
    <button
      type="button"
      className="btn mc-btn pba-discard-ask"
      disabled={busy}
      onClick={() => setAsking(true)}
    >
      Discard view
    </button>
  );
}

export function ConvictionForm({
  steerable,
  editing,
  onSaved,
  onCancel,
  onDiscard,
  discarding = false,
}: {
  /** The ◆ pairs the member's bots run, with each playbook's room (`GET /api/convictions/mine`). */
  readonly steerable: readonly SteerablePairView[];
  /** The view being changed. Absent = a new one. */
  readonly editing?: MemberConvictionView;
  readonly onSaved: (title: string) => void;
  readonly onCancel: () => void;
  readonly onDiscard?: (id: string) => void;
  readonly discarding?: boolean;
}): ReactElement {
  const ids = { title: useId(), checkOn: useId() };
  const [fields, setFields] = useState<ConvictionFields>(() =>
    editing ? fieldsFrom(editing.conviction) : emptyFields(steerable),
  );
  const [said, setSaid] = useState<readonly Said[]>([]);
  const [preview, setPreview] = useState<Extract<DraftAnswer, { ok: true }> | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const change = (next: Partial<ConvictionFields>) => {
    setFields((now) => ({ ...now, ...next }));
    setPreview(undefined);
    setError(undefined);
  };
  const setClaim = (i: number, next: Partial<ClaimFields>) =>
    change({ claims: fields.claims.map((c, j) => (j === i ? { ...c, ...next } : c)) });
  const setPair = (pair: string, next: Partial<PairFields>) =>
    change({
      pairs: { ...fields.pairs, [pair]: { ...(fields.pairs[pair] ?? emptyPair()), ...next } },
    });
  const toggle = (pair: string) =>
    change({
      steers: fields.steers.includes(pair)
        ? fields.steers.filter((p) => p !== pair)
        : [...fields.steers, pair],
    });

  const ask = async (send: typeof previewConvictionRequest) => {
    const blanks = blanksOf(fields);
    setSaid(blanks);
    if (blanks.length > 0) return undefined;
    setBusy(true);
    setError(undefined);
    try {
      const answer = await send(draftOf(fields), editing?.conviction.id);
      if (answer.ok) return answer;
      if (answer.problems && answer.problems.length > 0) {
        setSaid(placeProblems(answer.problems, steerable));
      } else setError(answer.error ?? "It couldn't be read.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };
  const doPreview = async () => {
    setPreview(await ask(previewConvictionRequest));
  };
  const doSave = async () => {
    const answer = await ask(saveConvictionRequest);
    if (answer) onSaved(answer.conviction.title ?? fields.title);
  };

  const wheelSteered = steerable.some(
    (p) => p.strategy === "wheel" && fields.steers.includes(p.pair),
  );
  const today = new Date().toISOString().slice(0, 10);
  // A saved view may steer a pair the member's bots have since left: drawn, so it can be unticked.
  const gone = fields.steers
    .filter((id) => !steerable.some((p) => p.pair === id))
    .map((id) => ({ pair: id, name: `${id} (no bot of yours runs it now)` }));
  return (
    <form
      className="cvf"
      noValidate
      aria-label={editing ? `Change ${editing.conviction.title ?? "this view"}` : "New conviction"}
      onSubmit={(event) => {
        event.preventDefault();
        void (preview ? doSave() : doPreview());
      }}
    >
      <div className="field">
        <label htmlFor={ids.title}>The view, in a few words</label>
        <input
          id={ids.title}
          value={fields.title}
          maxLength={MAX_TITLE}
          autoComplete="off"
          placeholder="CRWV holds its floor"
          disabled={busy}
          aria-invalid={saidAt(said, { at: "title" }).length > 0 || undefined}
          onChange={(e) => change({ title: e.target.value })}
        />
        <Problems said={saidAt(said, { at: "title" })} />
      </div>

      <div className="cvf-claims">
        {fields.claims.map((claim, i) => (
          <ClaimBlock
            // biome-ignore lint/suspicious/noArrayIndexKey: a claim is its place in the list; its number is the index
            key={i}
            n={i + 1}
            claim={claim}
            said={saidAt(said, { at: "claim", n: i + 1 })}
            busy={busy}
            onChange={(next) => setClaim(i, next)}
            {...(fields.claims.length > 1
              ? { onRemove: () => change({ claims: fields.claims.filter((_, j) => j !== i) }) }
              : {})}
          />
        ))}
        <button
          type="button"
          className="btn mc-btn cvf-add"
          disabled={busy || fields.claims.length >= MAX_CLAIMS}
          onClick={() => change({ claims: [...fields.claims, emptyClaim()] })}
        >
          <span aria-hidden="true">+</span> Add a claim
        </button>
      </div>

      <fieldset className="cvf-steers">
        <legend>It steers</legend>
        {[...steerable, ...gone].map((pair) => {
          const on = fields.steers.includes(pair.pair);
          return (
            <label key={pair.pair} className="cvf-chip cvf-steer" data-on={on || undefined}>
              <input
                type="checkbox"
                checked={on}
                disabled={busy || (!on && fields.steers.length >= MAX_STEERS)}
                onChange={() => toggle(pair.pair)}
              />
              <span aria-hidden="true">{on ? "■" : "□"}</span>
              <span>{pair.name}</span>
            </label>
          );
        })}
        <Problems said={saidAt(said, { at: "steers" })} />
      </fieldset>
      {steerable
        .filter((pair) => fields.steers.includes(pair.pair))
        .map((pair) => (
          <PairSettings
            key={pair.pair}
            pair={pair}
            fields={fields.pairs[pair.pair] ?? emptyPair()}
            said={saidAt(said, { at: "pair", pair: pair.pair })}
            busy={busy}
            onChange={(next) => setPair(pair.pair, next)}
          />
        ))}
      {wheelSteered ? (
        <label className="cvf-chip cvf-assign" data-on={fields.acceptsAssignment || undefined}>
          <input
            type="checkbox"
            checked={fields.acceptsAssignment}
            disabled={busy}
            onChange={() => change({ acceptsAssignment: !fields.acceptsAssignment })}
          />
          <span aria-hidden="true">{fields.acceptsAssignment ? "■" : "□"}</span>
          <span>
            Owning the shares if a put is assigned is fine: judge this view on net P/L alone
          </span>
        </label>
      ) : null}

      <div className="field">
        <label htmlFor={ids.checkOn}>Checked on</label>
        <input
          id={ids.checkOn}
          type="date"
          className="num"
          value={fields.checkOn}
          min={today}
          disabled={busy}
          aria-invalid={saidAt(said, { at: "checkOn" }).length > 0 || undefined}
          onChange={(e) => change({ checkOn: e.target.value })}
        />
        <span className="pba-hint">
          If the pairs it steers fail their check that day (net P/L and each playbook's own test),
          they stop opening new positions. Exits keep running.
        </span>
        <Problems said={saidAt(said, { at: "checkOn" })} />
      </div>

      {preview ? <Card card={preview.card} note={preview.note} /> : null}
      <Problems said={saidAt(said, { at: "general" })} />
      <div className="pba-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Reading…" : preview ? "Save draft" : "Preview what it changes"}
        </button>
        <button type="button" className="btn mc-btn" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="pba-hint">
        A saved view is a draft: only you see it, and it steers nothing yet.
      </p>
      {editing && onDiscard ? (
        <DiscardAsk
          title={editing.conviction.title ?? "this view"}
          busy={busy}
          discarding={discarding}
          onDiscard={() => onDiscard(editing.conviction.id)}
        />
      ) : null}
      {error ? (
        <InlineResult as="p" tone="err">
          {error}
        </InlineResult>
      ) : null}
    </form>
  );
}
