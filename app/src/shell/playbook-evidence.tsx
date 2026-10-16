import type { ReactElement } from "react";
import { dayText } from "../live/playbook-rule";
import type { PairForecastView, PairRowView, PastRecordView } from "../live/playbook-store";

/**
 * A TICKER'S EVIDENCE AS A CALL (#5444, Eric's Build pick on #5163 round 12; laid out as rows by
 * #5448, round 14: "I wish these categories were rows - Current climate feels more relevant to
 * current conditions, with historical 2nd").
 *
 * Top to bottom, at 390 and in the wide layout's middle column alike:
 *  1. THE CALL, one sentence — what the playbook does on this ticker, and until when.
 *  2. HOW SURE — a blue → teal → amber scale, the word under it, a marker in the middle of its
 *     word's band. No number until research states one (#5443): never print what the data lacks.
 *  3. THIS REPORT — R&D's dated call for the ticker's next earnings report (dashed top edge), or a
 *     plain "no call yet". The forecast.
 *  4. PAST REPORTS — the study's record in words, one dot per report (solid top edge). The almanac.
 *     The two are never merged into one number.
 *  5. Why it is only as sure as it is, when the row says.
 *
 * Colour never alone (docs/BRAND.md → Accessibility): the scale carries its words, the marker is a
 * dark ring, the rows differ by their edge's line style and their heading, a filled dot is a went-up
 * report and a hollow one is not. No red, no green. Copy says "went up", never "rose" (round 15).
 */

type Level = "low" | "medium" | "high";
const LEVELS: readonly Level[] = ["low", "medium", "high"];

const levelOf = (word: string | undefined): Level | undefined =>
  LEVELS.find((level) => level === word?.toLowerCase());

/** "Buy NVDA's run-up before its earnings report, until Mar 31, 2027." */
export function callSentence(pair: PairRowView): string | undefined {
  if (!pair.plainCall) return undefined;
  if (pair.status === "conviction" && pair.checkOn)
    return `${pair.plainCall}, on its owner's conviction, checked ${dayText(pair.checkOn)}.`;
  if (pair.shelfOn) return `${pair.plainCall}, until ${dayText(pair.shelfOn)}.`;
  return `${pair.plainCall}.`;
}

/** A row a bot can run today: researched or a conviction, and not past its shelf date. */
export const readyPair = (pair: PairRowView): boolean =>
  (pair.status === "researched" || pair.status === "conviction") && !pair.stale;

/** Why the confidence is no higher, when the row says why — only beside a low or medium scale, so
 *  the reason never contradicts the word drawn above it. */
export function sureWhy(pair: PairRowView): string | undefined {
  const level = levelOf(pair.confidence);
  if (level !== "low" && level !== "medium") return undefined;
  const lead = level === "low" ? "Low" : "Only medium";
  if (pair.qualifier === "weakened")
    return `${lead}: the record isn't yet strong enough for the house's bar.`;
  if (pair.qualifier === "borrowed")
    return `${lead}: the verdict is the run-up's; the spread's own results are untested.`;
  if (pair.status === "conviction")
    return `${lead}: it runs on its owner's conviction, not on a study's verdict.`;
  return undefined;
}

function SureScale({ level }: { readonly level: Level }): ReactElement {
  return (
    <div className="pbe-sure">
      <p className="pbe-h">
        How sure · <b data-level={level}>{level}</b>
      </p>
      <div className="pbe-scale" aria-hidden="true">
        <span className="pbe-marker" data-level={level} />
      </div>
      <p className="pbe-words" aria-hidden="true">
        {LEVELS.map((word) => (
          <span key={word} data-level={word} data-on={word === level || undefined}>
            {word}
          </span>
        ))}
      </p>
    </div>
  );
}

function ThisReport({
  symbol,
  forecast,
  keyed,
}: {
  readonly symbol: string;
  readonly forecast?: PairForecastView;
  /** The play is timed to the report (the run-up, the spread); otherwise R&D's call is about
   *  trading the report itself, never a verdict on this play, and is said so. */
  readonly keyed: boolean;
}): ReactElement {
  if (!forecast) {
    return (
      <section className="pbe-row pbe-now" aria-label="This report">
        <h4 className="pbe-h">This report</h4>
        <p className="pbe-body">No earnings report on file for {symbol} yet.</p>
      </section>
    );
  }
  const day = dayText(forecast.reportOn);
  const set = forecast.dateSet ? "date confirmed" : "date not confirmed yet";
  return (
    <section className="pbe-row pbe-now" aria-label={`This report, ${day}`}>
      <h4 className="pbe-h">This report · {day}</h4>
      {forecast.call ? (
        <>
          <p className="pbe-body">
            {keyed ? forecast.call : `R&D on trading the report itself: ${forecast.call}`}
          </p>
          <p className="pbe-muted">
            {forecast.confidence ? `How sure: ${forecast.confidence} · ` : ""}
            {set}
          </p>
          {forecast.wrongIf ? <p className="pbe-muted">Wrong if: {forecast.wrongIf}</p> : null}
          {forecast.href ? (
            <a className="pbe-link" href={forecast.href}>
              R&D's research on this report →
            </a>
          ) : null}
        </>
      ) : (
        <p className="pbe-body">
          No call for the {day} report yet · {set}
        </p>
      )}
    </section>
  );
}

function PastReports({ past }: { readonly past: PastRecordView }): ReactElement {
  const counted = past.up !== undefined && past.of !== undefined;
  const heading = counted ? `Past reports${past.era ? ` · ${past.era}` : ""}` : "The study";
  return (
    <section className="pbe-row pbe-past" aria-label={heading}>
      <h4 className="pbe-h">{heading}</h4>
      <p className="pbe-body">{past.line}</p>
      {counted ? (
        <p className="pbe-dots" aria-hidden="true">
          {Array.from({ length: past.of ?? 0 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: one dot per report, in order, never reordered
            <span key={i} data-up={i < (past.up ?? 0) || undefined} />
          ))}
        </p>
      ) : null}
    </section>
  );
}

/** The evidence block for a ready row (researched or conviction). */
export function PairEvidence({
  pair,
  reportKeyed = true,
}: {
  readonly pair: PairRowView;
  /** Whether the play is timed to the earnings report (`ruleTemplateOf` → "window"). */
  readonly reportKeyed?: boolean;
}): ReactElement {
  const sentence = callSentence(pair);
  const level = levelOf(pair.confidence);
  const why = sureWhy(pair);
  const [symbol = ""] = pair.symbols;
  return (
    <div className="pbe">
      {sentence ? <p className="pbe-call">{sentence}</p> : <p className="pbe-call">{pair.call}</p>}
      {level ? <SureScale level={level} /> : null}
      <ThisReport
        symbol={symbol}
        keyed={reportKeyed}
        {...(pair.forecast ? { forecast: pair.forecast } : {})}
      />
      {pair.past ? <PastReports past={pair.past} /> : null}
      {why ? <p className="pbe-muted">{why}</p> : null}
    </div>
  );
}
