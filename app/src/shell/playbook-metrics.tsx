import type { ReactElement } from "react";
import type { PlaybookMetricsView } from "../live/playbook-performance";
import { money } from "../live/ticket";
import { signedMoney } from "./option-preview";

/**
 * YOUR ACCOUNT ON THIS PLAYBOOK (#3665 slice 3) and THE HOUSE ON THIS PLAYBOOK (slice 4) — two
 * blocks on each R&D → Playbooks card (#3623 placement), drawn from the same server response but
 * never summed: the issue's core rule is that "how everyone did" must never blend into "how I did".
 * So each block has its own heading naming whose trades it counts, its own border (the house one
 * dashed — a shape, not a hue), and the shared tile grid below renders one row, never two.
 *
 * Phone-first ranking (CLAUDE.md): the four numbers that answer "is this working for me" — trades,
 * net P/L (dollars and percent of capital), win rate, capital committed — then hold time. Every
 * sign is spelled out (+/−) so no reading leans on red vs green. An unmeasurable stat prints "—",
 * never 0 (`trade-stats.ts`'s honesty invariant), and zero closed trades says so in words.
 */

export type MetricsScope =
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
  readonly scope: MetricsScope;
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

/** The house-wide collective on one playbook — every participant's attributed closed trips,
 *  shown to any member (even in catalog-only mode), always beside and never inside the account's. */
export function HousePlaybookMetrics({ scope }: { readonly scope: MetricsScope }): ReactElement {
  return (
    <section className="pb-metrics pb-metrics-house" aria-label="House — every account">
      <h3 className="pb-metrics-h">
        House — every account <span className="env-pill">SIM</span>
      </h3>
      {scope.kind === "unreadable" ? (
        <p className="pb-metrics-empty">The house-wide trade history isn't readable right now.</p>
      ) : scope.row ? (
        <Metrics row={scope.row} />
      ) : (
        <p className="pb-metrics-empty">
          No account has closed a trade on this playbook yet — nothing to measure.
        </p>
      )}
    </section>
  );
}
