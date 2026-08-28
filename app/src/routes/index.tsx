import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties, ReactElement } from "react";
import { useEffect } from "react";
import {
  BOARD_METRICS,
  type BoardBlock,
  type BoardCompare,
  type BoardMetric,
  type BoardRow,
  parseBoardMetric,
} from "../live/board";
import { boardQueryOptions, connectBoardChannel } from "../live/channel";

/**
 * Standings (#738 phase 2a): the metric picker is a TYPED search param — `?by=` validates through
 * the router, drives the snapshot fetch AND the live channel (the server formats every op for the
 * connection's metric), and stays a shareable URL. Every number on this page was formatted by the
 * server; the green intensity ramp (Eric, round 3) is the one presentational thing this file adds.
 */

function MatchRead({ block }: { readonly block: BoardBlock | undefined }): ReactElement | null {
  if (!block) return null;
  return (
    <section className="match" aria-label="Bots vs Humans live match standings">
      <p className="match-eyebrow">◈ THE MATCH · LIVE</p>
      <div
        className="match-bar"
        role="img"
        aria-label="Humans versus Bots, by average equity per account"
      >
        <div className="match-seg match-human" style={{ width: `${block.bar?.human ?? 50}%` }}>
          <span>{block.text.humanLabel}</span>
        </div>
        <div className="match-seg match-bot" style={{ width: `${block.bar?.bot ?? 50}%` }}>
          <span>{block.text.botLabel}</span>
        </div>
      </div>
      <p className="match-line">
        <strong>{block.text.readLeader}</strong>
        {block.text.readRest}
      </p>
    </section>
  );
}

const COHORT_METRICS = [
  ["avgEquity", "Avg equity"],
  ["unrealized", "Unrealized"],
  ["return", "Return"],
  ["breadth", "In profit"],
  ["spread", "Spread"],
] as const;

function CohortFigure({
  label,
  block,
}: {
  readonly label: string;
  readonly block: BoardBlock | undefined;
}): ReactElement | null {
  if (!block) return null;
  return (
    <article className="cohort">
      <header>
        <span className={`chip chip-${label === "Humans" ? "human" : "bot"}`}>{label}</span>
        <span className="cohort-count num">
          {block.text.count}
          {block.text.countUnit}
        </span>
      </header>
      <div className="cohort-equity num">{block.text.totalEquity}</div>
      <dl>
        {COHORT_METRICS.map(([key, title]) => (
          <div key={key}>
            <dt>{title}</dt>
            <dd className={`num tone-${block.tone?.[key] ?? "flat"}`}>{block.text[key]}</dd>
          </div>
        ))}
        <div>
          <dt>Best</dt>
          <dd>
            {block.text.bestName}{" "}
            <span className={`num tone-${block.tone?.bestPct ?? "flat"}`}>
              {block.text.bestPct}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

function VersusRead({ block }: { readonly block: BoardBlock | undefined }): ReactElement | null {
  if (!block) return null;
  return (
    <p className="versus-read">
      <span>
        <strong>{block.text.totalLeader}</strong> lead on total equity by{" "}
        <span className="num">{block.text.totalGap}</span>
      </span>
      <span>
        <strong>{block.text.avgLeader}</strong> lead on average equity by{" "}
        <span className="num">{block.text.avgGap}</span>
      </span>
    </p>
  );
}

function CompareSection({
  compare,
  onClear,
}: {
  readonly compare: BoardCompare;
  readonly onClear: () => void;
}): ReactElement {
  const lead = (delta: (typeof compare.deltas)[number]) =>
    delta.lead === "tie" ? "—" : delta.lead === "a" ? "◀" : "▶";
  return (
    <section className="cmp" aria-label={`${compare.a.name} versus ${compare.b.name}`}>
      <header className="cmp-head">
        <h2>
          {compare.a.name} <span className="cmp-vs">vs</span> {compare.b.name}
        </h2>
        <button type="button" className="cmp-clear" onClick={onClear}>
          × clear
        </button>
      </header>
      <div className="cmp-grid">
        {([compare.a, compare.b] as const).map((side, i) => (
          <article className={`cmp-col ${i === 0 ? "cmp-a" : "cmp-b"}`} key={side.key}>
            <div className="cmp-who">
              {side.name}
              <span className={`chip chip-${side.kind}`}>
                {side.kind === "bot" ? "BOT" : "HUMAN"}
              </span>
            </div>
            <div className="cmp-equity num">{side.equity}</div>
            <dl>
              <div>
                <dt>Cash</dt>
                <dd className="num">{side.cash}</dd>
              </div>
              <div>
                <dt>Invested</dt>
                <dd className="num">{side.invested}</dd>
              </div>
              <div>
                <dt>Unrealized</dt>
                <dd className={`num tone-${side.unrealizedTone}`}>{side.unrealized}</dd>
              </div>
              <div>
                <dt>Return</dt>
                <dd className={`num tone-${side.returnTone}`}>{side.returnPct}</dd>
              </div>
            </dl>
          </article>
        ))}
        <div className="cmp-mid">
          {compare.deltas.map((delta) => (
            <div className="cmp-delta" key={delta.label}>
              <span className="cmp-dlabel">{delta.label}</span>
              <span className="cmp-dval num">
                {lead(delta)} {delta.amount}
              </span>
            </div>
          ))}
          <p className="cmp-legend">
            ◀ {compare.a.name} · ▶ {compare.b.name}
          </p>
        </div>
      </div>
      <h3 className="cmp-holdhead">Holdings overlap</h3>
      {compare.holdings.length === 0 ? (
        <p className="note">Neither holds an open position yet.</p>
      ) : (
        <table className="cmp-holdings">
          <tbody>
            {compare.holdings.map((h) => (
              <tr key={h.symbol} className={h.shared ? "cmp-shared" : ""}>
                <td className="num cmp-aval">{h.aValue ?? "·"}</td>
                <td className="cmp-sym">
                  {h.symbol}
                  {h.shared ? <span className="cmp-tag">SHARED</span> : null}
                </td>
                <td className="num cmp-bval">{h.bValue ?? "·"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** The ramp: everyone is green, intensity carries the standing (never red on a friendly board). */
const rampFor = (index: number, count: number): string =>
  count <= 1 ? "100%" : `${Math.round(100 - (index / (count - 1)) * 70)}%`;

function ComparePill({
  rowKey,
  a,
  b,
}: {
  readonly rowKey: string;
  readonly a?: string;
  readonly b?: string;
}): ReactElement {
  // Three shapes, straight from the server view's rule: part of the armed/showing pair → cancel;
  // something else armed and incomplete → complete the pair; otherwise → arm this row.
  if (a && (rowKey === a || rowKey === b)) {
    return (
      <Link
        from={Route.fullPath}
        search={(prev) => ({ by: prev.by })}
        className="cmp-toggle cmp-armed"
        aria-label="Cancel compare"
      >
        ×
      </Link>
    );
  }
  if (a && !b) {
    return (
      <Link
        from={Route.fullPath}
        search={(prev) => ({ ...prev, b: rowKey })}
        className="cmp-toggle"
        aria-label="Complete the pair with this row"
      >
        ⇄
      </Link>
    );
  }
  return (
    <Link
      from={Route.fullPath}
      search={(prev) => ({ by: prev.by, a: rowKey })}
      className="cmp-toggle"
      aria-label="Compare this account"
    >
      ⇄
    </Link>
  );
}

function FieldLadder({
  rows,
  a,
  b,
}: {
  readonly rows: readonly BoardRow[];
  readonly a?: string;
  readonly b?: string;
}): ReactElement {
  return (
    <ul className="ladder">
      {rows.map((row, index) => (
        <li
          key={row.key}
          className="rank-row"
          style={{ "--g": rampFor(index, rows.length) } as CSSProperties}
        >
          <Link to="/u/$id" params={{ id: row.key }} className="rank-name">
            {row.name}
            <span className={`chip chip-${row.kind}`}>{row.kind === "bot" ? "BOT" : "HUMAN"}</span>
          </Link>
          <span className="rank-bar">
            <i style={{ width: `${row.bar}%` }} />
          </span>
          <span className="rank-val num">{row.value}</span>
          <ComparePill rowKey={row.key} a={a} b={b} />
        </li>
      ))}
    </ul>
  );
}

function MetricPicker({ active }: { readonly active: BoardMetric }): ReactElement {
  return (
    <nav className="metric-picker" aria-label="Rank the field by">
      {BOARD_METRICS.map((m) => (
        <Link
          key={m.key}
          from={Route.fullPath}
          search={{ by: m.key }}
          className={m.key === active ? "active" : ""}
          aria-current={m.key === active ? "page" : undefined}
        >
          {m.label}
        </Link>
      ))}
    </nav>
  );
}

function Standings(): ReactElement {
  const { by, a, b } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const pick = { ...(a ? { a } : {}), ...(b ? { b } : {}) };
  // The live channel follows the visible metric — one EventSource at a time, disposed on switch.
  useEffect(
    () => connectBoardChannel(queryClient, by, { ...(a ? { a } : {}), ...(b ? { b } : {}) }),
    [queryClient, by, a, b],
  );
  const board = useQuery(boardQueryOptions(by, pick));

  // The compare figures ride the snapshot, so they go live the precise way: whenever a live op
  // moves either compared row, refetch — never on unrelated ticks. Refetch resets opsApplied,
  // so this cannot loop.
  const aValue = board.data?.rows.find((r) => r.key === a)?.value;
  const bValue = board.data?.rows.find((r) => r.key === b)?.value;
  const compareShown = Boolean(board.data?.compare);
  const opsApplied = board.data?.opsApplied ?? 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires only when a compared row's VALUE moved — including opsApplied/refetch would refetch on every unrelated tick
  useEffect(() => {
    if (compareShown && opsApplied > 0) void board.refetch();
  }, [aValue, bValue]);

  if (board.isPending) return <p className="note">Reading the board…</p>;
  if (board.isError)
    return <p className="note">The board is unreachable — {String(board.error)}</p>;
  const { rows, blocks, generatedAt } = board.data;
  const armed = a && !board.data.compare ? rows.find((r) => r.key === a) : undefined;
  return (
    <>
      <header className="page-header">
        <div className="page-header-row">
          <h1>Standings</h1>
          <MetricPicker active={by} />
        </div>
        <p>How every desk is performing — bots and humans, same board. Figures, not placings.</p>
      </header>
      <MatchRead block={blocks.match} />
      <div className="versus">
        <CohortFigure label="Humans" block={blocks["cohort:human"]} />
        <CohortFigure label="Bots" block={blocks["cohort:bot"]} />
      </div>
      <VersusRead block={blocks.versus} />
      {armed ? (
        <p className="cmp-hint">
          Comparing <strong>{armed.name}</strong> — pick a second desk on any row below.{" "}
          <Link from={Route.fullPath} search={(prev) => ({ by: prev.by })} className="cmp-clear">
            × cancel
          </Link>
        </p>
      ) : null}
      {board.data.compare ? (
        <CompareSection
          compare={board.data.compare}
          onClear={() => void navigate({ search: { by } })}
        />
      ) : null}
      <FieldLadder rows={rows} a={a} b={b} />
      <footer className="obs-foot num">
        as of {generatedAt} · ranked by {by} · {opsApplied} live op{opsApplied === 1 ? "" : "s"}{" "}
        applied without a refetch
      </footer>
    </>
  );
}

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    by: parseBoardMetric(search.by),
    ...(asId(search.a) ? { a: asId(search.a) } : {}),
    ...(asId(search.b) ? { b: asId(search.b) } : {}),
  }),
  component: Standings,
});
