import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { fetchSettings, ownsAccount } from "../live/settings";
import { PageFrame } from "./frame";
import { HeartbeatChip } from "./heartbeat";

/**
 * THE ANY-ACCOUNT PAGE'S HEAD (#3807 slice 2d; docs/IA.md §8) — `/u/:id` is the page for ANY
 * account, bot or human, reached from the Leaderboard and Activity, and never folded into the
 * Profile page (Eric, #2321: "Profile verbiage is user-centric. Leaderboards that include other
 * users belong outside of profile"; #3345/#3350: Accounts is self-scoped). 2a's link row became
 * this page's own head, cockpit-shaped like `/accounts`' (`cockpit.css`): the account's name, its
 * kind and the SIM pill on the first line, the section switch on the second — Overview · Activity
 * · Pulse, and for a bot Heartbeat · Thesis. Sticky at ≥861 exactly like the cockpit head; at
 * ≤860 it scrolls away with the page (`.acct-head`), so a phone keeps its height for the book.
 *
 * "Decisions" folds into "Heartbeat" (#3687): the item is named for what the Profile page calls a
 * bot's passes, and it opens `/u/:id/decisions`, which now reads as Heartbeat. The old rail's way
 * back to the Leaderboard stays gone — the topbar's Leaderboard tab is that.
 *
 * OWNERSHIP decides what is offered (#785, dead end 4). Settings is always the VIEWER's own
 * account, so it appears only on a page the session owns — ownership from the same
 * `["settings"]` query the Settings page runs, so it is one cached fetch and the server stays the
 * only authority on identity. On your own account the head also links the same account on your
 * Profile page (dead end 6: the two pages for one account had no bridge). Off your own account
 * both are absent, not disabled.
 *
 * Always a `<Link>` (never a Link-or-span swap): the router marks the current one with
 * `aria-current="page"`, and one element per item keeps React from remounting it on each
 * navigation (`profile-rail.tsx` says why that reflowed its siblings).
 * @category navigation
 */
export function AccountHead({
  id,
  name,
  kind,
}: {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
}): ReactElement {
  const isOwn = useOwnsAccount(id);
  return (
    <div className="cockpit-head acct-head">
      <div className="acct-head-id">
        <h1>{name}</h1>
        <span className={`chip chip-${kind}`}>{kind === "bot" ? "BOT" : "HUMAN"}</span>
        <span className="env-pill">SIM</span>
        {kind === "bot" ? <HeartbeatChip deskId={id} /> : null}
        {isOwn ? (
          <Link to="/accounts" search={{ account: id }} className="acct-head-own">
            Open in your Accounts
          </Link>
        ) : null}
      </div>
      <nav className="cockpit-nav acct-switch" aria-label="Sections">
        <Link to="/u/$id" params={{ id }} activeOptions={{ exact: true }}>
          Overview
        </Link>
        <Link to="/u/$id/activity" params={{ id }}>
          Activity
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
        {isOwn ? <Link to="/settings">Settings</Link> : null}
      </nav>
    </div>
  );
}

/** The page chrome every `/u/:id` child shares: the frame, the head, then the section's body —
 *  one wrapper so the five sections read identically (`.acct-page` scopes the card's glance). */
export function AccountPage({
  desk,
  children,
}: {
  readonly desk: { readonly id: string; readonly name: string; readonly kind: "human" | "bot" };
  readonly children: ReactNode;
}): ReactElement {
  return (
    <PageFrame>
      <div className="cockpit acct-page">
        <AccountHead id={desk.id} name={desk.name} kind={desk.kind} />
        {children}
      </div>
    </PageFrame>
  );
}

/**
 * Does the viewer own this account? The page's write controls (Close, Close this buy, Roll, New
 * trade) ask before rendering (#3807 slice 2d, dead end 4): the server refuses any order on an
 * account that isn't yours (`account-identity-gate.ts`), so a control that will be refused is a
 * lie the page tells. Reads stay public inside the invite gate by design; only the offer of a
 * write changes. An unloaded index answers `false` — hiding costs a beat, a wrong offer costs
 * trust.
 */
export function useOwnsAccount(id: string): boolean {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  return ownsAccount(settings.data, id);
}
