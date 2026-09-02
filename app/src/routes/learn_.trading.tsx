import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchJourney } from "../live/learn";
import { CourseCard, Hud } from "../shell/course-cards";
import { PageFrame } from "../shell/frame";
import { ProfileRail } from "../shell/profile-rail";

/**
 * MILESTONE M·02 — TRADING PROGRESSION (#1119): the course cards that were `/learn` until the
 * table of contents took that route. The `learn_.` file prefix keeps this a sibling route
 * (`/learn/trading`), not a child rendered inside the table of contents. Same honesty rule as
 * ever — a milestone is earned only by a real filled order, and every earned row shows its proof.
 */
function TradingLadderPage(): ReactElement {
  const journey = useQuery({
    queryKey: ["learn"],
    queryFn: fetchJourney,
    refetchOnWindowFocus: true,
  });
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
  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <div className="join-eyebrow">Milestone M·02 · Trading progression</div>
        <h1>One fill unlocks the next rung</h1>
        <p>
          Progress is proven by <b>fills, never checkboxes</b> — the desk watches your real paper
          trades. Level 100 is open from the start; every course above unlocks the one below it, so
          you always know what you're working toward.
        </p>
      </header>
      {!data.linked ? (
        <p className="note">
          Milestones light up from orders you fill on your own desk — this session isn't linked to
          an account yet, so the ladder shows from the start.
        </p>
      ) : null}
      <Hud journey={data} />
      {data.courses.map((course) => (
        <CourseCard key={course.level} course={course} />
      ))}
      <p className="note">
        Spreads, condors, and anything with undefined risk stay off the ladder for now — later
        course, on purpose.
      </p>
    </PageFrame>
  );
}

export const Route = createFileRoute("/learn_/trading")({ component: TradingLadderPage });
