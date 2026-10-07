import type { ReactElement } from "react";
import type { Initiator, InitiatorSplitView } from "../live/playbook-performance";
import { signedMoney } from "./option-preview";

/**
 * WHO STARTED THE BOTS' CLOSED TRADES (#4450 slice 4) — three rows above the playbook deck: a
 * playbook's own signal, the forced daily pick, and a bot's own rules. Eric's brief (2026-10-02)
 * was that nearly every automatic trade looked forced; this is the number that says whether that
 * is still true, so the playbook row always renders, zero included, and comes first.
 *
 * Phone-first: one row per initiator, the count leading, net P/L and win rate beneath. Every sign
 * is spelled out (+/−) so no reading leans on red vs green, and an unmeasurable win rate prints
 * "—", never 0%. Trips no bot decision accounts for are named in a line of their own, never
 * folded into a row.
 */

export const INITIATOR_LABEL: Readonly<Record<Initiator, string>> = {
  playbook: "A playbook's own signal",
  forced: "The forced daily pick",
  persona: "A bot's own rules",
};

function untracedLine(n: number): string {
  return `${n} more closed ${n === 1 ? "trade" : "trades"} on bot accounts that no recorded decision accounts for — not counted above.`;
}

export function InitiatorSplit({
  heading,
  split,
}: {
  readonly heading: string;
  readonly split: InitiatorSplitView;
}): ReactElement {
  return (
    <section className="pb-metrics pb-initiators" aria-label={heading}>
      <h3 className="pb-metrics-h">
        {heading} <span className="env-pill">SIM</span>
      </h3>
      <dl className="pb-metrics-grid pb-initiators-grid">
        {split.rows.map((row) => (
          <div key={row.initiator}>
            <dt>{INITIATOR_LABEL[row.initiator]}</dt>
            <dd className="num">
              {row.trades} closed {row.trades === 1 ? "trade" : "trades"}
            </dd>
            <dd className="pb-metrics-sub num">
              {row.trades === 0
                ? "nothing to measure yet"
                : `net ${signedMoney(row.netRealized)} · ${
                    row.winRate === null ? "—" : `${row.winRate.toFixed(0)}%`
                  } won`}
            </dd>
          </div>
        ))}
      </dl>
      {split.untraced > 0 ? (
        <p className="pb-metrics-empty">{untracedLine(split.untraced)}</p>
      ) : null}
    </section>
  );
}
