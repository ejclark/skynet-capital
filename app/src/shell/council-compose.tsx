import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import { type CouncilWeek, retractThesis, submitThesis } from "../live/council";

/**
 * THE COUNCIL COMPOSER (issue #2224 shape 1; lifted out of `routes/activity.tsx` by #3963) — one
 * line per member per week, with the optional play tag, the character counter and the server's own
 * refusal message.
 *
 * It lives here rather than on the Activity route because the line renders in TWO places and is
 * ONE record: the league's shared view on Activity → Council, and the member's own line beside
 * their standing on the Profile Overview (`docs/IA.md` §5.7: "`mine` (member × week) renders on the
 * Overview beside the standing; `entries` stays the league read"). Both callers pass the same
 * `/api/council` week and the same `["council"]` invalidation, so a line written in one place is
 * the line the other shows.
 *
 * Resubmitting replaces this week's own line, so the composer prefills from `mine` rather than
 * always starting blank — the affordance is "edit your line," never "post again."
 *
 * TAKE IT BACK (slice 4): once you have a line this week you can remove it — your line only; the
 * Council has no way to remove anyone else's (the server keys it off your session). It takes two
 * taps, because the words are gone once it lands: the first tap arms it and says what happens, the
 * second does it. Typing in the box disarms it, so a stray tap mid-edit never deletes.
 */

const COUNCIL_MAX_CHARS = 280;

export function CouncilCompose({
  week,
  onSaved,
}: {
  readonly week: CouncilWeek;
  /** Refresh the shared read after a save — both callers invalidate the `["council"]` query. */
  readonly onSaved: () => Promise<unknown>;
}): ReactElement {
  const [draft, setDraft] = useState<string | undefined>();
  // "" means "no play tagged" — undefined means "hasn't touched the selector", so it still
  // prefills from `mine` after a resubmit the same way the text draft does.
  const [playDraft, setPlayDraft] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const [retractArmed, setRetractArmed] = useState(false);
  const playSelectId = useId();

  const text = draft ?? week.mine?.text ?? "";
  const play = playDraft ?? week.mine?.playbookId ?? "";
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(undefined);
    try {
      const result = await submitThesis(text, play || undefined);
      if (result.ok) {
        setDraft(undefined);
        setPlayDraft(undefined);
        setNote(undefined);
        await onSaved();
      } else {
        setNote(result.error ?? "Couldn't save that.");
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const retract = async () => {
    if (!retractArmed) {
      setRetractArmed(true);
      return;
    }
    setBusy(true);
    setNote(undefined);
    try {
      const result = await retractThesis();
      if (result.ok) {
        setDraft(undefined);
        setPlayDraft(undefined);
        setRetractArmed(false);
        await onSaved();
      } else {
        setNote(result.error ?? "Couldn't take that back.");
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="council-compose" onSubmit={(e) => void submit(e)}>
        <input
          type="text"
          value={text}
          maxLength={COUNCIL_MAX_CHARS}
          placeholder="I think NVDA runs, because…"
          aria-label="Your council line for the week"
          onChange={(e) => {
            setDraft(e.target.value);
            setRetractArmed(false);
          }}
          disabled={busy}
        />
        <button
          type="submit"
          className="btn btn-primary council-submit"
          disabled={busy || text.trim().length === 0}
        >
          {busy ? "Saving…" : week.mine ? "Update" : "Commit"}
        </button>
      </form>
      {week.plays.length > 0 ? (
        <p className="council-play-picker">
          <label htmlFor={playSelectId}>Tag your bot's play (optional)</label>
          <select
            id={playSelectId}
            value={play}
            onChange={(e) => setPlayDraft(e.target.value)}
            disabled={busy}
          >
            <option value="">No play tagged</option>
            {week.plays.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.symbol}
              </option>
            ))}
          </select>
        </p>
      ) : null}
      <p className="council-count num">{COUNCIL_MAX_CHARS - text.length} left</p>
      {week.mine ? (
        <p className="council-retract">
          <button
            type="button"
            className={
              retractArmed ? "btn council-retract-btn is-armed" : "btn council-retract-btn"
            }
            onClick={() => void retract()}
            disabled={busy}
          >
            {retractArmed ? "Yes, take it back" : "Take back my line"}
          </button>
          {retractArmed ? (
            <span className="council-retract-warn">
              Removes it for everyone this week.{" "}
              <button
                type="button"
                className="council-retract-cancel"
                onClick={() => setRetractArmed(false)}
              >
                Keep it
              </button>
            </span>
          ) : null}
        </p>
      ) : null}
      {note ? <p className="set-err">{note}</p> : null}
    </>
  );
}
