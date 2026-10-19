import type { ReactElement } from "react";
import { DOTS, dayText, usd } from "../../../src/options/position-guidance-rules";
import type { LongCallCall } from "../../../src/options/position-guidance-types";

/**
 * CALLS YOU HOLD — what the house's long-call exit rules say about a call the member bought (#5709
 * slice 2). Its own section, beside "Calls you've sold", in the same card grammar: that one manages
 * a contract the member wrote, this one a contract they own. Rendered only when they hold a call.
 *
 * There is no "Use this" on purpose: the rule is offered, never applied for the member, and nothing
 * here places an order (docs/BRAND.md — honesty). The verdict is a word, never a hue: TAKE PROFIT
 * and TIME STOP carry a glyph and a plain-language label, so a red/green colourblind reader loses
 * nothing.
 */

export const LONG_CALL_WORDS: Readonly<Record<LongCallCall["call"], string>> = {
  "TAKE PROFIT": "Take profit",
  "TIME STOP": "Time stop",
  HOLD: "Hold",
  "NO ANSWER": "No answer",
};

/** The shape beside the word: a win to take, a clock to heed, nothing to do yet. */
const GLYPH: Readonly<Record<LongCallCall["call"], string>> = {
  "TAKE PROFIT": "▲",
  "TIME STOP": "◷",
  HOLD: "○",
  "NO ANSWER": "–",
};

export const longCallName = (m: LongCallCall): string =>
  `Your ${usd(m.strike)} call, ${dayText(m.expiration)}${m.contracts > 1 ? ` ×${m.contracts}` : ""}`;

function Confidence({ m }: { readonly m: LongCallCall }): ReactElement | null {
  if (m.confidence === "none") return null;
  return (
    <span className="guidance-confidence">
      <span aria-hidden="true">{DOTS[m.confidence]}</span> {m.confidence} confidence
    </span>
  );
}

/** One at-a-glance line: the contract · the call · confidence · what the bid is against cost. */
export function LongCallGlanceLine({ m }: { readonly m: LongCallCall }): ReactElement {
  return (
    <li className="guidance-glance-line" data-call={m.call}>
      <span className="guidance-lever-name">{longCallName(m)}</span>
      <strong>
        <span aria-hidden="true">{GLYPH[m.call]}</span> {LONG_CALL_WORDS[m.call]}
      </strong>
      <Confidence m={m} />
      {m.multiple === undefined ? null : <span>{m.multiple.toFixed(1)}× what you paid</span>}
    </li>
  );
}

function LongCallCard({ m }: { readonly m: LongCallCall }): ReactElement {
  return (
    <article className="guidance-lever" data-call={m.call}>
      <header className="guidance-lever-head">
        <h3>{longCallName(m)}</h3>
        <p>
          <strong className="guidance-call">
            <span aria-hidden="true">{GLYPH[m.call]}</span> {LONG_CALL_WORDS[m.call]}
            {m.atOpen ? " at the open" : ""}
          </strong>{" "}
          <Confidence m={m} />
        </p>
      </header>
      <ul className="guidance-reasons">
        {m.reasons.map((r) => (
          <li key={r.text}>{r.text}</li>
        ))}
      </ul>
      {m.until ? (
        <p className="guidance-until-line">
          <span className="guidance-kicker">Until {dayText(m.until.date)}</span> {m.until.why}
        </p>
      ) : null}
      {m.provesWrong ? (
        <p className="guidance-comeback">
          <span className="guidance-kicker">What would change this</span> {m.provesWrong}
        </p>
      ) : null}
    </article>
  );
}

export function GuidanceLongCalls({
  longCalls,
}: {
  readonly longCalls: readonly LongCallCall[];
}): ReactElement | null {
  if (longCalls.length === 0) return null;
  return (
    <section className="guidance-manage" aria-label="Calls you hold">
      <p className="guidance-kicker">Calls you hold</p>
      {longCalls.map((m) => (
        <LongCallCard key={`${m.expiration}-${m.strike}`} m={m} />
      ))}
    </section>
  );
}
