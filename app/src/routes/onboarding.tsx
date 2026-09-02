import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { fetchJoin } from "../live/join";
import { fetchOnboarding, type Onboarding, type OnboardingStep } from "../live/onboarding";
import { PageFrame } from "../shell/frame";
import { JoinForm } from "../shell/join-form";
import { ProfileMeta } from "../shell/profile-meta";
import { ProfileRail } from "../shell/profile-rail";

/**
 * MILESTONE M·01 — ONBOARDING (#1119, from the Claude Design canvas "Alpaca onboarding process
 * streamline"). Three steps between a new member and their first trade, each marked done by the
 * server's reading of a ledger (`/api/onboarding`) — never by anything this page decides:
 *
 *   1. connect Alpaca — the join form, embedded here while the viewer has no linked human account
 *   2. meet Moneypenny — file the first feedback (the engagement track's own milestone)
 *   3. make the first trade — rung 101 on the desk
 *
 * Once connected the account tiles ride the same read: equity, buying power, rungs earned. Honesty
 * rule as everywhere (docs/BRAND.md): the figures are the live board's, labelled simulated, and a
 * stale read says so rather than showing zeros.
 */

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StepGlyph({ done, active }: { readonly done: boolean; readonly active: boolean }) {
  return (
    <span
      className={`ob-glyph${done ? " ob-done" : active ? " ob-active" : ""}`}
      aria-hidden="true"
    >
      {done ? "✓" : "○"}
    </span>
  );
}

/** The step's call to action — the shell route that completes it, or nothing once done. */
function StepAction({ step }: { readonly step: OnboardingStep }): ReactElement | null {
  if (step.done) return null;
  if (step.id === "first-feedback")
    return (
      <Link className="btn" to="/feedback" search={{ starter: "onboarding" }}>
        Meet Moneypenny ›
      </Link>
    );
  if (step.id === "first-trade")
    return (
      <Link className="btn btn-primary" to="/trade" search={{ play: "101" }}>
        Open the trading desk ›
      </Link>
    );
  return null;
}

function ConnectStep({
  step,
  data,
  onJoined,
}: {
  readonly step: OnboardingStep;
  readonly data: Onboarding;
  readonly onJoined: () => void;
}): ReactElement {
  const [open, setOpen] = useState(true);
  const join = useQuery({ queryKey: ["join"], queryFn: fetchJoin, enabled: !step.done });
  return (
    <li className={`ob-step${step.done ? " ob-step-done" : ""}`}>
      <div className="ob-step-head">
        <StepGlyph done={step.done} active={!step.done} />
        <div className="ob-step-body">
          <div className="ob-step-title">{step.title}</div>
          <div className="ob-step-detail">
            Five short steps: create the account, switch to Paper, set the balance to $1,000,000,
            generate keys, paste them here. Keys are checked with read-only calls and stored
            encrypted; a human account only ever places the orders you submit yourself.
          </div>
        </div>
        {step.done && data.account ? (
          <span className="status status-live">
            <span className="status-dot" />
            PAPER · LIVE
          </span>
        ) : (
          <button type="button" className="btn" onClick={() => setOpen(!open)}>
            {open ? "Hide the form" : "Set up ›"}
          </button>
        )}
      </div>
      {!step.done && open ? (
        <div className="ob-connect">
          <p className="ob-guide-link">
            New to Alpaca? <Link to="/join">The five-step guide</Link> walks through creating the
            account and the $1,000,000 reset before you paste keys.
          </p>
          {join.data?.wired ? (
            <JoinForm data={join.data} onJoined={onJoined} />
          ) : join.data ? (
            <p className="note">Joining isn't wired in this deployment.</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Step({
  step,
  active,
}: {
  readonly step: OnboardingStep;
  readonly active: boolean;
}): ReactElement {
  return (
    <li className={`ob-step${step.done ? " ob-step-done" : ""}`}>
      <div className="ob-step-head">
        <StepGlyph done={step.done} active={active} />
        <div className="ob-step-body">
          <div className="ob-step-title">{step.title}</div>
          <div className="ob-step-detail">{step.detail}</div>
        </div>
        <StepAction step={step} />
      </div>
    </li>
  );
}

function AccountTiles({ data }: { readonly data: Onboarding }): ReactElement | null {
  const a = data.account;
  if (!a) return null;
  return (
    <div className="ob-tiles">
      <div className="ob-tile ob-tile-lead">
        <span className="ob-k">Equity</span>
        <span className="ob-v num">{a.stale ? "—" : money(a.equity)}</span>
        <span className="ob-note">
          {a.stale ? "last account read failed" : "simulated · Alpaca paper"}
        </span>
      </div>
      <div className="ob-tile">
        <span className="ob-k">Buying power</span>
        <span className="ob-v num">{a.stale ? "—" : money(a.cash)}</span>
        <span className="ob-note">ready to deploy</span>
      </div>
      <div className="ob-tile">
        <span className="ob-k">Ladder</span>
        <span className="ob-v num">
          {a.rungsEarned}
          <span className="ob-unit"> / {a.rungsTotal} rungs</span>
        </span>
        <span className="ob-note">
          {a.nextUp ? `next up · ${a.nextUp.title.toLowerCase()}` : "ladder complete"}
        </span>
      </div>
    </div>
  );
}

function OnboardingPage(): ReactElement {
  const onboarding = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboarding,
    refetchOnWindowFocus: true,
  });
  if (onboarding.isPending)
    return (
      <PageFrame rail={<ProfileRail current="onboarding" />}>
        <p className="note">Opening onboarding…</p>
      </PageFrame>
    );
  if (onboarding.isError || !onboarding.data)
    return (
      <PageFrame rail={<ProfileRail current="onboarding" />}>
        <p className="note">Onboarding is unreachable.</p>
      </PageFrame>
    );
  const data = onboarding.data;
  const firstOpen = data.steps.findIndex((s) => !s.done);
  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
  return (
    <PageFrame rail={<ProfileRail current="onboarding" />}>
      <ProfileMeta />
      <header className="page-header">
        <div className="join-eyebrow">
          Milestone {data.milestone.code} · {data.milestone.title}
        </div>
        <h1>Welcome to the league</h1>
        <p>
          Skynet Capital is a league for learning to trade — for real, without real losses. You
          trade the live market through an Alpaca <b>paper</b> account, climb a ladder from stocks
          to options one fill at a time, and earn your rank on the leaderboard. Three things stand
          between you and your first trade.
        </p>
      </header>
      {!data.linked ? (
        <p className="note">
          Onboarding tracks the signed-in member — this deployment has no sign-in, so nothing here
          can be marked done.
        </p>
      ) : null}
      <section className="ob-panel">
        <div className="ob-panel-head">
          <h2 className="ob-panel-title">Onboarding</h2>
          <span className="ob-count num">
            {data.done} / {data.total} complete · {data.points} / {data.totalPoints} pts
          </span>
        </div>
        <div className="course-bar ob-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <ol className="ob-steps">
          {data.steps.map((step, i) =>
            step.id === "connect" ? (
              <ConnectStep
                key={step.id}
                step={step}
                data={data}
                onJoined={() => void onboarding.refetch()}
              />
            ) : (
              <Step key={step.id} step={step} active={i === firstOpen} />
            ),
          )}
        </ol>
      </section>
      <AccountTiles data={data} />
    </PageFrame>
  );
}

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });
