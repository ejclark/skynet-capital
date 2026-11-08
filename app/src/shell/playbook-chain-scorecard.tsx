import type { ReactElement } from "react";
import { nameOf } from "../../../src/playbooks/chain-form";
import type { ChainScorecard } from "../../../src/playbooks/chain-scorecard";

/**
 * A CHAIN'S SCORECARD (#6959 slice 4, criterion 3) — what the chain's shadow replay found, under its
 * row in "Your chains": each link's own result on its own line, the chain's total on a line of its
 * own beneath them, never instead of them. The total is a sum of nothing the links hide: a link
 * that never owned a position says so ("never owned one") rather than showing $0.
 *
 * Signs ride as words and glyphs, never colour alone (`docs/BRAND.md` → Accessibility): "+$1,200"
 * and "−$1,448" read the same in either palette. Every dollar is modeled premium on a replay, and a
 * run still open is marked, not finished — both said on the card, with "doesn't trade" (SIM honesty).
 *
 * A chain whose links were never replayed gets one plain line saying so, and no numbers.
 */

const usd = (x: number): string =>
  `${x < 0 ? "−" : "+"}$${Math.abs(Math.round(x)).toLocaleString("en-US")}`;

export function ChainScorecardView({
  card,
}: {
  readonly card: ChainScorecard | undefined;
}): ReactElement {
  if (!card) {
    return <p className="pbc-none">No shadow replay of this chain yet.</p>;
  }
  return (
    <section className="pbc" aria-label="Shadow replay results">
      <p className="pbc-head">
        Shadow replay on {card.symbol} · {card.runs} runs · {card.from} → {card.to}
      </p>
      <dl className="pbc-rows">
        {card.links.map((link) => (
          <div key={link.playbook} className="pbc-row">
            <dt>{nameOf(link.playbook)}</dt>
            <dd>
              {link.mean === null ? (
                "never owned one"
              ) : (
                <>
                  <b>{usd(link.mean)}</b> a contract, over {link.runs} runs
                </>
              )}
            </dd>
          </div>
        ))}
        <div className="pbc-row pbc-total">
          <dt>Chain total</dt>
          <dd>
            <b>{usd(card.total.mean)}</b> a contract · ended ahead in {card.total.won} of{" "}
            {card.runs}
          </dd>
        </div>
      </dl>
      <p className="pbc-note">
        Modeled premiums, not real quotes.
        {card.open > 0
          ? ` ${card.open} runs were still open when the history ended, marked at the last close.`
          : ""}{" "}
        Doesn't trade.
      </p>
    </section>
  );
}
