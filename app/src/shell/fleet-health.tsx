import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { useConnection } from "../live/connection";
import {
  type FleetReading,
  fetchOpsStatus,
  fleetReading,
  type OpsSignal,
  type OpsStatusView,
} from "../live/ops-status";

/**
 * FLEET HEALTH — "is this page current, and is the fleet healthy", for every member on every route.
 *
 * It lived in an owner-only card at the bottom of Settings › Account (#1295's admitted stopgap)
 * until Eric's call (#1296, 2026-09-04): it "should be public for the group but doesn't have a
 * great home". Its home became a status pill in the topbar. Round 2 of #5037 (question 9) folded
 * the pill into the market's status line (`session-status.tsx`): Eric, 2026-10-10, "there are too
 * many icons available all the time… Progressive reveal to elevate what's important and move the
 * rest to the side until it's needed". So the line says the fleet in words only when something is
 * wrong (`fleetReading`), the opened panel carries the one-sentence summary, and the rows below are
 * one more tap — still group-visible, still on every route, just not a mark of their own.
 *
 * The two halves stay distinguishable on purpose: the Live stream row is the STREAM, the signals are
 * the FLEET. A live stream says nothing about whether the bots are trading, so one row can't
 * honestly speak for both.
 */

function SignalRow({ signal }: { readonly signal: OpsSignal }): ReactElement {
  return (
    <li className="ops-row">
      <span className={`ops-dot ops-${signal.verdict}`} aria-hidden="true" />
      <span className="ops-row-label">{signal.label}</span>
      <span className="ops-row-detail">{signal.detail}</span>
      {signal.link ? (
        <a href={signal.link.href} target="_blank" rel="noopener noreferrer">
          {signal.link.label}
        </a>
      ) : null}
    </li>
  );
}

/** The rows themselves, plus the states that are not rows: still reading, unreachable, unwired. */
function OpsRows({
  id,
  stream,
  live,
  ops,
}: {
  readonly id: string;
  readonly stream: string;
  readonly live: boolean;
  readonly ops: UseQueryResult<OpsStatusView>;
}): ReactElement {
  const view = ops.data;
  return (
    <section className="ops-rows-wrap" id={id} aria-label="Ops status">
      <p className="ops-pop-head">Fleet ops — the same read-only panel for every member.</p>
      <ul className="ops-rows">
        <li className="ops-row">
          <span className={`ops-dot ops-${live ? "ok" : "unknown"}`} aria-hidden="true" />
          <span className="ops-row-label">Live stream</span>
          <span className="ops-row-detail" aria-live="polite">
            {live
              ? `This page is current — ${stream}.`
              : "This page is catching up; numbers may be a beat behind."}
          </span>
        </li>
        {view?.available
          ? view.status.signals.map((s) => <SignalRow key={s.id} signal={s} />)
          : null}
      </ul>
      {ops.isPending ? <p className="ops-pop-note">Reading the fleet…</p> : null}
      {ops.isError ? <p className="ops-pop-note">Fleet status is unreachable right now.</p> : null}
      {view && !view.available ? (
        <p className="ops-pop-note">No ops panel is wired in this deployment.</p>
      ) : null}
      {view?.available ? (
        <p className="ops-pop-note">
          Generated {view.status.generatedAt.slice(0, 16).replace("T", " ")} UTC
          {view.status.degraded
            ? " · running without a GitHub token, so the deploy signals are smaller"
            : ""}
          .
        </p>
      ) : null}
    </section>
  );
}

export interface Fleet {
  readonly ops: UseQueryResult<OpsStatusView>;
  readonly reading: FleetReading;
}

/**
 * The fleet's read, shared by the status line (its words) and the opened panel (its rows). A minute
 * matches the server's own deploy-signal cache TTL (`ops-status-deploy-lag.ts`), so every member as
 * a viewer costs the GitHub Actions API nothing extra: the cache is shared, and Query pauses the
 * interval while the tab is hidden.
 *
 * "Failed" is the LAST SETTLED read, not `isError`: with no answer ever landed, Query hands every
 * fresh ask back as `pending` — each minute's re-read, and every page, since the shell remounts the
 * line per path — and the line would draw that exactly like a healthy fleet for the whole retry
 * window. An unreachable fleet stays said until a read actually lands (#1307).
 */
export function useFleet(): Fleet {
  const ops = useQuery({
    queryKey: ["ops-status"],
    queryFn: fetchOpsStatus,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const failed = ops.isError || ops.errorUpdatedAt > ops.dataUpdatedAt;
  return { ops, reading: fleetReading(ops.data, failed) };
}

/** The opened panel's fleet row: the summary in words, and the rows one more tap away, in place. */
export function FleetHealth({ fleet }: { readonly fleet: Fleet }): ReactElement {
  const status = useConnection((s) => s.status);
  const seq = useConnection((s) => s.seq);
  const [open, setOpen] = useState(false);
  const rowsId = useId();
  const stream =
    status === "live" ? `live · seq ${seq}` : status === "resyncing" ? "resyncing…" : "connecting…";
  return (
    <div className="fleet-health" data-verdict={fleet.reading.verdict}>
      <p className="status-panel-row">
        <span className="fleet-summary">
          <span className="fleet-mark" aria-hidden="true" />
          {fleet.reading.summary}
        </span>
        <button
          type="button"
          className="status-panel-more"
          aria-expanded={open}
          aria-controls={rowsId}
          aria-label="Fleet details"
          onClick={() => setOpen((was) => !was)}
        >
          Details <span aria-hidden="true">{open ? "▴" : "▾"}</span>
        </button>
      </p>
      {open ? (
        <OpsRows id={rowsId} stream={stream} live={status === "live"} ops={fleet.ops} />
      ) : null}
    </div>
  );
}
