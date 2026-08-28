import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * The desk's rail sub-navigation (second nav dimension) — shared by every desk-scoped route so
 * the section reads identically everywhere. Every destination is in-shell (#738 phase 9a: the
 * old cross-links to the server-rendered desk were how members fell out of the redesign — the
 * legacy tabs' twins are Active, Pulse, and app Settings). Decisions is a bot's page.
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
      <Link to="/settings">Settings</Link>
      <hr />
      <Link to="/" search={{ by: "equity" }}>
        ← Standings
      </Link>
    </>
  );
}
