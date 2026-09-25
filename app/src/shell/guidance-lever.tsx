import type { ReactElement } from "react";
import { headlineRow } from "../../../src/options/position-guidance-ladder";
import {
  actionable,
  CALL_WORDS,
  DOTS,
  dayText,
  LEVER_NAME,
  pct,
  usd,
} from "../../../src/options/position-guidance-rules";
import type { LadderRow, LeverCall } from "../../../src/options/position-guidance-types";

/**
 * ONE LEVER OF THE GUIDANCE — its call, the one-line summary above the fold, and (for an option
 * lever) the strikes behind it (#3729 step 3). Three rules this file carries:
 *
 *   - "Use this" exists only on an ACTIONABLE row: a call to sell (WRITE) at medium confidence or
 *     better. Under Wait, Not available, or a low grade, the strikes stay visible for learning but
 *     have no button — a low-confidence call is a stand-aside, never a small bet.
 *   - Every row says what the member is agreeing to BEFORE the button: the promise, the upside
 *     given up or the obligation taken on, and that the shares or cash are locked meanwhile.
 *   - Confidence is dots plus a word, never hue (a standing reader is red/green colourblind).
 */

/** One date form on every surface — the engine's own (`dayText`), re-exported for the view. */
export const shortDate = dayText;

export const isActionable = (call: LeverCall): boolean =>
  call.call === "WRITE" && actionable(call.confidence);

function Confidence({ call }: { readonly call: LeverCall }): ReactElement | null {
  // "none confidence" beside "Not available" is noise — there is no call to grade.
  if (call.confidence === "none") return null;
  return (
    <span className="guidance-confidence">
      <span aria-hidden="true">{DOTS[call.confidence]}</span> {call.confidence} confidence
    </span>
  );
}

function callWord(call: LeverCall): string {
  return `${CALL_WORDS[call.call] ?? call.call}${call.atOpen ? " at the open" : ""}`;
}

/** The at-a-glance line: lever · call · confidence · (headline strike) · until. */
export function GlanceLine({
  call,
  rows,
}: {
  readonly call: LeverCall;
  readonly rows: readonly LadderRow[];
}): ReactElement {
  const top = isActionable(call) ? headlineRow(rows) : undefined;
  return (
    <li className="guidance-glance-line" data-call={call.call}>
      <span className="guidance-lever-name">{LEVER_NAME[call.lever]}</span>
      <strong>{callWord(call)}</strong>
      <Confidence call={call} />
      {top ? (
        <span>
          {usd(top.strike)} {top.lever === "covered-calls" ? "call" : "put"},{" "}
          {shortDate(top.expiration)} · you receive {usd(top.bid * 100)}
        </span>
      ) : null}
      {call.until ? (
        <span className="guidance-until">stands until {shortDate(call.until.date)}</span>
      ) : null}
    </li>
  );
}

function agreeing(row: LadderRow, symbol: string): string {
  if (row.lever === "covered-calls") {
    return `You agree to sell 100 shares at ${usd(row.strike)} if ${symbol} is above it on ${shortDate(row.expiration)} — and give up any rise past it. Those 100 shares stay locked while the call is open.`;
  }
  return `You agree to buy 100 shares at ${usd(row.strike)} (${usd(row.strike * 100)}) if ${symbol} is below it on ${shortDate(row.expiration)} — even if it has fallen much further. That cash stays set aside while the put is open.`;
}

function outcome(row: LadderRow): string {
  if (row.lever === "cash-secured-puts") {
    return `If exercised, you pay ${usd(row.effectiveEntry ?? row.strike)} a share after the premium.`;
  }
  if (row.returnIfCalled === undefined) return `If exercised, 100 shares go at ${usd(row.strike)}.`;
  // `returnIfCalled` includes the premium kept, so it is a total return — not the sale price's gap.
  const word = row.returnIfCalled >= 0 ? "gain" : "loss";
  return `If exercised, 100 shares go at ${usd(row.strike)} — a ${pct(Math.abs(row.returnIfCalled), 1)} total ${word} on what you paid, premium included.`;
}

function StrikeCard({
  row,
  symbol,
  onUse,
  brief = false,
}: {
  readonly row: LadderRow;
  readonly symbol: string;
  readonly onUse?: (row: LadderRow) => void;
  /** The headline row: the call's own reasons already priced it, so only the promise and the button. */
  readonly brief?: boolean;
}): ReactElement {
  const kind = row.lever === "covered-calls" ? "call" : "put";
  return (
    <li className="guidance-strike">
      <p className="guidance-strike-head">
        <strong>
          {usd(row.strike)} {kind}
        </strong>{" "}
        <span title={row.expiration}>
          {shortDate(row.expiration)} · {row.dte} days
        </span>
      </p>
      <p className="guidance-quote">
        bid {usd(row.bid)} · mid {usd(row.mid)} · delta {Math.abs(row.delta).toFixed(2)} · 1
        contract (you could cover up to {row.maxContracts})
      </p>
      {brief ? null : (
        <>
          <p>
            You receive <strong>{usd(row.bid * 100)}</strong> now, yours whatever happens (≈
            {pct(row.annualizedYield)} a year only if repeated).
          </p>
          <p>
            About a {pct(row.probAssigned)} chance it's exercised; {pct(row.probTouch)} it touches
            the strike first. {outcome(row)}
          </p>
        </>
      )}
      {row.deltaDisagreement !== undefined ? (
        <p className="guidance-flag">⚠ Data check: the feed and our model disagree on this one.</p>
      ) : null}
      {onUse ? (
        <>
          <p className="guidance-agree">
            <span className="guidance-kicker">What you're agreeing to</span> {agreeing(row, symbol)}
          </p>
          <button type="button" className="btn btn-primary guidance-btn" onClick={() => onUse(row)}>
            Use this
          </button>
        </>
      ) : null}
    </li>
  );
}

function Strikes({
  call,
  rows,
  symbol,
  onUse,
}: {
  readonly call: LeverCall;
  readonly rows: readonly LadderRow[];
  readonly symbol: string;
  readonly onUse: (row: LadderRow) => void;
}): ReactElement | null {
  if (rows.length === 0) return null;
  const act = isActionable(call);
  const top = headlineRow(rows);
  const rest = rows.filter((r) => r !== top);
  if (!act) {
    return (
      <details className="guidance-more">
        <summary>
          Strikes that passed the checks ({rows.length}) — for reference, not a suggestion
        </summary>
        <ul className="guidance-strikes">
          {rows.map((r) => (
            <StrikeCard key={`${r.expiration}-${r.strike}`} row={r} symbol={symbol} />
          ))}
        </ul>
      </details>
    );
  }
  return (
    <>
      <ul className="guidance-strikes">
        {top ? <StrikeCard row={top} symbol={symbol} onUse={onUse} brief /> : null}
      </ul>
      {rest.length ? (
        <details className="guidance-more">
          <summary>Other strikes that fit ({rest.length})</summary>
          <ul className="guidance-strikes">
            {rest.map((r) => (
              <StrikeCard
                key={`${r.expiration}-${r.strike}`}
                row={r}
                symbol={symbol}
                onUse={onUse}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

export function LeverCard({
  call,
  rows,
  symbol,
  onUse,
}: {
  readonly call: LeverCall;
  readonly rows: readonly LadderRow[];
  readonly symbol: string;
  readonly onUse: (row: LadderRow) => void;
}): ReactElement {
  return (
    <article className="guidance-lever" data-call={call.call}>
      <header className="guidance-lever-head">
        <h3>{LEVER_NAME[call.lever]}</h3>
        <p>
          <strong className="guidance-call">{callWord(call)}</strong> <Confidence call={call} />
        </p>
      </header>
      <ul className="guidance-reasons">
        {call.reasons.map((r) => (
          <li key={r.text}>{r.text}</li>
        ))}
      </ul>
      {call.until ? (
        <p className="guidance-until-line">
          <span className="guidance-kicker">Until {shortDate(call.until.date)}</span>{" "}
          {call.until.why}
        </p>
      ) : null}
      {call.provesWrong.replace(/[—\s-]/g, "") ? (
        <p className="guidance-comeback">
          <span className="guidance-kicker">What would change this</span> {call.provesWrong}
        </p>
      ) : null}
      {call.lever === "shares" ? null : (
        <Strikes call={call} rows={rows} symbol={symbol} onUse={onUse} />
      )}
    </article>
  );
}
