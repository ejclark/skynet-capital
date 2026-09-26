import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchSettings, ownsAccount } from "../live/settings";

/**
 * The any-account page's link row (#3807 slice 2a — the rail left the frame): the desk's
 * sub-views as one row at the top of its own stage, shared by every desk-scoped route so the row
 * reads identically everywhere — Overview · Pulse, and for a bot Heartbeat · Thesis. Every
 * destination is in-shell (#738 phase 9a: the old cross-links to the server-rendered desk were how
 * members fell out of the redesign). "Decisions" folds into "Heartbeat" here, the name the
 * Profile page already uses for a bot's passes (#3687 slice 4); `/u/:id/decisions` stays the
 * route it opens until 2d gives this page its own Heartbeat section (docs/IA.md §8.2). The rail's
 * way back to the Leaderboard is gone — the topbar's Leaderboard tab is that.
 *
 * Every item here is scoped to the OPEN desk, so Settings has to be too (#785): it reads as that
 * desk's, but `/settings` is always the viewer's own account. It appears only on a desk the
 * session owns — ownership from the same `["settings"]` query the Settings page runs, so it is
 * one cached fetch and the server stays the only authority on identity. Off your own desk the
 * item is absent, not disabled; the topbar's app-level Settings is the viewer-scoped one.
 *
 * Always a `<Link>` (never a Link-or-span swap): the router marks the current one with
 * `aria-current="page"`, and one element per item keeps React from remounting it in the row on
 * each navigation (`profile-rail.tsx` says why that reflowed its siblings).
 * @category navigation
 */
export function DeskRail({
  id,
  kind,
}: {
  readonly id: string;
  readonly kind: "human" | "bot";
}): ReactElement {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const isOwnDesk = ownsAccount(settings.data, id);
  return (
    <>
      <Link to="/u/$id" params={{ id }} activeOptions={{ exact: true }}>
        Overview
      </Link>
      <Link to="/u/$id/pulse" params={{ id }}>
        Pulse
      </Link>
      {kind === "bot" ? (
        <Link to="/u/$id/decisions" params={{ id }}>
          Heartbeat
        </Link>
      ) : null}
      {kind === "bot" ? (
        <Link to="/u/$id/thesis" params={{ id }}>
          Thesis
        </Link>
      ) : null}
      {isOwnDesk ? <Link to="/settings">Settings</Link> : null}
    </>
  );
}
