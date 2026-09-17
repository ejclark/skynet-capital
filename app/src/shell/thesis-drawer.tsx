import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { fetchDeskThesis, type ThesisData, type ThesisMarker } from "../live/desk";
import { readChartPalette } from "./chart-mount";
import { mountThesisChart } from "./thesis-chart-mount";

/**
 * THE THESIS DRAWER'S SHELL (#3186 slice 4a) — a bot's standing call, its one-line thesis, a
 * track-record chart, and an honest health readout. Read-only: no bot-controls cluster (Subscribe,
 * capital slider — slice 4b), no Steering Rules (slice 4c), no auto-suspend/auto-exit safeguard
 * ladder (slice 4d, new autonomous-engine plumbing tracked separately). Lives at `/u/:id/thesis`, a
 * sixth `DeskRail` sibling — this codebase has no slide-over/modal pattern (`timeline-drawer.tsx`
 * was deliberately de-drawered after live-review feedback that a popup read as too far removed from
 * what opened it), so "Drawer" here is a page, matching every other desk-scoped view.
 */

const VERDICT_LABEL: Record<ThesisData["call"]["verdict"], string> = {
  entering: "Entering",
  exiting: "Exiting",
  holding: "Holding",
  "standing aside": "Standing aside",
  "no data yet": "No data yet",
};

function CallBanner({ call }: { readonly call: ThesisData["call"] }): ReactElement {
  return (
    <div className={`thesis-call thesis-call-${call.verdict.replace(/\s+/g, "-")}`}>
      <p className="thesis-verdict">{VERDICT_LABEL[call.verdict]}</p>
      <p className="thesis-why">{call.why}</p>
      <dl className="thesis-call-meta">
        {call.window ? (
          <div>
            <dt>Window</dt>
            <dd className="num">{call.window}</dd>
          </div>
        ) : null}
        {call.invalidator ? (
          <div>
            <dt>Invalidator (as of the last cycle)</dt>
            <dd>{call.invalidator}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function MarkerList({
  markers,
}: {
  readonly markers: readonly ThesisMarker[];
}): ReactElement | null {
  if (markers.length === 0) return null;
  return (
    <ol className="thesis-markers">
      {markers.map((marker) => (
        <li key={marker.activityAnchor} className={`thesis-marker thesis-marker-${marker.kind}`}>
          <a href={`#${marker.activityAnchor}`}>
            {marker.n}. {marker.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

function ThesisChart({
  equity,
  markers,
}: {
  readonly equity: ThesisData["equity"];
  readonly markers: readonly ThesisMarker[];
}): ReactElement {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const mounted = mountThesisChart(el, equity, markers, readChartPalette());
    return () => mounted.dispose();
  }, [equity, markers]);

  if (equity.length === 0) return <p className="note">No equity history recorded yet.</p>;
  return (
    <>
      <div ref={container} className="thesis-chart-canvas" />
      <MarkerList markers={markers} />
    </>
  );
}

export function ThesisDrawer({ id }: { readonly id: string }): ReactElement {
  const thesis = useQuery({ queryKey: ["desk-thesis", id], queryFn: () => fetchDeskThesis(id) });

  if (thesis.isPending) return <p className="note">Reading the thesis…</p>;
  if (thesis.isError) return <p className="note">The thesis is unreachable.</p>;
  if (!(thesis.data.available && thesis.data.thesis)) {
    return (
      <p className="note">
        {thesis.data.kind === "human"
          ? "A human account has no persona thesis to show."
          : "No thesis data is wired in this deployment."}
      </p>
    );
  }

  const data = thesis.data.thesis;
  return (
    <div className="thesis-drawer">
      {data.thesis ? <p className="thesis-paragraph">{data.thesis}</p> : null}
      <CallBanner call={data.call} />
      <p className="thesis-health">
        Health:{" "}
        <span
          className={
            data.health.measured ? `tone-${data.health.label === "steady" ? "pos" : "neg"}` : ""
          }
        >
          {data.health.label}
        </span>
        {data.health.detail ? (
          <span className="thesis-health-detail"> · {data.health.detail}</span>
        ) : null}
      </p>
      <ThesisChart equity={data.equity} markers={data.markers} />
    </div>
  );
}
