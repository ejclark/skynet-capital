import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import {
  fetchJourney,
  type Journey,
  type JourneyCourse,
  type JourneyMilestone,
} from "../live/learn";
import { PageFrame } from "../shell/frame";
import { CheckGateCard, EngagementUnlockBanner, UnlockBanner } from "../shell/unlock-gate";

/**
 * MILESTONES (#738 phases 6b + 8b) — the gamified journey in the shell. The honesty rule is the
 * whole design (Eric, 2026-08-25): a milestone is earned only by a real filled order, and every
 * earned row shows its proof. Courses unlock bottom-up. A fresh unlock's one-time celebration and
 * its comprehension check render right here (`shell/unlock-gate.tsx`); passing or claiming
 * refetches, so the banner takes the gate's place the moment the check clears — grading and the
 * durable record stay server-side throughout.
 */

function MilestoneRow({ milestone }: { readonly milestone: JourneyMilestone }): ReactElement {
  return (
    <li className={`ms-row${milestone.earned ? " ms-done" : ""}`}>
      <span className="ms-mark" aria-hidden="true">
        ✓
      </span>
      <span className="ms-body">
        <span className="ms-title">{milestone.title}</span>
        <span className="ms-detail">{milestone.detail}</span>
        {milestone.earned ? (
          <span className="ms-proof num">
            filled {milestone.earned.on} · order {milestone.earned.orderId}
          </span>
        ) : null}
      </span>
      {!milestone.earned && milestone.ticket ? (
        <a className="ms-go" href={milestone.ticket}>
          open the ticket →
        </a>
      ) : null}
      <span className="ms-pts num">+{milestone.points}</span>
    </li>
  );
}

function CourseCard({ course }: { readonly course: JourneyCourse }): ReactElement {
  // Open by default exactly when it's the live frontier: unlocked with work remaining.
  const [open, setOpen] = useState(!course.locked && course.done < course.total);
  const pct = course.total ? Math.round((course.done / course.total) * 100) : 0;
  return (
    <section className={`course${course.locked ? " course-locked" : ""}`}>
      <button
        type="button"
        className="course-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="course-badge num">{course.level}</span>
        <span className="course-names">
          <span className="course-title">{course.title}</span>
          <span className="course-sub">{course.subtitle}</span>
        </span>
        <span className="course-prog">
          <span className="course-bar">
            <i style={{ width: `${pct}%` }} />
          </span>
          <span className="num">
            {course.done} / {course.total}
          </span>
        </span>
        {course.locked ? <span className="course-lock">🔒 finish the level below</span> : null}
      </button>
      {open && !course.locked ? (
        <ul className="ms-list">
          {course.milestones.map((m) => (
            <MilestoneRow key={m.id} milestone={m} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Hud({ journey }: { readonly journey: Journey }): ReactElement {
  const pct = journey.totalPoints ? Math.round((journey.points / journey.totalPoints) * 100) : 0;
  return (
    <div className="hud">
      <div className="hud-stat">
        <span className="hud-k">Rank</span>
        <span className="hud-v">{journey.rank}</span>
      </div>
      <div className="hud-stat">
        <span className="hud-k">Points</span>
        <span className="hud-v num">
          {journey.points} / {journey.totalPoints}
        </span>
      </div>
      <div className="hud-track">
        <span className="course-bar hud-bar">
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
    </div>
  );
}

function LearnPage(): ReactElement {
  const queryClient = useQueryClient();
  const journey = useQuery({
    queryKey: ["learn"],
    queryFn: fetchJourney,
    refetchOnWindowFocus: true,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["learn"] });

  if (journey.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the journey…</p>
      </PageFrame>
    );
  if (journey.isError)
    return (
      <PageFrame>
        <p className="note">The journey is unreachable.</p>
      </PageFrame>
    );

  const data = journey.data;
  return (
    <PageFrame>
      <header className="page-header">
        <h1>Milestones</h1>
        <p>
          A trading journey earned the only way that counts — real filled orders, each with its
          proof. Level 100 is open from the start; every course above unlocks the one below it.
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
      <Hud journey={data} />
      {data.courses.map((course) => (
        <CourseCard key={course.level} course={course} />
      ))}
    </PageFrame>
  );
}

export const Route = createFileRoute("/learn")({ component: LearnPage });
