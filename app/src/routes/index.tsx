import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties, ReactElement } from "react";
import type { BoardBlock, BoardRow } from "../live/board";
import { boardQueryOptions } from "../live/channel";

/**
 * Standings, phase-0 cut: the match read, the two cohort figures, and the field ladder — rendered
 * once from `/api/board`, then moved only by `/events` ops through the Query cache. Every number
 * on this page was formatted by the server; the green intensity ramp (Eric, round 3) is the one
 * purely presentational thing this file adds.
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
        <div>
          <dt>Avg equity</dt>
          <dd className="num">{block.text.avgEquity}</dd>
        </div>
        <div>
          <dt>Unrealized</dt>
          <dd className={`num tone-${block.tone?.unrealized ?? "flat"}`}>
            {block.text.unrealized}
          </dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd className={`num tone-${block.tone?.return ?? "flat"}`}>{block.text.return}</dd>
        </div>
      </dl>
    </article>
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

function Standings(): ReactElement {
  const board = useQuery(boardQueryOptions);
  if (board.isPending) return <p className="note">Reading the board…</p>;
  if (board.isError)
    return <p className="note">The board is unreachable — {String(board.error)}</p>;
  const { rows, blocks, generatedAt, opsApplied } = board.data;
  return (
    <>
      <header className="page-header">
        <h1>Standings</h1>
        <p>How every desk is performing — bots and humans, same board. Figures, not placings.</p>
      </header>
      <MatchRead block={blocks.match} />
      <div className="versus">
        <CohortFigure label="Humans" block={blocks["cohort:human"]} />
        <CohortFigure label="Bots" block={blocks["cohort:bot"]} />
      </div>
      <FieldLadder rows={rows} />
      <footer className="obs-foot num">
        as of {generatedAt} · {opsApplied} live op{opsApplied === 1 ? "" : "s"} applied without a
        refetch
      </footer>
    </>
  );
}

export const Route = createFileRoute("/")({ component: Standings });
