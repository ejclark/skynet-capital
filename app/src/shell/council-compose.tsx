import type { FormEvent, ReactElement } from "react";
import { useId, useState } from "react";
import { type CouncilWeek, submitThesis } from "../live/council";

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

  return (
    <>
      <form className="council-compose" onSubmit={(e) => void submit(e)}>
        <input
          type="text"
          value={text}
          maxLength={COUNCIL_MAX_CHARS}
          placeholder="I think NVDA runs, because…"
          aria-label="Your council line for the week"
          onChange={(e) => setDraft(e.target.value)}
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
      {note ? <p className="set-err">{note}</p> : null}
    </>
  );
}
