import { type ReactElement, useId, useState } from "react";
import { GOAL_WORDS, usd } from "../../../src/options/position-guidance-rules";
import type { GuidanceGoal, GuidanceStake } from "../../../src/options/position-guidance-types";
import { Toggle } from "./toggle";

/**
 * YOUR STAKE — what the guidance is sized to (#3729 step 3). Every field is optional and nothing
 * defaults to acting for the member: no goal is pre-picked, and a covered call waits for "what
 * you paid". A field commits on blur (or Enter), never per keystroke, so the guidance doesn't
 * flicker through half-typed numbers. Once anything is saved the form folds to one line — the
 * calls are what a returning member came for — with Edit one tap away.
 *
 * The values never leave this browser: the parent keeps them in local storage per symbol and runs
 * the engine here (see `live/guidance.ts`).
 */

type NumericField = "shares" | "costBasis" | "cash" | "happyToOwnAt";

const FIELDS: readonly (readonly [NumericField, string, string])[] = [
  ["shares", "Shares you hold", "0"],
  ["costBasis", "What you paid, per share", "needed for covered calls"],
  ["cash", "Cash you'd set aside", "for cash-secured puts"],
  ["happyToOwnAt", "Price you'd happily buy more at", "optional"],
];

const GOAL_OPTIONS: readonly (readonly [GuidanceGoal, string])[] = [
  ["keep-shares", "Keep shares"],
  ["income", "Earn income"],
  ["exit", "Exit"],
];

export function stakeSummary(stake: GuidanceStake): string {
  const parts = [
    `${stake.shares ?? 0} shares`,
    stake.costBasis !== undefined ? `paid ${usd(stake.costBasis)}` : "paid —",
    stake.cash !== undefined ? `cash ${usd(stake.cash)}` : undefined,
    stake.goal ? `goal: ${GOAL_WORDS[stake.goal]}` : "no goal picked",
  ];
  return parts.filter(Boolean).join(" · ");
}

function NumberField({
  field,
  label,
  hint,
  value,
  onCommit,
}: {
  readonly field: NumericField;
  readonly label: string;
  readonly hint: string;
  readonly value: number | undefined;
  readonly onCommit: (field: NumericField, value: number | undefined) => void;
}): ReactElement {
  const id = useId();
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  const commit = () => {
    const n = Number(draft);
    onCommit(field, draft.trim() !== "" && Number.isFinite(n) && n > 0 ? n : undefined);
  };
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        placeholder={hint}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
    </div>
  );
}

export function GuidanceStakeForm({
  stake,
  onChange,
}: {
  readonly stake: GuidanceStake;
  readonly onChange: (next: GuidanceStake) => void;
}): ReactElement {
  const entered = Object.keys(stake).length > 0;
  // Open until a goal is picked: without one no option call is available, so the form is the
  // next thing to do — even when the shares arrived from the paper account.
  const [open, setOpen] = useState(!(entered && stake.goal));
  const set = (field: NumericField, value: number | undefined) => {
    const next: Record<string, unknown> = { ...stake };
    if (value === undefined) delete next[field];
    else next[field] = value;
    onChange(next as GuidanceStake);
  };
  if (!open) {
    return (
      <div className="guidance-stake guidance-stake-folded">
        <p>
          <span className="guidance-kicker">Your stake</span> {stakeSummary(stake)}
        </p>
        <button type="button" className="btn guidance-btn" onClick={() => setOpen(true)}>
          Edit
        </button>
      </div>
    );
  }
  return (
    <form className="guidance-stake" onSubmit={(e) => e.preventDefault()}>
      <p className="guidance-kicker">Your stake — stays in this browser</p>
      <div className="guidance-stake-fields">
        {FIELDS.map(([field, label, hint]) => (
          <NumberField
            key={field}
            field={field}
            label={label}
            hint={hint}
            value={stake[field]}
            onCommit={set}
          />
        ))}
      </div>
      <p className="guidance-stake-goal-label">What do you want from this position?</p>
      <Toggle<GuidanceGoal | "">
        label="Your goal"
        value={stake.goal ?? ""}
        options={GOAL_OPTIONS}
        onPick={(goal) => onChange({ ...stake, goal: goal as GuidanceGoal })}
      />
      {entered ? (
        <button type="button" className="btn guidance-btn" onClick={() => setOpen(false)}>
          Done
        </button>
      ) : null}
    </form>
  );
}
