import { type ReactElement, useId } from "react";
import type { SteerablePairView } from "../live/member-convictions";
import { InlineResult } from "../ui";
import {
  BUCKET_WORDS,
  type ClaimFields,
  MAX_TEXT,
  type PairFields,
  TAG_WORDS,
} from "./conviction-fields";

/**
 * ONE CLAIM, AND ONE STEERED PAIR'S SETTINGS (#5482 slice 6b) — the two repeated blocks of the
 * conviction form (`conviction-form.tsx`), each with what the server or the blanks check said about
 * it drawn underneath.
 *
 * A CLAIM reads as a sentence about the market, in the order the call sheet asks for it: what the
 * market gets wrong (missing · underrates · overrates), the claim, what it rests on, what proves it
 * wrong and by when, and how it is checked. The two picks are chips with a filled dot and a heavier
 * outline when on, never a hue alone.
 *
 * A PAIR'S SETTINGS are optional, and each one only narrows: every hint states the playbook's own
 * room (its days-to-expiry window, its largest contract count), so a member sees the fence before
 * the preview says a number is outside it. Blank means the playbook keeps its own.
 */

export function Problems({ said }: { readonly said: readonly string[] }): ReactElement | null {
  return said.length > 0 ? (
    <div className="cvf-problems">
      {said.map((text) => (
        <InlineResult key={text} as="p" tone="err" live={false}>
          {text}
        </InlineResult>
      ))}
    </div>
  ) : null;
}

function Chips<T extends string>({
  legend,
  name,
  options,
  value,
  disabled,
  onPick,
}: {
  readonly legend: string;
  readonly name: string;
  readonly options: readonly { readonly id: T; readonly word: string; readonly line?: string }[];
  readonly value: T;
  readonly disabled: boolean;
  readonly onPick: (id: T) => void;
}): ReactElement {
  return (
    <fieldset className="cvf-chips">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.id} className="cvf-chip" data-on={option.id === value || undefined}>
          <input
            type="radio"
            name={name}
            checked={option.id === value}
            disabled={disabled}
            onChange={() => onPick(option.id)}
          />
          <span aria-hidden="true">{option.id === value ? "●" : "○"}</span> {option.word}
          {option.line ? <span className="cvf-chip-line">{option.line}</span> : null}
        </label>
      ))}
    </fieldset>
  );
}

export function ClaimBlock({
  n,
  claim,
  said,
  busy,
  onChange,
  onRemove,
}: {
  readonly n: number;
  readonly claim: ClaimFields;
  readonly said: readonly string[];
  readonly busy: boolean;
  readonly onChange: (next: Partial<ClaimFields>) => void;
  /** Absent on the only claim: a view needs at least one. */
  readonly onRemove?: () => void;
}): ReactElement {
  const id = useId();
  const text = (key: "statement" | "evidence" | "falsifier", label: string, hint: string) => (
    <div className="field">
      <label htmlFor={`${id}-${key}`}>{label}</label>
      <textarea
        id={`${id}-${key}`}
        rows={2}
        value={claim[key]}
        maxLength={MAX_TEXT}
        placeholder={hint}
        disabled={busy}
        onChange={(e) => onChange({ [key]: e.target.value })}
      />
    </div>
  );
  return (
    <fieldset className="cvf-claim" aria-invalid={said.length > 0 || undefined}>
      <legend>
        Claim <span className="num">{n}</span>
      </legend>
      <Chips
        legend="The market is"
        name={`${id}-tag`}
        options={TAG_WORDS.map((t) => ({ id: t.tag, word: t.word }))}
        value={claim.tag}
        disabled={busy}
        onPick={(tag) => onChange({ tag })}
      />
      {text("statement", "The claim", "CRWV's backlog outlasts the selloff.")}
      {text("evidence", "What it rests on", "A study, a number, or a dated source.")}
      <div className="cvf-wrong">
        {text("falsifier", "Wrong if", "CRWV closes under $45.")}
        <div className="field">
          <label htmlFor={`${id}-by`}>By</label>
          <input
            id={`${id}-by`}
            type="date"
            className="num"
            value={claim.scoreBy}
            disabled={busy}
            onChange={(e) => onChange({ scoreBy: e.target.value })}
          />
        </div>
      </div>
      <Chips
        legend="How it's checked"
        name={`${id}-bucket`}
        options={BUCKET_WORDS.map((b) => ({ id: b.bucket, word: b.word, line: b.line }))}
        value={claim.bucket}
        disabled={busy}
        onPick={(bucket) => onChange({ bucket })}
      />
      <Problems said={said} />
      {onRemove ? (
        <button type="button" className="btn mc-btn cvf-remove" disabled={busy} onClick={onRemove}>
          Remove claim {n}
        </button>
      ) : null}
    </fieldset>
  );
}

export function PairSettings({
  pair,
  fields,
  said,
  busy,
  onChange,
}: {
  readonly pair: SteerablePairView;
  readonly fields: PairFields;
  readonly said: readonly string[];
  readonly busy: boolean;
  readonly onChange: (next: Partial<PairFields>) => void;
}): ReactElement {
  const id = useId();
  const { dte, contracts } = pair.bounds;
  const most = Math.max(...Object.values(contracts));
  const number = (key: keyof PairFields, label: string, hint: string, step = 1) => (
    <div className="field">
      <label htmlFor={`${id}-${key}`}>{label}</label>
      <input
        id={`${id}-${key}`}
        className="num"
        type="number"
        inputMode={step === 1 ? "numeric" : "decimal"}
        min={0}
        step={step}
        value={fields[key]}
        disabled={busy}
        onChange={(e) => onChange({ [key]: e.target.value })}
      />
      <span className="pba-hint">{hint}</span>
    </div>
  );
  return (
    <fieldset className="cvf-pair">
      <legend>On {pair.name}, narrow</legend>
      <div className="cvf-pair-grid">
        {number("dteMin", "Days to expiry, at least", `the playbook's own: ${dte.min}`)}
        {number("dteMax", "Days to expiry, at most", `the playbook's own: ${dte.max}`)}
        <div className="field">
          <label htmlFor={`${id}-expiryFrom`}>Expiry on or after</label>
          <input
            id={`${id}-expiryFrom`}
            type="date"
            className="num"
            value={fields.expiryFrom}
            disabled={busy}
            onChange={(e) => onChange({ expiryFrom: e.target.value })}
          />
          <span className="pba-hint">any expiry in its window</span>
        </div>
        {number("strikeMax", "Strike at or under, $", "the playbook's own pick", 0.5)}
        {number("quiet", "Sessions quiet after the report", "no new opens until then")}
        {number("contractsMax", "Contracts, at most", `the playbook's own: up to ${most}`)}
      </div>
      <p className="pba-hint">Leave a setting blank and the playbook keeps its own.</p>
      <Problems said={said} />
    </fieldset>
  );
}
