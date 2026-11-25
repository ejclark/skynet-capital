import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties, MouseEvent, ReactElement } from "react";
import { useEffect, useRef } from "react";
import { BOARD_METRICS, type BoardMetric, type BoardRow, parseBoardMetric } from "../live/board";
import { boardQueryOptions, connectBoardChannel } from "../live/channel";
import { fetchSettings } from "../live/settings";
import { useComparePlace } from "../shell/compare-place";
import { DeskHoverName } from "../shell/desk-hovercard";
import { PageFrame } from "../shell/frame";
import { HeadToHead } from "../shell/head-to-head";
import { PartyTable, seatRead } from "../shell/party-table";
import { RankFlow } from "../shell/rank-flow";

/**
 * THE SCOREBOARD (#2321: split out of Profile — every player/bot ranked here belongs to no one
 * viewer, so it reads as its own top-level destination rather than a Profile sub-view). It opens
 * on the party's table (#8253, `shell/party-table.tsx`): the members together against the house
 * bot, no member ranked against another; the Field below still ranks every account. The
 * metric picker is a TYPED search param — `?by=` validates through the router, drives the
 * snapshot fetch AND the live channel (the server formats every op for the connection's metric),
 * and stays a shareable URL. Every number on this page was formatted by the server; the green
 * intensity ramp (Eric, round 3) is the one presentational thing this file adds.
 */

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
  reranking,
}: {
  readonly rows: readonly BoardRow[];
  readonly a?: string;
  readonly b?: string;
  readonly armedName?: string;
  readonly onTap: OnTap;
  /** The rows are the last metric's, held while the new ranking loads: drawn dimmed, busy. */
  readonly reranking: boolean;
}): ReactElement {
  return (
    <ul className="ladder" aria-busy={reranking || undefined}>
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
          <RankFlow flow={row.flow} />
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
  // A compare pick or a metric chip keeps the board on screen until the new snapshot lands: without
  // it, the page swapped to "Reading the board…" for a beat, and the page that short put the scroll
  // back at the top, whatever the tap asked for (#5057; a chip at 390 went from 656 to 0). The rows
  // held under a NEW metric are the old ranking, so the Field draws them dimmed and busy.
  const board = useQuery({ ...boardQueryOptions(by, pick), placeholderData: keepPreviousData });
  // The viewer's own accounts mark their seat with "you" (#8253): the same read as the league card.
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  // A pending or failed read is "reading" / "unread", never an empty list that reads as "no seat" (#8368).
  const accounts = seatRead(settings);
  const ownedIds =
    typeof accounts === "string" ? accounts : accounts.accounts.map((acct) => acct.id);
  const reranking = board.isPlaceholderData && board.data?.metric !== by;
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
  const { rows, generatedAt } = board.data;
  const armed = a && !board.data.compare ? rows.find((r) => r.key === a) : undefined;
  return (
    <PageFrame>
      <header className="page-header">
        <h1>Scoreboard</h1>
        <p>The members together against the house bot, then every account in the Field.</p>
      </header>
      {board.data.party ? <PartyTable party={board.data.party} ownedIds={ownedIds} /> : null}
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
        reranking={reranking}
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
