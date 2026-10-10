import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties, MouseEvent, ReactElement } from "react";
import { useEffect, useRef } from "react";
import {
  BOARD_METRICS,
  type BoardBlock,
  type BoardMetric,
  type BoardRow,
  parseBoardMetric,
} from "../live/board";
import { boardQueryOptions, connectBoardChannel } from "../live/channel";
import { useComparePlace } from "../shell/compare-place";
import { DeskHoverName } from "../shell/desk-hovercard";
import { PageFrame } from "../shell/frame";
import { HeadToHead } from "../shell/head-to-head";

/**
 * LEADERBOARD (#2321: split out of Profile — every player/bot ranked here belongs to no one
 * viewer, so it reads as its own top-level destination rather than a Profile sub-view). The
 * metric picker is a TYPED search param — `?by=` validates through the router, drives the
 * snapshot fetch AND the live channel (the server formats every op for the connection's metric),
 * and stays a shareable URL. Every number on this page was formatted by the server; the green
 * intensity ramp (Eric, round 3) is the one presentational thing this file adds.
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

/** A Compare toggle's tap: which row, and whether it completes the pair (`compare-place.ts`). */
type OnTap = (key: string, row: Element | null, completes: boolean) => void;

/**
 * A row's compare toggle (#5057). Every tap keeps the scroll (#4944's rule — the gate in
 * tests/arch/same-page-scroll.spec.ts holds it); the view moves only to a completed pair, in
 * `compare-place.ts`. Each toggle says what it does in a word: the ⇄ glyph alone read as "open
 * this account" in 6 of #4943's sessions. Real links, so a pair stays a shareable `?a=&b=` URL.
 */
function ComparePill({
  row,
  a,
  b,
  armedName,
  onTap,
}: {
  readonly row: BoardRow;
  readonly a?: string;
  readonly b?: string;
  readonly armedName?: string;
  readonly onTap: OnTap;
}): ReactElement {
  // A modified click opens the link in another tab: this page doesn't change, so nothing to move.
  const tap = (completes: boolean) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    onTap(row.key, e.currentTarget.closest("[data-row]"), completes);
  };
  // Three shapes, straight from the server view's rule: part of the armed/showing pair → cancel;
  // something else armed and incomplete → complete the pair; otherwise → arm this row.
  if (a && (row.key === a || row.key === b)) {
    const word = b ? "Clear" : "Cancel";
    return (
      <Link
        from={Route.fullPath}
        search={(prev) => ({ by: prev.by })}
        resetScroll={false}
        onClick={tap(false)}
        className="cmp-toggle cmp-armed"
        aria-label={`${word} compare`}
      >
        <span aria-hidden="true">×</span> {word}
      </Link>
    );
  }
  if (a && !b) {
    return (
      <Link
        from={Route.fullPath}
        search={(prev) => ({ ...prev, b: row.key })}
        resetScroll={false}
        onClick={tap(true)}
        className="cmp-toggle"
        aria-label={`Compare ${row.name} with ${armedName ?? "the first pick"}`}
      >
        <span aria-hidden="true">⇄</span> Compare
      </Link>
    );
  }
  return (
    <Link
      from={Route.fullPath}
      search={(prev) => ({ by: prev.by, a: row.key })}
      resetScroll={false}
      onClick={tap(false)}
      className="cmp-toggle"
      aria-label={`Compare ${row.name}`}
    >
      <span aria-hidden="true">⇄</span> Compare
    </Link>
  );
}

function FieldLadder({
  rows,
  a,
  b,
  armedName,
  onTap,
}: {
  readonly rows: readonly BoardRow[];
  readonly a?: string;
  readonly b?: string;
  readonly armedName?: string;
  readonly onTap: OnTap;
}): ReactElement {
  return (
    <ul className="ladder">
      {rows.map((row, index) => (
        <li
          key={row.key}
          className="rank-row"
          data-row={row.key}
          data-cmp={a && (row.key === a || row.key === b) ? "picked" : undefined}
          style={{ "--g": rampFor(index, rows.length) } as CSSProperties}
        >
          <DeskHoverName id={row.key} name={row.name} kind={row.kind} />
          <span className="rank-bar">
            <i style={{ width: `${row.bar}%` }} />
          </span>
          <span className="rank-val num">{row.value}</span>
          <ComparePill row={row} a={a} b={b} armedName={armedName} onTap={onTap} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The pick bar (#5057, "Pinned pick bar" in docs/PATTERNS.md): while one account is picked, one
 * line stuck to the bottom of the screen names it and offers Cancel, so the second pick happens
 * wherever the member is. It replaced a hint above the Field, which a phone had scrolled out of
 * sight by the time the member was in the rows it pointed at. The live region is always mounted,
 * so a screen reader hears the pick when the bar fills.
 */
function PickBar({ armed }: { readonly armed: BoardRow | undefined }): ReactElement {
  return (
    <div className="cmp-pickslot" role="status">
      {armed ? (
        <div className="cmp-pickbar">
          <p>
            <span>
              Comparing <strong>{armed.name}</strong>
            </span>
            <span className="cmp-pickhow">Tap Compare on a second account</span>
          </p>
          <Link
            from={Route.fullPath}
            search={(prev) => ({ by: prev.by })}
            resetScroll={false}
            className="cmp-pickcancel"
          >
            Cancel
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** The metric chips: one metric ranks the whole field, chosen right above the ladder it re-ranks.
 *  A filter chip, so it keeps the page where it is (#4944): the re-ranked ladder is right below. */
function RankChips({ active }: { readonly active: BoardMetric }): ReactElement {
  return (
    <nav className="fchips" aria-label="Rank the field by">
      {BOARD_METRICS.map((m) =>
        m.key === active ? (
          <span key={m.key} className="fchip fchip-on" aria-current="page">
            {m.label}
          </span>
        ) : (
          <Link
            key={m.key}
            from={Route.fullPath}
            search={{ by: m.key }}
            resetScroll={false}
            className="fchip"
          >
            {m.label}
          </Link>
        ),
      )}
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
  // A compare pick keeps the board it was made on until the new snapshot lands: without it, the
  // page swapped to "Reading the board…" for a beat, and the page that short put the scroll back
  // at the top, whatever the tap asked for (#5057). A metric switch is a different ranking, so it
  // never shows the old one.
  const board = useQuery({
    ...boardQueryOptions(by, pick),
    placeholderData: (previous, query) => (query?.queryKey[1] === by ? previous : undefined),
  });
  const compareShown = Boolean(board.data?.compare);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const place = useComparePlace(compareShown, heading);

  // The compare figures ride the snapshot, so they go live the precise way: whenever a live op
  // moves either compared row, refetch — never on unrelated ticks. Refetch resets opsApplied,
  // so this cannot loop.
  const aValue = board.data?.rows.find((r) => r.key === a)?.value;
  const bValue = board.data?.rows.find((r) => r.key === b)?.value;
  const opsApplied = board.data?.opsApplied ?? 0;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires only when a compared row's VALUE moved — including opsApplied/refetch would refetch on every unrelated tick
  useEffect(() => {
    if (compareShown && opsApplied > 0) void board.refetch();
  }, [aValue, bValue]);

  if (board.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the board…</p>
      </PageFrame>
    );
  if (board.isError)
    return (
      <PageFrame>
        <p className="note">The board is unreachable — {String(board.error)}</p>
      </PageFrame>
    );
  const { rows, blocks, generatedAt } = board.data;
  const armed = a && !board.data.compare ? rows.find((r) => r.key === a) : undefined;
  return (
    <PageFrame>
      <header className="page-header">
        <h1>Leaderboard</h1>
        <p>How every account is performing — bots and humans, same board. Figures, not placings.</p>
      </header>
      <MatchRead block={blocks.match} />
      <div className="versus">
        <CohortFigure label="Humans" block={blocks["cohort:human"]} />
        <CohortFigure label="Bots" block={blocks["cohort:bot"]} />
      </div>
      <VersusRead block={blocks.versus} />
      {board.data.compare ? (
        <HeadToHead
          compare={board.data.compare}
          headingRef={heading}
          onClear={() => {
            place.cleared();
            void navigate({ search: { by }, resetScroll: false });
          }}
        />
      ) : null}
      <div className="section-head">
        <span className="section-title">The Field</span>
        <RankChips active={by} />
      </div>
      <FieldLadder
        rows={rows}
        a={a}
        b={b}
        armedName={rows.find((r) => r.key === a)?.name}
        onTap={place.tapped}
      />
      <footer className="obs-foot num">
        as of {generatedAt} · ranked by {by} · {opsApplied} live op{opsApplied === 1 ? "" : "s"}{" "}
        applied without a refetch
      </footer>
      <PickBar armed={armed} />
    </PageFrame>
  );
}

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

export const Route = createFileRoute("/leaderboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    by: parseBoardMetric(search.by),
    ...(asId(search.a) ? { a: asId(search.a) } : {}),
    ...(asId(search.b) ? { b: asId(search.b) } : {}),
  }),
  component: Standings,
});
