import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useId, useState } from "react";
import {
  DEFAULT_TOLERANCE_PCT,
  MAX_TOLERANCE_PCT,
  type TargetSplit,
} from "../../../src/observatory/target-split";
import {
  clearTargetSplitRequest,
  fetchTargetSplit,
  saveTargetSplitRequest,
  type TargetSplitWriteResult,
  targetSplitKey,
} from "../live/target-split";
import { InlineResult } from "../ui";

/**
 * SETTINGS → TARGET SPLIT (#4607 slice 1): where the member wants their money to sit — shares,
 * options and cash as whole percents that add to 100 — and one tolerance for the book. Overview's
 * money row compares the book against it (slice 2). Stored on the server per member, so the
 * target set on a laptop is the one the phone reads; `prefs.ts` stays one browser's display
 * settings.
 *
 * The member's own numbers, never a default: the three slices start blank and nothing is saved
 * until Save. The tolerance starts at a suggested 5 points, also unsaved until Save.
 *
 * Mobile-first: one column of label · number · unit rows at 390px; the preview bar reuses the
 * money row's own slices (`money-strip.css`) so the target looks like the thing it is compared to.
 * Whether the three add to 100 is said in words with a ✓ or the gap, never by colour alone.
 */

type Slice = "sharesPct" | "optionsPct" | "cashPct";

const SLICES: readonly { readonly key: Slice; readonly label: string; readonly kind: string }[] = [
  { key: "sharesPct", label: "Shares", kind: "shares" },
  { key: "optionsPct", label: "Options", kind: "options" },
  { key: "cashPct", label: "Cash", kind: "cash" },
];

type Draft = Readonly<Record<Slice | "tolerancePct", string>>;

const draftFrom = (target: TargetSplit | null): Draft => ({
  sharesPct: target ? String(target.sharesPct) : "",
  optionsPct: target ? String(target.optionsPct) : "",
  cashPct: target ? String(target.cashPct) : "",
  tolerancePct: String(target?.tolerancePct ?? DEFAULT_TOLERANCE_PCT),
});

/** A blank slice counts as 0; anything that is not a whole number reads as undefined. */
function wholeOrZero(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return /^\d{1,3}$/.test(trimmed) ? Number(trimmed) : undefined;
}

/** "Adds to 100% ✓", or what is short or over — the words carry it, not a colour. */
export function sumLine(sum: number | undefined): { readonly text: string; readonly ok: boolean } {
  if (sum === undefined) return { text: "Each slice is a whole percent from 0 to 100.", ok: false };
  if (sum === 100) return { text: "Adds to 100% ✓", ok: true };
  return sum < 100
    ? { text: `Adds to ${sum}% — ${100 - sum} short of 100%`, ok: false }
    : { text: `Adds to ${sum}% — ${sum - 100} over 100%`, ok: false };
}

const dateLine = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function TargetForm({ target }: { readonly target: TargetSplit | null }): ReactElement {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(target));
  const [result, setResult] = useState<TargetSplitWriteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const baseId = useId();
  const sumId = useId();
  const tolHintId = useId();

  const values = SLICES.map((s) => wholeOrZero(draft[s.key]));
  const sum = values.every((v) => v !== undefined)
    ? values.reduce<number>((a, v) => a + (v ?? 0), 0)
    : undefined;
  const tolerance = wholeOrZero(draft.tolerancePct);
  const toleranceOk = tolerance !== undefined && tolerance >= 1 && tolerance <= MAX_TOLERANCE_PCT;
  const status = sumLine(sum);
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(draftFrom(target)) &&
    !(target === null && SLICES.every((s) => draft[s.key].trim() === ""));

  const settle = async (write: () => Promise<TargetSplitWriteResult>) => {
    setBusy(true);
    try {
      const outcome = await write();
      setResult(outcome);
      if (outcome.ok) setDraft(draftFrom(outcome.target ?? null));
      if (outcome.ok) await queryClient.invalidateQueries({ queryKey: targetSplitKey });
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    settle(() =>
      saveTargetSplitRequest({
        sharesPct: values[0] ?? 0,
        optionsPct: values[1] ?? 0,
        cashPct: values[2] ?? 0,
        tolerancePct: tolerance ?? DEFAULT_TOLERANCE_PCT,
      }),
    );
  const clear = () => settle(clearTargetSplitRequest);

  return (
    <div className="set-fields">
      <div className="money-bar tsplit-bar" aria-hidden="true">
        {sum !== undefined && sum > 0
          ? SLICES.map((s, i) =>
              (values[i] ?? 0) > 0 ? (
                <span
                  key={s.key}
                  className={`money-slice money-slice--${s.kind}`}
                  style={{ flexGrow: values[i] }}
                />
              ) : null,
            )
          : null}
      </div>
      <div className="tsplit-rows">
        {SLICES.map((s) => (
          <div className="field tsplit-row" key={s.key}>
            <label htmlFor={`${baseId}-${s.key}`}>
              <span className={`money-swatch money-slice--${s.kind}`} aria-hidden="true" />{" "}
              {s.label}
            </label>
            <input
              id={`${baseId}-${s.key}`}
              className="num"
              type="text"
              inputMode="numeric"
              placeholder="0"
              maxLength={3}
              value={draft[s.key]}
              aria-describedby={sumId}
              onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
            />
            <span className="tsplit-unit">%</span>
          </div>
        ))}
      </div>
      <p className={`tsplit-sum${status.ok ? " tsplit-sum--ok" : ""}`} id={sumId}>
        {status.text}
      </p>
      <div className="field tsplit-row">
        <label htmlFor={`${baseId}-tolerance`}>Tolerance</label>
        <input
          id={`${baseId}-tolerance`}
          className="num"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={draft.tolerancePct}
          aria-describedby={tolHintId}
          onChange={(e) => setDraft({ ...draft, tolerancePct: e.target.value })}
        />
        <span className="tsplit-unit">points</span>
      </div>
      <p className="set-hint" id={tolHintId}>
        {toleranceOk
          ? `A slice more than ${tolerance} points from its target counts as over or under.`
          : `The tolerance is a whole number of points from 1 to ${MAX_TOLERANCE_PCT}.`}
      </p>
      <div className="tsplit-actions">
        <button
          type="button"
          className="btn btn-primary set-save"
          disabled={!dirty || busy || !status.ok || !toleranceOk}
          onClick={save}
        >
          {busy ? "Saving…" : "Save target"}
        </button>
        {target ? (
          <button type="button" className="btn set-save" disabled={busy} onClick={clear}>
            Clear target
          </button>
        ) : null}
      </div>
      {result ? (
        result.ok ? (
          <InlineResult tone="ok">
            {result.target ? "Saved — your target split is set." : "Cleared — no target is set."}
          </InlineResult>
        ) : (
          <InlineResult tone="err">{result.error}</InlineResult>
        )
      ) : null}
      {target ? <p className="set-hint">Last set {dateLine(target.updatedAt)}.</p> : null}
    </div>
  );
}

export function TargetSplitCard(): ReactElement {
  const read = useQuery({ queryKey: targetSplitKey, queryFn: fetchTargetSplit });
  return (
    <section className="set-card">
      <h2 className="set-card-h">Target split</h2>
      <p className="set-hint tsplit-lede">
        Where you want your money to sit across shares, options and cash. It's kept with your
        sign-in, so every device sees the same target. Next, Overview's money row will compare your
        book against it and name what to trim or add — guidance to review, never an order.
      </p>
      {read.isPending ? (
        <p className="note">Reading your target…</p>
      ) : read.isError ? (
        <p className="note">Your target split needs a signed-in session — sign in to set one.</p>
      ) : !read.data.wired ? (
        <p className="note">A target split isn't wired in this deployment.</p>
      ) : (
        <TargetForm target={read.data.target} />
      )}
    </section>
  );
}
