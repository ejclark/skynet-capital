import type { ReactElement } from "react";
import { useState } from "react";
import type { ConsiderationChip } from "../live/desk";

/**
 * THE CONSIDERATIONS RAIL (#3186 slice 3) — one chip strip below the hero chart unifying at-risk
 * and opportunity signals into the same continuous page state (the issue's settled IA fork: hero +
 * considerations are one state, only Positions/Activity/Analytics stay tabbed). Single-expand
 * accordion: expanding one chip collapses any other, so the strip stays scannable — a plain default
 * for the issue's own open question ("what's the exact expand interaction?"), not a settled call;
 * flagged for Eric's live reaction rather than guessed at in prose pre-ship.
 *
 * Hue never carries the kind distinction alone (a standing red/green-colourblind reader) — each
 * chip's kind rides with a label/icon too, not just a border color.
 */

const KIND_LABEL: Record<ConsiderationChip["kind"], string> = {
  "at-risk": "At risk",
  opportunity: "Opportunity",
};

function Chip({
  chip,
  expanded,
  onToggle,
}: {
  readonly chip: ConsiderationChip;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}): ReactElement {
  return (
    <li className={`consid-chip consid-chip-${chip.kind}${expanded ? " is-expanded" : ""}`}>
      <button
        type="button"
        className="consid-chip-head"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className={`consid-chip-kind consid-chip-kind-${chip.kind}`}>
          {KIND_LABEL[chip.kind]}
        </span>
        <span className="consid-chip-sym">{chip.display}</span>
        <span className={`consid-chip-delta num tone-${chip.deltaTone}`}>{chip.delta}</span>
      </button>
      {expanded ? (
        <div className="consid-chip-body">
          {chip.notional !== "—" ? (
            <p className="consid-chip-notional num">{chip.notional}</p>
          ) : null}
          <p className="consid-chip-reason">{chip.reason}</p>
          <a className="btn mc-btn" href={chip.action.href}>
            {chip.action.label}
          </a>
        </div>
      ) : null}
    </li>
  );
}

export function ConsiderationsRail({
  chips,
}: {
  readonly chips: readonly ConsiderationChip[];
}): ReactElement | null {
  const [expandedId, setExpandedId] = useState<string | undefined>(undefined);
  if (chips.length === 0) return null;
  return (
    <ul className="consid-rail">
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          chip={chip}
          expanded={expandedId === chip.id}
          onToggle={() => setExpandedId(expandedId === chip.id ? undefined : chip.id)}
        />
      ))}
    </ul>
  );
}
