import type { ReactElement } from "react";
import { useId, useState } from "react";
import { type ConvictionView, convictionRequest } from "../live/playbook-store";

/**
 * AN OWNER'S CONVICTION (#4469 slice 3c part 3b, criteria 2, 11 and 12) — their own reason for
 * running a pair the study does not back, and the day it is checked. The server owns the rules (a
 * check day still to come and within a year, a reason up to 500 characters); this draws the two
 * fields and the line that states them back.
 *
 * What the check does is said beside the fields, in the words the criterion uses: on the check day,
 * if the pair's net P/L is below $0 or its strategy's own retire test fails, it stops opening NEW
 * positions until the owner sets a new date. Open positions keep being managed to exit — said, since
 * a stop that sounds like a liquidation would frighten an owner into skipping the date.
 *
 * Never hue alone: the line wears a ◆ and the word "conviction", the same glyph the pair's evidence
 * status uses, so an owner finds it by shape.
 */

export const CONVICTION_NOTE =
  "On the check day, if its net P/L is below $0 or its strategy's own retire test fails, it stops " +
  "opening new positions until you set a new date. Open positions keep being managed to exit.";

const REASON_LIMIT = 500;

/** Tomorrow as `YYYY-MM-DD` in the browser's calendar — the earliest a check day can be. The server
 *  judges the day on the exchange's calendar and is the real gate; this only keeps the picker honest. */
function tomorrow(): string {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

/** Both fields filled, or nothing: half a conviction is not one. */
export function convictionOf(reason: string, checkOn: string): ConvictionView | undefined {
  const text = reason.trim();
  return text !== "" && checkOn !== "" ? { reason: text, checkOn } : undefined;
}

/** The reason and the check day, controlled by the form that holds them. */
export function ConvictionFields({
  reason,
  checkOn,
  onReason,
  onCheckOn,
}: {
  readonly reason: string;
  readonly checkOn: string;
  readonly onReason: (reason: string) => void;
  readonly onCheckOn: (checkOn: string) => void;
}): ReactElement {
  const reasonId = useId();
  const dayId = useId();
  return (
    <fieldset className="pb-conviction-fields">
      <legend>◆ Your conviction</legend>
      <div className="field">
        <label htmlFor={reasonId}>Why you are taking it</label>
        <textarea
          id={reasonId}
          rows={3}
          maxLength={REASON_LIMIT}
          value={reason}
          onChange={(e) => onReason(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={dayId}>Check it on</label>
        <input
          id={dayId}
          type="date"
          min={tomorrow()}
          value={checkOn}
          onChange={(e) => onCheckOn(e.target.value)}
        />
      </div>
      <p className="pb-symbols-hint">{CONVICTION_NOTE}</p>
    </fieldset>
  );
}

/**
 * The owner's conviction on a pair they hold: the line that states it back, and the control to set a
 * new date — the move after a failed check, and the routine one before it. With none on record the
 * control reads "State a conviction", and the bots keep the pair trading, labelled "conviction not
 * stated" (criterion 11): the line says so rather than leave the owner to infer it.
 */
export function ConvictionPanel({
  accountId,
  playbookId,
  conviction,
  onChanged,
}: {
  readonly accountId: string;
  readonly playbookId: string;
  readonly conviction?: ConvictionView;
  readonly onChanged: () => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(conviction?.reason ?? "");
  const [checkOn, setCheckOn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const next = convictionOf(reason, checkOn);

  const save = async () => {
    if (!next) return;
    setBusy(true);
    setError(undefined);
    try {
      const answer = await convictionRequest({ id: accountId, playbookId, conviction: next });
      if (answer.ok) {
        setOpen(false);
        setCheckOn("");
        onChanged();
      } else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-conviction">
      <p className="pb-status">
        {conviction ? (
          <>
            <b className="pb-status-state">
              <span aria-hidden="true">◆</span> Conviction
            </b>{" "}
            · {conviction.reason} · checked on <span className="num">{conviction.checkOn}</span>
          </>
        ) : (
          <>
            <b className="pb-status-state">
              <span aria-hidden="true">◇</span> No conviction stated
            </b>{" "}
            · it keeps trading, and is labelled so.
          </>
        )}
      </p>
      {open ? (
        <div className="pb-subscribe-form">
          <ConvictionFields
            reason={reason}
            checkOn={checkOn}
            onReason={setReason}
            onCheckOn={setCheckOn}
          />
          <div className="pb-subscription-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !next}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save conviction"}
            </button>
            <button
              type="button"
              className="btn mc-btn"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
          {error ? <span className="set-err">{error}</span> : null}
        </div>
      ) : (
        <div className="pb-subscription-actions">
          <button type="button" className="btn mc-btn" onClick={() => setOpen(true)}>
            {conviction ? "Set a new date" : "State a conviction"}
          </button>
        </div>
      )}
    </div>
  );
}
