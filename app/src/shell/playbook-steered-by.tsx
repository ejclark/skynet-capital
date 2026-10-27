import type { ReactElement } from "react";
import type { ClaimOutcome, SteeredByView } from "../live/playbook-store";

/**
 * "STEERED BY" ON A PAIR ROW, WITH THE VIEW'S SCORECARD (#5482 slice 5, criterion 7). One line a
 * phone can hold — "steered by: AI-dip view · check 2027-01-29 · ✓ 3 pass / ✗ 1 fail / ○ 3 pending"
 * — and the claims one tap under it, each with its outcome as a glyph AND a word (hue never carries
 * it alone), the day it is scored, and what was read. The counts are the whole view's, because one
 * belief steers several pairs; a claim this pair's fence rests on says so.
 *
 * A read of the record. It sizes nothing and changes no setting: a conviction only narrows, and the
 * playbook still picks the timing. SIM — paper only.
 */

const MARK: Readonly<Record<ClaimOutcome, { glyph: string; word: string }>> = {
  pass: { glyph: "✓", word: "held" },
  fail: { glyph: "✗", word: "failed" },
  pending: { glyph: "○", word: "pending" },
  untestable: { glyph: "–", word: "untestable" },
};

/** "due 2026-11-20" for a claim waiting on its day, "scored 2027-01-20" once it has one. */
function dayOf(claim: SteeredByView["claims"][number]): string {
  if (claim.scoredOn) return `scored ${claim.scoredOn}`;
  return claim.dueOn ? `due ${claim.dueOn}` : "no day set";
}

export function SteeredBy({ view }: { readonly view: SteeredByView }): ReactElement {
  const { scorecard: card } = view;
  return (
    <details className="pb-steered">
      <summary>
        steered by: <span className="pb-steered-view">{view.title}</span> · check {view.checkOn} ·{" "}
        <span className="pb-steered-count num">
          ✓ {card.pass} pass / ✗ {card.fail} fail / ○ {card.pending} pending
        </span>
      </summary>
      <ul className="pb-steered-claims">
        {view.claims.map((claim) => {
          const mark = MARK[claim.outcome];
          return (
            <li className="pb-steered-claim" key={claim.label} data-outcome={claim.outcome}>
              <span className="pb-steered-mark num">
                <span aria-hidden="true">{mark.glyph}</span> {claim.label}
              </span>
              <div>
                <p className="pb-steered-says">
                  {mark.word} · {claim.statement}
                </p>
                <p>
                  {claim.outcome === "untestable" ? "size zero" : dayOf(claim)}
                  {claim.backsThisPair ? " · this pair's fence rests on it" : ""}
                </p>
                {claim.outcome === "pass" || claim.outcome === "fail" ? <p>{claim.basis}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="pb-steered-note">
        {view.owner}'s view; {card.untestable} claim{card.untestable === 1 ? "" : "s"} untestable at
        size zero. It only narrows this pair; the playbook still picks the timing. SIM.
      </p>
    </details>
  );
}
