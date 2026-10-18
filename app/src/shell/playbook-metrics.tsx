import type { ReactElement } from "react";
import type { PlaybookFunnelRowView, PlaybookMetricsView } from "../live/playbook-performance";
import { money } from "../live/ticket";
import { EnvPill } from "../ui";
import { signedMoney } from "./option-preview";

/**
 * YOUR ACCOUNT ON THIS PLAYBOOK (#3665 slice 3) and THE HOUSE ON THIS PLAYBOOK (slice 4) — two
 * blocks on each R&D → Playbooks card (#3623 placement), drawn from the same server response but
 * never summed: the issue's core rule is that "how everyone did" must never blend into "how I did".
 * So each block has its own heading naming whose trades it counts, its own border (the house one
 * dashed — a shape, not a hue), and the shared tile grid below renders one row, never two.
 *
 * Phone-first ranking (CLAUDE.md): the four numbers that answer "is this working for me" — trades,
 * net P/L (dollars and percent of capital), win rate, capital committed — then hold time, then the
 * expiration-cycle mix (slice 5). Every sign is spelled out (+/−) so no reading leans on red vs
 * green. An unmeasurable stat prints "—", never 0 (`trade-stats.ts`'s honesty invariant), and zero
 * closed trades says so in words.
 */

export type MetricsScope =
  | { readonly kind: "unreadable" }
  | {
      readonly kind: "read";
      readonly row?: PlaybookMetricsView;
      /** House only: how this playbook's checks turned into orders (#4450 slice 5a). */
      readonly funnel?: FunnelScope;
    };

/** The window's length in sessions, and this playbook's row — absent when no bot checked it. */
export interface FunnelScope {
  readonly sessions: number;
  readonly row?: PlaybookFunnelRowView;
}

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

/**
 * "1 weekly · 2 monthly" — shortest-dated cycle first, which is how a chain reads. Counts option
 * trips only, so a playbook that trades shares says that in words: three zeros would be a false
 * reading (it did trade, just nothing with an expiration) and a bare "—" reads like a number we
 * failed to compute rather than a thing that doesn't apply.
 */
export function cycleLabel(counts: PlaybookMetricsView["byCycle"]): string {
  return mixLabel(counts) || "no option trades — shares carry no expiration";
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
      <div className="pb-metrics-wide">
        <dt>Expiration cycle</dt>
        <dd>{cycleLabel(row.byCycle)}</dd>
      </div>
    </dl>
  );
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

/**
 * HOW CHECKS BECAME ORDERS (#4450 slice 5a, EARS 5) — one line under the house numbers: across
 * every bot, how often this playbook was checked in the last ten sessions, how many orders it asked
 * for, how many a guard refused, how many the broker took and filled. Eric's brief was that nearly
 * every bot trade looked forced; the closed-trade numbers above can't say whether a quiet playbook
 * was never asked, or asked and stopped. This can, and names the guard that stopped it most.
 *
 * "Asked for" is an order the playbook raised, not a signal: the signals stage waits on #4808,
 * where each playbook declares what its signal is.
 */
function FunnelLine({ funnel }: { readonly funnel: FunnelScope }): ReactElement {
  const { row, sessions } = funnel;
  const window = `Last ${sessions} sessions`;
  if (!row) {
    return <p className="pb-metrics-empty">{window}: no bot checked this playbook.</p>;
  }
  const { checks, asked, refused, placed, filled } = row.totals;
  const top = row.refusals[0];
  return (
    <dl className="pb-metrics-grid pb-funnel">
      <div className="pb-metrics-wide">
        <dt>{window}, every bot</dt>
        {/* Words, not the tiles' monospace: a chain wraps at 390px, and a run of trailing zeros
            after "no orders" would be noise, not news. */}
        <dd>
          {asked === 0
            ? `${plural(checks, "check")} → no orders asked for`
            : `${plural(checks, "check")} → ${plural(asked, "order")} asked for → ${refused} refused → ${placed} placed → ${filled} filled`}
        </dd>
        <dd className="pb-metrics-sub">
          asked on {row.askedOn} of {sessions} sessions
          {top ? ` · most refused: ${top.label}` : ""}
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
        {accountName} on this playbook <EnvPill />
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
        House — every account <EnvPill />
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
      {scope.kind === "read" && scope.funnel ? <FunnelLine funnel={scope.funnel} /> : null}
    </section>
  );
}
