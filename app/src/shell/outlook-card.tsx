import type { ReactElement } from "react";
import { structureLabel } from "../../../src/options/candidate-mechanics";
import type { RankedCandidate } from "../../../src/options/recommend";
import { boundWords, noDenominatorWords, noRatioWords } from "../../../src/options/structure-words";

/**
 * ONE PROPOSED STRUCTURE, AS A CARD (#3407, slice 4). Mobile-first: at 390px the member reads a
 * name, THE MOST IT CAN LOSE, and one sentence; the rest of the marks sit under them as a two-column
 * list that simply gets more room at a wider viewport. Max loss leads because the plan's criterion
 * puts it on screen — and because a ranked list of option structures sorted by fit would otherwise
 * lead with its most attractive number.
 *
 * Three honesty rules the layout enforces, each inherited from the engine under it:
 *
 * - **An unbounded loss is the word "unlimited", never a sampled dollar figure** (`boundWords` over
 *   `StructureRisk`'s `RiskBound`). A short strangle's worst case is not the edge of the band the
 *   scorer happened to sample.
 * - **Upside never renders without its downside.** Both bounds are in the same list, always both
 *   present — the same line `candidate-mechanics.ts` holds in prose.
 * - **An absent ratio is absent.** `targetReturn` and `rewardToRisk` are optional precisely because
 *   an uncapped loss has no denominator; those rows say which bound has no ceiling rather than
 *   printing a dash or a zero.
 *
 * Pure: a candidate and one callback, so a screenshot mounts it with a literal.
 */

const pct = (x: number) => `${Math.round(x * 100)}%`;
const money = (x: number) =>
  `${x < 0 ? "−" : ""}$${Math.abs(x).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** One mark and its label — the label always renders, so a missing value shows as a stated reason. */
function Mark({ label, value }: { readonly label: string; readonly value: string }): ReactElement {
  return (
    <div className="outlook-mark">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function OutlookCard({
  candidate,
  onUse,
  useLabel,
}: {
  readonly candidate: RankedCandidate;
  readonly onUse: (candidate: RankedCandidate) => void;
  /** What the handoff button says — the pane names the rung, or says it isn't earned yet. */
  readonly useLabel: string;
}): ReactElement {
  const { risk, score } = candidate;
  // A net credit reads as a credit RECEIVED, not as a negative cost — the sign convention in
  // `StructureRisk.entryCost` is correct and unreadable (positive is a debit paid).
  const entry =
    risk.entryCost >= 0
      ? `${money(risk.entryCost)} debit`
      : `${money(-risk.entryCost)} credit received`;
  const breakEvens =
    risk.breakEvens.length > 0
      ? risk.breakEvens.map((b) => money(b)).join(" / ")
      : "no break-even inside the marked band";
  return (
    <li className="outlook-card">
      <div className="outlook-card-head">
        <h3>{structureLabel(candidate.kind)}</h3>
        <p className="outlook-worst">
          <span className="outlook-kicker">Most it can lose</span>
          <strong>{boundWords(risk.maxLoss)}</strong>
        </p>
      </div>
      <p className="outlook-mechanics">{candidate.mechanics}</p>
      <dl className="outlook-marks">
        <Mark label="Most it can make" value={boundWords(risk.maxProfit)} />
        <Mark label="To open" value={entry} />
        <Mark label="Chance of profit" value={pct(score.probabilityOfProfit)} />
        <Mark label="At your target" value={money(score.targetProfit)} />
        <Mark
          label="Return at target"
          value={
            score.targetReturn === undefined ? noDenominatorWords(risk) : pct(score.targetReturn)
          }
        />
        <Mark
          label="Reward to risk"
          value={
            score.rewardToRisk === undefined
              ? noRatioWords(risk)
              : `${score.rewardToRisk.toFixed(2)}×`
          }
        />
        <Mark
          label="Expiry"
          value={
            candidate.expiration
              ? `${candidate.expiration} · ${Math.round(candidate.daysToExpiry)} days`
              : `${Math.round(candidate.daysToExpiry)} days out`
          }
        />
        <Mark label="Break-even" value={breakEvens} />
      </dl>
      <button type="button" className="btn outlook-use" onClick={() => onUse(candidate)}>
        {useLabel}
      </button>
    </li>
  );
}
