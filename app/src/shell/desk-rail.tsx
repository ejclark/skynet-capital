import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * The desk's rail sub-navigation (second nav dimension) — shared by every desk-scoped route so
 * the section reads identically everywhere. In-shell destinations are router links; views the
 * shell doesn't own yet cross to the server-rendered desk, honestly. Decisions is a bot's page.
 */
export function DeskRail({
  id,
  name,
  kind,
  current,
}: {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly current: "active" | "decisions" | "pulse";
}): ReactElement {
  return (
    <>
      <p className="rail-label">{name}'s desk</p>
      {current === "active" ? (
        <span className="rail-current" aria-current="page">
          Active
        </span>
      ) : (
        <Link to="/u/$id" params={{ id }} activeOptions={{ exact: true }}>
          Active
        </Link>
      )}
      {kind === "bot" ? (
        current === "decisions" ? (
          <span className="rail-current" aria-current="page">
            Decisions
          </span>
        ) : (
          <Link to="/u/$id/decisions" params={{ id }}>
            Decisions
          </Link>
        )
      ) : null}
      {current === "pulse" ? (
        <span className="rail-current" aria-current="page">
          Pulse
        </span>
      ) : (
        <Link to="/u/$id/pulse" params={{ id }}>
          Pulse
        </Link>
      )}
      <a href={`/u/${id}`}>Overview</a>
      <a href={`/u/${id}?tab=performance`}>Performance</a>
      <a href={`/u/${id}?tab=settings`}>Settings</a>
      <hr />
      <Link to="/" search={{ by: "equity" }}>
        ← Standings
      </Link>
    </>
  );
}
