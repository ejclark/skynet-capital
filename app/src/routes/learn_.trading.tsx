import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchJourney } from "../live/learn";
import { fetchPlays } from "../live/options";
import { fetchSettings } from "../live/settings";
import { CourseCard, Hud, ladderProgress } from "../shell/course-cards";
import { PageFrame } from "../shell/frame";
import { LadderGateCard } from "../shell/ladder-gate";
import { MilestonePanel } from "../shell/milestone-panel";
import { MilestoneStrip } from "../shell/milestone-strip";
import { ProfileMeta } from "../shell/profile-meta";
import { ProfileRail } from "../shell/profile-rail";

/**
 * MILESTONE M·02 — TRADING PROGRESSION (#1119): the course cards that were `/learn` until the
 * table of contents took that route. The `learn_.` file prefix keeps this a sibling route
 * (`/learn/trading`), not a child rendered inside the table of contents. Same honesty rule as
 * ever — a milestone is earned only by a real filled order, and every earned row shows its proof.
 *
 * THE MILESTONE STRIP LIVES HERE (#3407, Workbench slice 5 — Eric, 2026-09-22, "B — keep"): #1461
 * hung the eight-rung rail over the trade ticket; the Workbench pick made the ticket one pane of a
 * bench, and the rail moved to the page that IS the ladder. Same component, same rules (a reached
 * rung is a preset into the ticket, a locked one stays here), `current` = the server's `nextUp` —
 * "you are here" on a page with no ticket. Fed by `/api/trade/plays` (the earned/locked truth) and
 * the session's first account for the preset links; fail-soft — no plays, no strip, the cards below
 * still tell the story.
 */
function TradingLadderPage(): ReactElement {
  const journey = useQuery({
    queryKey: ["learn"],
    queryFn: fetchJourney,
    refetchOnWindowFocus: true,
  });
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const deskId = settings.data?.accounts[0]?.id ?? "";
  const rail = <ProfileRail current="ladder" />;
  if (journey.isPending)
    return (
      <PageFrame rail={rail}>
        <p className="note">Opening the ladder…</p>
      </PageFrame>
    );
  if (journey.isError)
    return (
      <PageFrame rail={rail}>
        <p className="note">The ladder is unreachable.</p>
      </PageFrame>
    );
  const data = journey.data;
  const ladder = ladderProgress(data);
  return (
    <PageFrame rail={rail}>
      <ProfileMeta />
      <header className="page-header">
        <div className="join-eyebrow">Milestone M·02 · Trading progression</div>
        <h1>One fill unlocks the next rung</h1>
        <p>
          Progress is proven by <b>fills, never checkboxes</b> — your account watches your real
          paper trades. Level 100 is open from the start; every course above unlocks the one below
          it, so you always know what you're working toward.
        </p>
      </header>
      {!data.linked ? (
        <p className="note">
          Milestones light up from orders you fill yourself — this session isn't linked to an
          account yet, so the ladder shows from the start.
        </p>
      ) : null}
      {data.gate ? <LadderGateCard note={data.gate.note} /> : null}
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
      <Hud journey={data} />
      <MilestonePanel title="Trading progression" done={ladder.done} total={ladder.total}>
        {data.courses.map((course) => (
          <CourseCard key={course.level} course={course} />
        ))}
      </MilestonePanel>
      <p className="note">
        Iron condors and anything with undefined risk stay off the ladder — a condor is a Playbook
        Store strategy (two spreads run together), never a rung.
      </p>
    </PageFrame>
  );
}

export const Route = createFileRoute("/learn_/trading")({ component: TradingLadderPage });
