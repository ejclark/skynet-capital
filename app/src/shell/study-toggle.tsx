import type { ReactElement } from "react";
import { STUDY_GLOSS, STUDY_IDS, STUDY_LABELS, type StudyId } from "./chart-studies";

/**
 * The study toggles (#2017 Phase 1 chart build-out, the studies slice) — four `.railctl` chips,
 * SMA · EMA · Bollinger · RSI, any number on at once. The same checkbox idiom `activity.tsx`'s
 * `WireRail` uses for its feed filters (`aria-pressed`, click toggles membership in a set), NOT the
 * radio-shaped `Toggle` in `toggle.tsx` — a member overlays SMA and RSI together, so exactly-one is
 * the wrong contract. State is the chart section's own, never the URL: reopening the chart lands
 * on the clean base view again.
 *
 * Every active study prints its `src/indicators/` gloss — the "how to read this" line — as plain
 * text right under the row. Readable on a phone with no hover, which is the point: the copy is
 * the differentiator, not a tooltip a touch can't reach.
 *
 * @category trading
 */
export function StudyToggles({
  active,
  onToggle,
}: {
  readonly active: ReadonlySet<StudyId>;
  readonly onToggle: (id: StudyId) => void;
}): ReactElement {
  return (
    <>
      <fieldset className="chart-studies">
        <legend className="visually-hidden">Studies</legend>
        {STUDY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className="railctl"
            aria-pressed={active.has(id)}
            onClick={() => onToggle(id)}
          >
            {STUDY_LABELS[id]}
          </button>
        ))}
      </fieldset>
      {STUDY_IDS.filter((id) => active.has(id)).map((id) => (
        <p key={id} className="chart-gloss">
          <b>{STUDY_LABELS[id]}</b> — {STUDY_GLOSS[id]}
        </p>
      ))}
    </>
  );
}
