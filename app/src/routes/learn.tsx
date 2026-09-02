import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchJourney } from "../live/learn";
import { fetchOnboarding } from "../live/onboarding";
import { fetchPlaybooks } from "../live/playbooks";
import { Hud, ladderProgress } from "../shell/course-cards";
import { PageFrame } from "../shell/frame";
import { MilestoneCard } from "../shell/milestone-card";
import { ProfileRail } from "../shell/profile-rail";
import { CheckGateCard, EngagementUnlockBanner, UnlockBanner } from "../shell/unlock-gate";

/**
 * MILESTONES — THE TABLE OF CONTENTS (#1119, from the Claude Design canvas "Alpaca onboarding
 * process streamline"). Three chapters, each its own route: M·01 Onboarding, M·02 Trading
 * progression (the course cards that used to render here, now `/learn/trading`), M·03 Playbooks
 * (WIP). This page keeps what must be seen wherever a member lands — the rank/points HUD, a fresh
 * unlock's one-time celebration, and the comprehension check gate — then lists the chapters with
 * their progress. Every state is the server's: three reads, no arithmetic the ledgers didn't do.
 */
function LearnPage(): ReactElement {
  const queryClient = useQueryClient();
  const journey = useQuery({
    queryKey: ["learn"],
    queryFn: fetchJourney,
    refetchOnWindowFocus: true,
  });
  const onboarding = useQuery({ queryKey: ["onboarding"], queryFn: fetchOnboarding });
  const playbooks = useQuery({ queryKey: ["playbooks"], queryFn: fetchPlaybooks });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["learn"] });
  const rail = <ProfileRail current="milestones" />;

  if (journey.isPending)
    return (
      <PageFrame rail={rail}>
        <p className="note">Opening the journey…</p>
      </PageFrame>
    );
  if (journey.isError)
    return (
      <PageFrame rail={rail}>
        <p className="note">The journey is unreachable.</p>
      </PageFrame>
    );

  const data = journey.data;
  const ob = onboarding.data;
  const pb = playbooks.data;
  const ladder = ladderProgress(data);
  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <div className="join-eyebrow">Milestones · table of contents</div>
        <h1>Your account's milestones</h1>
        <p>
          The table of contents for your account — every concept worth knowing and every goal worth
          chasing, with your progress tracked on each. Open a chapter to learn what it teaches, what
          completes it, and where that action lives.
        </p>
      </header>
      {!data.linked ? (
        <p className="note">
          Milestones light up from orders you fill on your own desk — this session isn't linked to
          an account yet, so the journey shows from the start.
        </p>
      ) : null}
      {data.celebrating.length > 0 ? (
        <UnlockBanner celebrations={data.celebrating} onClaimed={refresh} />
      ) : null}
      {data.engagementCelebrating.length > 0 ? (
        <EngagementUnlockBanner celebrations={data.engagementCelebrating} onClaimed={refresh} />
      ) : null}
      {data.check ? (
        <CheckGateCard key={data.check.milestoneId} gate={data.check} onPassed={refresh} />
      ) : null}
      {data.pendingChecks > 1 ? (
        <p className="note">
          {data.pendingChecks - 1} more unlock{data.pendingChecks === 2 ? "" : "s"} wait behind this
          check — each brings its own.
        </p>
      ) : null}
      <Hud journey={data} extraPoints={ob?.points ?? 0} extraTotal={ob?.totalPoints ?? 30} />
      <div className="mc-grid">
        <MilestoneCard
          code="M·01"
          title="Onboarding"
          desc="Get seated at the desk: connect Alpaca, file your first feedback, make your first trade."
          state={ob?.complete ? "complete" : "progress"}
          done={ob?.done ?? 0}
          total={ob?.total ?? 3}
          points={`+${ob?.totalPoints ?? 30} pts`}
          to="/onboarding"
        />
        <MilestoneCard
          code="M·02"
          title="Trading progression"
          desc="Climb the ladder one fill at a time — stocks, the Wheel, then directional longs."
          state={ladder.total > 0 && ladder.done === ladder.total ? "complete" : "progress"}
          done={ladder.done}
          total={ladder.total}
          points={`+${data.totalPoints} pts`}
          to="/learn/trading"
        />
        <MilestoneCard
          code="M·03"
          title="Playbooks"
          desc="Prove a play by hand, then arm it to draft tickets for you. WIP — Season 1."
          state="wip"
          done={pb?.unlocked ?? 0}
          total={pb?.total ?? 4}
          points="pts TBD"
          to="/playbooks"
          gateNote="WIP — Season 1 release"
        />
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/learn")({ component: LearnPage });
