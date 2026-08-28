import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties, ReactElement } from "react";
import { useEffect } from "react";
import {
  BOARD_METRICS,
  type BoardBlock,
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

/** The ramp: everyone is green, intensity carries the standing (never red on a friendly board). */
const rampFor = (index: number, count: number): string =>
  count <= 1 ? "100%" : `${Math.round(100 - (index / (count - 1)) * 70)}%`;

function FieldLadder({ rows }: { readonly rows: readonly BoardRow[] }): ReactElement {
  return (
    <ul className="ladder">
      {rows.map((row, index) => (
        <li
          key={row.key}
          className="rank-row"
          style={{ "--g": rampFor(index, rows.length) } as CSSProperties}
        >
          <span className="rank-name">
            {row.name}
            <span className={`chip chip-${row.kind}`}>{row.kind === "bot" ? "BOT" : "HUMAN"}</span>
          </span>
          <span className="rank-bar">
            <i style={{ width: `${row.bar}%` }} />
          </span>
          <span className="rank-val num">{row.value}</span>
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
  const { by } = Route.useSearch();
  const queryClient = useQueryClient();
  // The live channel follows the visible metric — one EventSource at a time, disposed on switch.
  useEffect(() => connectBoardChannel(queryClient, by), [queryClient, by]);
  const board = useQuery(boardQueryOptions(by));

  if (board.isPending) return <p className="note">Reading the board…</p>;
  if (board.isError)
    return <p className="note">The board is unreachable — {String(board.error)}</p>;
  const { rows, blocks, generatedAt, opsApplied } = board.data;
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
      <FieldLadder rows={rows} />
      <footer className="obs-foot num">
        as of {generatedAt} · ranked by {by} · {opsApplied} live op{opsApplied === 1 ? "" : "s"}{" "}
        applied without a refetch
      </footer>
    </>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({ by: parseBoardMetric(search.by) }),
  component: Standings,
});
