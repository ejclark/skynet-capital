import type { ReactElement } from "react";
import { DOTS, dayText, pct, usd } from "../../../src/options/position-guidance-rules";
import type { ManageCall } from "../../../src/options/position-guidance-types";
import { GlossaryTerm } from "./glossary-term";

/**
 * CALLS YOU'VE SOLD — the guidance for a covered call already open (#3729). A separate section from
 * "Covered calls" on purpose: that one is about opening a new call; this one is about a contract the
 * member already holds (the IA call written down in the plan). Rendered only when there is one.
 *
 * "Use this" exists only where there is something to do — buy it back, or roll it — and it opens the
 * Option positions card's own Close / Roll row for that contract, pre-filled. Nothing is sent from
 * here: the member reviews and confirms there, exactly as they would today.
 */

export const MANAGE_WORDS: Readonly<Record<ManageCall["call"], string>> = {
  KEEP: "Keep it",
  "BUY BACK": "Buy it back",
  ROLL: "Roll it",
  "LET IT GO": "Let it go",
  "NO ANSWER": "No answer",
};

const acting = (m: ManageCall): boolean => m.call === "BUY BACK" || m.call === "ROLL";

export const contractName = (m: ManageCall): string =>
  `Your ${usd(m.strike)} call, ${dayText(m.expiration)}${m.contracts > 1 ? ` ×${m.contracts}` : ""}`;

function Confidence({ m }: { readonly m: ManageCall }): ReactElement | null {
  if (m.confidence === "none") return null;
  return (
    <span className="guidance-confidence">
      <span aria-hidden="true">{DOTS[m.confidence]}</span> {m.confidence} confidence
    </span>
  );
}

/** One at-a-glance line: the contract · the call · confidence · premium kept. */
export function ManageGlanceLine({ m }: { readonly m: ManageCall }): ReactElement {
  return (
    <li className="guidance-glance-line" data-call={m.call}>
      <span className="guidance-lever-name">{contractName(m)}</span>
      <strong>{MANAGE_WORDS[m.call]}</strong>
      <Confidence m={m} />
      {m.kept === undefined ? null : m.kept >= 0 ? (
        <span>{pct(m.kept)} kept</span>
      ) : (
        <span>costs more than you took in</span>
      )}
    </li>
  );
}

function agreeing(m: ManageCall): string {
  const each = m.contracts > 1 ? ` for each of the ${m.contracts} contracts` : "";
  if (m.call === "ROLL" && m.rollTo) {
    const net =
      m.rollTo.net >= 0
        ? `you take in about ${usd(m.rollTo.net * 100)} more a contract`
        : `it costs about ${usd(-m.rollTo.net * 100)} a contract`;
    return `Two trades in one order: buy this call back and sell the ${usd(m.rollTo.strike)} call for ${dayText(m.rollTo.expiration)}${each} — ${net}. Your shares stay covered until the new date.`;
  }
  return `You pay to close the call${each}; your shares are free again, and the premium you've kept is locked in.`;
}

function ManageCard({
  m,
  onManage,
}: {
  readonly m: ManageCall;
  readonly onManage: (m: ManageCall) => void;
}): ReactElement {
  return (
    <article className="guidance-lever" data-call={m.call}>
      <header className="guidance-lever-head">
        <h3>{contractName(m)}</h3>
        <p>
          <strong className="guidance-call">
            {m.call === "ROLL" ? (
              <GlossaryTerm term="roll">{MANAGE_WORDS.ROLL}</GlossaryTerm>
            ) : (
              MANAGE_WORDS[m.call]
            )}
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
      {acting(m) ? (
        <>
          <p className="guidance-agree">
            <span className="guidance-kicker">What you're agreeing to</span> {agreeing(m)}
          </p>
          <button
            type="button"
            className="btn btn-primary guidance-btn"
            onClick={() => onManage(m)}
          >
            Use this
          </button>
        </>
      ) : null}
    </article>
  );
}

export function GuidanceManage({
  manage,
  onManage,
}: {
  readonly manage: readonly ManageCall[];
  readonly onManage: (m: ManageCall) => void;
}): ReactElement | null {
  if (manage.length === 0) return null;
  return (
    <section className="guidance-manage" aria-label="Calls you've sold">
      <p className="guidance-kicker">Calls you've sold</p>
      {manage.map((m) => (
        <ManageCard key={m.occ} m={m} onManage={onManage} />
      ))}
    </section>
  );
}
