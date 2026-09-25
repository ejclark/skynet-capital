import type { ReactElement } from "react";
import {
  DTE_WORD,
  PULSE_MARK,
  PULSE_WORDS,
  usd,
} from "../../../src/options/position-guidance-rules";
import type {
  GuidanceStake,
  LadderRow,
  PositionGuidance,
  PulseItem,
  PulseStatus,
} from "../../../src/options/position-guidance-types";
import { GlanceLine, LeverCard, shortDate } from "./guidance-lever";
import { GuidanceStakeForm } from "./guidance-stake-form";

/**
 * THE GUIDANCE TAB, RENDERED (#3729 step 3) — the same fixed-order template as
 * `position-guidance-markdown.ts`, laid out for a phone first: what a member acts on sits above
 * the fold (one line per lever), the reasoning under it, the reference material (expiry dates,
 * assumptions) folded. Pure: it takes a computed guidance and callbacks, so a screenshot mounts it
 * with a literal and no router or network.
 *
 * Freshness shows only the WORST check until tapped — a strip of six green ticks is noise, one
 * "~ aging: Option prices" is the thing to see. Glyph and word always travel together.
 */

const ET_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "2-digit",
});

const WORST: readonly PulseStatus[] = ["stale", "aging", "fresh"];

function worstOf(pulse: readonly PulseItem[]): PulseStatus {
  return WORST.find((s) => pulse.some((p) => p.status === s)) ?? "fresh";
}

function Freshness({ pulse }: { readonly pulse: readonly PulseItem[] }): ReactElement {
  const worst = worstOf(pulse);
  const hit = pulse.filter((p) => p.status === worst);
  const summary =
    worst === "fresh"
      ? "every check is fresh"
      : `${worst}: ${hit.map((p) => PULSE_WORDS[p.id] ?? p.id).join(", ")}`;
  return (
    <details className="guidance-pulse" data-status={worst}>
      <summary>
        <span aria-hidden="true">{PULSE_MARK[worst]}</span> Data {summary}
      </summary>
      <ul>
        {pulse.map((p) => (
          <li key={p.id} data-status={p.status}>
            <span aria-hidden="true">{PULSE_MARK[p.status]}</span> {p.status} ·{" "}
            <strong>{PULSE_WORDS[p.id] ?? p.id}</strong> — {p.note}{" "}
            <span className="guidance-muted">({p.source})</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function GuidanceView({
  guidance,
  stake,
  changes,
  refreshing,
  notice,
  onStake,
  onRefresh,
  onUse,
}: {
  readonly guidance: PositionGuidance;
  readonly stake: GuidanceStake;
  /** `diffGuidance` against this browser's last look; undefined on a first visit. */
  readonly changes: readonly string[] | undefined;
  readonly refreshing: boolean;
  /** A refresh that failed: shown above the last good read, which stays. */
  readonly notice?: string;
  readonly onStake: (next: GuidanceStake) => void;
  readonly onRefresh: () => void;
  readonly onUse: (row: LadderRow) => void;
}): ReactElement {
  const g = guidance;
  const rowsFor = (lever: string) => g.ladder.filter((r) => r.lever === lever);
  return (
    <div className="guidance">
      <header className="guidance-head">
        <p>
          <strong>{g.symbol}</strong> {usd(g.spot)} ·{" "}
          {g.sessionOpen ? "market open" : "market closed — prices as of the close"} · read at{" "}
          {ET_TIME.format(new Date(g.asOf))} ET
        </p>
        <button
          type="button"
          className="btn guidance-btn"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>
      {notice ? (
        <p className="guidance-notice" role="status">
          {notice}
        </p>
      ) : null}
      <Freshness pulse={g.pulse} />
      <GuidanceStakeForm key={g.symbol} stake={stake} onChange={onStake} />
      <ul className="guidance-glance" aria-label="At a glance">
        {g.calls.map((c) => (
          <GlanceLine key={c.lever} call={c} rows={rowsFor(c.lever)} />
        ))}
      </ul>
      {changes?.length ? (
        <section className="guidance-changes" aria-label="Since you last looked">
          <p className="guidance-kicker">Since you last looked</p>
          <ul>
            {changes.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {g.calls.map((c) => (
        <LeverCard key={c.lever} call={c} rows={rowsFor(c.lever)} symbol={g.symbol} onUse={onUse} />
      ))}
      <section className="guidance-waiting" aria-label="Waiting on">
        <p className="guidance-kicker">Waiting on</p>
        {g.waitingOn.length ? (
          <ul>
            {g.waitingOn.map((w) => (
              <li key={`${w.date}-${w.label}`}>
                <strong>{shortDate(w.date)}</strong> — {w.label}{" "}
                <span className="guidance-muted">({w.source})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Nothing dated on the calendar — the calls stand until prices or the research change.
          </p>
        )}
      </section>
      <details className="guidance-more">
        <summary>Expiry dates — which ones the guidance uses, and why</summary>
        <ul className="guidance-expiries">
          {g.dteStrip.map((m) => (
            <li key={m.expiration} data-verdict={m.verdict}>
              <strong>{shortDate(m.expiration)}</strong> · {m.dte} days · {DTE_WORD[m.verdict]}
            </li>
          ))}
        </ul>
      </details>
      <details className="guidance-more">
        <summary>Assumptions &amp; how this was decided</summary>
        <ul>
          {g.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="guidance-muted">{g.disclosure}</p>
      </details>
    </div>
  );
}
