import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import type { Journey } from "../live/learn";
import { fetchPlays } from "../live/options";
import { fetchSettings } from "../live/settings";
import { CourseCard, ladderProgress } from "./course-cards";
import { MilestonePanel } from "./milestone-panel";
import { MilestoneStrip } from "./milestone-strip";

/**
 * MILESTONE M·02 — TRADING PROGRESSION (#1119), a chapter of the Profile page's Milestones section
 * since #3807 slice 2b — moved from the retired `/learn/trading` route as it was. Same honesty rule
 * as ever — a milestone is earned only by a real filled order, and every earned row shows its
 * proof. The table of contents above it already carries the HUD, the gate card and the "not
 * linked" note, so the chapter does not repeat them (one sentence per fact on the page — the
 * repetition dead end 2 counted on Trade).
 *
 * THE MILESTONE STRIP LIVES HERE TOO (#3407, Workbench slice 5 — Eric, 2026-09-22, "B — keep"): the
 * same component Trade renders above the Bench, `current` = the server's `nextUp` — "you are here"
 * on a page with no ticket. Fed by `/api/trade/plays` (the earned/locked truth) and the session's
 * first account for the preset links; fail-soft — no plays, no strip, the cards below still tell
 * the story.
 * @category learning
 */
export function LadderChapter({ journey }: { readonly journey: Journey }): ReactElement {
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const deskId = settings.data?.accounts[0]?.id ?? "";
  const ladder = ladderProgress(journey);
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
      {plays.data ? (
        <MilestoneStrip
          deskId={deskId}
          current={plays.data.nextUp ?? ""}
          plays={plays.data.plays}
          wheels={plays.data.wheels}
          gate={plays.data.gate}
          nextUp={plays.data.nextUp}
        />
      ) : null}
      <MilestonePanel title="Trading progression" done={ladder.done} total={ladder.total}>
        {journey.courses.map((course) => (
          <CourseCard key={course.level} course={course} />
        ))}
      </MilestonePanel>
      <p className="note">
        Iron condors and anything with undefined risk stay off the ladder — a condor is a Playbook
        Store strategy (two spreads run together), never a rung.
      </p>
    </>
  );
}
