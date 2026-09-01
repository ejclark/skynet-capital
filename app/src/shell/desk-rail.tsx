import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchSettings, ownsAccount } from "../live/settings";

/**
 * The desk's rail sub-navigation (second nav dimension) — shared by every desk-scoped route so
 * the section reads identically everywhere. Every destination is in-shell (#738 phase 9a: the
 * old cross-links to the server-rendered desk were how members fell out of the redesign — the
 * legacy tabs' twins are Active, Pulse, and app Settings). Decisions is a bot's page.
 *
 * Every item here is scoped to the OPEN desk, so Settings has to be too (#785): it reads as that
 * desk's, but `/settings` is always the viewer's own account. It now appears only on a desk the
 * session owns — ownership from the same `["settings"]` query the Settings page runs, so it is
 * one cached fetch and the server stays the only authority on identity. Off your own desk the
 * item is absent, not disabled; the topbar's app-level Settings is the viewer-scoped one.
 * @category navigation
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
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const isOwnDesk = ownsAccount(settings.data, id);
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
      {isOwnDesk ? <Link to="/settings">Settings</Link> : null}
      <hr />
      <Link to="/" search={{ by: "equity" }}>
        ← Standings
      </Link>
    </>
  );
}
