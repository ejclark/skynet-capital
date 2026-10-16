import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import type { Journey } from "../live/learn";
import { fetchPlays } from "../live/options";
import { fetchSettings } from "../live/settings";
import { LadderList } from "./ladder-list";

/**
 * MILESTONE M·02 — TRADING PROGRESSION (#1119), a chapter of the Profile page's Milestones section
 * since #3807 slice 2b — moved from the retired `/learn/trading` route as it was. Same honesty rule
 * as ever — a milestone is earned only by a real filled order, and every earned row shows its
 * proof. The table of contents above it already carries the HUD, the gate card and the "not
 * linked" note, so the chapter does not repeat them (one sentence per fact on the page — the
 * repetition dead end 2 counted on Trade).
 *
 * THE LADDER IS DRAWN ONCE (#5242, Eric's pick on #5176 round 2): the strip Trade renders (#3407)
 * and the level cards below it drew the same eight rungs twice, counted twice. One list replaces
 * both here — `LadderList`, rungs under their levels — and Trade keeps its strip. Fed by
 * `/api/trade/plays` (the earned/locked truth) and the session's first account for the preset
 * links; fail-soft — no plays, the list still tells the story, just without Trade links.
 * @category learning
 */
export function LadderChapter({ journey }: { readonly journey: Journey }): ReactElement {
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const deskId = settings.data?.accounts[0]?.id ?? "";
  return (
    <>
      <header className="page-header">
        <div className="join-eyebrow">Milestone M·02 · Trading progression</div>
        <h2>One fill unlocks the next rung</h2>
        <p>
          Progress is proven by <b>fills, never checkboxes</b> — your account watches your real
          paper trades. Level 100 is open from the start; every course above unlocks the one below
          it, so you always know what you're working toward.
        </p>
      </header>
      <LadderList journey={journey} plays={plays.data} deskId={deskId} />
      <p className="note">
        Iron condors stay off the ladder: a condor is two spreads run together, a Playbook Store
        strategy, never a rung. Trades with undefined risk stay off it entirely.
      </p>
    </>
  );
}
