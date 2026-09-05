import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useConnection } from "../live/connection";
import {
  fetchOpsStatus,
  type OpsSignal,
  opsAttentionCount,
  opsAttentionLabel,
} from "../live/ops-status";

/**
 * THE STATUS PILL — one mark in the topbar for "is this page current, and is the fleet healthy".
 *
 * It carried only the first half (SSE `live · seq N`). Fleet health lived in an owner-only card at
 * the bottom of Settings › Account, where Eric put it as an admitted stopgap (#1295) and where no
 * member could see it at all. His call (#1296, 2026-09-04): it "should be public for the group but
 * doesn't have a great home". This is the home — group-visible by construction, on every route, no
 * sixth nav destination, and glanceable from a phone, which is where the panel was wanted in the
 * first place (#666: on a phone, with no surface saying whether the bots were alive).
 *
 * The two halves stay distinguishable on purpose: the connection dot is the STREAM, the flag is
 * the FLEET. A live stream says nothing about whether the bots are trading, so one dot can't
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
function OpsPanel({
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
    <section className="ops-pop" id={id} aria-label="Ops status">
      <p className="ops-pop-head">Fleet ops — the same read-only panel for every member.</p>
      <ul className="ops-rows">
        <li className="ops-row">
          <span className={`ops-dot ops-${live ? "ok" : "unknown"}`} aria-hidden="true" />
          <span className="ops-row-label">Live stream</span>
          <span className="ops-row-detail">
            {live
              ? `This page is current — ${stream}.`
              : "This page is catching up with the desk; numbers may be a beat behind."}
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

/** Escape and a click outside both close the popover; Escape hands focus back to the pill. */
function useDismiss(
  open: boolean,
  close: () => void,
): {
  readonly wrapRef: React.RefObject<HTMLDivElement | null>;
  readonly buttonRef: React.RefObject<HTMLButtonElement | null>;
} {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);
  return { wrapRef, buttonRef };
}

export function StatusPill(): ReactElement {
  const status = useConnection((s) => s.status);
  const seq = useConnection((s) => s.seq);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { wrapRef, buttonRef } = useDismiss(
    open,
    useCallback(() => setOpen(false), []),
  );

  // A minute matches the server's own deploy-signal cache TTL (`ops-status-deploy-lag.ts`), so
  // adding every member as a viewer costs the GitHub Actions API nothing extra: the cache is
  // shared, and Query pauses the interval while the tab is hidden.
  const ops = useQuery({
    queryKey: ["ops-status"],
    queryFn: fetchOpsStatus,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const stream =
    status === "live" ? `live · seq ${seq}` : status === "resyncing" ? "resyncing…" : "connecting…";
  const flag = opsAttentionLabel(opsAttentionCount(ops.data));

  return (
    <div className="status-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`status status-${status}${flag ? " status-attn" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        // Colour is never the whole message: the flag's own sentence rides the accessible name,
        // and the pill's text stays a live region so a stream change is still announced.
        aria-label={flag ? `Status — ${flag}` : "Status"}
        title={flag ?? "Bots and deploy health"}
        onClick={() => setOpen((was) => !was)}
      >
        <span className="status-dot" aria-hidden="true" />
        {flag ? <span className="status-flag" aria-hidden="true" /> : null}
        <span className="status-text" aria-live="polite">
          {stream}
        </span>
      </button>
      {open ? <OpsPanel id={panelId} stream={stream} live={status === "live"} ops={ops} /> : null}
    </div>
  );
}
