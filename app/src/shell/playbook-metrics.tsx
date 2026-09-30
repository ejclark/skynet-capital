import type { ReactElement } from "react";
import type { PlaybookMetricsView } from "../live/playbook-performance";
import { money } from "../live/ticket";
import { signedMoney } from "./option-preview";

/**
 * YOUR ACCOUNT ON THIS PLAYBOOK (#3665 slice 3) — the selected account's own closed trades on one
 * playbook, on that playbook's R&D card. Placement: R&D → Playbooks is the one home for playbooks
 * (#3623), and #3970 already puts per-account metrics on the card; the house-wide collective lands
 * beside this in slice 4 as its own block, never summed into this one (the issue's core rule: "how
 * everyone did" must never blend into "how I did").
 *
 * Phone-first ranking (CLAUDE.md): the four numbers that answer "is this working for me" — trades,
 * net P/L (dollars and percent of capital), win rate, capital committed — then hold time. Every
 * sign is spelled out (+/−) so no reading leans on red vs green. An unmeasurable stat prints "—",
 * never 0 (`trade-stats.ts`'s honesty invariant), and zero closed trades says so in words.
 */

export type AccountMetricsScope =
  | { readonly kind: "unreadable" }
  | { readonly kind: "read"; readonly row?: PlaybookMetricsView };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A hold as the coarsest two units that matter: "3d 4h", "5h 20m", "12m". */
export function holdLabel(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms >= DAY) return `${Math.floor(ms / DAY)}d ${Math.floor((ms % DAY) / HOUR)}h`;
  if (ms >= HOUR) return `${Math.floor(ms / HOUR)}h ${Math.floor((ms % HOUR) / 60_000)}m`;
  return `${Math.max(0, Math.round(ms / 60_000))}m`;
}

const signedPct = (value: number | null): string =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

/** "3 long · 1 short", "2 call · 2 put" — only the parts that happened, so a stock-only playbook
 *  never reads "0 call · 0 put". */
export function mixLabel(counts: Readonly<Record<string, number>>): string {
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => `${n} ${kind}`)
    .join(" · ");
}

function Metrics({ row }: { readonly row: PlaybookMetricsView }): ReactElement {
  return (
    <dl className="pb-metrics-grid">
      <div>
        <dt>Closed trades</dt>
        <dd className="num">{row.trades}</dd>
        <dd className="pb-metrics-sub">
          {mixLabel(row.byDirection)} · {mixLabel(row.byInstrument)}
        </dd>
      </div>
      <div>
        <dt>Net realized</dt>
        <dd className="num">{signedMoney(row.netRealized)}</dd>
        <dd className="pb-metrics-sub num">{signedPct(row.returnPct)} of capital committed</dd>
      </div>
      <div>
        <dt>Win rate</dt>
        <dd className="num">{row.winRate === null ? "—" : `${row.winRate.toFixed(0)}%`}</dd>
        <dd className="pb-metrics-sub num">
          {row.wins} won · {row.losses} lost
        </dd>
      </div>
      <div>
        <dt>Capital committed</dt>
        <dd className="num">{money(row.capitalCommitted)}</dd>
        <dd className="pb-metrics-sub">summed entry cost</dd>
      </div>
      <div className="pb-metrics-wide">
        <dt>Hold</dt>
        <dd className="num">
          avg {holdLabel(row.avgHoldMs)} · longest {holdLabel(row.longestHold?.holdMs)} · shortest{" "}
          {holdLabel(row.shortestHold?.holdMs)}
        </dd>
      </div>
    </dl>
  );
}

export function AccountPlaybookMetrics({
  accountName,
  scope,
}: {
  readonly accountName: string;
  readonly scope: AccountMetricsScope;
}): ReactElement {
  return (
    <section className="pb-metrics" aria-label={`${accountName} on this playbook`}>
      <h3 className="pb-metrics-h">
        {accountName} on this playbook <span className="env-pill">SIM</span>
      </h3>
      {scope.kind === "unreadable" ? (
        <p className="pb-metrics-empty">This account's trade history isn't readable right now.</p>
      ) : scope.row ? (
        <Metrics row={scope.row} />
      ) : (
        <p className="pb-metrics-empty">
          No closed trades on this playbook yet — nothing to measure.
        </p>
      )}
    </section>
  );
}
